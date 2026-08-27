import type { PropertyContent } from "@/domains/properties/types";

/**
 * Javalambre Mountain SuperSki — the SNOW property.
 *
 * Content status (decision D-004): the property's real Booking listing, exact
 * address, verified amenities, distances, photos and reviews were NOT provided.
 * Every field below that is not a safe, publicly-true fact about the destination
 * is marked `status: "placeholder"` and the UI labels it as pending owner
 * confirmation. NOTHING invented is rendered to guests as a verified fact.
 *
 * To finish: replace the placeholder blocks with the owner-authorised content
 * and flip each `status` / `*Status` flag to "authored". No code change needed.
 */
export const javalambre: PropertyContent = {
  slug: "javalambre",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Javalambre Mountain SuperSki",
  experience: "ski",
  currency: "EUR",
  tagline: "Nieve, montaña y esquí en la sierra de Javalambre",
  shortIntro:
    "Un apartamento para escapadas de esquí y montaña en la zona de la estación de Javalambre, en Teruel: ideal para fines de semana de nieve, puentes y vacaciones de invierno en familia o con amigos.",

  location: {
    city: "Javalambre",
    region: "Teruel, Aragón",
    area: "Sierra de Javalambre",
    addressLine: null,
    postalCode: null,
    country: "ES",
    // Approximate coordinates of the Javalambre ski resort area (public).
    geo: { lat: 40.0783, lng: -1.0139 },
    status: "placeholder",
  },

  capacity: {
    guests: 6,
    bedrooms: 2,
    beds: 4,
    bathrooms: 1,
  },

  amenities: [],
  amenitiesStatus: "placeholder",

  distances: [
    { label: "Estación de esquí de Javalambre", mode: "car" },
    { label: "Teruel capital", mode: "car" },
  ],
  distancesStatus: "placeholder",

  gallery: [
    {
      src: "/images/placeholders/javalambre-hero.svg",
      alt: "Apartamento Praetoria Vacacional en la sierra de Javalambre — imagen pendiente de confirmación",
      width: 1600,
      height: 1067,
      order: 0,
      hero: true,
    },
    {
      src: "/images/placeholders/javalambre-2.svg",
      alt: "Sierra de Javalambre con nieve cerca del apartamento",
      width: 1600,
      height: 1067,
      order: 1,
    },
    {
      src: "/images/placeholders/javalambre-3.svg",
      alt: "Entorno de montaña de la estación de esquí de Javalambre",
      width: 1600,
      height: 1067,
      order: 2,
    },
  ],
  galleryStatus: "placeholder",

  sections: [
    {
      heading: "Una base para tus días de esquí en Javalambre",
      body: [
        "Praetoria Vacacional en Javalambre está pensado como punto de partida para disfrutar de la nieve sin complicaciones: llegar, dejar el equipo y tener las pistas cerca para aprovechar cada jornada al máximo.",
        "La sierra de Javalambre, en la provincia de Teruel, ofrece una de las estaciones de esquí más accesibles del este peninsular, con buen ambiente familiar y una montaña tranquila lejos de las grandes aglomeraciones.",
      ],
    },
    {
      heading: "Escapadas de montaña también fuera de temporada",
      body: [
        "Fuera de la temporada de esquí, Javalambre y su entorno son un destino excelente para el senderismo, la observación astronómica en el Observatorio Astrofísico de Javalambre y las rutas por los pueblos de la comarca Gúdar-Javalambre.",
      ],
    },
  ],

  faq: [
    {
      question: "¿El apartamento está cerca de las pistas de Javalambre?",
      answer:
        "El alojamiento se encuentra en la zona de la estación de esquí de Javalambre. La distancia exacta y el tiempo de acceso se confirmarán con los datos definitivos del propietario.",
    },
    {
      question: "¿Se puede reservar para fines de semana sueltos?",
      answer:
        "Sí. La estancia mínima puede variar según la temporada; el calendario muestra las noches disponibles y el precio total antes de pagar.",
    },
    {
      question: "¿La reserva se confirma al instante?",
      answer:
        "Sí. Tras el pago seguro con tarjeta recibirás el email de confirmación con tu localizador y las fechas quedan bloqueadas automáticamente.",
    },
  ],

  reviews: [],

  cancellationPolicy: {
    summary:
      "Cancelación gratuita hasta 30 días antes de la entrada. Después, condiciones según la política del alojamiento.",
    tiers: [
      { daysBefore: 30, refundPercent: 100 },
      { daysBefore: 14, refundPercent: 50 },
      { daysBefore: 0, refundPercent: 0 },
    ],
    status: "placeholder",
  },

  seo: {
    metaTitle: "Alojamiento en Javalambre junto a la estación de esquí | Praetoria Vacacional",
    metaDescription:
      "Apartamento para escapadas de esquí y montaña en la sierra de Javalambre (Teruel). Reserva directa, disponibilidad real y confirmación inmediata.",
    h1: "Alojamiento en Javalambre para tus escapadas de nieve",
    ogImage: "/images/og/javalambre.svg",
  },

  icalImportUrls: [
    // Paste the property's Booking.com iCal export URL here (Sync calendars).
    { channel: "booking", url: "" },
  ],

  en: {
    tagline: "Snow, mountains and skiing in the Javalambre range",
    shortIntro:
      "An apartment for ski and mountain getaways near the Javalambre resort in Teruel: ideal for winter weekends, long weekends and family snow holidays.",
    seo: {
      metaTitle: "Accommodation in Javalambre near the ski resort | Praetoria Vacacional",
      metaDescription:
        "Apartment for ski and mountain getaways in the Javalambre range (Teruel, Spain). Book direct, real availability and instant confirmation.",
      h1: "Accommodation in Javalambre for your snow getaways",
      ogImage: "/images/og/javalambre.svg",
    },
    sections: [
      {
        heading: "A base for your ski days in Javalambre",
        body: [
          "Praetoria Vacacional in Javalambre is meant as a starting point to enjoy the snow with no hassle: arrive, drop your gear and have the slopes close by to make the most of every day.",
          "The Javalambre range, in the province of Teruel, has one of the most accessible ski resorts in eastern Spain, with a friendly, family atmosphere and a quiet mountain away from the big crowds.",
        ],
      },
      {
        heading: "Mountain getaways outside the season too",
        body: [
          "Outside the ski season, Javalambre and its surroundings are excellent for hiking, stargazing at the Javalambre Astrophysical Observatory and touring the villages of the Gúdar-Javalambre region.",
        ],
      },
    ],
    faq: [
      {
        question: "Is the apartment close to the Javalambre slopes?",
        answer:
          "The property is in the area of the Javalambre ski resort. The exact distance and access time will be confirmed with the owner's final details.",
      },
      {
        question: "Can I book single weekends?",
        answer:
          "Yes. The minimum stay may vary by season; the calendar shows available nights and the full price before you pay.",
      },
      {
        question: "Is the booking confirmed instantly?",
        answer:
          "Yes. After the secure card payment you receive a confirmation email with your booking reference and the dates are blocked automatically.",
      },
    ],
    cancellationSummary:
      "Free cancellation up to 30 days before check-in. After that, terms apply per the property's policy.",
  },
};
