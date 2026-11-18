import type { ReportEvent, ReservationReport } from "./types";

/**
 * Plazos del RD 933/2021 (#178): cada hecho —formalización de la reserva, su
 * anulación y la entrada de los viajeros— se comunica como máximo en las
 * 24 horas siguientes a que ocurra.
 *
 * Para la entrada no sabemos la hora exacta de llegada, así que tomamos como
 * referencia prudente el comienzo del día de entrada (hora de Madrid): así el
 * aviso nunca llega tarde. Los avisos son ayudas internas; la obligación legal
 * sigue siendo del titular y depende de que nos informe a tiempo.
 */

const H = 60 * 60 * 1000;
export const LEGAL_WINDOW_HOURS = 24;
/** A partir de aquí avisamos de que vence pronto. */
export const SOON_HOURS = 8;

/** Medianoche de una fecha YYYY-MM-DD en Europe/Madrid, como instante UTC. */
export function madridMidnight(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  // Probamos los dos desfases posibles de Madrid (+1 / +2) y nos quedamos con el
  // que, formateado en Madrid, da las 00:00 de ese día.
  for (const offset of [1, 2]) {
    const guess = new Date(Date.UTC(y, m - 1, d, 0 - offset, 0, 0));
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      hourCycle: "h23",
      day: "2-digit",
    }).formatToParts(guess);
    const hour = parts.find((p) => p.type === "hour")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    if (hour === "00" && Number(day) === d) return guess;
  }
  return new Date(Date.UTC(y, m - 1, d, -1, 0, 0));
}

/**
 * «2026-11-18T10:30» (input datetime-local, hora de Madrid, sin zona) → ISO UTC.
 * Si ya trae zona (Z o ±hh:mm) se respeta tal cual.
 */
export function madridLocalToIso(local: string): string {
  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(local)) return new Date(local).toISOString();
  const [date, time = "00:00"] = local.split("T") as [string, string?];
  const [h, m] = time.split(":").map(Number) as [number, number];
  const base = madridMidnight(date);
  return new Date(base.getTime() + (h * 60 + m) * 60_000).toISOString();
}

/** Momento del hecho que dispara cada comunicación. */
export function eventMoment(
  r: Pick<ReservationReport, "bookedAt" | "checkIn" | "cancelledAt">,
  e: ReportEvent,
): Date | null {
  switch (e) {
    case "reserva":
      return new Date(r.bookedAt);
    case "anulacion":
      return r.cancelledAt ? new Date(r.cancelledAt) : null;
    case "entrada":
      return madridMidnight(r.checkIn);
  }
}

export function deadlineFor(
  r: Pick<ReservationReport, "bookedAt" | "checkIn" | "cancelledAt">,
  e: ReportEvent,
): Date | null {
  const at = eventMoment(r, e);
  return at ? new Date(at.getTime() + LEGAL_WINDOW_HOURS * H) : null;
}

export type DeadlineState = "hecho" | "a_tiempo" | "vence_pronto" | "vencido" | "no_aplica";

export function deadlineState(
  r: ReservationReport,
  e: ReportEvent,
  now: Date = new Date(),
): { state: DeadlineState; due: Date | null } {
  const done =
    e === "reserva"
      ? r.communicatedReservaAt
      : e === "anulacion"
        ? r.communicatedAnulacionAt
        : r.communicatedEntradaAt;
  const due = deadlineFor(r, e);
  if (!due) return { state: "no_aplica", due: null };
  // Una reserva anulada antes de la entrada ya no genera parte de entrada.
  if (e === "entrada" && r.cancelledAt && new Date(r.cancelledAt) < madridMidnight(r.checkIn))
    return { state: "no_aplica", due: null };
  if (done) return { state: "hecho", due };
  const left = due.getTime() - now.getTime();
  if (left < 0) return { state: "vencido", due };
  if (left <= SOON_HOURS * H) return { state: "vence_pronto", due };
  return { state: "a_tiempo", due };
}

/**
 * Cuando el cliente nos comunica la reserva cuando ya ha vencido el plazo del
 * primer hecho, el expediente se marca «fuera de plazo» para revisión humana.
 * Comunicar tarde no borra un incumplimiento anterior (#178).
 */
export function reportedLate(
  r: Pick<ReservationReport, "bookedAt" | "checkIn" | "cancelledAt" | "reportedAt">,
): boolean {
  const due = deadlineFor(r, "reserva");
  return !!due && new Date(r.reportedAt).getTime() > due.getTime();
}

/** La siguiente comunicación pendiente con su fecha límite (para avisos). */
export function nextPending(r: ReservationReport, now: Date = new Date()) {
  const order: ReportEvent[] = ["reserva", "anulacion", "entrada"];
  for (const e of order) {
    const s = deadlineState(r, e, now);
    if (s.state === "a_tiempo" || s.state === "vence_pronto" || s.state === "vencido")
      return { event: e, ...s };
  }
  return null;
}

export const EVENT_LABEL: Record<ReportEvent, string> = {
  reserva: "Reserva",
  anulacion: "Anulación",
  entrada: "Entrada de viajeros",
};
