/**
 * Content expansion for the thinnest destination guides (DinoRANK audit, nov 2026).
 * The audit flagged ten guides at 220–450 words. Each one gets extra sections,
 * internal links to the matching blog articles and an FAQ (FAQPage JSON-LD).
 *
 * Facts are limited to publicly verifiable information (resort figures from the
 * official resort data, Galáctica opening days, the C-1 Cercanías line, Metrobús
 * line 188). Anything that changes (prices, timetables, opening dates) points the
 * reader to the official source instead of stating a figure.
 */
import type { Guide } from "./index";

type Section = Guide["sections"][number];
type Faq = NonNullable<Guide["faq"]>[number];

export const guideExpansions: Record<string, { sections: Section[]; faq?: Faq[] }> = {
  // ---------------------------------------------------------------- Javalambre
  "esquiar-en-javalambre": {
    sections: [
      {
        heading: "La estación en cifras",
        body: [
          "Javalambre tiene 17 pistas y 9 remontes entre los 1.650 m de la zona de base y los 2.000 m de la cota más alta, unos 350 m de desnivel. No es un gran dominio, pero está muy bien aprovechado: las pistas son anchas, casi todas convergen en la base y en una mañana se recorre la estación entera.",
          "Forma parte de Aramón, el mismo grupo que Valdelinares, así que el parte de nieve, las pistas abiertas, las webcams y la venta de forfaits se consultan en la web oficial de Aramón.",
        ],
        links: [{ label: "Javalambre en Aramón (forfait, parte y pistas)", href: "https://www.aramon.com" }],
      },
      {
        heading: "Para quién es ideal",
        body: [
          "Es una estación muy agradecida para quien empieza o para quien quiere ganar confianza: hay zona de debutantes junto a la base y la mayoría de las pistas son azules y rojas sin grandes muros. Los esquiadores avanzados disfrutan de las mañanas de nieve polvo y de las jornadas sin colas, aunque una sola jornada suele bastarles para conocerla entera.",
          "Por tamaño y ambiente es, sobre todo, una estación de familias y grupos de amigos de Valencia, Teruel y Castellón.",
        ],
      },
      {
        heading: "Cuándo ir y cómo evitar colas",
        body: [
          "La temporada suele ir de diciembre a marzo, según las nevadas y la producción de nieve. Los puentes de diciembre, Navidad y los fines de semana de enero y febrero concentran la mayor afluencia; entre semana la estación está muy tranquila.",
          "En los días punta, llegar antes de la apertura de remontes evita la cola de las taquillas y del aparcamiento. Si sabes que vas a esquiar, compra el forfait online.",
        ],
      },
      {
        heading: "El truco de la primera parada del telesilla",
        body: [
          "Uno de los telesillas tiene una parada intermedia que permite bajar por pistas más suaves sin subir hasta arriba: muy útil con niños o el primer día. Lo contamos con detalle en el blog.",
        ],
        related: [
          { label: "Javalambre con niños: el truco de la primera parada del telesilla Camarena", href: "/blog/javalambre-con-ninos-truco-telesilla-camarena" },
          { label: "Sectores de Javalambre: Lapiaz y Sabina, y dónde aparcar", href: "/blog/sectores-javalambre-lapiaz-sabina" },
          { label: "Temporada de esquí 2026-2027 en Javalambre", href: "/blog/temporada-esqui-javalambre-2026-2027" },
        ],
      },
      {
        heading: "Dormir a 10 minutos de las pistas",
        body: [
          "Camarena de la Sierra es el pueblo más cercano a la estación, a unos 10 minutos en coche. Dormir allí permite estar en pistas a primera hora, volver a comer al apartamento y no hacer cada día el viaje desde Valencia o Teruel.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuántas pistas tiene Javalambre?",
        answer: "17 pistas y 9 remontes, entre los 1.650 y los 2.000 m de altitud. Las pistas abiertas cada día se publican en el parte de nieve oficial de Aramón.",
      },
      {
        question: "¿Dónde se compra el forfait de Javalambre?",
        answer: "En la web oficial de Aramón y en las taquillas de la estación. Comprarlo online por adelantado evita colas en los días de más afluencia.",
      },
      {
        question: "¿Es Javalambre buena para aprender a esquiar?",
        answer: "Sí. Tiene zona de debutantes junto a la base, pistas anchas y poco desnivel, y escuela de esquí en la propia estación.",
      },
    ],
  },

  "fin-de-semana-en-javalambre": {
    sections: [
      {
        heading: "Viernes: llegar y cenar tranquilo",
        body: [
          "Desde Valencia se llega en algo menos de dos horas por la A-23. Salir el viernes por la tarde permite cenar en el apartamento, dejar preparado el material y estar en pistas el sábado a primera hora, cuando la nieve está mejor.",
          "Si viajas en invierno, comprueba antes el estado de las carreteras y lleva cadenas o neumáticos de invierno: las últimas curvas hasta Camarena y la estación son de montaña.",
        ],
        related: [{ label: "Fin de semana de esquí en Javalambre desde Valencia: cómo ir y qué reservar", href: "/blog/fin-de-semana-esqui-javalambre-desde-valencia" }],
      },
      {
        heading: "Sábado noche: estrellas en Galáctica",
        body: [
          "A unos 40 minutos en coche, en Arcos de las Salinas, Galáctica es un centro de divulgación de la astronomía junto al Observatorio Astrofísico de Javalambre, con cúpulas y telescopios para observar el cielo con guía. Abre de miércoles a domingo y festivos, y las visitas guiadas y las observaciones nocturnas se reservan con antelación en su web.",
          "Si no hay plaza, basta con alejarse un poco de las luces del pueblo en una noche despejada: el cielo de Javalambre es de los más oscuros de Europa.",
        ],
        links: [{ label: "Galáctica: reservas y horarios", href: "https://www.galactica.org.es" }],
      },
      {
        heading: "Domingo: Teruel en el camino de vuelta",
        body: [
          "Teruel capital queda a unos 45 minutos y está de camino si vuelves por la A-23. Su arquitectura mudéjar —las torres de San Salvador y San Martín, la catedral— es Patrimonio de la Humanidad, y el Mausoleo de los Amantes es la visita clásica. Con niños, Dinópolis, el parque de dinosaurios de Teruel, llena la mañana; consulta su calendario, porque no abre todo el año.",
        ],
      },
      {
        heading: "Si no hay nieve",
        body: [
          "El plan funciona igual en otoño o primavera: cambia el esquí por una ruta a pie desde Camarena —el castillo, los Amanaderos— o, en otoño, por una jornada buscando rebollones.",
        ],
        related: [
          { label: "Rutas en Camarena de la Sierra: senderismo, los Amanaderos y escalada", href: "/blog/rutas-camarena-de-la-sierra-senderismo-escalada" },
          { label: "Dónde coger rebollones cerca de Valencia", href: "/blog/donde-coger-rebollones-cerca-de-valencia" },
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto se tarda de Valencia a Javalambre?",
        answer: "En coche, algo menos de dos horas por la A-23 y las carreteras de montaña hasta la estación. En invierno hay que contar con el estado de la carretera.",
      },
      {
        question: "¿Merece la pena ir a Javalambre solo un fin de semana?",
        answer: "Sí. Con dos días da tiempo a una jornada completa de esquí, una noche de estrellas y una parada en Teruel a la vuelta.",
      },
      {
        question: "¿Dónde dormir para un fin de semana en Javalambre?",
        answer: "En Camarena de la Sierra, el pueblo más cercano a la estación, a unos 10 minutos en coche de las pistas.",
      },
    ],
  },

  "javalambre-con-ninos": {
    sections: [
      {
        heading: "Qué llevar para los peques",
        body: [
          "Ropa por capas, guantes de repuesto (los primeros se mojan siempre), gafas o máscara, crema solar de alta protección y protector labial: a 2.000 m el sol de invierno quema aunque haga frío. Un termo con algo caliente y unas galletas en el bolsillo salvan más de un berrinche a media mañana.",
          "El casco es imprescindible para los niños, y se puede alquilar junto con los esquís en la estación.",
        ],
      },
      {
        heading: "Un día de nieve con niños, paso a paso",
        body: [
          "Llegar pronto, dejar a los peques en su clase a primera hora y aprovechar ese rato para esquiar los adultos. A mediodía, comer en el apartamento o en la base y, por la tarde, trineo y muñeco de nieve en vez de más esquí: así acaban el día con ganas de volver y no agotados.",
        ],
        related: [{ label: "Javalambre con niños: el truco de la primera parada del telesilla Camarena", href: "/blog/javalambre-con-ninos-truco-telesilla-camarena" }],
      },
      {
        heading: "Planes en familia fuera de pistas",
        body: [
          "Dinópolis, en Teruel, es un parque de dinosaurios y paleontología que encanta a los niños; abre por temporadas, así que conviene mirar su calendario. En Arcos de las Salinas, Galáctica ofrece observaciones del cielo y del sol con telescopio, con reserva previa, que funcionan muy bien a partir de los 7-8 años.",
        ],
      },
      {
        heading: "Un apartamento pensado para familias",
        body: [
          "En nuestro apartamento de Camarena hay juguetes para los niños y un trineo para los huéspedes, y la cocina completa permite comer a las horas de los peques sin depender de los restaurantes.",
        ],
      },
    ],
    faq: [
      {
        question: "¿A qué edad pueden empezar a esquiar los niños en Javalambre?",
        answer: "La escuela de esquí organiza clases por grupos de edad y nivel; consulta directamente con la estación las edades mínimas de cada cursillo.",
      },
      {
        question: "¿Hay zona de trineos en Javalambre?",
        answer: "Con nieve, los alrededores del pueblo son perfectos para el trineo. En nuestro apartamento de Camarena los huéspedes pueden usar el nuestro.",
      },
      {
        question: "¿Qué hacer con niños cerca de Javalambre si no se esquía?",
        answer: "Dinópolis en Teruel, la observación de estrellas en Galáctica y los juegos en la nieve del propio pueblo son los planes más agradecidos.",
      },
    ],
  },

  "que-hacer-en-javalambre-sin-esquiar": {
    sections: [
      {
        heading: "Galáctica y el Observatorio de Javalambre",
        body: [
          "Galáctica, en Arcos de las Salinas, es un centro de divulgación de la astronomía junto al Observatorio Astrofísico de Javalambre. Tiene cúpulas con telescopios para observar el sol de día y el cielo de noche con un guía, y algunas entradas incluyen la visita al observatorio. Abre de miércoles a domingo y festivos; las visitas se reservan en su web.",
        ],
        links: [{ label: "Galáctica: reservas y horarios", href: "https://www.galactica.org.es" }],
      },
      {
        heading: "Rutas desde Camarena de la Sierra",
        body: [
          "Desde el propio pueblo salen rutas a pie para todos los niveles: la subida al castillo, el paseo hasta los Amanaderos y caminos entre sabinas con vistas a la estación. También hay vías de escalada para quienes vienen con cuerda.",
        ],
        related: [{ label: "Rutas en Camarena de la Sierra: senderismo, los Amanaderos y escalada", href: "/blog/rutas-camarena-de-la-sierra-senderismo-escalada" }],
      },
      {
        heading: "Setas en otoño",
        body: [
          "Con las lluvias de otoño, los pinares de la zona son terreno de rebollones. Antes de salir, infórmate de la normativa de recogida del municipio y no recojas ninguna seta que no sepas identificar con seguridad.",
        ],
        related: [{ label: "Dónde coger rebollones cerca de Valencia", href: "/blog/donde-coger-rebollones-cerca-de-valencia" }],
      },
      {
        heading: "Rubielos de Mora y Mora de Rubielos",
        body: [
          "Rubielos de Mora es uno de los pueblos más bonitos de Teruel, con un casco histórico de casas blasonadas y portales. Muy cerca, Mora de Rubielos tiene un castillo-palacio y una colegiata que merecen la parada. Combinan bien en una misma mañana.",
        ],
      },
      {
        heading: "Verano en el pueblo",
        body: [
          "En verano, Javalambre es una escapada para huir del calor: noches frescas, días largos para caminar y pueblos tranquilos.",
        ],
        related: [{ label: "Verano en el pueblo: un mes en Camarena de la Sierra", href: "/blog/verano-en-el-pueblo-camarena-de-la-sierra" }],
      },
    ],
    faq: [
      {
        question: "¿Qué ver cerca de Javalambre?",
        answer: "Teruel capital y su mudéjar, Rubielos de Mora, Mora de Rubielos, Galáctica y el Observatorio de Javalambre, y las rutas a pie desde Camarena de la Sierra.",
      },
      {
        question: "¿Se puede visitar el Observatorio de Javalambre?",
        answer: "Sí, a través de Galáctica, en Arcos de las Salinas: algunas de sus entradas incluyen la visita guiada al observatorio. Hay que reservar en su web.",
      },
      {
        question: "¿Merece la pena Javalambre en verano?",
        answer: "Sí: temperaturas suaves, senderismo, cielos muy oscuros para ver estrellas y pueblos tranquilos, lejos del calor de la costa.",
      },
    ],
  },

  "restaurantes-y-servicios-cerca-de-javalambre": {
    sections: [
      {
        heading: "Qué comer en la montaña de Teruel",
        body: [
          "La cocina de la zona es de montaña y de cuchara: migas, ternasco de Aragón, embutidos y jamón de Teruel, quesos de la comarca y, en invierno, trufa negra en temporada. Para el postre, los dulces de los hornos de los pueblos.",
          "Si te vas con algo en la maleta, el jamón de Teruel con denominación de origen es la compra clásica.",
        ],
      },
      {
        heading: "Cocinar en el apartamento",
        body: [
          "Con el horario de la estación y los niños, muchas familias prefieren comer en el apartamento: la cocina completa permite preparar algo caliente al volver de pistas y cenar sin horarios. Haz la compra grande en Teruel antes de subir.",
        ],
      },
      {
        heading: "Servicios prácticos",
        body: [
          "Repostar en Teruel o en la A-23 antes del último tramo de montaña. Los pueblos tienen comercios pequeños con horarios limitados, sobre todo fuera de temporada. Para urgencias sanitarias, llama al 112.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Hay restaurantes en la estación de Javalambre?",
        answer: "Sí, durante la temporada de esquí hay cafetería y restauración en la zona de base, pensada para comidas rápidas entre pistas.",
      },
      {
        question: "¿Dónde hacer la compra cerca de Javalambre?",
        answer: "Lo más práctico es hacer la compra grande en Teruel capital antes de subir; en los pueblos de montaña los comercios son pequeños y con horarios limitados.",
      },
    ],
  },

  // ------------------------------------------------- Valencia (costa sur, Sueca)
  "que-hacer-junto-al-mar-en-valencia": {
    sections: [
      {
        heading: "Deportes en la playa de la Llastra",
        body: [
          "La Llastra es una playa abierta y poco concurrida, perfecta para el paddle surf en los días de calma y, cuando entra viento, para el kitesurf. En el apartamento tienes tabla de paddle surf para alquilar. Los aficionados a la pesca practican surfcasting desde la orilla al atardecer, y en las rocas de la Diablera se puede hacer snorkel.",
        ],
        related: [
          { label: "Paddle surf en Valencia: rema al amanecer en la playa de la Llastra", href: "/blog/paddle-surf-valencia-playa-de-la-llastra" },
          { label: "Kitesurf en Valencia: la playa de la Llastra", href: "/blog/kitesurf-valencia-playa-de-la-llastra" },
          { label: "Bucear en Valencia: las rocas de la Diablera", href: "/blog/bucear-en-valencia-rocas-de-la-diablera" },
          { label: "Surfcasting en la playa de la Llastra", href: "/blog/surfcasting-valencia-playa-de-la-llastra" },
        ],
      },
      {
        heading: "Arrozales y miradores de la Albufera",
        body: [
          "Además del paseo en barca, merece la pena recorrer en coche o en bici los caminos entre arrozales y subir a la Muntanyeta dels Sants, en Sueca, el mejor mirador de la marjal. El paisaje cambia con el ciclo del arroz: verde en verano, dorado en la siega e inundado en invierno.",
        ],
        related: [
          { label: "Excursión por los arrozales de la Albufera", href: "/blog/excursion-arrozales-albufera" },
          { label: "La Perellonà: cuándo ver los arrozales inundados", href: "/blog/perellona-arrozales-inundados-albufera" },
          { label: "Dónde ver el atardecer en Valencia", href: "/blog/atardecer-valencia-albufera-playa-llastra" },
        ],
      },
      {
        heading: "La Cova del Dragut en Cullera",
        body: [
          "Además del castillo y el faro, Cullera tiene la Cova del Dragut, una cueva junto al mar convertida en museo sobre los ataques piratas a la costa. Es una visita corta que gusta mucho a los niños.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Qué hacer cerca de El Perelló?",
        answer: "Playa, paseo en barca por la Albufera, la ruta por los arrozales y la Muntanyeta dels Sants, arroces en El Palmar y una excursión a Cullera.",
      },
      {
        question: "¿Dónde hacer paddle surf al sur de Valencia?",
        answer: "En la playa de la Llastra, una playa abierta y tranquila. Los días de calma, a primera hora, el agua está como un plato.",
      },
    ],
  },

  "como-moverse-de-la-playa-al-centro-de-valencia": {
    sections: [
      {
        heading: "Tren: qué tienes que saber",
        body: [
          "Sueca está en la línea C-1 de Cercanías (Valencia Nord–Gandia), a unos 32 km de la estación del Nord, con trenes cada 20-30 minutos. Algunos trenes semidirectos solo paran en Sueca, Cullera, Tavernes y Xeraco y hacen el trayecto más rápido. La estación del Nord está en pleno centro, a pocos pasos de la plaza del Ayuntamiento.",
        ],
        links: [{ label: "Horarios de Cercanías Valencia (Renfe)", href: "https://www.renfe.com" }],
      },
      {
        heading: "Autobús por la costa",
        body: [
          "La línea 188 de Metrobús une Valencia con El Saler, El Perellonet y el Mareny Blau, y en verano refuerza su frecuencia dentro del plan de playas del área metropolitana. Consulta horarios y paradas actualizados en la web de Metrobús antes de salir.",
        ],
      },
      {
        heading: "Aparcar en Valencia",
        body: [
          "Si vas en coche, la opción más cómoda es dejarlo en un aparcamiento cerca de una parada de metro o en la zona de la Ciudad de las Artes y las Ciencias, que es la primera gran zona de la ciudad viniendo del sur. En el casco histórico el aparcamiento es escaso y caro.",
        ],
      },
      {
        heading: "Un día en la ciudad",
        body: [
          "Una propuesta sencilla: Ciudad de las Artes y las Ciencias por la mañana, paseo por el jardín del Turia hasta el centro, comida en el Mercado Central o alrededores, y tarde por el barrio del Carmen antes de volver a dormir frente al mar.",
        ],
      },
    ],
    faq: [
      {
        question: "¿Cuánto se tarda de la playa de la Llastra a Valencia?",
        answer: "Unos 30 minutos en coche sin tráfico. En tren, hay que sumar el trayecto hasta la estación de Sueca y el viaje en Cercanías hasta Valencia Nord.",
      },
      {
        question: "¿Hay tren de Sueca a Valencia?",
        answer: "Sí, la línea C-1 de Cercanías une Sueca con la estación del Nord de Valencia, con trenes cada 20-30 minutos.",
      },
      {
        question: "¿Hay autobús de Valencia a El Perellonet?",
        answer: "Sí, la línea 188 de Metrobús conecta Valencia con El Saler, El Perellonet y el Mareny Blau, con más frecuencia en verano.",
      },
    ],
  },

  "valencia-con-ninos-y-playa": {
    sections: [
      {
        heading: "Parque Gulliver: gratis y en el Turia",
        body: [
          "En el antiguo cauce del Turia, junto a la Ciudad de las Artes y las Ciencias, el Parque Gulliver es un gigante tumbado convertido en toboganes, rampas y cuerdas. La entrada es gratuita y combina muy bien con una mañana en el Oceanogràfic.",
        ],
      },
      {
        heading: "Un día de playa con niños, sin agobios",
        body: [
          "Bajar temprano, cuando la arena aún no quema, montar la sombrilla cerca de la orilla y volver al apartamento a comer y a la siesta. Por la tarde, segunda sesión de playa o un paseo en bici. Al estar el apartamento a pie de playa, no hay que cargar con todo ni buscar aparcamiento.",
        ],
      },
      {
        heading: "Naturaleza para niños: barcas y aves",
        body: [
          "En invierno, con los arrozales inundados, la Albufera se llena de aves: patos, garzas y hasta flamencos. Con unos prismáticos, un paseo por la Gola del Pujol o por los caminos entre arrozales se convierte en una pequeña aventura.",
        ],
        related: [
          { label: "La Perellonà: cuándo ver los arrozales inundados", href: "/blog/perellona-arrozales-inundados-albufera" },
          { label: "Playa de la Llastra y El Fernandet", href: "/blog/playa-de-la-llastra-y-el-fernandet" },
        ],
      },
    ],
    faq: [
      {
        question: "¿Es la playa de la Llastra buena para niños?",
        answer: "Sí: arena fina, pendiente suave y mucho menos gentío que las playas urbanas, lo que facilita tener a los niños a la vista.",
      },
      {
        question: "¿Qué hacer con niños en Valencia gratis?",
        answer: "El Parque Gulliver y el jardín del Turia, la playa y los paseos por la Albufera son planes gratuitos que encantan a los niños.",
      },
      {
        question: "¿Cuánto se tarda al Oceanogràfic desde la playa de la Llastra?",
        answer: "Unos 30 minutos en coche; la Ciudad de las Artes y las Ciencias es la primera gran zona de Valencia viniendo desde el sur.",
      },
    ],
  },

  "escapada-fin-de-semana-junto-al-mar-valencia": {
    sections: [
      {
        heading: "Si vienes en invierno",
        body: [
          "Fuera del verano la costa sur está tranquila y la luz es preciosa. Entre noviembre y enero los arrozales se inundan (la Perellonà) y la Albufera se convierte en un espejo lleno de aves: es el momento ideal para sustituir la mañana de playa por un paseo entre arrozales y la Muntanyeta dels Sants.",
        ],
        related: [
          { label: "La Perellonà: cuándo ver los arrozales inundados", href: "/blog/perellona-arrozales-inundados-albufera" },
          { label: "Teletrabajar frente al mar en temporada baja", href: "/blog/teletrabajar-frente-al-mar-valencia" },
        ],
      },
      {
        heading: "Si vienes en verano",
        body: [
          "Playa a primera hora y a última, siesta a mediodía y paddle surf o kitesurf según el viento. Reserva el arroz con antelación los fines de semana y deja la ciudad para una tarde, cuando baja el calor.",
        ],
        related: [{ label: "Paddle surf en la playa de la Llastra", href: "/blog/paddle-surf-valencia-playa-de-la-llastra" }],
      },
      {
        heading: "Atardeceres para cerrar el día",
        body: [
          "En la costa valenciana el sol se pone tierra adentro, sobre la Albufera. Por eso cada tarde puedes elegir: ver la puesta de sol en barca o en la Gola del Pujol, o quedarte en la playa viendo cómo el cielo se vuelve rosa sobre el mar.",
        ],
        related: [{ label: "Dónde ver el atardecer en Valencia", href: "/blog/atardecer-valencia-albufera-playa-llastra" }],
      },
    ],
    faq: [
      {
        question: "¿Dónde hacer una escapada de playa cerca de Valencia?",
        answer: "En la costa sur, entre El Perelló y Cullera: playas amplias y tranquilas a unos 30 minutos de la ciudad y junto a la Albufera.",
      },
      {
        question: "¿Merece la pena la playa en invierno?",
        answer: "Sí: playas vacías, buena luz, arrozales inundados y aves en la Albufera, y temperaturas suaves para pasear.",
      },
    ],
  },

  "restaurantes-y-ocio-cerca-de-la-playa-valencia": {
    sections: [
      {
        heading: "Qué arroz pedir",
        body: [
          "La paella valenciana tradicional lleva pollo, conejo, judía verde y garrofó. En la costa también son típicos el arroz a banda, el arroz negro y el arroz del senyoret. En la Albufera no te vayas sin probar el all i pebre, un guiso de anguila con ajo y pimentón propio de El Palmar.",
          "La paella se come a mediodía y se encarga para un mínimo de dos personas; en los restaurantes de arroz, la cena suele ser más de tapas y pescado.",
        ],
      },
      {
        heading: "Sueca, capital del arroz",
        body: [
          "Sueca organiza cada septiembre el Concurso Internacional de Paella Valenciana, uno de los más conocidos. Si coincides con las fiestas, es la mejor ocasión para ver cocinar paellas a leña en plena calle.",
        ],
      },
      {
        heading: "Mercados y producto",
        body: [
          "El pescado de los puertos de la zona, las verduras de la huerta y el arroz de la Albufera con denominación de origen son la base de la cocina local. Si cocinas en el apartamento, merece la pena comprar arroz de la zona para llevártelo a casa.",
        ],
        related: [{ label: "Excursión por los arrozales de la Albufera", href: "/blog/excursion-arrozales-albufera" }],
      },
    ],
    faq: [
      {
        question: "¿Dónde comer paella cerca de El Perelló?",
        answer: "En los restaurantes de arroz de El Perelló y de la playa de la Llastra, a pocos minutos del apartamento, y en El Palmar, en plena Albufera.",
      },
      {
        question: "¿Qué es el all i pebre?",
        answer: "Un guiso tradicional de anguila con ajo, pimentón y patata, típico de El Palmar y de la Albufera.",
      },
      {
        question: "¿Hay que reservar para comer paella?",
        answer: "Conviene, sobre todo los fines de semana y en verano. La paella se suele encargar para un mínimo de dos personas.",
      },
    ],
  },
};

/** Appends the expansion sections and FAQ to a guide, keeping its own content first. */
export function expandGuide(g: Guide): Guide {
  const ext = guideExpansions[g.slug];
  if (!ext) return g;
  return {
    ...g,
    sections: [...g.sections, ...ext.sections],
    faq: [...(g.faq ?? []), ...(ext.faq ?? [])],
  };
}
