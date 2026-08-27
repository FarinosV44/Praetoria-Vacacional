# Canonical & cannibalization map (issue #47)

_Last reviewed: 2026-08-27._

One strong URL per search intent. The **property page** owns the head term for
each property; **landings** own distinct modifier phrases; **guides/hubs** own
informational intent and feed internal links to the commercial pages.

## Rule set

1. Every commercial URL is self-canonical (`pageMetadata({ path })` emits
   `<link rel="canonical">` to itself). No landing canonicalises to another.
2. No two landings share a primary `keyword`. Enforced by content review + the
   admin SEO inventory (`/admin/seo`), which lists `kw:` per row.
3. A landing's `secondaryKeywords` must never equal another landing's primary
   `keyword`.
4. Every landing links **down** to the property page (booking) and is linked
   **in** from the property page (`landingLinksFor`) and, for the matching
   destination, from the guide hub. Max depth from home: home → property →
   landing = 2 clicks; home → /guias → hub → landing = 3 clicks.

## Javalambre

| URL | Primary keyword | Secondary | Intent | Canonical |
|---|---|---|---|---|
| `/javalambre` | apartamento / alojamiento Javalambre (head) | Camarena de la Sierra, casa nieve Teruel | Transaccional — ficha | self |
| `/javalambre/alojamiento-javalambre` | alojamiento Javalambre | apartamento Javalambre; dónde alojarse en Javalambre | Transaccional | self |
| `/javalambre/donde-dormir-javalambre` | dónde dormir en Javalambre | dónde alojarse Gúdar-Javalambre | Informacional-transaccional | self |
| `/javalambre/alojamiento-cerca-estacion-esqui` | alojamiento cerca de las pistas de Javalambre | alojamiento Camarena de la Sierra; apartamento para esquiar en Javalambre | Transaccional local | self |
| `/guias/javalambre` | guía de Javalambre / Camarena de la Sierra | qué hacer en Javalambre | Informacional (hub) | self |

**Overlap watch:** `alojamiento-javalambre` vs `/javalambre`. Mitigation: the
landing targets the exact phrase "alojamiento Javalambre" and routes to the
property page for booking; the property page H1 leads with "Apartamento en
Camarena de la Sierra". Kept separate — different SERP intent (list-style vs
product). Re-evaluate if GSC shows both ranking p.1–2 for the same query.

## Valencia (costa sur, Sueca)

| URL | Primary keyword | Secondary | Intent | Canonical |
|---|---|---|---|---|
| `/valencia` | apartamento frente al mar Les Palmeretes (head) | Mareny de Barraquetes, playa Sueca | Transaccional — ficha | self |
| `/valencia/apartamento-playa-valencia` | apartamento playa Valencia | apartamento playa Sueca; apartamento Les Palmeretes; apartamento Mareny de Barraquetes | Transaccional | self |
| `/valencia/alojamiento-frente-al-mar-valencia` | alojamiento frente al mar Valencia | apartamento primera línea playa Valencia; alojamiento con vistas al mar Valencia | Transaccional específico | self |
| `/valencia/vacaciones-playa-valencia` | vacaciones playa Valencia | alojamiento cerca de la Albufera; apartamento vacaciones costa de Valencia | Transaccional estacional | self |
| `/guias/valencia-playa` | guía costa sur de Valencia / Les Palmeretes | Albufera, Cullera, Sueca | Informacional (hub) | self |

**Overlap watch:** `apartamento-playa-valencia` vs
`alojamiento-frente-al-mar-valencia`. Distinct primary phrases ("playa" as a
category vs "frente al mar" as a position). Both are named priorities in #47.
Cross-linked, not merged. `vacaciones-playa-valencia` is seasonal-leaning and
pairs with the seasonal pages (issue #48) rather than the two above.

## Seasonal pages (issue #48)

Seasonal URLs live under `/ofertas/<slug>` and are **only indexable when
`published` and backed by real copy + CTA**. They canonical to themselves and
link to the property + the relevant landing. They never target a landing's
primary keyword; they target season-qualified variants ("Navidad en
Javalambre", "verano en la playa de Valencia"). Draft seasonal pages are
`noindex` and excluded from the sitemap.

## Not thin

Every published landing now carries: commercial hero with keyword, a real photo,
an advantages summary, a distances table, deep local copy, guest reviews, a
specific FAQ (+ FAQPage schema) and links to the destination guides. Reviewed
2026-08-27 — none is thin content.
