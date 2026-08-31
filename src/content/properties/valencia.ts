import type { PropertyContent } from "@/domains/properties/types";

/**
 * Valencia Frente al Mar — the SEA property.
 *
 * Content originally extracted (issue #35) from the owner's Booking listing and
 * repositioned in issue #53: the apartment is on the playa de la Llastra, a
 * quiet stretch of the southern Valencia coast between Les Palmeres and El
 * Perelló, in the municipality of Sueca, right on the Mediterranean. The
 * commercial copy no longer names Mareny de Barraquetes / Les Palmeretes.
 *
 * Structured location data (coordinates, street address, postal code) and the
 * legal tourist-registry line are kept unchanged per D-008 — the copy moves,
 * the machine data does not. Photos live in public/images/properties/valencia
 * and are served locally.
 */
export const valencia: PropertyContent = {
  slug: "valencia",
  id: "22222222-2222-4222-8222-222222222222",
  name: "Valencia Frente al Mar",
  experience: "sea",
  currency: "EUR",
  tagline: "Apartamento a pie de la playa de la Llastra, litoral sur de Valencia",
  shortIntro:
    "Un apartamento de 75 m² a pie de la playa de la Llastra, entre Les Palmeres y El Perelló, con vistas frontales al Mediterráneo desde el salón y la terraza, zona privada de playa y parking gratis. Un tramo de costa valenciana tranquilo, junto a la Albufera y a media hora de la ciudad de Valencia.",

  idealFor: [
    "Familias con niños",
    "Parejas y escapadas de playa",
    "Verano mediterráneo sin masificación",
    "Días de arroz en la Albufera y El Perelló",
    "Teletrabajo con vistas al mar en temporada baja",
  ],

  highlights: [
    {
      title: "A pie de la playa de la Llastra, a unos 5 metros de la arena",
      body: "Bajas del edificio y estás sobre la arena. El apartamento está en primera línea, con vistas frontales al mar desde el salón y la terraza: las mañanas empiezan con la playa delante y el primer baño, descalzo, sin coger el coche.",
    },
    {
      title: "Una playa de carácter local, poco masificada",
      body: "Arena clara, agua habitualmente limpia y buena calidad de baño, en un tramo de costa alejado de los grandes complejos turísticos. Entre Les Palmeres y El Perelló, al sur de Valencia.",
    },
    {
      title: "Zona privada de playa y recepción 24 horas",
      body: "El alojamiento cuenta con zona reservada de playa y recepción 24 horas para la entrega de llaves y cualquier incidencia.",
    },
    {
      title: "Barrio tranquilo, ideal para parejas y familias",
      body: "Un litoral que mantiene una escala baja y tradicional, con horario sin ruido de 22:00 a 9:00. Booking valora la ubicación con un 9,4 para viajes en pareja.",
    },
    {
      title: "75 m², tres dormitorios, cocina completa y parking gratis",
      body: "Salón-comedor, cocina totalmente equipada y tres dormitorios para hasta 6 personas. Plaza de aparcamiento gratuita, sin depender de la calle en verano. Ropa de cama y toallas incluidas.",
    },
    {
      title: "La Albufera, El Perelló, Cullera y Valencia muy cerca",
      body: "El Parque Natural de la Albufera a 8 km, el faro de Cullera a 9 km y la ciudad de Valencia a media hora en coche. Base ideal para combinar playa, arroz, naturaleza y ciudad.",
    },
  ],

  location: {
    city: "Mareny de Barraquetes",
    region: "Sueca · Valencia",
    area: "Playa de la Llastra",
    addressLine: "Carrer del Mestre Navarro 1, pta 3",
    postalCode: "46419",
    country: "ES",
    geo: { lat: 39.3243, lng: -0.294 },
    status: "authored",
    gettingThere: [
      "En coche desde Valencia por la V-31 y la CV-500, unos 30 minutos hasta este tramo del litoral sur, entre Les Palmeres y El Perelló.",
      "En tren, las estaciones de Sueca (8 km) y Cullera (11 km) son las más cercanas; desde allí, taxi o bus local hasta la playa.",
      "El Aeropuerto de Valencia está a 34 km. La Ciudad de las Artes y las Ciencias y el Oceanogràfic quedan a unos 24 km.",
    ],
  },

  capacity: {
    guests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 1,
    bedConfig: "1 dormitorio con cama doble extragrande · 2 dormitorios con literas",
    sizeSqm: 75,
  },

  amenityGroups: [
    {
      category: "Mar y playa",
      items: [
        "A pie de la playa de la Llastra",
        "Zona privada de playa",
        "Terraza con vistas frontales al mar",
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
    { name: "Playa de la Llastra", category: "beach", distance: "A pie de playa" },
    { name: "Restaurante La Manduca Maresa", category: "food", distance: "500 m" },
    { name: "Bar Autónomo", category: "food", distance: "950 m" },
    { name: "Restaurante Llobarro", category: "food", distance: "1,7 km" },
    { name: "Playa de El Perelló", category: "beach", distance: "2 km" },
    { name: "Parque Natural de la Albufera", category: "nature", distance: "8 km" },
    { name: "Estación de tren de Sueca", category: "transport", distance: "8 km" },
    { name: "Faro de Cullera", category: "landmark", distance: "9 km" },
    { name: "Estación de tren de Cullera", category: "transport", distance: "11 km" },
    { name: "Ciudad de las Artes y las Ciencias / Oceanogràfic", category: "landmark", distance: "24 km" },
    { name: "Aeropuerto de Valencia", category: "airport", distance: "34 km" },
  ],
  distancesStatus: "authored",
  headlineDistance: { label: "A la playa de la Llastra", value: "~5 m a la arena" },

  galleryStatus: "authored",

  sections: [
    {
      heading: "En primera línea de la playa de la Llastra",
      body: [
        "El apartamento está a pie de la playa de la Llastra, en el litoral sur de Valencia, entre Les Palmeres y El Perelló. A unos cinco metros de la arena: no hay carretera de por medio ni un paseo largo, bajas del portal y ya estás en la playa.",
        "Son 75 m² con tres dormitorios, salón-comedor, cocina totalmente equipada y una terraza con vistas frontales al mar. La mesa del salón está junto al ventanal: se desayuna con la playa delante, se baja descalzo a primera hora y se vuelve a mediodía sin coger el coche. El alojamiento cuenta con zona privada de playa y recepción 24 horas.",
        "A las parejas les encanta la ubicación —Booking la valora con un 9,4 para viajes de dos personas— y el barrio es especialmente tranquilo, con un horario sin ruido de 22:00 a 9:00.",
      ],
    },
    {
      heading: "Una playa con esencia de costa valenciana",
      body: [
        "La Llastra es un arenal de arena clara, con agua habitualmente limpia y buena calidad de baño, en un tramo del litoral que ha mantenido una escala más tradicional: casas bajas vinculadas históricamente al mar, poca edificación en altura y ninguno de los grandes complejos turísticos que han transformado otras costas.",
        "Es una franja de litoral menos concurrida, buena para quien busca playa de verdad sin el bullicio de los destinos más masificados. Hacia el sur, El Perelló con su puerto y sus arroces; hacia el interior, los arrozales y la Albufera.",
      ],
    },
    {
      heading: "La Albufera, Cullera y Valencia, muy cerca",
      body: [
        "El Parque Natural de la Albufera queda a 8 km: paseos en barca al atardecer saliendo de El Palmar o El Perellonet, y arroces en el pueblo. El faro y el castillo de Cullera están a unos 9 km.",
        "La ciudad de Valencia, con su casco histórico, la Ciudad de las Artes y las Ciencias y el Oceanogràfic, está a una media hora en coche. Se puede pasar la mañana en la playa y la tarde en la ciudad sin agobios.",
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
        "Sí. Está a pie de la playa de la Llastra, a unos cinco metros de la arena, en primera línea y con vistas frontales al mar desde el salón y la terraza. También tiene zona privada de playa.",
    },
    {
      question: "¿Dónde está exactamente?",
      answer:
        "En la playa de la Llastra, en el litoral sur de la provincia de Valencia, entre Les Palmeres y El Perelló (municipio de Sueca), junto al Parque Natural de la Albufera. La ciudad de Valencia está a una media hora en coche.",
    },
    {
      question: "¿Cómo es la playa de la Llastra?",
      answer:
        "Un arenal de arena clara y agua habitualmente limpia, poco masificado y alejado de los grandes complejos turísticos. Un tramo de costa valenciana que conserva parte de su carácter local y una escala más tradicional.",
    },
    {
      question: "¿Cuántas personas caben?",
      answer:
        "Hasta 6 personas en 3 dormitorios: uno con cama doble extragrande y dos con literas. El apartamento tiene 75 m² y 1 baño.",
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
    metaTitle: "Apartamento frente al mar en la playa de la Llastra (Valencia) | Praetoria Vacacional",
    metaDescription:
      "Apartamento de 75 m² a pie de la playa de la Llastra, entre Les Palmeres y El Perelló, litoral sur de Valencia. Vistas frontales al mar, zona privada de playa y parking gratis. Reserva directa.",
    h1: "Apartamento frente al mar en la playa de la Llastra, al sur de Valencia",
    ogImage: "/images/properties/valencia/salon-vista-mar-1200.webp",
  },

  icalImportUrls: [{ channel: "booking", url: "" }],

  en: {
    tagline: "Apartment right on la Llastra beach, southern Valencia coast",
    shortIntro:
      "A 75 m² apartment right on la Llastra beach, between Les Palmeres and El Perelló, with head-on Mediterranean views from the living room and terrace, a private beach area and free parking. A quiet stretch of the Valencian coast, next to the Albufera and half an hour from the city of Valencia.",
    seo: {
      metaTitle: "Beachfront apartment on la Llastra beach (Valencia) | Praetoria Vacacional",
      metaDescription:
        "75 m² apartment right on la Llastra beach, between Les Palmeres and El Perelló, southern Valencia coast. Head-on sea views, private beach area, free parking. Book direct.",
      h1: "Beachfront apartment on la Llastra beach, southern Valencia coast",
      ogImage: "/images/properties/valencia/salon-vista-mar-1200.webp",
    },
    sections: [
      {
        heading: "Front line to la Llastra beach",
        body: [
          "The apartment sits right on la Llastra beach, on the southern Valencia coast between Les Palmeres and El Perelló — about five metres from the sand. No road to cross, no long walk: you step out of the door and you are on the beach.",
          "It is 75 m² with three bedrooms, a living-dining room, a fully equipped kitchen and a terrace with head-on sea views. The table sits by the window: breakfast with the beach in front of you, an early barefoot walk down to the sand, back at midday without touching the car. The property has a private beach area and 24-hour reception.",
          "Couples love the location — Booking rates it 9.4 for two-person trips — and the neighbourhood is especially quiet, with a no-noise window from 22:00 to 9:00.",
        ],
      },
      {
        heading: "A beach with real Valencian-coast character",
        body: [
          "La Llastra is a stretch of pale, clean sand with water that is usually clear and good for swimming, on a part of the coast that has kept a more traditional scale: low houses with a long tie to the sea, little high-rise building and none of the large tourist complexes that have reshaped other coastlines.",
          "It is a quieter, less crowded strip — good for anyone who wants a real beach without the bustle of the busier destinations. South lies El Perelló, with its marina and rice restaurants; inland, the rice fields and the Albufera.",
        ],
      },
      {
        heading: "The Albufera, Cullera and Valencia, all close",
        body: [
          "The Albufera natural park is 8 km away: boat trips at sunset from El Palmar or El Perellonet, and rice dishes in the village. The Cullera lighthouse and castle are about 9 km away.",
          "The city of Valencia — its old town, the City of Arts and Sciences and the Oceanogràfic — is about half an hour by car. You can spend the morning on the beach and the afternoon in the city without rushing.",
        ],
      },
    ],
    cancellationSummary:
      "Free cancellation up to 14 days before check-in. After that, terms apply per the property's policy.",
    highlights: [
      {
        title: "Right on la Llastra beach, about 5 metres from the sand",
        body: "Step out of the building and you are on the sand. The apartment is on the front line, with head-on sea views from the living room and terrace: mornings start with the beach in front of you and the first swim, barefoot, without touching the car.",
      },
      {
        title: "A local, uncrowded beach",
        body: "Pale sand, water that is usually clean and good for swimming, on a stretch of coast away from the big tourist complexes. Between Les Palmeres and El Perelló, south of Valencia.",
      },
      {
        title: "Private beach area and 24-hour reception",
        body: "The property has a reserved beach area and 24-hour reception for key handover and anything that comes up.",
      },
      {
        title: "A quiet neighbourhood for couples and families",
        body: "A coastline that has kept a low, traditional scale, with a no-noise window from 22:00 to 9:00. Booking rates the location 9.4 for couples.",
      },
      {
        title: "75 m², three bedrooms, full kitchen and free parking",
        body: "A living-dining room, a fully equipped kitchen and three bedrooms for up to 6 people. A free parking space — no relying on the street in summer. Linen and towels included.",
      },
      {
        title: "The Albufera, El Perelló, Cullera and Valencia all close",
        body: "The Albufera natural park 8 km away, the Cullera lighthouse 9 km away and the city of Valencia half an hour by car. An ideal base for combining beach, rice, nature and city.",
      },
    ],
  },
};
