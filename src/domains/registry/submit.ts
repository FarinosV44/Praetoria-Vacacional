import "server-only";
import { env } from "@/lib/env";
import { company } from "@/content/company";
import { getRepository } from "@/lib/repository";
import { getPropertyById } from "@/domains/properties/registry";
import { reportError } from "@/lib/observability/report";
import { buildParte, registryStatus, type ParteEstablishment } from "./parte";

/**
 * Issue #72 — transmission to SES.HOSPEDAJES (Ministerio del Interior).
 *
 * The web-service binding needs the establishment's real credentials and the
 * WSDL, which the owner has to obtain from the Guardia Civil / Policía Nacional
 * portal. Until `SES_HOSPEDAJES_*` are set this returns a clear "not configured"
 * and the owner records the transmission manually ("marcar como enviado") after
 * uploading the parte on the official portal.
 */

export function sesHospedajesConfigured(): boolean {
  return (
    !!env.SES_HOSPEDAJES_USER &&
    !!env.SES_HOSPEDAJES_PASSWORD &&
    !!env.SES_HOSPEDAJES_ESTABLISHMENT
  );
}

export function establishmentBlock(propertyId: string): ParteEstablishment {
  const property = getPropertyById(propertyId);
  return {
    code: env.SES_HOSPEDAJES_ESTABLISHMENT ?? "",
    name: property?.name ?? company.legalName,
    nif: company.taxId,
    address: property?.location.addressLine ?? "",
    municipality: property?.location.city ?? "",
    province: property?.location.region ?? "",
    postalCode: property?.location.postalCode ?? "",
    phone: company.phone,
    email: company.email,
  };
}

export async function buildReservationParte(reservationId: string) {
  const repo = getRepository();
  const [reservation, travellers] = await Promise.all([
    repo.getReservation(reservationId),
    repo.listTravellers(reservationId),
  ]);
  if (!reservation) return null;
  return {
    reservation,
    travellers,
    status: registryStatus(travellers, reservation.guests, reservation.checkIn),
    parte: buildParte(
      establishmentBlock(reservation.propertyId),
      {
        reference: reservation.code,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        guests: reservation.guests,
        internetAccess: true,
      },
      travellers,
    ),
  };
}

export async function submitParte(
  reservationId: string,
): Promise<{ ok: boolean; ref?: string; error?: string }> {
  if (!sesHospedajesConfigured()) {
    return {
      ok: false,
      error:
        "SES.HOSPEDAJES no configurado. Sube el parte en el portal oficial y marca el envío manualmente.",
    };
  }
  const bundle = await buildReservationParte(reservationId);
  if (!bundle) return { ok: false, error: "Reserva no encontrada" };
  if (!bundle.status.complete) {
    return { ok: false, error: "El parte está incompleto; complétalo antes de enviarlo." };
  }

  try {
    // TODO: implement the SES.HOSPEDAJES SOAP call with the owner's WSDL + certs.
    throw new Error("SES_HOSPEDAJES_BINDING_PENDING");
  } catch (err) {
    reportError(err, { scope: "registry/submit", extra: { reservationId } });
    return {
      ok: false,
      error:
        "La integración automática con SES.HOSPEDAJES aún no está finalizada (falta el WSDL/certificado). Usa el envío manual.",
    };
  }
}
