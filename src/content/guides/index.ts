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
    lead: "La sierra de Javalambre, en el sur de la provincia de Teruel, es montaña de verdad sin masificación: una estación de esquí familiar, cielos de los más limpios de Europa y pueblos de piedra como Camarena de la Sierra, a los pies de la estación. Esta guía reúne lo esencial para organizar la escapada.",
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
    title: "Javalambre con niños: esquí en familia y planes de nieve",
    description:
      "Por qué Javalambre es una buena estación para ir con niños: pistas suaves, ambiente tranquilo, clases de esquí y planes de nieve más allá de las pistas.",
    h1: "Javalambre con niños",
    lead: "Javalambre es de las estaciones más recomendables para iniciar a los niños en el esquí: pistas anchas y poco inclinadas, distancias cortas y un ambiente sin aglomeraciones. Estas son las claves para una escapada de nieve en familia.",
    sections: [
      {
        heading: "Por qué funciona para peques",
        body: [
          "La zona de debutantes y las pistas verdes y azules concentradas cerca de la base permiten tener al grupo controlado y volver rápido al punto de encuentro. El desnivel moderado evita sustos y cansancio excesivo el primer día.",
        ],
      },
      {
        heading: "Clases y material",
        body: [
          "La escuela de esquí ofrece cursillos para niños por grupos de edad y nivel; en puentes y vacaciones conviene reservar con antelación. El alquiler de material infantil está disponible en la estación.",
        ],
      },
      {
        heading: "Días sin esquí",
        body: [
          "Un trineo, un muñeco de nieve y chocolate caliente llenan una mañana. Fuera de pistas, el planetario de la zona y la observación de estrellas (la comarca es Destino Starlight) funcionan muy bien con niños a partir de cierta edad.",
        ],
      },
      {
        heading: "Logística",
        body: [
          "Alojarse cerca de la estación evita trayectos largos con niños cansados y permite comer y descansar en el apartamento a mediodía.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "que-hacer-en-javalambre-sin-esquiar",
    propertySlug: "javalambre",
    pillar: false,
    intent: "Informacional — plan sin esquí",
    keyword: "qué hacer en Javalambre sin esquiar",
    title: "Qué hacer en Javalambre sin esquiar",
    description:
      "Planes en la sierra de Javalambre que no dependen de las pistas: observación de estrellas, senderismo, pueblos de Gúdar-Javalambre y Teruel.",
    h1: "Qué hacer en Javalambre sin esquiar",
    lead: "La sierra de Javalambre es mucho más que su estación de esquí. Si viajas fuera de temporada, o simplemente no esquías, estos planes llenan un fin de semana.",
    sections: [
      {
        heading: "Observación de estrellas",
        body: [
          "El entorno del Observatorio Astrofísico de Javalambre tiene uno de los cielos más oscuros de Europa. La comarca Gúdar-Javalambre está certificada como Destino Turístico Starlight; en noche despejada se ve la Vía Láctea a simple vista.",
        ],
      },
      {
        heading: "Senderismo y naturaleza",
        body: [
          "En primavera y verano hay rutas por sabinares, nacimientos de agua y las cumbres de la sierra. El pico de Javalambre supera los 2.000 m y ofrece panorámicas hacia el Mediterráneo en días claros.",
        ],
      },
      {
        heading: "Pueblos de la comarca",
        body: [
          "Camarena de la Sierra, La Puebla de Valverde, Manzanera o Mora de Rubielos (con su castillo y colegiata) son paradas con encanto rural y buena gastronomía de montaña: ternasco, quesos, trufa en temporada.",
        ],
      },
      {
        heading: "Teruel capital",
        body: [
          "A menos de una hora, Teruel concentra el mejor mudéjar de Aragón (Patrimonio de la Humanidad), el conjunto de los Amantes y un casco histórico compacto ideal para una tarde.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "restaurantes-y-servicios-cerca-de-javalambre",
    propertySlug: "javalambre",
    pillar: false,
    intent: "Informacional local — servicios",
    keyword: "restaurantes cerca de Javalambre",
    title: "Restaurantes y servicios cerca de Javalambre",
    description:
      "Cómo organizar las comidas y las compras en una escapada a Javalambre: opciones en la estación, en los pueblos y en Teruel, y consejos para abastecerte.",
    h1: "Restaurantes y servicios cerca de Javalambre",
    lead: "La zona de Javalambre es de montaña y de pueblos pequeños, así que conviene planificar las comidas y la compra. Esto es lo que debes saber.",
    sections: [
      {
        heading: "En la estación",
        body: [
          "La zona de base cuenta con cafetería y restauración de estación durante la temporada de esquí, pensada para comidas rápidas entre pistas. En días de mucha afluencia hay colas a mediodía.",
        ],
      },
      {
        heading: "En los pueblos cercanos",
        body: [
          "Camarena de la Sierra y La Puebla de Valverde tienen bares y restaurantes de cocina tradicional. Mora de Rubielos y Rubielos de Mora, algo más lejos, ofrecen propuestas más cuidadas. Fuera de temporada conviene confirmar horarios por teléfono.",
        ],
      },
      {
        heading: "Compra y abastecimiento",
        body: [
          "Para una estancia de varios días es práctico hacer una compra grande en Teruel capital antes de subir, ya que en los pueblos de la sierra los comercios son pequeños y con horarios limitados. Cocinar en el apartamento ahorra tiempo y dinero.",
        ],
      },
      {
        heading: "Combustible y farmacia",
        body: [
          "Repostar en Teruel o en la A-23 antes de la última parte del trayecto. Las farmacias más cercanas están en los pueblos; para urgencias, el centro de salud de referencia de la comarca.",
        ],
      },
    ],
    published: true,
  },

  // ------------------------------------------------- Valencia (costa sur, Sueca)
  {
    slug: "guia-playas-de-valencia",
    propertySlug: "valencia",
    pillar: true,
    intent: "Informacional amplio — playas del sur de Valencia",
    keyword: "playas del sur de Valencia",
    title: "Guía de las playas del sur de Valencia: de la Albufera a Cullera",
    description:
      "Guía de las playas de la costa sur de Valencia: El Saler, El Perellonet, El Perelló, la playa de la Llastra y Cullera. Arena amplia, dunas y ambiente tranquilo.",
    h1: "Guía de las playas del sur de Valencia",
    lead: "Al sur de la ciudad de Valencia, entre la Albufera y Cullera, se extiende un litoral de playas amplias y tranquilas, con dunas y pinar en algunos tramos y pueblos costeros de casas bajas. Esta guía ayuda a elegir según lo que busques.",
    sections: [
      {
        heading: "El cordón de playas de la Devesa y El Saler",
        body: [
          "Nada más salir de Valencia, dentro del Parque Natural de la Albufera, El Saler y la Devesa ofrecen kilómetros de arena con dunas y pinar y muy poca edificación. Ideales para quien prioriza el entorno natural.",
        ],
      },
      {
        heading: "El Perellonet, El Perelló y la playa de la Llastra",
        body: [
          "Más al sur, ya en los municipios de Valencia y Sueca, se suceden playas tranquilas de casas de veraneo: El Perellonet, El Perelló y, entre Les Palmeres y El Perelló, la playa de la Llastra. Arenales de arena clara, paseo marítimo y ambiente familiar sin masificación.",
        ],
        list: [
          "Playa de la Llastra: arena clara y tranquila, poco masificada; aquí está este apartamento, a pie de arena.",
          "El Perelló: pueblo con puerto deportivo y buena oferta de arroces.",
          "El Perellonet: entre el mar y la Albufera, punto de partida de paseos en barca.",
        ],
      },
      {
        heading: "Cullera",
        body: [
          "Al final de este tramo, Cullera combina una larga playa urbana con el faro, el castillo y el monte con vistas al Mediterráneo. Está a unos 9 km de la playa de la Llastra.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuál es la mejor playa del sur de Valencia para ir con niños?",
        answer:
          "La Llastra, El Perelló y El Perellonet tienen arena fina, pendiente suave, paseo y servicios en temporada, y suelen estar menos concurridas que la playa urbana de Valencia.",
      },
      {
        question: "¿Se puede ir a estas playas en transporte público?",
        answer:
          "Sí, aunque con menos frecuencia que a la playa urbana. Hay autobuses desde Valencia y las estaciones de tren de Sueca y Cullera dan servicio a la zona; lo más cómodo es el coche.",
      },
    ],
    published: true,
  },
  {
    slug: "que-hacer-junto-al-mar-en-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Informacional — planes cerca de la playa (costa sur)",
    keyword: "qué hacer junto al mar al sur de Valencia",
    title: "Qué hacer junto al mar al sur de Valencia",
    description:
      "Planes sin alejarte de la costa sur de Valencia: la Albufera en barca, arroces en El Palmar, el castillo de Cullera y los pueblos costeros de Sueca.",
    h1: "Qué hacer junto al mar al sur de Valencia",
    lead: "Desde la playa de la Llastra puedes pasar varios días sin separarte de la costa y no repetir plan. Estas son las mejores opciones cerca.",
    sections: [
      {
        heading: "La Albufera en barca al atardecer",
        body: [
          "El Parque Natural de la Albufera está a 8 km. El paseo en barca por el lago al caer el sol, saliendo de El Palmar o El Perellonet, es uno de los planes más recordados de la zona, y termina con arroz en un restaurante del pueblo.",
        ],
      },
      {
        heading: "Cullera: faro, castillo y mirador",
        body: [
          "A unos 9 km, el monte de Cullera ofrece el faro, el castillo medieval y varios miradores sobre la desembocadura del Júcar y el Mediterráneo. Buen plan de media mañana o de atardecer.",
        ],
      },
      {
        heading: "Los pueblos costeros y sus puertos",
        body: [
          "El Perelló y su puerto deportivo, los mercadillos de verano de la zona y los paseos marítimos dan para tardes tranquilas de bici y helado.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "como-moverse-de-la-playa-al-centro-de-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Práctico — transporte a Valencia capital",
    keyword: "cómo llegar a Valencia desde la playa del sur",
    title: "Cómo llegar a Valencia capital desde la playa del sur",
    description:
      "Opciones para ir de la playa de la Llastra (Sueca) a la ciudad de Valencia: coche, tren desde Sueca o Cullera y autobús. Tiempos y consejos.",
    h1: "Cómo llegar a Valencia capital desde la playa del sur",
    lead: "El apartamento está en la costa sur de la provincia, a una media hora de la ciudad de Valencia. Estas son las formas de moverte.",
    sections: [
      {
        heading: "En coche",
        body: [
          "Es la opción más directa: por la V-31 y la CV-500 se llega al centro de Valencia en unos 30 minutos sin tráfico. En el centro, el aparcamiento es caro y limitado, así que conviene dejar el coche en un parking disuasorio o cerca de una parada de metro.",
        ],
      },
      {
        heading: "En tren de Cercanías",
        body: [
          "Las estaciones de Sueca (a 8 km) y Cullera (a 11 km) están en la línea C-1 de Cercanías, que llega a la estación del Nord de Valencia en unos 40-50 minutos. Necesitarás coche o taxi para llegar a la estación desde la playa.",
        ],
      },
      {
        heading: "En autobús",
        body: [
          "Hay líneas de autobús que conectan los pueblos costeros de Sueca con Valencia, con menos frecuencia que el tren. Útil como alternativa puntual.",
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
    keyword: "playa con niños al sur de Valencia",
    title: "Playa con niños al sur de Valencia: plan para toda la familia",
    description:
      "Cómo combinar playa tranquila y planes para niños desde la costa sur de Valencia: la playa de la Llastra, la Albufera, Cullera y, a media hora, el Oceanogràfic y el Bioparc.",
    h1: "Playa con niños al sur de Valencia",
    lead: "La costa sur de Valencia es muy cómoda para viajar con niños: playas amplias de arena fina y pendiente suave, ambiente tranquilo y grandes atractivos familiares a media hora en coche.",
    sections: [
      {
        heading: "Playa con niños",
        body: [
          "La playa de la Llastra y las vecinas de El Perelló y El Perellonet tienen arena fina, pendiente suave, paseo y servicios en temporada. Al estar menos concurridas que la playa urbana, es más fácil montar la sombrilla y no perder de vista a los peques. Ir a primera hora o a última tarde evita el sol fuerte.",
        ],
      },
      {
        heading: "La Albufera y Cullera",
        body: [
          "El paseo en barca por la Albufera suele gustar a partir de cierta edad. En Cullera, el castillo y el faro son una buena excursión, y hay un pequeño tren turístico en verano.",
        ],
      },
      {
        heading: "A media hora: Oceanogràfic y Bioparc",
        body: [
          "El Oceanogràfic (el acuario más grande de Europa) y el Museo de las Ciencias, en la Ciudad de las Artes, están a unos 24 km. El Bioparc, un zoo de inmersión muy valorado con niños, está al otro lado de la ciudad.",
        ],
      },
      {
        heading: "Comer con niños",
        body: [
          "Los restaurantes de arroz de la zona suelen tener menús y espacio para carritos. Conviene reservar para comer, sobre todo en fin de semana y en verano.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "escapada-fin-de-semana-junto-al-mar-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Transaccional — escapada fin de semana",
    keyword: "escapada de fin de semana junto al mar en Valencia",
    title: "Escapada de fin de semana junto al mar, al sur de Valencia",
    description:
      "Un plan de dos días junto al mar en la costa sur de Valencia: playa de la Llastra, Albufera en barca, Cullera y, si apetece, una tarde en la ciudad. Con alojamiento en reserva directa.",
    h1: "Escapada de fin de semana junto al mar, al sur de Valencia",
    lead: "Con un fin de semana da tiempo a mezclar playa tranquila, naturaleza y algo de ciudad sin agobios. Esta es una propuesta equilibrada partiendo de un apartamento a pie de la playa de la Llastra.",
    sections: [
      {
        heading: "Viernes: llegada y atardecer en la playa",
        body: [
          "Llegar, dejar las cosas y bajar a la arena a ver el atardecer. Cena de arroz o de tapas en El Perelló.",
        ],
      },
      {
        heading: "Sábado: playa y Albufera",
        body: [
          "Mañana de playa frente al apartamento. Por la tarde, paseo en barca por la Albufera saliendo de El Palmar o El Perellonet, y arroz para cenar.",
        ],
      },
      {
        heading: "Domingo: Cullera o ciudad, y regreso",
        body: [
          "Subir al castillo y al faro de Cullera, o acercarse a la ciudad de Valencia (media hora) para ver el casco histórico y la Ciudad de las Artes antes de volver.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "restaurantes-y-ocio-cerca-de-la-playa-valencia",
    propertySlug: "valencia",
    pillar: false,
    intent: "Informacional local",
    keyword: "restaurantes cerca de la playa de la Llastra / El Perelló",
    title: "Restaurantes y ocio cerca de la playa, al sur de Valencia",
    description:
      "Dónde comer arroz, tapear y salir cerca de la playa de la Llastra y El Perelló, en la costa sur de Valencia. Consejos prácticos.",
    h1: "Restaurantes y ocio cerca de la playa, al sur de Valencia",
    lead: "La costa sur de Valencia es tierra de arroz: la paella valenciana y el arroz a banda se toman aquí en su versión más tradicional, muchas veces con el arrozal a la vista. Esto es lo que conviene saber cerca del apartamento.",
    sections: [
      {
        heading: "Arroces cerca del apartamento",
        body: [
          "Junto a la playa de la Llastra y hacia El Perelló hay restaurantes de arroz a pocos minutos: La Manduca Maresa está a unos 500 m del apartamento y el Restaurante Llobarro a 1,7 km. La paella se come tradicionalmente a mediodía; conviene reservar en fin de semana y en verano.",
        ],
      },
      {
        heading: "El Palmar, la meca del arroz",
        body: [
          "El Palmar, en el corazón de la Albufera, concentra los restaurantes de arroz más conocidos de la zona y combina muy bien con un paseo en barca al atardecer.",
        ],
      },
      {
        heading: "Ocio y ambiente",
        body: [
          "El Perelló tiene puerto deportivo y algo más de vida nocturna en verano. En general, la costa sur es tranquila: chiringuitos, terrazas y paseo marítimo, sin el bullicio de la playa urbana de Valencia.",
        ],
      },
    ],
    published: true,
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

/* --- Hub-aware helpers (issue #46) --- */

const HUB_TO_PROPERTY: Record<string, string> = {
  javalambre: "javalambre",
  "valencia-playa": "valencia",
};

export function propertyForHub(hubSlug: string): string | undefined {
  return HUB_TO_PROPERTY[hubSlug];
}
export function hubForPropertySlug(propertySlug: string): string {
  return propertySlug === "valencia" ? "valencia-playa" : propertySlug;
}
/** Satellite (non-pillar) published guides in a hub. */
export function satelliteGuides(hubSlug: string): Guide[] {
  const prop = HUB_TO_PROPERTY[hubSlug];
  if (!prop) return [];
  return guides.filter((g) => g.published && !g.pillar && g.propertySlug === prop);
}
export function getSatelliteGuide(hubSlug: string, slug: string): Guide | undefined {
  const prop = HUB_TO_PROPERTY[hubSlug];
  if (!prop) return undefined;
  return guides.find((g) => g.published && !g.pillar && g.propertySlug === prop && g.slug === slug);
}
