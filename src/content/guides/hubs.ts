/**
 * Destination guide HUBS (issue #46). Each hub is a pillar page that gathers a
 * cluster of satellite guides and routes naturally to the property. URLs:
 *   /guias/javalambre       /guias/valencia-playa
 *   /guias/javalambre/<slug> /guias/valencia-playa/<slug>
 */

export interface GuideHub {
  slug: string; // URL segment
  propertySlug: "javalambre" | "valencia";
  eyebrow: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  /** Practical summary shown near the top ("info práctica arriba"). */
  quickFacts: { label: string; value: string }[];
  sections: { heading: string; body: string[]; list?: string[] }[];
  faq: { question: string; answer: string }[];
  updated: string;
}

export const guideHubs: GuideHub[] = [
  {
    slug: "javalambre",
    propertySlug: "javalambre",
    eyebrow: "Guía de destino · Teruel",
    title: "Guía de Javalambre y Camarena de la Sierra",
    metaTitle: "Guía de Javalambre: esquí, Camarena de la Sierra y qué hacer",
    metaDescription:
      "Guía práctica para tu escapada a Javalambre: la estación de esquí, Camarena de la Sierra, cómo llegar, dónde alojarse y qué hacer con o sin nieve.",
    h1: "Guía de Javalambre y Camarena de la Sierra",
    lead: "Todo lo que necesitas para preparar una escapada a la sierra de Javalambre, en el sur de Teruel: la estación de esquí más cómoda para ir desde Valencia, el pueblo de Camarena de la Sierra a diez minutos de las pistas, cómo llegar y qué hacer durante todo el año.",
    quickFacts: [
      { label: "Dónde", value: "Sierra de Javalambre, sur de Teruel (Aragón)" },
      { label: "Pueblo base", value: "Camarena de la Sierra" },
      { label: "A las pistas", value: "~10 min en coche desde Camarena" },
      { label: "Desde Valencia / Zaragoza", value: "~2 h en coche" },
      { label: "Temporada de esquí", value: "diciembre – marzo (según nieve)" },
      { label: "Tren más cercano", value: "Puebla de Valverde (15 km)" },
    ],
    sections: [
      {
        heading: "Dónde está y cómo llegar",
        body: [
          "La sierra de Javalambre está en el extremo sur de la provincia de Teruel, en la comarca Gúdar-Javalambre. Se llega en coche por la A-23 (Sagunto–Teruel) y después por carreteras de montaña hasta Camarena de la Sierra, el pueblo situado a los pies de la estación.",
          "Desde Valencia son unas dos horas; desde Zaragoza, algo más; desde Teruel capital, unos 40 minutos. En invierno conviene llevar cadenas o neumáticos de invierno. La estación de tren más cercana es Puebla de Valverde, a 15 km.",
        ],
      },
      {
        heading: "La estación de esquí de Javalambre",
        body: [
          "Javalambre forma parte del grupo Aramón junto con Valdelinares. Es una estación de tamaño medio, con pistas amplias y un perfil especialmente cómodo para familias y para quienes están aprendiendo. La cota alta supera los 2.000 m.",
          "No hay alojamiento a pie de pistas: la mayoría de visitantes se aloja en Camarena de la Sierra (unos 10 minutos en coche) o en los pueblos de la comarca.",
        ],
      },
      {
        heading: "Camarena de la Sierra, la villa de las fuentes",
        body: [
          "Camarena es un pueblo serrano de piedra en un valle con numerosos nacimientos de agua, a unos 10 minutos de la estación. Conserva una atmósfera de pueblo de montaña tradicional, con calles, fuentes y un ritmo alejados de los grandes resorts de esquí. Además de ser la base para esquiar, es punto de partida de rutas de senderismo, BTT y escalada, y tiene una ruta fluvial apta para hacer en familia.",
        ],
      },
      {
        heading: "Cielo de estrellas",
        body: [
          "La comarca Gúdar-Javalambre está certificada como Destino Turístico Starlight y tiene uno de los cielos más oscuros de Europa. El Observatorio Astrofísico de Javalambre está muy cerca; en noche despejada se ve la Vía Láctea a simple vista.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuándo abre la estación de Javalambre?",
        answer:
          "La temporada suele ir de diciembre a marzo, sujeta a las condiciones de nieve. Consulta el calendario oficial de Aramón antes de organizar el viaje.",
      },
      {
        question: "¿Dónde es mejor alojarse para esquiar en Javalambre?",
        answer:
          "En Camarena de la Sierra, el pueblo más cercano a la estación (unos 10 minutos en coche), con servicios y guardaesquís.",
      },
      {
        question: "¿Merece la pena ir a Javalambre sin esquiar?",
        answer:
          "Sí. Senderismo, BTT, escalada, micología, observación de estrellas y los pueblos de Gúdar-Javalambre hacen que sea un destino de montaña todo el año.",
      },
    ],
    updated: "2026-08-27",
  },
  {
    slug: "valencia-playa",
    propertySlug: "valencia",
    eyebrow: "Guía de destino · Litoral sur de Valencia",
    title: "Guía de la playa de la Llastra y el litoral sur de Valencia",
    metaTitle: "Guía de la playa de la Llastra: El Perelló, Albufera y Valencia",
    metaDescription:
      "Guía práctica del litoral sur de Valencia: la playa de la Llastra entre Les Palmeres y El Perelló, la Albufera, Cullera, cómo llegar a la ciudad de Valencia y dónde comer arroz.",
    h1: "Guía de la playa de la Llastra y el litoral sur de Valencia",
    lead: "Todo para preparar una escapada al litoral sur de la provincia de Valencia: la playa de la Llastra entre Les Palmeres y El Perelló, el Parque Natural de la Albufera, Cullera y los arrozales, con la ciudad de Valencia a media hora.",
    quickFacts: [
      { label: "Dónde", value: "Playa de la Llastra (Sueca), litoral sur de Valencia" },
      { label: "Playa", value: "La Llastra: arena clara, poco masificada" },
      { label: "A Valencia ciudad", value: "~30 min en coche" },
      { label: "A la Albufera", value: "8 km" },
      { label: "A Cullera", value: "~9 km" },
      { label: "Tren más cercano", value: "Sueca (8 km) / Cullera (11 km)" },
    ],
    sections: [
      {
        heading: "Dónde está y cómo llegar",
        body: [
          "La playa de la Llastra está en el litoral sur de la provincia de Valencia, entre Les Palmeres y El Perelló, en el municipio de Sueca y junto al Parque Natural de la Albufera.",
          "En coche desde Valencia se llega por la V-31 y la CV-500 en unos 30 minutos. Las estaciones de tren de Sueca (8 km) y Cullera (11 km) están en la línea C-1 de Cercanías. El Aeropuerto de Valencia está a 34 km.",
        ],
      },
      {
        heading: "La playa y su carácter",
        body: [
          "La Llastra es un arenal de arena clara y agua habitualmente limpia, poco masificado y alejado de los grandes complejos turísticos. Es un tramo de costa valenciana que mantiene una escala más tradicional, con casas bajas vinculadas al mar y ambiente familiar, lejos del bullicio de la playa urbana de Valencia.",
          "Hacia el sur está El Perelló, con su puerto deportivo y su oferta de arroces; al norte, Les Palmeres y El Perellonet; y más allá, la larga playa de Cullera con su faro y su castillo.",
        ],
      },
      {
        heading: "La Albufera",
        body: [
          "El Parque Natural de la Albufera, a 8 km, es el mayor lago de agua dulce de España, rodeado de arrozales. El paseo en barca al atardecer saliendo de El Palmar o El Perellonet es uno de los planes imprescindibles, y termina con arroz en el pueblo.",
        ],
      },
      {
        heading: "Valencia ciudad, a media hora",
        body: [
          "La ciudad de Valencia —casco histórico, Mercado Central, la Lonja, la Ciudad de las Artes y las Ciencias y el Oceanogràfic— está a unos 30 minutos en coche o en Cercanías desde Sueca. Playa por la mañana y ciudad por la tarde es un plan perfectamente posible desde aquí.",
        ],
      },
    ],
    faq: [
      {
        question: "¿La playa de la Llastra está masificada?",
        answer:
          "No. Es un arenal tranquilo del litoral sur de Valencia, con arena clara y agua habitualmente limpia, muy diferente de la playa urbana de la ciudad y alejado de los grandes complejos turísticos.",
      },
      {
        question: "¿Dónde está exactamente la playa de la Llastra?",
        answer:
          "En el municipio de Sueca, entre Les Palmeres y El Perelló, en la costa sur de la provincia de Valencia, junto a la Albufera. La ciudad de Valencia queda a una media hora en coche.",
      },
      {
        question: "¿Se puede ir a la ciudad de Valencia desde aquí sin coche?",
        answer:
          "Sí, en Cercanías desde Sueca o Cullera (unos 40-50 minutos hasta la estación del Nord), aunque necesitarás taxi o bus local para llegar a la estación desde la playa.",
      },
      {
        question: "¿Dónde se come el mejor arroz de la zona?",
        answer:
          "En los restaurantes de El Perelló y del entorno, y sobre todo en El Palmar, en el corazón de la Albufera.",
      },
    ],
    updated: "2026-08-28",
  },
];

export function getGuideHub(slug: string): GuideHub | undefined {
  return guideHubs.find((h) => h.slug === slug);
}
export function hubForProperty(propertySlug: string): GuideHub | undefined {
  return guideHubs.find((h) => h.propertySlug === propertySlug);
}
