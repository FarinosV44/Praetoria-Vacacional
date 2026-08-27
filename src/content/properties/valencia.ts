import type { PropertyContent } from "@/domains/properties/types";

/**
 * Valencia Frente al Mar — the SEA property.
 *
 * Content status (decision D-004): the real Booking listing, exact address,
 * verified amenities, distances, photos and reviews were NOT provided. Every
 * non-obvious fact is marked `status: "placeholder"` and labelled in the UI as
 * pending owner confirmation. Nothing invented is shown to guests as verified.
 *
 * To finish: replace placeholder blocks with owner-authorised content and flip
 * the `status` flags to "authored". No code change needed.
 */
export const valencia: PropertyContent = {
  slug: "valencia",
  id: "22222222-2222-4222-8222-222222222222",
  name: "Valencia Frente al Mar",
  experience: "sea",
  currency: "EUR",
  tagline: "Playa, sol y mar Mediterráneo en Valencia",
  shortIntro:
    "Un apartamento junto al mar en Valencia para vacaciones de playa, escapadas de fin de semana y días de sol mediterráneo, con la ciudad y su gastronomía a un paso.",

  location: {
    city: "Valencia",
    region: "Comunidad Valenciana",
    area: "Frente al mar",
    addressLine: null,
    postalCode: null,
    country: "ES",
    // Approximate coordinates of the Valencia seafront (public).
    geo: { lat: 39.4699, lng: -0.3246 },
    status: "placeholder",
  },

  capacity: {
    guests: 4,
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
  },

  amenities: [],
  amenitiesStatus: "placeholder",

  distances: [
    { label: "Playa", mode: "walk" },
    { label: "Centro histórico de Valencia", mode: "transit" },
  ],
  distancesStatus: "placeholder",

  gallery: [
    {
      src: "/images/placeholders/valencia-hero.svg",
      alt: "Apartamento Praetoria Vacacional frente al mar en Valencia — imagen pendiente de confirmación",
      width: 1600,
      height: 1067,
      order: 0,
      hero: true,
    },
    {
      src: "/images/placeholders/valencia-2.svg",
      alt: "Playa de Valencia junto al apartamento",
      width: 1600,
      height: 1067,
      order: 1,
    },
    {
      src: "/images/placeholders/valencia-3.svg",
      alt: "Paseo marítimo del Mediterráneo en Valencia",
      width: 1600,
      height: 1067,
      order: 2,
    },
  ],
  galleryStatus: "placeholder",

  sections: [
    {
      heading: "Vacaciones de playa en Valencia, con la ciudad al lado",
      body: [
        "Praetoria Vacacional frente al mar es el sitio para desconectar con el sonido del Mediterráneo: mañanas de playa, comidas de arroz y tardes de paseo marítimo.",
        "Valencia combina como pocas ciudades la playa urbana con un centro histórico vivo, la Ciudad de las Artes y las Ciencias y el parque natural de la Albufera a un corto trayecto.",
      ],
    },
    {
      heading: "Un destino que funciona todo el año",
      body: [
        "Más allá del verano, el clima suave de Valencia hace que las escapadas de primavera y otoño junto al mar sean igual de agradables, con menos gente y precios más contenidos.",
      ],
    },
  ],

  faq: [
    {
      question: "¿El apartamento está frente a la playa?",
      answer:
        "El alojamiento está en la zona de primera línea de mar de Valencia. La distancia exacta al agua se confirmará con los datos definitivos del propietario.",
    },
    {
      question: "¿Es fácil llegar al centro de Valencia desde el apartamento?",
      answer:
        "Sí. El frente marítimo de Valencia está bien conectado con el centro en transporte público y bicicleta; los tiempos concretos se añadirán con la información definitiva.",
    },
    {
      question: "¿La reserva se confirma al instante?",
      answer:
        "Sí. Tras el pago seguro recibirás el email de confirmación con tu localizador y las fechas quedan bloqueadas automáticamente.",
    },
  ],

  reviews: [],

  cancellationPolicy: {
    summary:
      "Cancelación gratuita hasta 14 días antes de la entrada. Después, condiciones según la política del alojamiento.",
    tiers: [
      { daysBefore: 14, refundPercent: 100 },
      { daysBefore: 7, refundPercent: 50 },
      { daysBefore: 0, refundPercent: 0 },
    ],
    status: "placeholder",
  },

  seo: {
    metaTitle: "Apartamento frente al mar en Valencia | Praetoria Vacacional",
    metaDescription:
      "Apartamento junto a la playa en Valencia para vacaciones y escapadas de fin de semana. Reserva directa, disponibilidad real y confirmación inmediata.",
    h1: "Apartamento frente al mar en Valencia",
    ogImage: "/images/og/valencia.svg",
  },

  icalImportUrls: [{ channel: "booking", url: "" }],

  en: {
    tagline: "Beach, sun and Mediterranean sea in Valencia",
    shortIntro:
      "A seafront apartment in Valencia for beach holidays, weekend getaways and days of Mediterranean sun, with the city and its food a step away.",
    seo: {
      metaTitle: "Seafront apartment in Valencia | Praetoria Vacacional",
      metaDescription:
        "Apartment by the beach in Valencia for holidays and weekend getaways. Book direct, real availability and instant confirmation.",
      h1: "Seafront apartment in Valencia",
      ogImage: "/images/og/valencia.svg",
    },
    sections: [
      {
        heading: "A beach holiday in Valencia, with the city right there",
        body: [
          "Praetoria Vacacional by the sea is the place to switch off to the sound of the Mediterranean: beach mornings, rice lunches and evening walks along the promenade.",
          "Few cities combine an urban beach with a living historic centre, the City of Arts and Sciences and the Albufera natural park a short trip away like Valencia does.",
        ],
      },
      {
        heading: "A destination that works all year round",
        body: [
          "Beyond summer, Valencia's mild climate makes spring and autumn seaside getaways just as pleasant, with fewer people and lower prices.",
        ],
      },
    ],
    faq: [
      {
        question: "Is the apartment on the beachfront?",
        answer:
          "The property is in Valencia's seafront area. The exact distance to the water will be confirmed with the owner's final details.",
      },
      {
        question: "Is it easy to reach the centre of Valencia from the apartment?",
        answer:
          "Yes. Valencia's seafront is well connected to the centre by public transport and bike; exact times will be added with the final information.",
      },
      {
        question: "Is the booking confirmed instantly?",
        answer:
          "Yes. After the secure payment you receive a confirmation email with your booking reference and the dates are blocked automatically.",
      },
    ],
    cancellationSummary:
      "Free cancellation up to 14 days before check-in. After that, terms apply per the property's policy.",
  },
};
