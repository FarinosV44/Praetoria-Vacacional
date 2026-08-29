import { isAdminAuthenticated } from "@/domains/admin/auth";
import { getRepository } from "@/lib/repository";
import { getPropertyById, getPropertyBySlug } from "@/domains/properties/registry";
import { toCsv, csvResponse } from "@/lib/csv";
import type { PaymentState, ReservationSource, ReservationStatus } from "@/domains/booking/types";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new Response("No autorizado", { status: 401 });
  const sp = new URL(request.url).searchParams;
  const repo = getRepository();

  const reservations = await repo.listReservations({
    propertyId: getPropertyBySlug(sp.get("property") ?? "")?.id,
    status: sp.get("status") ? [sp.get("status") as ReservationStatus] : undefined,
    source: (sp.get("channel") as ReservationSource) || undefined,
    paymentState: (sp.get("payment") as PaymentState) || undefined,
    q: sp.get("q") || undefined,
  });

  const customerIds = [...new Set(reservations.map((r) => r.customerId).filter(Boolean))] as string[];
  const customers = new Map(
    (await Promise.all(customerIds.map((id) => repo.getCustomer(id)))).flatMap((c) =>
      c ? [[c.id, c] as const] : [],
    ),
  );

  const body = toCsv(
    [
      "localizador",
      "alojamiento",
      "canal",
      "detalle_canal",
      "estado",
      "entrada",
      "salida",
      "noches",
      "huespedes",
      "importe_eur",
      "estado_pago",
      "metodo_pago",
      "nombre",
      "email",
      "telefono",
      "documento",
      "localizador_externo",
      "num_factura",
      "cliente_id",
      "creada",
    ],
    reservations.map((r) => [
      r.code,
      getPropertyById(r.propertyId)?.name ?? r.propertyId,
      r.source,
      r.channelDetail,
      r.status,
      r.checkIn,
      r.checkOut,
      r.nights,
      r.guests,
      (r.totalCents / 100).toFixed(2),
      r.paymentState,
      r.paymentMethod,
      r.guestName ?? (r.customerId ? customers.get(r.customerId)?.firstName : ""),
      r.guestEmail,
      r.guestPhone,
      r.guestDocNumber,
      r.externalLocator,
      r.invoiceNumber,
      r.customerId,
      r.createdAt.slice(0, 10),
    ]),
  );
  return csvResponse("reservas.csv", body);
}
