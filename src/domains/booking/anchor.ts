/**
 * Stable in-page anchor for a property's booking / calendar module (issue #55).
 *
 * Every "Ver fechas / disponibilidad / reservar" CTA on a property page must
 * point here — never to `#` , `/` or a shared id like `#contenido` (which also
 * belongs to the `<main>` landmark and sends the user back to the top of the
 * page). Centralised so the id and the href can never drift apart.
 */
export function bookingSectionId(propertySlug: string): string {
  return `reserva-${propertySlug}`;
}

export function bookingSectionHref(propertySlug: string): string {
  return `#${bookingSectionId(propertySlug)}`;
}
