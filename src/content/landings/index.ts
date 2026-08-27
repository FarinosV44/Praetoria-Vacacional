/**
 * Transactional SEO landing pages per property (issues #15, #16, #31).
 *
 * Each landing targets a DIFFERENT search intent — no near-duplicates. Copy is
 * written for humans first, with concrete, publicly-verifiable information about
 * the destination (not invented property amenities). Deep operational details
 * that depend on the owner are deferred to the property page, which every
 * landing links to with an availability CTA.
 */

export interface Landing {
  slug: string;
  propertySlug: string;
  intent: string;
  title: string;
  description: string;
  h1: string;
  lead: string;
  blocks: { heading: string; body: string[] }[];
  published: boolean;
}

export const landings: Landing[] = [
  {
    slug: "alojamiento-javalambre",
    propertySlug: "javalambre",
    intent: "Transaccional — buscar dónde alojarse en Javalambre",
    title: "Alojamiento en Javalambre | Apartamento con reserva directa",
    description:
      "Apartamento en la zona de la estación de esquí de Javalambre. Reserva directa, disponibilidad real y precio total antes de pagar. Ideal para escapadas de nieve en Teruel.",
    h1: "Alojamiento en Javalambre",
    lead: "Si buscas dónde alojarte en Javalambre para esquiar o disfrutar de la montaña, este apartamento es una base cómoda y bien situada, con reserva directa y sin comisiones de intermediarios.",
    blocks: [
      {
        heading: "Por qué alojarse en la sierra de Javalambre",
        body: [
          "La estación de esquí de Javalambre, en la provincia de Teruel, es una de las opciones más accesibles para esquiar en el este de España. Su tamaño contenido y su ambiente familiar la hacen ideal para quienes empiezan o para fines de semana sin agobios.",
          "Alojarse cerca de la estación te permite aprovechar la mañana en pistas sin largos desplazamentos y volver a descansar entre jornadas.",
        ],
      },
      {
        heading: "Qué encontrarás en el apartamento",
        body: [
          "El apartamento está pensado para grupos y familias que quieren un sitio donde dejar el equipo, cocinar y descansar. La capacidad, distribución y equipamiento concretos se detallan en la página del alojamiento.",
        ],
      },
      {
        heading: "Reserva directa y confirmación inmediata",
        body: [
          "Consulta tus fechas, comprueba la disponibilidad real y reserva en tres pasos. El precio que ves incluye la limpieza y es el precio final. Tras el pago recibirás el email de confirmación con tu localizador.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "donde-dormir-javalambre",
    propertySlug: "javalambre",
    intent: "Informacional-transaccional — 'dónde dormir en Javalambre'",
    title: "Dónde dormir en Javalambre: opciones y consejos | Praetoria Vacacional",
    description:
      "Guía práctica sobre dónde dormir en Javalambre según tu plan: esquí, fin de semana o escapada de montaña. Con opción de apartamento en reserva directa.",
    h1: "Dónde dormir en Javalambre",
    lead: "La mejor zona para dormir en Javalambre depende de tu plan. Aquí te explicamos las opciones y cuándo tiene sentido cada una, con un apartamento disponible para reserva directa.",
    blocks: [
      {
        heading: "Cerca de la estación de esquí",
        body: [
          "Es la opción más práctica si vas a esquiar varios días: minimizas desplazamientos y ganas tiempo en pistas. Es lo que ofrece este apartamento.",
        ],
      },
      {
        heading: "En los pueblos de la comarca",
        body: [
          "Localidades de Gúdar-Javalambre como La Puebla de Valverde o Camarena de la Sierra son alternativas con encanto rural, algo más alejadas de las pistas.",
        ],
      },
      {
        heading: "En Teruel capital",
        body: [
          "Teruel ofrece más servicios y patrimonio (arquitectura mudéjar Patrimonio de la Humanidad), a cambio de un trayecto diario hasta la estación.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "alojamiento-cerca-estacion-esqui",
    propertySlug: "javalambre",
    intent: "Transaccional local — 'alojamiento cerca estación de esquí Javalambre'",
    title: "Alojamiento cerca de la estación de esquí de Javalambre",
    description:
      "Apartamento en la zona de la estación de esquí de Javalambre para esquiar sin largos desplazamientos. Reserva directa con disponibilidad real y precio total.",
    h1: "Alojamiento cerca de la estación de esquí de Javalambre",
    lead: "Dormir cerca de las pistas de Javalambre cambia la experiencia: más tiempo esquiando y menos coche. Este apartamento está en la zona de la estación.",
    blocks: [
      {
        heading: "Ventajas de alojarse junto a la estación",
        body: [
          "Llegar pronto al telesilla, comer en el apartamento, descansar entre jornadas y no depender del aparcamiento en días de mucha afluencia.",
        ],
      },
      {
        heading: "La estación de Javalambre en breve",
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
    published: true,
  },
  {
    slug: "apartamento-playa-valencia",
    propertySlug: "valencia",
    intent: "Transaccional — 'apartamento playa Valencia'",
    title: "Apartamento en la playa de Valencia | Reserva directa",
    description:
      "Apartamento junto a la playa en Valencia para vacaciones y escapadas. Reserva directa, disponibilidad real y precio total antes de pagar. Sin comisiones de intermediarios.",
    h1: "Apartamento en la playa de Valencia",
    lead: "Un apartamento junto al mar en Valencia para tus vacaciones de playa, con reserva directa y confirmación inmediata.",
    blocks: [
      {
        heading: "Vacaciones de playa con ciudad al lado",
        body: [
          "Valencia combina playa urbana amplia, paseo marítimo y una ciudad con vida propia: casco histórico, mercado central, Ciudad de las Artes y las Ciencias y la Albufera muy cerca.",
          "Alojarse frente al mar te permite empezar el día en la playa y dedicar la tarde a la ciudad sin complicaciones.",
        ],
      },
      {
        heading: "El apartamento",
        body: [
          "Pensado para parejas y familias, con la playa a un paso. Capacidad y equipamiento concretos, en la página del alojamiento.",
        ],
      },
      {
        heading: "Reserva directa",
        body: [
          "Consulta disponibilidad, comprueba el precio final con limpieza incluida y reserva en tres pasos. Recibirás el email de confirmación con el localizador.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "alojamiento-frente-al-mar-valencia",
    propertySlug: "valencia",
    intent: "Transaccional específico — 'alojamiento frente al mar / primera línea Valencia'",
    title: "Alojamiento frente al mar en Valencia — primera línea de playa",
    description:
      "Alojamiento en primera línea de mar en Valencia. Despiertas con el Mediterráneo delante. Reserva directa con disponibilidad real y precio total.",
    h1: "Alojamiento frente al mar en Valencia",
    lead: "Estar en primera línea de playa en Valencia significa bajar a la arena en minutos y tener el paseo marítimo como salón. Este alojamiento está en esa zona.",
    blocks: [
      {
        heading: "Qué aporta la primera línea",
        body: [
          "Menos desplazamientos, más tiempo de playa, atardeceres sobre el agua y acceso directo a los chiringuitos y restaurantes de arroz del frente marítimo.",
        ],
      },
      {
        heading: "Las playas del frente urbano",
        body: [
          "Las playas de la Malva-rosa y El Cabanyal-Les Arenes forman un arenal amplio y bien equipado, con bandera azul en distintas temporadas y buena conexión con el centro.",
        ],
      },
      {
        heading: "Comprueba tus fechas",
        body: [
          "El buscador te dice al momento si está disponible y a qué precio total. La reserva se confirma tras el pago seguro.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "vacaciones-playa-valencia",
    propertySlug: "valencia",
    intent: "Transaccional estacional — 'apartamento vacaciones Valencia playa'",
    title: "Vacaciones de playa en Valencia | Apartamento junto al mar",
    description:
      "Apartamento para tus vacaciones de playa en Valencia: verano, primavera y otoño con clima suave. Reserva directa, disponibilidad real y precio total.",
    h1: "Vacaciones de playa en Valencia",
    lead: "Valencia es un destino de playa que funciona más allá del verano. Este apartamento junto al mar es una buena base para tus vacaciones.",
    blocks: [
      {
        heading: "Cuándo ir",
        body: [
          "Julio y agosto son temporada alta, con más ambiente y precios más altos. Junio y septiembre mantienen buen tiempo de baño con menos gente. Primavera y otoño son ideales para quien busca tranquilidad y ciudad.",
        ],
      },
      {
        heading: "Más allá de la playa",
        body: [
          "Rutas en bici por el antiguo cauce del Turia, visita a la Albufera al atardecer, gastronomía de arroz y el casco histórico. Todo compatible con una base junto al mar.",
        ],
      },
      {
        heading: "Reserva tus fechas",
        body: [
          "Consulta la disponibilidad real y el precio total antes de pagar. Confirmación inmediata y fechas bloqueadas automáticamente.",
        ],
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
