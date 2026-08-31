import type { PropertyContent } from "@/domains/properties/types";

/**
 * Javalambre Mountain SuperSki — the SNOW property.
 *
 * Content extracted (issue #35) from the owner's Booking listing:
 * https://www.booking.com/hotel/es/javalambre-mountain-resort.es.html
 * Every field below is real and source-backed. The drive to the slopes was
 * corrected to ~10 minutes and the village of Camarena de la Sierra given more
 * weight in issue #53. Photos live in public/images/properties/javalambre (see
 * photo-manifest.json) and are served locally — the site never depends on
 * Booking at runtime.
 */
export const javalambre: PropertyContent = {
  slug: "javalambre",
  id: "11111111-1111-4111-8111-111111111111",
  name: "Javalambre Mountain SuperSki",
  experience: "ski",
  currency: "EUR",
  tagline: "Apartamento en Camarena de la Sierra, a 10 minutos de las pistas de Javalambre",
  shortIntro:
    "Un apartamento nuevo de 70 m² en Camarena de la Sierra, un pueblo serrano de piedra y fuentes, con vistas a la montaña y a unos 10 minutos en coche de las pistas de Javalambre. Chimenea de pellets, cocina completa, parking gratis y guardaesquís: una de las escapadas de nieve más cómodas desde Valencia, sin necesidad de organizar un gran viaje de montaña.",

  idealFor: [
    "Familias con niños",
    "Primeras veces en la nieve y principiantes",
    "Fines de semana y puentes desde Valencia",
    "Grupos pequeños que esquían juntos",
    "Escapada de montaña también sin esquís",
  ],

  weekendPlan: [
    {
      day: "Viernes",
      text: "Llegada por la tarde, se enciende la chimenea de pellets y se deja el material en el guardaesquís. Cena en el pueblo de Camarena de la Sierra.",
    },
    {
      day: "Sábado",
      text: "Desayuno y a las pistas: en unos 10 minutos estás calzando los esquís en Javalambre. Comida en la estación y tarde de nieve; de vuelta, sobremesa larga en el apartamento.",
    },
    {
      day: "Domingo",
      text: "Media mañana de pistas o un paseo por la sierra si no esquías, y salida sin prisa. Camarena queda a poco más de una hora de Valencia.",
    },
  ],

  highlights: [
    {
      title: "A unos 10 minutos en coche de las pistas de Javalambre",
      body: "El apartamento está en Camarena de la Sierra, el pueblo más cercano a la estación. Sales por la mañana y en unos 10 minutos estás calzando los esquís.",
    },
    {
      title: "Guardaesquís, forfaits y alquiler de material",
      body: "El edificio tiene habitación guardaesquís, punto de venta de forfaits y servicio de alquiler de equipo: llegas, dejas las botas secándose y no cargas con nada.",
    },
    {
      title: "Chimenea de pellets y calefacción",
      body: "Salón con chimenea de pellets además de la calefacción. Varios huéspedes destacan lo cálido que se mantiene el apartamento en pleno invierno.",
    },
    {
      title: "Apartamento nuevo de 70 m², parking gratis y balcón a la montaña",
      body: "Dos dormitorios, cocina totalmente equipada con lavavajillas y horno, balcón con vistas a la sierra y plaza de aparcamiento gratuita en el mismo edificio, sin buscar sitio en la calle con nieve. Para hasta 6 personas.",
    },
    {
      title: "En un pueblo serrano de verdad, no en un resort",
      body: "Camarena de la Sierra conserva una atmósfera de pueblo de montaña tradicional: calles de piedra, fuentes, paisaje y un ritmo ajeno al turismo de masas. Además del esquí, la experiencia de pasar unos días en un pueblo serrano español.",
    },
    {
      title: "Ideal para familias y para la primera vez en la nieve",
      body: "Javalambre es una estación cómoda para aprender y disfrutar sin agobios. Con la proximidad del apartamento a las pistas, es una escapada de fin de semana fácil de organizar, también con niños.",
    },
  ],

  location: {
    city: "Camarena de la Sierra",
    region: "Teruel · Aragón",
    area: "Camarena de la Sierra",
    addressLine: "24 Calle San Mateo",
    postalCode: "44459",
    country: "ES",
    geo: { lat: 40.0961, lng: -1.0447 },
    status: "authored",
    gettingThere: [
      "En coche por la A-23 (Sagunto–Teruel), autovía casi todo el trayecto, y luego una corta subida de montaña hasta Camarena de la Sierra. En invierno conviene llevar cadenas o neumáticos de invierno.",
      "Desde Valencia son unas 2 horas; desde Teruel capital, unos 40 minutos; desde Zaragoza, algo más de 2 horas. La estación de tren más cercana es Puebla de Valverde, a 15 km.",
      "Las pistas de la estación de esquí de Javalambre quedan a unos 10 minutos en coche desde el apartamento.",
    ],
  },

  capacity: {
    guests: 6,
    bedrooms: 2,
    beds: 3,
    bathrooms: 1,
    bedConfig: "1 cama doble grande · 1 litera · 1 sofá cama",
    sizeSqm: 70,
  },

  amenityGroups: [
    {
      category: "Esquí y montaña",
      items: [
        "Guardaesquís y habitación guardarropía",
        "Punto de venta de forfaits",
        "Servicio de alquiler de equipamiento de esquí",
        "Vistas a la montaña desde el apartamento",
      ],
    },
    {
      category: "Confort",
      items: [
        "Calefacción",
        "Chimenea de pellets en el salón",
        "Balcón",
        "Ascensor en el edificio",
        "Ropa de cama y toallas incluidas",
        "Habitaciones sin humo",
      ],
    },
    {
      category: "Cocina",
      items: [
        "Cocina totalmente equipada",
        "Lavavajillas",
        "Microondas y horno",
        "Frigorífico",
        "Cafetera italiana",
      ],
    },
    {
      category: "Ocio y conectividad",
      items: [
        "WiFi gratis (32 Mbps) en todo el alojamiento",
        "TV de pantalla plana vía satélite",
        "HBO y Netflix",
      ],
    },
    {
      category: "Aparcamiento",
      items: ["Parking privado gratis en el mismo edificio"],
    },
  ],
  amenitiesStatus: "authored",

  nearby: [
    { name: "Estación de esquí de Javalambre", category: "ski", distance: "~10 min en coche" },
    { name: "Restaurante La Fondica", category: "food", distance: "14 km" },
    { name: "Restaurante El Salón (Riodeva)", category: "food", distance: "15 km" },
    { name: "El Ventorrillo", category: "food", distance: "16 km" },
    { name: "Estación de tren de Puebla de Valverde", category: "transport", distance: "15 km" },
    { name: "Teruel capital (conjunto mudéjar)", category: "landmark", distance: "~40 min en coche" },
    { name: "Aeropuerto de Valencia", category: "airport", distance: "137 km" },
  ],
  distancesStatus: "authored",
  headlineDistance: { label: "A las pistas de Javalambre", value: "~10 min en coche" },

  galleryStatus: "authored",

  sections: [
    {
      heading: "Una base a diez minutos de las pistas",
      body: [
        "El apartamento está en el centro de Camarena de la Sierra, a unos 10 minutos en coche de la estación de esquí de Javalambre. Es de las formas más cómodas de esquiar cerca de Valencia: sales, llegas a pistas antes de las colas y vuelves a comer o a descansar al apartamento sin recorrer medio valle.",
        "Es un apartamento nuevo de 70 m² con dos dormitorios, salón con chimenea de pellets, cocina totalmente equipada y balcón con vistas a la montaña. Tiene guardaesquís, punto de forfaits y alquiler de material, así que puedes llegar, dejar el equipo y centrarte en esquiar.",
        "La estación de Javalambre, del grupo Aramón, es una de las más accesibles del este peninsular y especialmente cómoda para familias y para quienes se estrenan en la nieve.",
      ],
    },
    {
      heading: "Camarena de la Sierra, un pueblo serrano con vida propia",
      body: [
        "Camarena conserva una atmósfera de pueblo de montaña tradicional, con un ritmo y una escala que parecen ajenos al turismo de masas: calles de piedra, fuentes por todo el casco —de ahí que se la conozca como la villa de las fuentes—, y el paisaje de la sierra siempre delante. Pasear por el pueblo al caer la tarde es parte del plan, no solo esquiar.",
        "Su entorno es además un destino de montaña todo el año: senderismo, BTT, escalada, micología y barranquismo, con una ruta fluvial por el propio pueblo apta para hacer en familia.",
        "La comarca Gúdar-Javalambre es Destino Turístico Starlight y una de las zonas con menos contaminación lumínica de Europa; el Observatorio Astrofísico de Javalambre está muy cerca.",
      ],
    },
    {
      heading: "Trato directo con el propietario",
      body: [
        "La entrega y recogida de llaves es personalizada, con guía de la zona y sus actividades. El anfitrión, Juan José, atiende en español, inglés, francés e italiano.",
      ],
    },
  ],

  faq: [
    {
      question: "¿A qué distancia está el apartamento de las pistas de Javalambre?",
      answer:
        "La estación de esquí de Javalambre está a unos 10 minutos en coche desde el apartamento, en Camarena de la Sierra.",
    },
    {
      question: "¿Cuántas personas caben?",
      answer:
        "Hasta 6 personas: 1 cama doble grande, 1 litera y 1 sofá cama, repartidas en 2 dormitorios y el salón. El apartamento tiene 70 m² y 1 baño con ducha y bidé.",
    },
    {
      question: "¿Hay calefacción?",
      answer:
        "Sí. El apartamento tiene calefacción y, además, una chimenea de pellets en el salón. Varios huéspedes destacan lo cálido y confortable que se mantiene en invierno.",
    },
    {
      question: "¿Se puede aparcar?",
      answer:
        "Sí. Hay parking privado gratuito en el mismo edificio. Los huéspedes recientes no han tenido ningún problema para aparcar.",
    },
    {
      question: "¿Cuál es el horario de entrada y salida?",
      answer:
        "Entrada de 15:00 a 20:00 y salida de 8:00 a 11:00. Se pide avisar con antelación de la hora prevista de llegada para coordinar la entrega de llaves.",
    },
    {
      question: "¿La reserva se confirma al instante?",
      answer:
        "Sí. Tras el pago seguro con tarjeta recibirás el email de confirmación con tu localizador y las fechas quedan bloqueadas automáticamente.",
    },
  ],

  reviews: [
    {
      author: "María",
      rating: 10,
      text: "Fuimos una familia de 5 miembros. La casa muy cómoda, con todo lo necesario para disfrutar de unos días de desconexión. La calefacción calentaba mucho pero también tenía opción de chimenea de pellets. Muy limpio todo. Repetiríamos sin dudarlo.",
      date: "2025-02-10",
      source: "booking",
      locale: "es",
    },
    {
      author: "Carla",
      rating: 9,
      text: "Vistas a la montaña, limpio, cómodo, con ascensor, silencioso. Pistas a 10 min en coche.",
      date: "2025-01-22",
      source: "booking",
      locale: "es",
    },
    {
      author: "Pepe",
      rating: 10,
      text: "Me ha encantado mi estancia en este apartamento. Una de las cosas que más valoro es que cuenta con licencia, lo que me dio mucha tranquilidad. La cocina está completamente equipada con lavavajillas, microondas, horno, cafetera italiana, frigorífico...",
      date: "2025-03-05",
      source: "booking",
      locale: "es",
    },
    {
      author: "Almudena",
      rating: 9,
      text: "El apartamento estaba muy bien, prácticamente nuevo. Las camas muy cómodas. Ningún problema para aparcar.",
      date: "2024-12-28",
      source: "booking",
      locale: "es",
    },
    {
      author: "David",
      rating: 10,
      text: "La casa tenía todo lo necesario para la estancia, la casera muy amable y servicial. Sin duda un lugar con mucho encanto.",
      date: "2025-02-18",
      source: "booking",
      locale: "es",
    },
  ],
  rating: { value: 8.7, count: 43, source: "booking" },

  stayInfo: {
    checkIn: "De 15:00 a 20:00",
    checkOut: "De 8:00 a 11:00",
    deposit: "Depósito por daños reembolsable de 150 € por transferencia, devuelto 7 días después de la salida si no hay incidencias.",
    notes: [
      "No se puede fumar.",
      "No se admiten mascotas.",
      "No se pueden celebrar fiestas ni despedidas.",
      "Los menores de 18 años solo pueden alojarse acompañados de un progenitor o tutor.",
    ],
    licenseNumber: "VUTE-23-0450 / VUTE-23-045",
  },

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
    metaTitle: "Alojamiento en Camarena de la Sierra junto a Javalambre | Praetoria Vacacional",
    metaDescription:
      "Apartamento nuevo de 70 m² en Camarena de la Sierra (Teruel), a unos 10 min en coche de las pistas de Javalambre. Chimenea, cocina completa, parking gratis y guardaesquís. Reserva directa.",
    h1: "Apartamento en Camarena de la Sierra, junto a la estación de Javalambre",
    ogImage: "/images/properties/javalambre/salon-comedor-1200.webp",
  },

  icalImportUrls: [{ channel: "booking", url: "" }],

  en: {
    tagline: "Apartment in Camarena de la Sierra, 10 minutes from the Javalambre slopes",
    shortIntro:
      "A new 70 m² apartment in Camarena de la Sierra, a traditional stone-and-springs mountain village, with mountain views and about a 10-minute drive from the Javalambre slopes. Pellet stove, full kitchen, free parking and ski storage — one of the easiest snow escapes from Valencia, with no big mountain trip to organise.",
    seo: {
      metaTitle: "Accommodation in Camarena de la Sierra near Javalambre | Praetoria Vacacional",
      metaDescription:
        "New 70 m² apartment in Camarena de la Sierra (Teruel, Spain), about a 10-minute drive from the Javalambre slopes. Stove, full kitchen, free parking, ski storage. Book direct.",
      h1: "Apartment in Camarena de la Sierra, next to the Javalambre resort",
      ogImage: "/images/properties/javalambre/salon-comedor-1200.webp",
    },
    sections: [
      {
        heading: "A base ten minutes from the slopes",
        body: [
          "The apartment is in the centre of Camarena de la Sierra, about a 10-minute drive from the Javalambre ski resort. It is one of the most comfortable ways to ski near Valencia: you set off, reach the slopes before the queues, and come back to eat or rest at the apartment without crossing half the valley.",
          "It is a new 70 m² apartment with two bedrooms, a living room with a pellet stove, a fully equipped kitchen and a balcony with mountain views. It has ski storage, a ski-pass point and equipment rental, so you can arrive, drop your gear and focus on skiing.",
          "The Javalambre resort, part of the Aramón group, is one of the most accessible in eastern Spain and especially comfortable for families and first-timers on snow.",
        ],
      },
      {
        heading: "Camarena de la Sierra, a mountain village with a life of its own",
        body: [
          "Camarena keeps the feel of a traditional mountain village, with a pace and a scale that seem untouched by mass tourism: stone streets, springs all through the old centre, and the range always in view. An evening stroll through the village is part of the trip, not just the skiing.",
          "Its surroundings are a year-round mountain destination too: hiking, mountain biking, climbing, mushroom foraging and canyoning, plus a river walk through the village that works well with children.",
          "The Gúdar-Javalambre region is a Starlight Tourist Destination and one of the darkest skies in Europe; the Javalambre Astrophysical Observatory is nearby.",
        ],
      },
    ],
    cancellationSummary:
      "Free cancellation up to 30 days before check-in. After that, terms apply per the property's policy.",
    highlights: [
      {
        title: "About 10 minutes' drive from the Javalambre slopes",
        body: "The apartment is in Camarena de la Sierra, the closest village to the resort. Leave in the morning and you are clipping into your skis about 10 minutes later.",
      },
      {
        title: "Ski storage, passes and equipment rental",
        body: "The building has a ski storage room, a ski-pass point and equipment rental: arrive, leave your boots to dry and carry nothing.",
      },
      {
        title: "Pellet stove and heating",
        body: "A living room with a pellet stove on top of the central heating. Guests keep mentioning how warm the apartment stays in midwinter.",
      },
      {
        title: "New 70 m² apartment, free parking and a mountain-view balcony",
        body: "Two bedrooms, a fully equipped kitchen with dishwasher and oven, a balcony facing the range and a free parking space in the same building. Sleeps up to 6.",
      },
      {
        title: "A real mountain village, not a resort",
        body: "Camarena de la Sierra keeps the feel of a traditional mountain village — stone streets, springs, landscape and a pace far from mass tourism. Beyond the skiing, the experience of a few days in a Spanish mountain village.",
      },
      {
        title: "Great for families and a first time on snow",
        body: "Javalambre is an easy resort to learn and enjoy without stress. With the apartment so close to the slopes, it is a weekend escape that is simple to organise, children included.",
      },
    ],
  },
};
