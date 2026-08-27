/**
 * Destination content clusters — hub & spoke (issue #25).
 *
 * Each guide answers a real search intent with concrete, publicly-verifiable
 * information about the destination (geography, the ski resort, Valencia's
 * beaches and transport). It is NOT invented detail about the apartment.
 * Every guide links to the property page and to availability (issue #28).
 *
 * `published: false` guides are planned but not yet written — they are not
 * emitted in the sitemap or linked, so there is no thin content.
 */

export interface Guide {
  slug: string;
  propertySlug: string;
  pillar: boolean;
  intent: string;
  keyword: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  sections: { heading: string; body: string[]; list?: string[] }[];
  faq?: { question: string; answer: string }[];
  published: boolean;
}

export const guides: Guide[] = [
  // ---------------------------------------------------------------- Javalambre
  {
    slug: "guia-de-javalambre",
    propertySlug: "javalambre",
    pillar: true,
    intent: "Informacional amplio — planificar una escapada a Javalambre",
    keyword: "guía de Javalambre",
    title: "Guía de Javalambre: qué ver, esquiar y dónde alojarse",
    description:
      "Guía práctica de la sierra de Javalambre (Teruel): la estación de esquí, el observatorio, los pueblos de Gúdar-Javalambre, cómo llegar y dónde dormir.",
    h1: "Guía de Javalambre",
    lead: "La sierra de Javalambre, en el sur de la provincia de Teruel, es montaña de verdad sin masificación: una estación de esquí familiar, cielos de los más limpios de Europa y pueblos de piedra en la comarca de Gúdar-Javalambre. Esta guía reúne lo esencial para organizar la escapada.",
    sections: [
      {
        heading: "Dónde está y cómo llegar",
        body: [
          "Javalambre se encuentra al sur de Teruel capital, en la divisoria entre Aragón y el interior de Castellón y Valencia. Se llega en coche por la A-23 (Sagunto–Teruel) y luego por carreteras de montaña hasta la estación; en invierno conviene llevar cadenas o neumáticos de invierno.",
          "Desde Valencia el trayecto ronda 1 h 45 min; desde Zaragoza, unas 2 h; desde Teruel capital, unos 30–40 min. No hay acceso directo en tren a la estación.",
        ],
      },
      {
        heading: "La estación de esquí de Javalambre",
        body: [
          "Javalambre forma parte del grupo Aramón junto con Valdelinares. Es una estación de tamaño medio, con desnivel moderado y pistas amplias, especialmente cómoda para quienes están aprendiendo y para familias. La cota alta supera los 2.000 m.",
          "Antes de viajar conviene revisar el parte de nieve y el calendario de apertura, ya que la temporada depende mucho de las nevadas y la producción de nieve.",
        ],
      },
      {
        heading: "Más allá del esquí",
        body: [
          "El Observatorio Astrofísico de Javalambre (OAJ) ha convertido la zona en un referente de turismo de estrellas: es uno de los lugares con menor contaminación lumínica del continente.",
          "En verano, la sierra es terreno de senderismo y BTT, y los pueblos de la comarca —La Puebla de Valverde, Camarena de la Sierra, Manzanera— ofrecen gastronomía de montaña y rutas tranquilas.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuándo abre la estación de Javalambre?",
        answer:
          "La temporada suele ir de diciembre a marzo, sujeta a las condiciones de nieve. Consulta siempre el calendario oficial de Aramón antes de reservar transporte.",
      },
      {
        question: "¿Es Javalambre buena opción para principiantes?",
        answer:
          "Sí. Es una de las estaciones más recomendables para aprender por su orografía suave y su ambiente familiar.",
      },
    ],
    published: true,
  },
  {
    slug: "esquiar-en-javalambre",
    propertySlug: "javalambre",
    pillar: false,
    intent: "Transaccional-informacional — planificar un día de esquí",
    keyword: "esquiar en Javalambre",
    title: "Esquiar en Javalambre: pistas, forfait y consejos",
    description:
      "Cómo es esquiar en Javalambre: perfil de las pistas, para quién es ideal, cómo organizar el día y dónde alojarse cerca de la estación.",
    h1: "Esquiar en Javalambre",
    lead: "Javalambre es una estación para disfrutar del esquí sin colas interminables ni presupuestos de gran resort. Así puedes organizar un buen día en pistas.",
    sections: [
      {
        heading: "Cómo es la montaña",
        body: [
          "El grueso del dominio es de dificultad azul y roja, con algún tramo negro. La disposición en abanico desde la zona de base hace fácil orientarse y reagrupar al grupo, algo que se agradece con niños.",
        ],
      },
      {
        heading: "Organizar el día",
        body: [
          "Comprar el forfait online por adelantado ahorra tiempo. Llegar temprano permite aparcar cerca y aprovechar la nieve en mejores condiciones. Alojarse en la zona de la estación evita el trayecto de ida y vuelta cada jornada.",
        ],
      },
      {
        heading: "Alquiler y clases",
        body: [
          "Hay servicio de alquiler de material y escuela de esquí en la propia estación. En puentes y vacaciones conviene reservar las clases con antelación.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "fin-de-semana-en-javalambre",
    propertySlug: "javalambre",
    pillar: false,
    intent: "Transaccional — 'fin de semana Javalambre'",
    keyword: "fin de semana en Javalambre",
    title: "Fin de semana en Javalambre: plan de 2 días",
    description:
      "Un plan realista para un fin de semana en Javalambre: esquí, observación de estrellas y pueblos de Gúdar-Javalambre, con alojamiento en reserva directa.",
    h1: "Fin de semana en Javalambre",
    lead: "Con dos días da tiempo a esquiar una jornada completa, mirar las estrellas y conocer un par de pueblos. Esta es una propuesta equilibrada.",
    sections: [
      {
        heading: "Sábado: día de nieve",
        body: [
          "Mañana completa en la estación. Comida en el apartamento o en la zona de base. Por la tarde, si quedan fuerzas, un paseo corto por los alrededores.",
        ],
      },
      {
        heading: "Sábado noche: cielo oscuro",
        body: [
          "La comarca es Destino Turístico Starlight. Con una manta y una app de astronomía se ve la Vía Láctea a simple vista en las noches despejadas de invierno.",
        ],
      },
      {
        heading: "Domingo: pueblos y regreso",
        body: [
          "Camino de vuelta, parada en La Puebla de Valverde o en Teruel capital para ver el conjunto mudéjar, Patrimonio de la Humanidad, antes de coger la autovía.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "javalambre-con-ninos",
    propertySlug: "javalambre",
    pillar: false,
    intent: "Informacional — familias con niños",
    keyword: "Javalambre con niños",
    title: "Javalambre con niños",
    description: "Por qué Javalambre funciona bien para ir con niños y cómo organizar la escapada.",
    h1: "Javalambre con niños",
    lead: "",
    sections: [],
    published: false,
  },
  {
    slug: "que-hacer-en-javalambre-sin-esquiar",
    propertySlug: "javalambre",
    pillar: false,
    intent: "Informacional — plan sin esquí",
    keyword: "qué hacer en Javalambre sin esquiar",
    title: "Qué hacer en Javalambre sin esquiar",
    description: "Planes en la sierra de Javalambre que no dependen de las pistas.",
    h1: "Qué hacer en Javalambre sin esquiar",
    lead: "",
    sections: [],
    published: false,
  },
  {
    slug: "restaurantes-y-servicios-cerca-de-javalambre",
    propertySlug: "javalambre",
    pillar: false,
    intent: "Informacional local — servicios",
    keyword: "restaurantes cerca de Javalambre",
    title: "Restaurantes y servicios cerca de Javalambre",
    description: "Dónde comer, comprar y repostar en la zona de Javalambre.",
    h1: "Restaurantes y servicios cerca de Javalambre",
    lead: "",
    sections: [],
    published: false,
  },

  // ------------------------------------------------------------------- Valencia
  {
    slug: "guia-playas-de-valencia",
    propertySlug: "valencia",
    pillar: true,
    intent: "Informacional amplio — playas de Valencia",
    keyword: "playas de Valencia",
    title: "Guía de las playas de Valencia: cuál elegir",
    description:
      "Guía de las playas de Valencia: Malva-rosa, Cabanyal, Patacona, El Saler y la Devesa de la Albufera. Servicios, ambiente y cómo llegar desde el centro.",
    h1: "Guía de las playas de Valencia",
    lead: "Valencia tiene playa urbana amplia y, a pocos kilómetros, arenales naturales dentro del parque de la Albufera. Esta guía ayuda a elegir según lo que busques: servicios y ambiente, o dunas y pinar.",
    sections: [
      {
        heading: "Playas del frente urbano",
        body: [
          "Las Arenas, la Malva-rosa y el Cabanyal forman un arenal continuo de varios kilómetros, con paseo marítimo, chiringuitos, duchas y socorrismo en temporada. Es la opción más cómoda si quieres bajar andando desde el alojamiento y combinar playa con ciudad.",
        ],
        list: [
          "Malva-rosa: la más conocida, con paseo animado y restaurantes de arroz.",
          "Cabanyal-Les Arenes: el mismo arenal frente al barrio marinero de casas modernistas.",
          "Patacona: continuación hacia el norte, ya en Alboraia, algo más tranquila.",
        ],
      },
      {
        heading: "Playas naturales del sur",
        body: [
          "Al sur, dentro del Parc Natural de l'Albufera, El Saler y la Devesa ofrecen dunas, pinar y menos edificación. Se llega en coche o en autobús; son ideales para quien prioriza el entorno natural.",
        ],
      },
      {
        heading: "Cómo llegar desde el centro",
        body: [
          "El frente urbano está conectado con el centro por líneas de autobús (p. ej. la 32 y la 92) y por carril bici; en coche, unos 15 minutos sin tráfico. Para las playas del sur, el bus a El Saler o vehículo propio.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuál es la mejor playa de Valencia para ir con niños?",
        answer:
          "La Malva-rosa y la Patacona tienen arena fina, poca pendiente y todos los servicios, lo que las hace cómodas para familias.",
      },
    ],
    published: true,
  },
  {
    slug: "que-hacer-junto-al-mar-en-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Informacional — planes cerca de la playa",
    keyword: "qué hacer junto al mar en Valencia",
    title: "Qué hacer junto al mar en Valencia",
    description:
      "Planes sin alejarte del mar en Valencia: paseo marítimo, barrio del Cabanyal, arroces, la Marina y puesta de sol en la Albufera.",
    h1: "Qué hacer junto al mar en Valencia",
    lead: "Puedes pasar varios días sin separarte de la costa y no repetir plan. Estas son las mejores opciones a pie o en bici desde el frente marítimo.",
    sections: [
      {
        heading: "El barrio del Cabanyal",
        body: [
          "El antiguo barrio de pescadores conserva una trama de calles con casas de azulejo y modernismo popular. Hoy combina mercado, bares y una escena cultural en auge.",
        ],
      },
      {
        heading: "La Marina de Valencia",
        body: [
          "El puerto que acogió la Copa América es hoy un espacio abierto con actividades náuticas, gastronomía y eventos. Buen sitio para el atardecer.",
        ],
      },
      {
        heading: "La Albufera al atardecer",
        body: [
          "A un corto trayecto, el paseo en barca por la Albufera al caer el sol es uno de los planes más recordados de Valencia, y termina con arroz en El Palmar.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "como-moverse-de-la-playa-al-centro-de-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Práctico — transporte",
    keyword: "cómo moverse de la playa al centro de Valencia",
    title: "Cómo moverse de la playa al centro de Valencia",
    description:
      "Opciones para ir de la playa al centro de Valencia: autobús, bici por el antiguo cauce del Turia, coche y a pie. Tiempos y consejos.",
    h1: "Cómo moverse de la playa al centro de Valencia",
    lead: "Valencia es una ciudad llana y muy ciclable, así que moverse entre la playa y el centro es sencillo. Estas son las alternativas.",
    sections: [
      {
        heading: "En bici por el Jardín del Turia",
        body: [
          "El antiguo cauce del río, reconvertido en parque de 9 km, conecta la Ciudad de las Artes y las Ciencias con el centro histórico. Con Valenbisi o bici propia, del mar al centro son unos 20–25 minutos.",
        ],
      },
      {
        heading: "En autobús",
        body: [
          "Varias líneas de la EMT unen el frente marítimo con el centro en 15–25 minutos según tráfico. Es la opción más directa si no quieres pedalear.",
        ],
      },
      {
        heading: "En coche",
        body: [
          "Rápido fuera de hora punta, pero el aparcamiento en el centro es caro y limitado; mejor dejar el coche cerca del alojamiento y moverse en transporte o bici.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "valencia-con-ninos-y-playa",
    propertySlug: "valencia",
    pillar: false,
    intent: "Informacional — familias",
    keyword: "Valencia con niños y playa",
    title: "Valencia con niños y playa",
    description: "Cómo combinar playa y planes para niños en Valencia.",
    h1: "Valencia con niños y playa",
    lead: "",
    sections: [],
    published: false,
  },
  {
    slug: "escapada-fin-de-semana-junto-al-mar-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Transaccional — escapada fin de semana",
    keyword: "escapada de fin de semana junto al mar en Valencia",
    title: "Escapada de fin de semana junto al mar en Valencia",
    description: "Un plan de dos días junto al mar en Valencia.",
    h1: "Escapada de fin de semana junto al mar en Valencia",
    lead: "",
    sections: [],
    published: false,
  },
  {
    slug: "restaurantes-y-ocio-cerca-de-la-playa-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Informacional local",
    keyword: "restaurantes cerca de la playa de Valencia",
    title: "Restaurantes y ocio cerca de la playa de Valencia",
    description: "Dónde comer y salir cerca del frente marítimo de Valencia.",
    h1: "Restaurantes y ocio cerca de la playa de Valencia",
    lead: "",
    sections: [],
    published: false,
  },
];

export function getGuide(propertySlug: string, slug: string): Guide | undefined {
  return guides.find((g) => g.propertySlug === propertySlug && g.slug === slug);
}
export function publishedGuides(propertySlug?: string): Guide[] {
  return guides.filter((g) => g.published && (propertySlug ? g.propertySlug === propertySlug : true));
}
export function pillarGuide(propertySlug: string): Guide | undefined {
  return guides.find((g) => g.propertySlug === propertySlug && g.pillar && g.published);
}
