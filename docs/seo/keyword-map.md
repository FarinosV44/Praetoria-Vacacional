# Keyword → URL map (issue #15)

Every indexable URL has ONE differentiated intent. Transactional and local
intents are prioritised. No two URLs target the same query.

## Javalambre (snow)

| URL | Primary keyword | Intent | Title / H1 focus | Internal links in |
|---|---|---|---|---|
| `/javalambre` | alojamiento Javalambre | Transactional (property) | Alojamiento en Javalambre para escapadas de nieve | home, all JV landings & guides |
| `/javalambre/alojamiento-javalambre` | alojamiento Javalambre / apartamento Javalambre | Transactional | Alojamiento en Javalambre \| reserva directa | property page, guides |
| `/javalambre/donde-dormir-javalambre` | dónde dormir en Javalambre | Info→transactional | Dónde dormir en Javalambre: opciones y consejos | pillar guide, property |
| `/javalambre/alojamiento-cerca-estacion-esqui` | alojamiento cerca estación de esquí Javalambre | Local transactional | Alojamiento cerca de la estación de esquí de Javalambre | "esquiar en Javalambre" guide, property |
| `/guias/javalambre/guia-de-javalambre` | guía de Javalambre | Info (pillar) | Guía de Javalambre: qué ver, esquiar y dónde alojarse | every JV guide + property |
| `/guias/javalambre/esquiar-en-javalambre` | esquiar en Javalambre | Info-transactional | Esquiar en Javalambre: pistas, forfait y consejos | pillar, `alojamiento-cerca-estacion-esqui` |
| `/guias/javalambre/fin-de-semana-en-javalambre` | fin de semana Javalambre | Transactional | Fin de semana en Javalambre: plan de 2 días | pillar, property |
| `/guias/javalambre/javalambre-con-ninos` | Javalambre con niños | Info | Javalambre con niños: esquí en familia | pillar |
| `/guias/javalambre/que-hacer-en-javalambre-sin-esquiar` | qué hacer en Javalambre sin esquiar | Info | Qué hacer en Javalambre sin esquiar | pillar |
| `/guias/javalambre/restaurantes-y-servicios-cerca-de-javalambre` | restaurantes cerca de Javalambre | Info local | Restaurantes y servicios cerca de Javalambre | pillar |

## Valencia Frente al Mar (sea)

| URL | Primary keyword | Intent | Title / H1 focus | Internal links in |
|---|---|---|---|---|
| `/valencia` | apartamento frente al mar Valencia | Transactional (property) | Apartamento frente al mar en Valencia | home, all VLC landings & guides |
| `/valencia/apartamento-playa-valencia` | apartamento playa Valencia | Transactional | Apartamento en la playa de Valencia \| reserva directa | property, guides |
| `/valencia/alojamiento-frente-al-mar-valencia` | alojamiento frente al mar / primera línea Valencia | Transactional specific | Alojamiento frente al mar en Valencia — primera línea | "playas de Valencia" guide, property |
| `/valencia/vacaciones-playa-valencia` | apartamento vacaciones Valencia playa | Transactional seasonal | Vacaciones de playa en Valencia \| apartamento junto al mar | "escapada fin de semana" guide, property |
| `/guias/valencia/guia-playas-de-valencia` | playas de Valencia | Info (pillar) | Guía de las playas de Valencia: cuál elegir | every VLC guide + property |
| `/guias/valencia/que-hacer-junto-al-mar-en-valencia` | qué hacer junto al mar en Valencia | Info | Qué hacer junto al mar en Valencia | pillar, property |
| `/guias/valencia/como-moverse-de-la-playa-al-centro-de-valencia` | cómo moverse de la playa al centro de Valencia | Practical | Cómo moverse de la playa al centro de Valencia | pillar |
| `/guias/valencia/valencia-con-ninos-y-playa` | Valencia con niños y playa | Info | Valencia con niños y playa: plan para toda la familia | pillar |
| `/guias/valencia/escapada-fin-de-semana-junto-al-mar-valencia` | escapada fin de semana junto al mar Valencia | Transactional | Escapada de fin de semana junto al mar en Valencia | pillar, `vacaciones-playa-valencia` |
| `/guias/valencia/restaurantes-y-ocio-cerca-de-la-playa-valencia` | restaurantes cerca de la playa de Valencia | Info local | Restaurantes y ocio cerca de la playa de Valencia | pillar |

## Brand / conversion

| URL | Intent | Notes |
|---|---|---|
| `/` | Brand + choice | "reserva directa apartamento playa y montaña" — Playa/Nieve selector |
| `/en`, `/en/javalambre`, `/en/valencia` | EN transactional | hreflang paired with the ES equivalents |
| `/ventajas-reserva-directa` | Conversion support | linked near first CTA on every commercial page |
| `/guias` | Content hub | links both pillar guides |

## Rules applied

- Transactional URLs (`/javalambre`, `/valencia`, the 6 landings) receive links
  from every relevant informational guide (issue #28).
- Guides link up to their pillar and across to 1–2 siblings, never a keyword farm.
- The EN tree is a focused funnel (home → property → checkout); EN landings/guides
  are a later expansion and are not linked from ES pages.
- `noindex`: `/admin/**`, `/reservar/**`, `/reserva/**`, `/api/**`.
