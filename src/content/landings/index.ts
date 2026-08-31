/**
 * Transactional SEO landing pages per property (issues #15, #16, #31, #39, #47).
 *
 * Content is written for humans first, with concrete, verifiable information
 * about the real location of each property:
 *  - Javalambre → Camarena de la Sierra (Teruel), ~10 min from the slopes
 *  - Valencia   → playa de la Llastra (Sueca), between Les Palmeres and El
 *                 Perelló, on the southern Valencia coast, next to the Albufera
 * Every landing links to the property page and to availability (issue #28).
 *
 * Issue #47 — one strong URL per search intent. `keyword` is the single primary
 * intent this URL owns; `secondaryKeywords` are supporting long-tail it may also
 * rank for. The canonical is always the landing itself; the property page owns
 * the head term. See `docs/seo/canonical-map.md`.
 */

export interface Landing {
  slug: string;
  propertySlug: string;
  intent: string;
  /** The single primary search intent this URL owns (issue #47). */
  keyword: string;
  /** Supporting long-tail; never another landing's primary keyword. */
  secondaryKeywords: string[];
  title: string;
  description: string;
  h1: string;
  lead: string;
  blocks: { heading: string; body: string[] }[];
  faq?: { question: string; answer: string }[];
  published: boolean;
}

export const landings: Landing[] = [
  {
    slug: "alojamiento-javalambre",
    propertySlug: "javalambre",
    intent: "Transaccional — buscar alojamiento en Javalambre",
    keyword: "alojamiento Javalambre",
    secondaryKeywords: ["apartamento Javalambre", "dónde alojarse en Javalambre"],
    title: "Alojamiento en Javalambre: apartamento en Camarena de la Sierra",
    description:
      "Apartamento en Camarena de la Sierra, a 10 minutos de las pistas de Javalambre. 70 m², chimenea de pellets, cocina completa, parking gratis y guardaesquís. Reserva directa.",
    h1: "Alojamiento en Javalambre",
    lead: "El alojamiento más práctico para esquiar en Javalambre es un apartamento en Camarena de la Sierra, el pueblo a los pies de la sierra. A unos 10 minutos en coche de las pistas, con parking y guardaesquís, es una base cómoda para un fin de semana de nieve.",
    blocks: [
      {
        heading: "Dónde alojarse para esquiar en Javalambre",
        body: [
          "La estación de esquí de Javalambre no tiene alojamiento a pie de pistas, así que la mayoría de visitantes se aloja en los pueblos de la comarca. Camarena de la Sierra es el más cercano y el mejor comunicado con la estación.",
          "Este apartamento está en el centro de Camarena, en la Calle San Mateo. Es un piso nuevo de 70 m² con dos dormitorios, salón con chimenea de pellets y cocina totalmente equipada.",
        ],
      },
      {
        heading: "Pensado para días de nieve",
        body: [
          "Tiene habitación guardaesquís en el edificio y parking privado gratuito. Los huéspedes destacan lo bien que calienta en invierno, entre la calefacción y la chimenea de pellets. El forfait y el alquiler de material se gestionan en la propia estación.",
        ],
      },
      {
        heading: "Reserva directa y confirmación inmediata",
        body: [
          "Consulta tus fechas, comprueba la disponibilidad real y reserva en tres pasos. El precio que ves antes de pagar es el precio total, sin comisiones ni cargos ocultos. Tras el pago recibirás el email de confirmación con tu localizador.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Dónde está el alojamiento?",
        answer:
          "En Camarena de la Sierra (Teruel), en la Calle San Mateo, a unos 10 minutos en coche de la estación de esquí de Javalambre.",
      },
      {
        question: "¿Tiene parking?",
        answer: "Sí, parking privado gratuito en el mismo edificio, además de guardaesquís.",
      },
    ],
    published: true,
  },
  {
    slug: "donde-dormir-javalambre",
    propertySlug: "javalambre",
    intent: "Informacional-transaccional — 'dónde dormir en Javalambre'",
    keyword: "dónde dormir en Javalambre",
    secondaryKeywords: ["dónde alojarse Gúdar-Javalambre", "hoteles y apartamentos Javalambre"],
    title: "Dónde dormir en Javalambre: Camarena de la Sierra y alrededores",
    description:
      "Guía práctica sobre dónde dormir para esquiar en Javalambre: Camarena de la Sierra, los pueblos de Gúdar-Javalambre y Teruel capital. Con apartamento en reserva directa.",
    h1: "Dónde dormir en Javalambre",
    lead: "Dónde dormir en Javalambre depende de tu plan. Para esquiar varios días, lo más cómodo es alojarse en Camarena de la Sierra; para una escapada rural o cultural, los pueblos de la comarca o Teruel capital.",
    blocks: [
      {
        heading: "Camarena de la Sierra",
        body: [
          "El pueblo más cercano a la estación (unos 10 minutos en coche). Conocido como la villa de las 100 fuentes, está en un valle con nacimientos de agua y rutas de senderismo. Es la mejor opción si vas a esquiar. Aquí está este apartamento.",
        ],
      },
      {
        heading: "Otros pueblos de Gúdar-Javalambre",
        body: [
          "La Puebla de Valverde, Manzanera o Mora de Rubielos (con castillo y colegiata) son alternativas con encanto rural, algo más alejadas de las pistas.",
        ],
      },
      {
        heading: "Teruel capital",
        body: [
          "A unos 40 minutos, Teruel ofrece más servicios y el mejor mudéjar de Aragón (Patrimonio de la Humanidad), a cambio de un trayecto diario hasta la estación.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuál es la mejor zona para dormir si voy a esquiar?",
        answer:
          "Camarena de la Sierra, el pueblo más cercano a la estación de Javalambre, a unos 10 minutos en coche de las pistas.",
      },
      {
        question: "¿Hay alojamiento a pie de pistas en Javalambre?",
        answer:
          "No. La estación no tiene alojamiento propio a pie de pistas, por lo que se duerme en los pueblos de la comarca.",
      },
    ],
    published: true,
  },
  {
    slug: "alojamiento-cerca-estacion-esqui",
    propertySlug: "javalambre",
    intent: "Transaccional local — 'alojamiento cerca estación de esquí Javalambre' / 'Camarena de la Sierra'",
    keyword: "alojamiento cerca de las pistas de Javalambre",
    secondaryKeywords: [
      "apartamento cerca estación esquí Javalambre",
      "apartamento para esquiar en Javalambre",
    ],
    title: "Alojamiento cerca de la estación de esquí de Javalambre",
    description:
      "Apartamento en Camarena de la Sierra, a unos 10 minutos de la estación de esquí de Javalambre. Parking gratis y guardaesquís en el edificio. Reserva directa con precio total.",
    h1: "Alojamiento cerca de la estación de esquí de Javalambre",
    lead: "Camarena de la Sierra es el pueblo más próximo a la estación de Javalambre. Alojarte aquí reduce los desplazamientos diarios a unos 10 minutos y te permite volver a comer o descansar entre jornadas.",
    blocks: [
      {
        heading: "Ventajas de alojarse en Camarena",
        body: [
          "Llegar pronto a pistas, comer en el apartamento, no depender del aparcamiento de la estación en días de mucha afluencia y dejar el material en la habitación guardaesquís del edificio.",
        ],
      },
      {
        heading: "La estación de Javalambre",
        body: [
          "Javalambre forma parte de Aramón junto con Valdelinares. Tiene pistas para todos los niveles y un perfil especialmente cómodo para familias y principiantes. Consulta siempre el parte de nieve y el calendario de apertura antes de viajar.",
        ],
      },
      {
        heading: "Comprueba fechas y reserva",
        body: [
          "Usa el buscador para ver si tus fechas están libres y el precio total. La reserva se confirma al instante tras el pago seguro.",
        ],
      },
    ],
    faq: [
      {
        question: "¿A cuánto está el apartamento de las pistas?",
        answer: "A unos 10 minutos en coche de la estación de esquí de Javalambre.",
      },
      {
        question: "¿Hay guardaesquís?",
        answer:
          "Sí, el edificio dispone de habitación guardaesquís. El forfait y el alquiler de material se gestionan en la estación de Javalambre.",
      },
    ],
    published: true,
  },
  {
    slug: "apartamento-playa-valencia",
    propertySlug: "valencia",
    intent: "Transaccional — 'apartamento playa Valencia'",
    keyword: "apartamento playa Valencia",
    secondaryKeywords: [
      "apartamento playa Sueca",
      "apartamento playa de la Llastra",
      "alojamiento cerca de El Perelló",
    ],
    title: "Apartamento en la playa, al sur de Valencia | Reserva directa",
    description:
      "Apartamento a pie de la playa de la Llastra, entre Les Palmeres y El Perelló (Sueca), litoral sur de Valencia. 75 m², vistas frontales al mar, parking gratis. Reserva directa.",
    h1: "Apartamento en la playa, al sur de Valencia",
    lead: "Un apartamento a pie de la playa de la Llastra, entre Les Palmeres y El Perelló, en la costa sur de la provincia de Valencia. Arena clara, agua limpia, vistas frontales al Mediterráneo y reserva directa.",
    blocks: [
      {
        heading: "Playa tranquila, con Valencia y la Albufera cerca",
        body: [
          "La Llastra es un arenal de arena clara del litoral sur de Valencia, en el municipio de Sueca, junto al Parque Natural de la Albufera. Poco masificado y alejado de los grandes complejos turísticos, pero con la ciudad de Valencia a una media hora en coche.",
          "El apartamento tiene 75 m², tres dormitorios, cocina completa y un balcón con vistas frontales al mar. A unos cinco metros de la arena: bajas del edificio y ya estás en la playa.",
        ],
      },
      {
        heading: "El apartamento",
        body: [
          "Para hasta 6 personas, con zona privada de playa, terraza, recepción 24 horas y parking gratuito. Muy valorado por parejas y familias que buscan desconectar.",
        ],
      },
      {
        heading: "Reserva directa",
        body: [
          "Consulta disponibilidad, comprueba el precio final —total, sin cargos ocultos— y reserva en tres pasos. Recibirás el email de confirmación con el localizador.",
        ],
      },
    ],
    faq: [
      {
        question: "¿El apartamento está en la playa de Valencia ciudad?",
        answer:
          "No. Está a pie de la playa de la Llastra, entre Les Palmeres y El Perelló (Sueca), en la costa sur de la provincia, a una media hora en coche de la ciudad de Valencia.",
      },
      {
        question: "¿Cuántas personas caben?",
        answer:
          "Hasta 6 personas en 3 dormitorios: uno con cama doble extragrande y dos con literas.",
      },
    ],
    published: true,
  },
  {
    slug: "alojamiento-frente-al-mar-valencia",
    propertySlug: "valencia",
    intent: "Transaccional específico — 'alojamiento frente al mar / primera línea Valencia'",
    keyword: "alojamiento frente al mar Valencia",
    secondaryKeywords: ["apartamento primera línea playa Valencia", "alojamiento con vistas al mar Valencia"],
    title: "Alojamiento frente al mar en la provincia de Valencia",
    description:
      "Alojamiento en primera línea de mar en la playa de la Llastra (Sueca), al sur de Valencia. Despiertas con el Mediterráneo delante. Reserva directa con disponibilidad real y precio total.",
    h1: "Alojamiento frente al mar en la provincia de Valencia",
    lead: "Estar en primera línea de playa significa bajar a la arena en segundos y tener el mar como salón. Este apartamento está a pie de la playa de la Llastra, entre Les Palmeres y El Perelló, en la costa sur de Valencia.",
    blocks: [
      {
        heading: "Qué aporta la primera línea",
        body: [
          "Menos desplazamientos, más tiempo de playa, mañanas con vistas frontales al mar desde el balcón y acceso directo a la arena y a los restaurantes del frente marítimo.",
        ],
      },
      {
        heading: "El entorno: Albufera y Cullera",
        body: [
          "El Parque Natural de la Albufera queda a 8 km, con paseos en barca al atardecer y arroces en El Palmar. El faro y el castillo de Cullera están a unos 9 km hacia el sur.",
        ],
      },
      {
        heading: "Comprueba tus fechas",
        body: [
          "El buscador te dice al momento si está disponible y a qué precio total. La reserva se confirma tras el pago seguro.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Se ve el mar desde el apartamento?",
        answer: "Sí, tiene vistas directas al Mediterráneo desde el balcón y zona privada de playa.",
      },
      {
        question: "¿A qué distancia está la arena?",
        answer: "A unos cinco metros. El edificio está a pie de la playa de la Llastra, en primera línea.",
      },
    ],
    published: true,
  },
  {
    slug: "vacaciones-playa-valencia",
    propertySlug: "valencia",
    intent: "Transaccional estacional — 'apartamento vacaciones Valencia playa'",
    keyword: "vacaciones playa Valencia",
    secondaryKeywords: ["alojamiento cerca de la Albufera", "apartamento vacaciones costa de Valencia"],
    title: "Vacaciones de playa al sur de Valencia | Apartamento frente al mar",
    description:
      "Apartamento para vacaciones de playa en la playa de la Llastra (Sueca), litoral sur de Valencia: verano, primavera y otoño con clima suave. Reserva directa, disponibilidad real y precio total.",
    h1: "Vacaciones de playa al sur de Valencia",
    lead: "La costa sur de Valencia, junto a la Albufera, es un destino de playa que funciona más allá del verano. Este apartamento a pie de la playa de la Llastra es una buena base para tus vacaciones.",
    blocks: [
      {
        heading: "Cuándo ir",
        body: [
          "Julio y agosto son temporada alta, con más ambiente y precios más altos. Junio y septiembre mantienen buen tiempo de baño con menos gente. Primavera y otoño son ideales para quien busca tranquilidad.",
        ],
      },
      {
        heading: "Más allá de la playa",
        body: [
          "Paseo en barca por la Albufera, arroces en El Palmar, el castillo de Cullera y, a media hora, la ciudad de Valencia con su casco histórico y la Ciudad de las Artes y las Ciencias.",
        ],
      },
      {
        heading: "Reserva tus fechas",
        body: [
          "Consulta la disponibilidad real y el precio total antes de pagar. Confirmación inmediata y fechas bloqueadas automáticamente.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Es buen destino de playa fuera de julio y agosto?",
        answer:
          "Sí. Junio y septiembre tienen buen tiempo de baño con menos gente; primavera y otoño son ideales para tranquilidad y para visitar la Albufera y Valencia.",
      },
      {
        question: "¿Cuánto se tarda a la ciudad de Valencia?",
        answer: "Una media hora en coche, o en Cercanías desde las estaciones de Sueca o Cullera.",
      },
    ],
    published: true,
  },

  // --- Local landings (issue #95) — hyper-specific sub-locations -------------
  {
    slug: "apartamento-playa-la-llastra",
    propertySlug: "valencia",
    intent: "Transaccional — apartamento en la playa de la Llastra",
    keyword: "apartamento en la playa de la Llastra",
    secondaryKeywords: [
      "alojamiento playa de la Llastra",
      "apartamento playa Sueca primera línea",
    ],
    title: "Apartamento en la playa de la Llastra (Sueca), a pie de arena",
    description:
      "Apartamento de 75 m² a pie de la playa de la Llastra, entre Les Palmeres y El Perelló, con vistas frontales al Mediterráneo, parking gratis y hasta 6 huéspedes. Reserva directa.",
    h1: "Apartamento en la playa de la Llastra",
    lead: "La playa de la Llastra es un tramo tranquilo del litoral de Sueca, entre Les Palmeres y El Perelló, con arena clara y poca masificación. Este apartamento está en primera línea: bajas del edificio y estás sobre la arena.",
    blocks: [
      {
        heading: "Qué es la playa de la Llastra",
        body: [
          "Es una playa de arena en el municipio de Sueca, en el sur de la provincia de Valencia, junto al Parque Natural de la Albufera. Queda algo apartada de los núcleos más concurridos, así que mantiene un ambiente de playa local incluso en verano.",
          "El apartamento da directamente al mar: 75 m², balcón con vistas frontales, zona privada de playa y plaza de aparcamiento gratuita en el mismo edificio. Admite hasta 6 huéspedes en 3 dormitorios.",
        ],
      },
      {
        heading: "Qué tienes cerca",
        body: [
          "Restaurantes de arroz en El Perelló y Les Palmeres, la Albufera y su puesta de sol en barca, Cullera y su faro, y la ciudad de Valencia a una media hora en coche o en Cercanías desde Sueca o Cullera.",
        ],
      },
      {
        heading: "Reserva directa, precio total desde el principio",
        body: [
          "Consulta disponibilidad, comprueba el precio final —total, sin cargos ni comisiones ocultas— y reserva en tres pasos, con confirmación inmediata.",
        ],
      },
    ],
    faq: [
      {
        question: "¿El apartamento está realmente en primera línea?",
        answer:
          "Sí. Está a pie de playa, a unos 5 metros de la arena, con vistas frontales al Mediterráneo desde el balcón.",
      },
      {
        question: "¿Dónde está la playa de la Llastra exactamente?",
        answer:
          "En el municipio de Sueca (Valencia), entre Les Palmeres y El Perelló, en el litoral sur de la provincia, junto a la Albufera.",
      },
      {
        question: "¿Hay parking?",
        answer: "Sí, plaza de aparcamiento gratuita en el mismo edificio.",
      },
    ],
    published: true,
  },
  {
    slug: "alojamiento-cerca-el-perello",
    propertySlug: "valencia",
    intent: "Transaccional — alojamiento cerca de El Perelló",
    keyword: "alojamiento cerca de El Perelló",
    secondaryKeywords: [
      "apartamento cerca El Perelló playa",
      "dónde dormir El Perelló Valencia",
    ],
    title: "Alojamiento cerca de El Perelló: apartamento frente al mar en la Llastra",
    description:
      "Apartamento a pie de playa junto a El Perelló, en la playa de la Llastra (Sueca). Vistas frontales al mar, parking gratis, hasta 6 huéspedes y arroces a un paso. Reserva directa.",
    h1: "Alojamiento cerca de El Perelló",
    lead: "El Perelló es conocido por sus restaurantes de arroz y su ambiente de pueblo costero. Este apartamento está muy cerca, en la playa de la Llastra, en primera línea de mar y con parking gratuito.",
    blocks: [
      {
        heading: "Dónde está y qué distancia hay a El Perelló",
        body: [
          "El apartamento está en la playa de la Llastra, en el término de Sueca, contiguo a El Perelló por la costa. Se llega andando por el paseo marítimo o en unos minutos en coche.",
          "Son 75 m² a pie de arena, con balcón y vistas frontales al Mediterráneo, tres dormitorios para hasta 6 personas y plaza de aparcamiento gratuita.",
        ],
      },
      {
        heading: "Comer arroz y visitar la Albufera",
        body: [
          "El Perelló y Les Palmeres concentran algunos de los mejores arroces de la zona. La Albufera queda al lado: mirador de El Palmar, paseo en barca y atardecer sobre el agua. Cullera y Valencia, a corta distancia.",
        ],
      },
      {
        heading: "Reserva directa con Praetoria",
        body: [
          "Disponibilidad real, precio total antes de pagar y confirmación inmediata. Trato directo con quien gestiona el apartamento, sin intermediarios.",
        ],
      },
    ],
    faq: [
      {
        question: "¿A qué distancia está de El Perelló?",
        answer:
          "El apartamento está en la playa de la Llastra, contigua a El Perelló; se llega andando por la costa o en unos minutos en coche.",
      },
      {
        question: "¿Es buena zona para ir con niños?",
        answer:
          "Sí: playa de arena tranquila, poco masificada, con el apartamento a pie de arena y parking en el edificio.",
      },
    ],
    published: true,
  },
  {
    slug: "alojamiento-camarena-de-la-sierra",
    propertySlug: "javalambre",
    intent: "Transaccional — alojamiento en Camarena de la Sierra",
    keyword: "alojamiento en Camarena de la Sierra",
    secondaryKeywords: [
      "apartamento Camarena de la Sierra",
      "dónde dormir Camarena de la Sierra",
    ],
    title: "Alojamiento en Camarena de la Sierra: apartamento a 10 min de Javalambre",
    description:
      "Apartamento nuevo de 70 m² en Camarena de la Sierra (Teruel), a unos 10 minutos de las pistas de Javalambre. Chimenea de pellets, guardaesquís, parking gratis. Reserva directa.",
    h1: "Alojamiento en Camarena de la Sierra",
    lead: "Camarena de la Sierra es el pueblo más cercano a la estación de Javalambre y una buena base para una escapada de nieve o de montaña. Este apartamento está en el centro del pueblo, con parking y guardaesquís.",
    blocks: [
      {
        heading: "El pueblo y la distancia a las pistas",
        body: [
          "Camarena de la Sierra conserva una atmósfera de pueblo serrano: calles de piedra, fuentes y el paisaje de la sierra de Javalambre. La estación de esquí queda a unos 10 minutos en coche.",
          "El apartamento es un piso nuevo de 70 m² con dos dormitorios, salón con chimenea de pellets y cocina totalmente equipada. El edificio tiene habitación guardaesquís y parking gratuito; el forfait y el alquiler de equipo se gestionan en la estación.",
        ],
      },
      {
        heading: "También sin esquís",
        body: [
          "El entorno es un destino de montaña todo el año: senderismo, BTT, micología y una ruta fluvial por el propio pueblo apta para familias. La comarca Gúdar-Javalambre es Destino Turístico Starlight, con el Observatorio Astrofísico muy cerca.",
        ],
      },
      {
        heading: "Reserva directa y confirmación inmediata",
        body: [
          "Consulta tus fechas, comprueba el precio total —sin comisiones ni cargos ocultos— y reserva en tres pasos, con confirmación inmediata.",
        ],
      },
    ],
    faq: [
      {
        question: "¿A qué distancia está de la estación de Javalambre?",
        answer: "A unos 10 minutos en coche desde el centro de Camarena de la Sierra.",
      },
      {
        question: "¿Tiene sitio para el material de esquí?",
        answer:
          "Sí: el edificio tiene habitación guardaesquís, además de parking privado gratuito. El forfait y el alquiler de equipo se gestionan en la estación de Javalambre.",
      },
      {
        question: "¿Se puede ir en verano?",
        answer:
          "Sí. Camarena y la sierra de Javalambre son un destino de montaña todo el año, con senderismo, BTT y cielo nocturno de los mejores de Europa.",
      },
    ],
    published: true,
  },
];

export function getLanding(propertySlug: string, slug: string): Landing | undefined {
  return landings.find((l) => l.propertySlug === propertySlug && l.slug === slug);
}
export function publishedLandings(): Landing[] {
  return landings.filter((l) => l.published);
}
