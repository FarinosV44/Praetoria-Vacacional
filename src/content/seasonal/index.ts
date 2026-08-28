/**
 * Season-driven SEO pages (issue #48).
 *
 * These are NOT generated from date/keyword combinations. Each one is a
 * hand-written page with its own copy, a real availability CTA and a link to the
 * property and the matching landing. URLs live under `/ofertas/<slug>`.
 *
 * `status: "draft"` pages are routable (so the owner can preview) but render
 * `noindex` and are excluded from the sitemap — a seasonal page is only indexed
 * once it has real content and value of its own.
 */

export interface SeasonalPage {
  slug: string;
  propertySlug: "javalambre" | "valencia";
  status: "draft" | "published";
  /** Primary season-qualified search intent. Never a landing's primary keyword. */
  keyword: string;
  /** Human label for the period, shown on the page. */
  period: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  blocks: { heading: string; body: string[] }[];
  faq?: { question: string; answer: string }[];
  updated: string;
}

export const seasonalPages: SeasonalPage[] = [
  {
    slug: "navidad-y-puente-de-diciembre-en-javalambre",
    propertySlug: "javalambre",
    status: "published",
    keyword: "Navidad en Javalambre",
    period: "Diciembre – Reyes",
    title: "Navidad y puente de diciembre en Javalambre | Apartamento en Camarena",
    description:
      "Escápate a la nieve en Navidad o el puente de diciembre: apartamento en Camarena de la Sierra, a 10 min de las pistas de Javalambre. Chimenea, parking y guardaesquís. Reserva directa.",
    h1: "Navidad y puente de diciembre en Javalambre",
    lead: "El puente de la Constitución y las vacaciones de Navidad son la primera gran ventana de esquí de la temporada en Javalambre. Este apartamento en Camarena de la Sierra es una base cómoda para esos días, con chimenea de pellets para las tardes frías.",
    blocks: [
      {
        heading: "Cuándo y cómo es la nieve en diciembre",
        body: [
          "La estación de Javalambre suele abrir en diciembre, sujeta a las condiciones de nieve; conviene revisar el calendario oficial de Aramón antes de reservar transporte. El puente de diciembre y la semana de Navidad son fechas de mucha demanda, así que merece la pena mirar disponibilidad con antelación.",
        ],
      },
      {
        heading: "El apartamento en fechas de frío",
        body: [
          "Salón con chimenea de pellets además de calefacción, cocina completa para cenas en casa y parking privado gratuito en el edificio para no depender de la calle con nieve. Guardaesquís y punto de forfaits en el mismo bloque.",
        ],
      },
      {
        heading: "Planes de Navidad más allá de las pistas",
        body: [
          "Observación de estrellas (la comarca es Destino Turístico Starlight), los belenes y luces de los pueblos de Gúdar-Javalambre y una escapada a Teruel capital para ver el conjunto mudéjar.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Está abierta la estación de Javalambre en Navidad?",
        answer:
          "Normalmente sí, la temporada arranca en diciembre, pero depende de la nieve. Consulta el calendario oficial de Aramón antes de organizar el viaje.",
      },
      {
        question: "¿Conviene reservar con antelación para el puente de diciembre?",
        answer:
          "Sí. Es una de las fechas de mayor demanda de la temporada; cuanto antes compruebes disponibilidad, mejor.",
      },
    ],
    updated: "2026-08-27",
  },
  {
    slug: "verano-en-la-playa-de-valencia",
    propertySlug: "valencia",
    status: "published",
    keyword: "verano en la playa de Valencia",
    period: "Junio – septiembre",
    title: "Verano en la playa al sur de Valencia | Apartamento frente al mar",
    description:
      "Verano frente al mar en la playa de la Llastra (Sueca), al sur de Valencia: arena clara y tranquila, vistas frontales al Mediterráneo, zona privada de playa y parking gratis. Reserva directa.",
    h1: "Verano en la playa al sur de Valencia",
    lead: "Julio y agosto son temporada alta en la costa sur de Valencia, y junio y septiembre mantienen buen tiempo de baño con menos gente. Este apartamento a pie de la playa de la Llastra es una base tranquila para el verano, con Valencia y la Albufera a media hora.",
    blocks: [
      {
        heading: "Cómo es el verano en la playa de la Llastra",
        body: [
          "Un arenal de arena clara del litoral sur, entre Les Palmeres y El Perelló (Sueca), lejos del bullicio de la playa urbana. Nada más bajar del edificio estás en la arena, y el alojamiento tiene zona privada de playa y recepción 24 horas.",
        ],
      },
      {
        heading: "Julio y agosto vs. junio y septiembre",
        body: [
          "Julio y agosto tienen más ambiente y precios más altos; conviene reservar con antelación. Junio y septiembre siguen siendo excelentes para bañarse, con las playas y los restaurantes de arroz mucho más tranquilos.",
        ],
      },
      {
        heading: "Planes de verano cerca",
        body: [
          "Paseo en barca por la Albufera al atardecer, arroces en El Palmar, el castillo y el faro de Cullera y, a media hora, la ciudad de Valencia con el Oceanogràfic y la Ciudad de las Artes y las Ciencias.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Qué mes es mejor para ir en verano?",
        answer:
          "Julio y agosto para máximo ambiente; junio y septiembre si prefieres buen tiempo de baño con menos gente y mejores precios.",
      },
      {
        question: "¿Hay que reservar con mucha antelación para agosto?",
        answer: "Sí, agosto es la fecha de mayor demanda. Comprueba disponibilidad cuanto antes.",
      },
    ],
    updated: "2026-08-27",
  },
  {
    slug: "semana-santa-en-javalambre",
    propertySlug: "javalambre",
    status: "draft",
    keyword: "Semana Santa en Javalambre",
    period: "Semana Santa",
    title: "Semana Santa en Javalambre | Apartamento en Camarena de la Sierra",
    description:
      "Escapada de montaña en Semana Santa a Camarena de la Sierra, sur de Teruel. Reserva directa.",
    h1: "Semana Santa en Javalambre",
    lead: "Página en preparación: la publicaremos cuando tengamos contenido propio y disponibilidad confirmada para estas fechas.",
    blocks: [
      {
        heading: "Pendiente de contenido",
        body: [
          "Esta página estacional está en borrador. No se indexa ni aparece en el mapa del sitio hasta que tenga información real de valor para estas fechas.",
        ],
      },
    ],
    updated: "2026-08-27",
  },
];

export function getSeasonalPage(slug: string): SeasonalPage | undefined {
  return seasonalPages.find((s) => s.slug === slug);
}
export function publishedSeasonalPages(): SeasonalPage[] {
  return seasonalPages.filter((s) => s.status === "published");
}
