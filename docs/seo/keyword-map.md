# Keyword → URL map (issues #15, #39)

Every indexable URL has ONE differentiated intent. Transactional and local
intents are prioritised. No two URLs target the same query.

**Real locations** (corrected in V2 after extracting the Booking listings):

- **Javalambre** → the apartment is in **Camarena de la Sierra** (Teruel), ~20 min
  by car from the ski slopes.
- **Valencia** → the apartment is in **Mareny de Barraquetes (Sueca)**, on
  **Les Palmeretes beach**, on the coast **south** of Valencia city, next to the
  Albufera — not the city beach.

## Javalambre (snow)

| URL | Primary keyword | Intent |
|---|---|---|
| `/javalambre` | alojamiento Camarena de la Sierra / apartamento Javalambre | Transactional (property) |
| `/javalambre/alojamiento-javalambre` | alojamiento Javalambre / apartamento Javalambre | Transactional |
| `/javalambre/donde-dormir-javalambre` | dónde dormir en Javalambre | Info→transactional |
| `/javalambre/alojamiento-cerca-estacion-esqui` | alojamiento cerca estación de esquí Javalambre / Camarena de la Sierra | Local transactional |
| `/guias/javalambre/guia-de-javalambre` | guía de Javalambre | Info (pillar) |
| `/guias/javalambre/esquiar-en-javalambre` | esquiar en Javalambre | Info-transactional |
| `/guias/javalambre/fin-de-semana-en-javalambre` | fin de semana de esquí Javalambre | Transactional |
| `/guias/javalambre/javalambre-con-ninos` | Javalambre con niños | Info |
| `/guias/javalambre/que-hacer-en-javalambre-sin-esquiar` | qué hacer en Javalambre sin esquiar | Info |
| `/guias/javalambre/restaurantes-y-servicios-cerca-de-javalambre` | restaurantes cerca de Javalambre / Camarena | Info local |

## Valencia (sea — southern coast)

| URL | Primary keyword | Intent |
|---|---|---|
| `/valencia` | apartamento frente al mar Valencia / playa Les Palmeretes | Transactional (property) |
| `/valencia/apartamento-playa-valencia` | apartamento playa Valencia | Transactional |
| `/valencia/alojamiento-frente-al-mar-valencia` | alojamiento frente al mar Valencia / primera línea | Transactional specific |
| `/valencia/vacaciones-playa-valencia` | apartamento vacaciones Valencia playa | Transactional seasonal |
| `/guias/valencia/guia-playas-de-valencia` | playas del sur de Valencia | Info (pillar) |
| `/guias/valencia/que-hacer-junto-al-mar-en-valencia` | qué hacer junto al mar al sur de Valencia | Info |
| `/guias/valencia/como-moverse-de-la-playa-al-centro-de-valencia` | cómo llegar a Valencia desde la playa del sur | Practical |
| `/guias/valencia/valencia-con-ninos-y-playa` | playa con niños al sur de Valencia | Info |
| `/guias/valencia/escapada-fin-de-semana-junto-al-mar-valencia` | escapada fin de semana junto al mar Valencia | Transactional |
| `/guias/valencia/restaurantes-y-ocio-cerca-de-la-playa-valencia` | restaurantes cerca de la playa Mareny / El Perelló | Info local |

## Entity signals (issue #39)

- **Praetoria Vacacional** — Organization + WebSite JSON-LD (home + all pages).
- **Each property** — VacationRental JSON-LD with real address, geo, floorSize,
  aggregateRating (8.7, from Booking), image list. BreadcrumbList on every page.
- **Each destination** — real distances rendered server-side in the "Qué tienes
  cerca" table (crawlable without JS), plus the getting-there paragraphs.

## Brand / conversion

| URL | Intent |
|---|---|
| `/` | Brand + choice (desire-first hero, then standalone booking module) |
| `/en`, `/en/javalambre`, `/en/valencia` | EN transactional, hreflang-paired |
| `/ventajas-reserva-directa` | Conversion support, linked near first CTA |
| `/guias` | Content hub → both pillar guides |

## Rules applied

- One strong landing per intent, not many weak pages (issue #39).
- Transactional URLs receive links from every relevant guide (issue #28).
- Guides link up to their pillar and across to 1–2 siblings.
- EN tree is a focused funnel (home → property → checkout); EN landings/guides
  are a later expansion.
- `noindex`: `/admin/**`, `/reservar/**`, `/reserva/**`, `/api/**`.
