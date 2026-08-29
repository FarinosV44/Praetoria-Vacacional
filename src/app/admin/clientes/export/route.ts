import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository } from "@/lib/repository";
import { getPropertyById, getPropertyBySlug } from "@/domains/properties/registry";
import { displayName } from "@/domains/crm/types";
import { toCsv, csvResponse } from "@/lib/csv";
import type { ReservationSource } from "@/domains/booking/types";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new Response("No autorizado", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const repo = getRepository();

  const customers = await repo.listCustomers({
    q: sp.get("q") || undefined,
    channel: (sp.get("channel") as ReservationSource) || undefined,
    property: getPropertyBySlug(sp.get("property") ?? "")?.id,
    consentOnly: sp.get("consent") === "1",
    repeatersOnly: sp.get("repeaters") === "1",
  });
  const profiles = await Promise.all(customers.map((c) => repo.customerProfile(c.id)));

  const body = toCsv(
    [
      "nombre",
      "email",
      "telefono",
      "whatsapp",
      "documento",
      "direccion",
      "cp",
      "localidad",
      "provincia",
      "pais",
      "idioma",
      "canal_origen",
      "reservas_confirmadas",
      "gasto_total_eur",
      "ultimo_alojamiento",
      "ultima_estancia",
      "cupones_usados",
      "consentimiento",
      "alta",
    ],
    customers.map((c, i) => {
      const p = profiles[i];
      return [
        displayName(c),
        c.email,
        c.phone,
        c.whatsapp,
        c.docNumber,
        c.address,
        c.postalCode,
        c.city,
        c.province,
        c.country,
        c.language,
        c.channelOrigin,
        p?.confirmedCount ?? 0,
        ((p?.totalSpentCents ?? 0) / 100).toFixed(2),
        p?.lastPropertyId ? (getPropertyById(p.lastPropertyId)?.name ?? p.lastPropertyId) : "",
        p?.lastStay ?? "",
        (p?.couponsUsed ?? []).join(" "),
        c.marketingConsent ? "si" : "no",
        c.createdAt.slice(0, 10),
      ];
    }),
  );
  return csvResponse("clientes.csv", body);
}
