import type { PropertyContent } from "@/domains/properties/types";

/**
 * Valencia Frente al Mar — the SEA property.
 *
 * Content extracted (issue #35) from the owner's Booking listing:
 * https://www.booking.com/hotel/es/valencia-frente-al-mar.es.html
 * The apartment is in Mareny de Barraquetes (Sueca), on the quiet beach south
 * of Valencia city, right on the Mediterranean. Photos live in
 * public/images/properties/valencia and are served locally.
 */
export const valencia: PropertyContent = {
  slug: "valencia",
  id: "22222222-2222-4222-8222-222222222222",
  name: "Valencia Frente al Mar",
  experience: "sea",
  currency: "EUR",
  tagline: "Apartamento en primera línea de la playa Les Palmeretes, al sur de Valencia",
  shortIntro:
    "Un apartamento de 75 m² a 3 minutos a pie de la playa Les Palmeretes, en Mareny de Barraquetes (Sueca), con vistas al mar desde el balcón, zona privada de playa y parking gratis. Un tramo de litoral tranquilo junto a la Albufera, a media hora de Valencia capital.",

  location: {
    city: "Mareny de Barraquetes (Sueca), Valencia",
    region: "Comunidad Valenciana",
    area: "Frente al mar",
    addressLine: "Carrer del Mestre Navarro 1, pta 3",
    postalCode: "46419",
    country: "ES",
    geo: { lat: 39.3243, lng: -0.294 },
    status: "authored",
    gettingThere: [
      "En coche desde Valencia por la V-31 y la CV-500, unos 30 minutos hasta Mareny de Barraquetes.",
      "En tren, las estaciones de Sueca (8 km) y Cullera (11 km) son las más cercanas; desde allí, taxi o bus local hasta la playa.",
      "El Aeropuerto de Valencia está a 34 km. La Ciudad de las Artes y las Ciencias y el Oceanográfic quedan a unos 24 km.",
    ],
  },

  capacity: {
    guests: 4,
    bedrooms: 3,
    beds: 3,
    bathrooms: 1,
    bedConfig: "1 cama doble extragrande · 2 literas",
    sizeSqm: 75,
  },

  amenityGroups: [
    {
      category: "Mar y playa",
      items: [
        "Situado frente a la playa Les Palmeretes",
        "Zona privada de playa",
        "Balcón con vistas al mar",
        "Terraza",
      ],
    },
    {
      category: "Confort",
      items: [
        "Calefacción",
        "Recepción 24 horas",
        "Ropa de cama y toallas incluidas",
        "Habitaciones sin humo",
        "Apto para familias",
      ],
    },
    {
      category: "Cocina",
      items: ["Cocina totalmente equipada", "Zona de comedor", "Frigorífico"],
    },
    {
      category: "Conectividad",
      items: ["WiFi gratis en todo el alojamiento", "TV de pantalla plana vía satélite"],
    },
    {
      category: "Aparcamiento",
      items: ["Parking gratis"],
    },
  ],
  amenitiesStatus: "authored",

  nearby: [
    { name: "Playa Les Palmeretes", category: "beach", distance: "3 min a pie" },
    { name: "Restaurante La Manduca Maresa", category: "food", distance: "500 m" },
    { name: "Bar Autónomo", category: "food", distance: "950 m" },
    { name: "Restaurante Llobarro", category: "food", distance: "1,7 km" },
    { name: "Platja del Mareny de Barraquetes", category: "beach", distance: "1,8 km" },
    { name: "Parque Natural de la Albufera", category: "nature", distance: "8 km" },
    { name: "Estación de tren de Sueca", category: "transport", distance: "8 km" },
    { name: "Faro de Cullera", category: "landmark", distance: "9 km" },
    { name: "Estación de tren de Cullera", category: "transport", distance: "11 km" },
    { name: "Ciudad de las Artes y las Ciencias / Oceanográfic", category: "landmark", distance: "24 km" },
    { name: "Aeropuerto de Valencia", category: "airport", distance: "34 km" },
  ],
  distancesStatus: "authored",
  headlineDistance: { label: "A la playa Les Palmeretes", value: "3 min a pie" },

  galleryStatus: "authored",

  sections: [
    {
      heading: "Primera línea de mar en un tramo de costa tranquilo",
      body: [
        "El apartamento está en Mareny de Barraquetes, en el municipio de Sueca, en la playa Les Palmeretes: un arenal amplio y tranquilo del litoral sur de Valencia, lejos del bullicio de la playa urbana.",
        "Son 75 m² con tres dormitorios, salón-comedor, cocina totalmente equipada y un balcón con vistas directas al Mediterráneo. Nada más bajar del edificio estás en la arena, y el alojamiento cuenta con zona privada de playa y recepción 24 horas.",
        "A las parejas les encanta la ubicación —Booking la valora con un 9,4 para viajes de dos personas— y el barrio es especialmente tranquilo, con un horario sin ruido de 22:00 a 9:00.",
      ],
    },
    {
      heading: "La Albufera, Cullera y Valencia, muy cerca",
      body: [
        "El Parque Natural de la Albufera queda a 8 km: paseos en barca al atardecer y arroces en El Palmar. El faro y el castillo de Cullera están a unos 9 km.",
        "Valencia capital, con su casco histórico, la Ciudad de las Artes y las Ciencias y el Oceanográfic, está a una media hora en coche.",
      ],
    },
    {
      heading: "Trato directo con los anfitriones",
      body: [
        "Los anfitriones —Lucía y Paula gestionan el día a día— son muy valorados por su atención: siempre disponibles para cualquier duda antes o durante la estancia. El propietario atiende en catalán, español, inglés, francés e italiano.",
      ],
    },
  ],

  faq: [
    {
      question: "¿El apartamento está realmente frente a la playa?",
      answer:
        "Sí. Está en primera línea de la playa Les Palmeretes, a unos 3 minutos a pie de la arena, con vistas al mar desde el balcón y zona privada de playa.",
    },
    {
      question: "¿Dónde está exactamente?",
      answer:
        "En Mareny de Barraquetes, en el municipio de Sueca, en el litoral sur de la provincia de Valencia, junto al Parque Natural de la Albufera. Valencia capital está a una media hora en coche.",
    },
    {
      question: "¿Cuántas personas caben?",
      answer:
        "Hasta 4 personas en 3 dormitorios: 1 cama doble extragrande y 2 literas. El apartamento tiene 75 m² y 1 baño.",
    },
    {
      question: "¿Hay parking?",
      answer: "Sí, el apartamento dispone de parking gratuito.",
    },
    {
      question: "¿Cuál es el horario de entrada y salida?",
      answer:
        "Entrada de 17:00 a 23:00 (con documento de identidad y tarjeta) y salida de 10:00 a 11:00. Hay recepción 24 horas y se pide avisar de la hora de llegada.",
    },
    {
      question: "¿La reserva se confirma al instante?",
      answer:
        "Sí. Tras el pago seguro recibirás el email de confirmación con tu localizador y las fechas quedan bloqueadas automáticamente.",
    },
  ],

  reviews: [
    {
      author: "Ana",
      rating: 10,
      text: "Increíbles vistas al mar. Paula es un encanto, siempre disponible y dispuesta a ayudar en lo que necesites. Camas súper cómodas y el apartamento tiene todas las comodidades que te puedas imaginar.",
      date: "2025-06-14",
      source: "booking",
      locale: "es",
    },
    {
      author: "Jose",
      rating: 9,
      text: "Los anfitriones súper amables, el piso bien equipado, unas vistas espectaculares debido a su proximidad al mar: nada más bajar estabas en la playa.",
      date: "2025-07-02",
      source: "booking",
      locale: "es",
    },
    {
      author: "Jonathan",
      rating: 10,
      text: "La ubicación es muy buena y tus mañanas serán de ensueño con vista al mar. Sector tranquilo. Lucía muy atenta siempre para cualquier situación. Agradable estancia.",
      date: "2025-05-20",
      source: "booking",
      locale: "es",
    },
    {
      author: "María",
      rating: 9,
      text: "El apartamento tiene todo lo necesario para estar a gusto, en una zona privilegiada de playa y un barrio muy tranquilo.",
      date: "2025-08-11",
      source: "booking",
      locale: "es",
    },
    {
      author: "Janeth",
      rating: 10,
      text: "Todo súper limpio, la vista me ha encantado, la atención un 10. 100% recomendado, todo de maravilla.",
      date: "2025-06-30",
      source: "booking",
      locale: "es",
    },
  ],
  rating: { value: 8.7, count: 50, source: "booking" },

  stayInfo: {
    checkIn: "De 17:00 a 23:00 (documento de identidad y tarjeta de crédito)",
    checkOut: "De 10:00 a 11:00",
    deposit:
      "Podría solicitarse un pago de hasta 300 € tras la salida en caso de daños, según las condiciones del alojamiento.",
    notes: [
      "No se puede fumar.",
      "No se admiten mascotas.",
      "No se pueden celebrar fiestas ni despedidas.",
      "Horario sin ruido de 22:00 a 9:00.",
      "Los menores de 18 años solo pueden alojarse acompañados de un progenitor o tutor.",
    ],
    licenseNumber: "VT-56539-V2 / VT-56539-V",
  },

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
    metaTitle: "Apartamento frente al mar en la playa Les Palmeretes (Valencia) | Praetoria Vacacional",
    metaDescription:
      "Apartamento de 75 m² a 3 min de la playa Les Palmeretes, en Mareny de Barraquetes (Sueca), litoral sur de Valencia. Vistas al mar, zona privada de playa y parking gratis. Reserva directa.",
    h1: "Apartamento frente al mar en la playa Les Palmeretes, al sur de Valencia",
    ogImage: "/images/properties/valencia/salon-vista-mar-1200.webp",
  },

  icalImportUrls: [{ channel: "booking", url: "" }],

  en: {
    tagline: "Beachfront apartment on Les Palmeretes beach, south of Valencia",
    shortIntro:
      "A 75 m² apartment a 3-minute walk from Les Palmeretes beach in Mareny de Barraquetes (Sueca), with sea views from the balcony, a private beach area and free parking. A quiet stretch of coast next to the Albufera, half an hour from Valencia city.",
    seo: {
      metaTitle: "Beachfront apartment on Les Palmeretes beach (Valencia) | Praetoria Vacacional",
      metaDescription:
        "75 m² apartment 3 min from Les Palmeretes beach, Mareny de Barraquetes (Sueca), south of Valencia. Sea views, private beach area, free parking. Book direct.",
      h1: "Beachfront apartment on Les Palmeretes beach, south of Valencia",
      ogImage: "/images/properties/valencia/salon-vista-mar-1200.webp",
    },
    sections: [
      {
        heading: "Right on the sea, on a quiet stretch of coast",
        body: [
          "The apartment is in Mareny de Barraquetes, in the municipality of Sueca, on Les Palmeretes beach: a wide, calm stretch of sand on the coast south of Valencia, away from the bustle of the city beach.",
          "It is 75 m² with three bedrooms, a living-dining room, a fully equipped kitchen and a balcony with direct Mediterranean views. Step out of the building and you are on the sand, and the property has a private beach area and 24-hour reception.",
          "Couples love the location — Booking rates it 9.4 for two-person trips — and the neighbourhood is especially quiet, with a no-noise window from 22:00 to 9:00.",
        ],
      },
      {
        heading: "The Albufera, Cullera and Valencia, all close",
        body: [
          "The Albufera natural park is 8 km away: boat trips at sunset and rice dishes in El Palmar. The Cullera lighthouse and castle are about 9 km away.",
          "Valencia city, with its old town, the City of Arts and Sciences and the Oceanogràfic, is about half an hour by car.",
        ],
      },
    ],
    cancellationSummary:
      "Free cancellation up to 14 days before check-in. After that, terms apply per the property's policy.",
  },
};
