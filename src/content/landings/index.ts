/**
 * Transactional SEO landing pages per property (issues #15, #16, #31, #39).
 *
 * Content is written for humans first, with concrete, verifiable information
 * about the real location of each property:
 *  - Javalambre → Camarena de la Sierra (Teruel), ~20 min from the slopes
 *  - Valencia   → Mareny de Barraquetes (Sueca), Les Palmeretes beach, south of
 *                 Valencia city, next to the Albufera
 * Every landing links to the property page and to availability (issue #28).
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
    intent: "Transaccional — buscar alojamiento en Javalambre",
    title: "Alojamiento en Javalambre: apartamento en Camarena de la Sierra",
    description:
      "Apartamento en Camarena de la Sierra, a 20 minutos de las pistas de Javalambre. 70 m², chimenea de pellets, cocina completa, parking gratis y guardaesquís. Reserva directa.",
    h1: "Alojamiento en Javalambre",
    lead: "El alojamiento más práctico para esquiar en Javalambre es un apartamento en Camarena de la Sierra, el pueblo a los pies de la sierra. A unos 20 minutos en coche de las pistas, con parking y guardaesquís, es una base cómoda para un fin de semana de nieve.",
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
          "Tiene guardaesquís, punto de venta de forfaits y servicio de alquiler de equipo en el propio edificio, además de parking privado gratuito. Los huéspedes destacan lo bien que calienta en invierno, entre la calefacción y la chimenea de pellets.",
        ],
      },
      {
        heading: "Reserva directa y confirmación inmediata",
        body: [
          "Consulta tus fechas, comprueba la disponibilidad real y reserva en tres pasos. El precio que ves incluye la limpieza. Tras el pago recibirás el email de confirmación con tu localizador.",
        ],
      },
    ],
    published: true,
  },
  {
    slug: "donde-dormir-javalambre",
    propertySlug: "javalambre",
    intent: "Informacional-transaccional — 'dónde dormir en Javalambre'",
    title: "Dónde dormir en Javalambre: Camarena de la Sierra y alrededores",
    description:
      "Guía práctica sobre dónde dormir para esquiar en Javalambre: Camarena de la Sierra, los pueblos de Gúdar-Javalambre y Teruel capital. Con apartamento en reserva directa.",
    h1: "Dónde dormir en Javalambre",
    lead: "Dónde dormir en Javalambre depende de tu plan. Para esquiar varios días, lo más cómodo es alojarse en Camarena de la Sierra; para una escapada rural o cultural, los pueblos de la comarca o Teruel capital.",
    blocks: [
      {
        heading: "Camarena de la Sierra",
        body: [
          "El pueblo más cercano a la estación (unos 20 minutos en coche). Conocido como la villa de las 100 fuentes, está en un valle con nacimientos de agua y rutas de senderismo. Es la mejor opción si vas a esquiar. Aquí está este apartamento.",
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
    published: true,
  },
  {
    slug: "alojamiento-cerca-estacion-esqui",
    propertySlug: "javalambre",
    intent: "Transaccional local — 'alojamiento cerca estación de esquí Javalambre' / 'Camarena de la Sierra'",
    title: "Alojamiento cerca de la estación de esquí de Javalambre",
    description:
      "Apartamento en Camarena de la Sierra, a unos 20 minutos de la estación de esquí de Javalambre. Parking, guardaesquís y forfaits en el edificio. Reserva directa con precio total.",
    h1: "Alojamiento cerca de la estación de esquí de Javalambre",
    lead: "Camarena de la Sierra es el pueblo más próximo a la estación de Javalambre. Alojarte aquí reduce los desplazamientos diarios a unos 20 minutos y te permite volver a comer o descansar entre jornadas.",
    blocks: [
      {
        heading: "Ventajas de alojarse en Camarena",
        body: [
          "Llegar pronto a pistas, comer en el apartamento, no depender del aparcamiento de la estación en días de mucha afluencia y tener guardaesquís y alquiler de material en el propio edificio.",
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
    published: true,
  },
  {
    slug: "apartamento-playa-valencia",
    propertySlug: "valencia",
    intent: "Transaccional — 'apartamento playa Valencia'",
    title: "Apartamento en la playa, al sur de Valencia | Reserva directa",
    description:
      "Apartamento en primera línea de la playa Les Palmeretes, en Mareny de Barraquetes (Sueca), litoral sur de Valencia. 75 m², vistas al mar, parking gratis. Reserva directa.",
    h1: "Apartamento en la playa, al sur de Valencia",
    lead: "Un apartamento frente al mar en la playa Les Palmeretes, en Mareny de Barraquetes, en la costa sur de la provincia de Valencia. Arena amplia y tranquila, vistas al Mediterráneo y reserva directa.",
    blocks: [
      {
        heading: "Playa tranquila, con Valencia y la Albufera cerca",
        body: [
          "Les Palmeretes es un arenal amplio del litoral sur de Valencia, en el municipio de Sueca, junto al Parque Natural de la Albufera. Lejos del bullicio de la playa urbana, pero con Valencia capital a una media hora en coche.",
          "El apartamento tiene 75 m², tres dormitorios, cocina completa y un balcón con vistas directas al mar. Nada más bajar del edificio estás en la arena.",
        ],
      },
      {
        heading: "El apartamento",
        body: [
          "Para hasta 4 personas, con zona privada de playa, terraza, recepción 24 horas y parking gratuito. Muy valorado por parejas y familias que buscan desconectar.",
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
    title: "Alojamiento frente al mar en la provincia de Valencia",
    description:
      "Alojamiento en primera línea de mar en Les Palmeretes (Sueca), al sur de Valencia. Despiertas con el Mediterráneo delante. Reserva directa con disponibilidad real y precio total.",
    h1: "Alojamiento frente al mar en la provincia de Valencia",
    lead: "Estar en primera línea de playa significa bajar a la arena en minutos y tener el mar como salón. Este apartamento está en primera línea de la playa Les Palmeretes, en la costa sur de Valencia.",
    blocks: [
      {
        heading: "Qué aporta la primera línea",
        body: [
          "Menos desplazamientos, más tiempo de playa, mañanas con vista al mar desde el balcón y acceso directo a la arena y a los restaurantes del frente marítimo de Mareny de Barraquetes.",
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
    published: true,
  },
  {
    slug: "vacaciones-playa-valencia",
    propertySlug: "valencia",
    intent: "Transaccional estacional — 'apartamento vacaciones Valencia playa'",
    title: "Vacaciones de playa al sur de Valencia | Apartamento frente al mar",
    description:
      "Apartamento para vacaciones de playa en Les Palmeretes (Sueca), litoral sur de Valencia: verano, primavera y otoño con clima suave. Reserva directa, disponibilidad real y precio total.",
    h1: "Vacaciones de playa al sur de Valencia",
    lead: "La costa sur de Valencia, junto a la Albufera, es un destino de playa que funciona más allá del verano. Este apartamento frente al mar en Les Palmeretes es una buena base para tus vacaciones.",
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
    published: true,
  },
];

export function getLanding(propertySlug: string, slug: string): Landing | undefined {
  return landings.find((l) => l.propertySlug === propertySlug && l.slug === slug);
}
export function publishedLandings(): Landing[] {
  return landings.filter((l) => l.published);
}
