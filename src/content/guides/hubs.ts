/**
 * Destination guide HUBS (issue #46). Each hub is a pillar page that gathers a
 * cluster of satellite guides and routes naturally to the property. URLs:
 *   /guias/javalambre       /guias/valencia-playa
 *   /guias/javalambre/<slug> /guias/valencia-playa/<slug>
 */

export interface GuideHubEn {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  lead: string;
  quickFacts: { label: string; value: string }[];
  sections: { heading: string; body: string[]; list?: string[] }[];
  faq: { question: string; answer: string }[];
}

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
  /**
   * Issue #85 — English draft. Present ≠ published: the `/en/guias/<slug>` route
   * renders it with a "draft, pending review" banner, `noindex`, and it is not
   * in the sitemap or hreflang until the owner approves.
   */
  en?: GuideHubEn;
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
    en: {
      metaTitle: "Javalambre guide: skiing, Camarena de la Sierra and what to do",
      metaDescription:
        "A practical guide to a Javalambre getaway: the ski resort, the village of Camarena de la Sierra, how to get there, where to stay and what to do with or without snow.",
      eyebrow: "Destination guide · Teruel",
      h1: "Guide to Javalambre and Camarena de la Sierra",
      lead: "Everything you need to plan a trip to the Javalambre mountains, in southern Teruel: the most convenient ski resort to reach from Valencia, the village of Camarena de la Sierra ten minutes from the slopes, how to get there and what to do all year round.",
      quickFacts: [
        { label: "Where", value: "Javalambre mountains, southern Teruel (Aragón)" },
        { label: "Base village", value: "Camarena de la Sierra" },
        { label: "To the slopes", value: "~10 min by car from Camarena" },
        { label: "From Valencia / Zaragoza", value: "~2 h by car" },
        { label: "Ski season", value: "December – March (snow permitting)" },
        { label: "Nearest train", value: "Puebla de Valverde (15 km)" },
      ],
      sections: [
        {
          heading: "Where it is and how to get there",
          body: [
            "The Javalambre range sits at the far south of the province of Teruel, in the Gúdar-Javalambre district. You get there by car on the A-23 (Sagunto–Teruel) and then mountain roads up to Camarena de la Sierra, the village at the foot of the resort.",
            "It is about two hours from Valencia, a little more from Zaragoza, and around 40 minutes from the city of Teruel. In winter it is worth carrying chains or winter tyres. The nearest train station is Puebla de Valverde, 15 km away.",
          ],
        },
        {
          heading: "The Javalambre ski resort",
          body: [
            "Javalambre is part of the Aramón group, together with Valdelinares. It is a mid-sized resort with wide pistes and a profile that is especially comfortable for families and for people who are still learning. The top station is above 2,000 m.",
            "There is no accommodation at the foot of the slopes: most visitors stay in Camarena de la Sierra (about 10 minutes by car) or in the villages of the district.",
          ],
        },
        {
          heading: "Camarena de la Sierra, the village of springs",
          body: [
            "Camarena is a stone mountain village in a valley with numerous springs, about 10 minutes from the resort. It keeps the feel of a traditional mountain village — lanes, fountains and a pace far from the big ski resorts. As well as being the base for skiing, it is a starting point for hiking, mountain-biking and climbing routes, and it has a river walk that families can do.",
          ],
        },
        {
          heading: "A sky full of stars",
          body: [
            "The Gúdar-Javalambre district is certified as a Starlight Tourist Destination and has one of the darkest skies in Europe. The Javalambre Astrophysical Observatory is very close; on a clear night the Milky Way is visible to the naked eye.",
          ],
        },
      ],
      faq: [
        {
          question: "When does the Javalambre resort open?",
          answer:
            "The season usually runs from December to March, subject to snow conditions. Check Aramón's official calendar before planning the trip.",
        },
        {
          question: "Where is it best to stay to ski at Javalambre?",
          answer:
            "In Camarena de la Sierra, the village closest to the resort (about 10 minutes by car), with services and a ski room.",
        },
        {
          question: "Is Javalambre worth visiting without skiing?",
          answer:
            "Yes. Hiking, mountain biking, climbing, mushroom foraging, stargazing and the villages of Gúdar-Javalambre make it a year-round mountain destination.",
        },
      ],
    },
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
    en: {
      metaTitle: "La Llastra beach guide: El Perelló, Albufera and Valencia",
      metaDescription:
        "A practical guide to the southern Valencia coast: La Llastra beach between Les Palmeres and El Perelló, the Albufera nature park, Cullera and the rice fields, with the city of Valencia half an hour away.",
      eyebrow: "Destination guide · Southern Valencia coast",
      h1: "Guide to La Llastra beach and the southern Valencia coast",
      lead: "Everything to plan a getaway to the southern coast of the province of Valencia: La Llastra beach between Les Palmeres and El Perelló, the Albufera Nature Park, Cullera and the rice fields, with the city of Valencia half an hour away.",
      quickFacts: [
        { label: "Where", value: "La Llastra beach (Sueca), southern Valencia coast" },
        { label: "Beach", value: "La Llastra: pale sand, uncrowded" },
        { label: "To Valencia city", value: "~30 min by car" },
        { label: "To the Albufera", value: "8 km" },
        { label: "To Cullera", value: "~9 km" },
        { label: "Nearest train", value: "Sueca (8 km) / Cullera (11 km)" },
      ],
      sections: [
        {
          heading: "Where it is and how to get there",
          body: [
            "La Llastra beach is on the southern coast of the province of Valencia, between Les Palmeres and El Perelló, in the municipality of Sueca and next to the Albufera Nature Park.",
            "By car from Valencia it is about 30 minutes via the V-31 and the CV-500. The train stations of Sueca (8 km) and Cullera (11 km) are on Cercanías line C-1. Valencia airport is 34 km away.",
          ],
        },
        {
          heading: "The beach and its character",
          body: [
            "La Llastra is a stretch of pale sand with generally clean water, uncrowded and away from the large tourist complexes. It is a part of the Valencian coast that keeps a more traditional scale, with low houses tied to the sea and a family atmosphere, far from the bustle of the city beach in Valencia.",
            "To the south is El Perelló, with its marina and its rice restaurants; to the north, Les Palmeres and El Perellonet; and beyond, the long Cullera beach with its lighthouse and castle.",
          ],
        },
        {
          heading: "The Albufera",
          body: [
            "The Albufera Nature Park, 8 km away, is the largest freshwater lake in Spain, surrounded by rice fields. A boat trip at sunset from El Palmar or El Perellonet is one of the essential things to do, and it ends with rice in the village.",
          ],
        },
        {
          heading: "The city of Valencia, half an hour away",
          body: [
            "The city of Valencia — old town, Central Market, the Silk Exchange, the City of Arts and Sciences and the Oceanogràfic — is about 30 minutes by car or by train from Sueca. Beach in the morning and city in the afternoon is a perfectly workable plan from here.",
          ],
        },
      ],
      faq: [
        {
          question: "Is La Llastra beach crowded?",
          answer:
            "No. It is a quiet stretch of the southern Valencia coast, with pale sand and generally clean water, very different from the city beach and away from the large tourist complexes.",
        },
        {
          question: "Where exactly is La Llastra beach?",
          answer:
            "In the municipality of Sueca, between Les Palmeres and El Perelló, on the southern coast of the province of Valencia, next to the Albufera. The city of Valencia is about half an hour away by car.",
        },
        {
          question: "Can you get to the city of Valencia from here without a car?",
          answer:
            "Yes, by Cercanías train from Sueca or Cullera (about 40–50 minutes to Valencia Nord station), though you will need a taxi or local bus to reach the station from the beach.",
        },
        {
          question: "Where do you eat the best rice in the area?",
          answer:
            "In the restaurants of El Perelló and around, and above all in El Palmar, in the heart of the Albufera.",
        },
      ],
    },
  },
];

/** Issue #85 — the EN draft merged onto the hub, or null. */
export function getGuideHubEn(slug: string): (GuideHub & { en: GuideHubEn }) | null {
  const h = guideHubs.find((x) => x.slug === slug);
  return h?.en ? (h as GuideHub & { en: GuideHubEn }) : null;
}
export function guideHubsWithEn(): GuideHub[] {
  return guideHubs.filter((h) => h.en);
}

export function getGuideHub(slug: string): GuideHub | undefined {
  return guideHubs.find((h) => h.slug === slug);
}
export function hubForProperty(propertySlug: string): GuideHub | undefined {
  return guideHubs.find((h) => h.propertySlug === propertySlug);
}
