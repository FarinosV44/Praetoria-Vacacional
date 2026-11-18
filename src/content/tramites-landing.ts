/**
 * Textos de la landing de gestión de trámites (#174) y sus guías (#178).
 * Los precios NO van aquí: salen del catálogo vigente (catalog.ts / panel).
 */

export const tramitesHero = {
  eyebrow: "Gestión de trámites para viviendas turísticas",
  h1: "Registro de viajeros y trámites turísticos, sin complicaciones",
  claim: "Tú gestionas las reservas. Nosotros, el papeleo.",
  lede: "Damos de alta tu vivienda en SES.HOSPEDAJES y comunicamos al Ministerio del Interior cada reserva y cada entrada de viajeros. Sigues con tu plataforma, tus llaves y tus huéspedes. Nos avisas de la reserva desde tu carpeta y nosotros hacemos el resto, con justificante.",
};

export const tramitesProblems = [
  {
    title: "El plazo es de 24 horas",
    body: "Cada reserva, cada anulación y cada entrada se comunican en las 24 horas siguientes. Con el móvil lleno de mensajes de huéspedes, es fácil que se pase.",
  },
  {
    title: "Los datos que pide Interior son muchos",
    body: "Documento con número de soporte, dirección completa, parentesco de los menores, forma de pago… Si falta uno, la comunicación no vale.",
  },
  {
    title: "Las normas han cambiado varias veces",
    body: "El Registro Único se creó en 2025 y el Supremo lo anuló en 2026. Saber qué sigue en vigor y qué no te quita horas.",
  },
];

export const tramitesSteps = [
  {
    title: "Te das de alta",
    body: "Eliges el plan, añades tus viviendas y aceptas el encargo. Ves el precio total, IVA incluido, antes de pagar.",
  },
  {
    title: "Nos das la documentación",
    body: "Subes a tu carpeta la autorización firmada y lo que te pidamos. Si falta algo, te lo decimos por correo y en la carpeta.",
  },
  {
    title: "Nos avisas de cada reserva",
    body: "En cuanto entra una reserva, la registras en la carpeta (dos minutos) y antes de la llegada nos pasas los datos de los viajeros.",
  },
  {
    title: "Presentamos y te dejamos el justificante",
    body: "Hacemos la comunicación en la sede del Ministerio y subimos a tu carpeta el resguardo oficial. Si hay un problema, te llamamos.",
  },
];

export const tramitesIncluded = [
  "Alta de la vivienda como establecimiento en SES.HOSPEDAJES",
  "Comunicación de la reserva, de su anulación si la hay y de la entrada de los viajeros",
  "Revisión de los datos antes de presentarlos",
  "Resguardo oficial de cada presentación en tu carpeta",
  "Avisos de plazos y de documentación pendiente",
  "Mensajes directos con quien lleva tu expediente",
];

export const tramitesNotIncluded = [
  "Solicitar el registro turístico autonómico o la licencia de actividad",
  "Recurrir sanciones o representarte en un procedimiento sancionador",
  "Gestionar tus reservas, el check-in o la limpieza (eso lo hacemos en la gestión integral)",
  "Las tasas oficiales, si alguna administración las cobra",
];

export const tramitesFaq = [
  {
    question: "¿Dejo de ser responsable de las comunicaciones?",
    answer:
      "No. La obligación del RD 933/2021 sigue siendo del titular de la vivienda. Nosotros actuamos como tu representante y presentamos en tu nombre lo que nos comunicas a tiempo. Por eso es importante que registres cada reserva en tu carpeta en cuanto se produce.",
  },
  {
    question: "¿Qué pasa si os aviso tarde de una reserva?",
    answer:
      "La presentamos igualmente lo antes posible y queda marcada como comunicada fuera de plazo. Comunicarla tarde no borra el retraso ni evita una posible sanción. Te lo decimos claro para que no haya sorpresas.",
  },
  {
    question: "¿Tengo que cambiar de plataforma o daros acceso a Booking o Airbnb?",
    answer:
      "No. Sigues con tus anuncios y tu forma de trabajar. Solo nos registras la reserva en tu carpeta y, antes de la llegada, los datos de los viajeros. No pedimos contraseñas de ninguna plataforma.",
  },
  {
    question: "¿Cómo se guardan los datos de mis huéspedes?",
    answer:
      "Cifrados y separados de tus datos de cliente. Solo los ve la persona que presenta el parte, y cada consulta queda registrada. Los usamos únicamente para comunicarlos al Ministerio, como encargados del tratamiento.",
  },
  {
    question: "¿Y el Registro Único de Arrendamientos (NRUA)?",
    answer:
      "El Tribunal Supremo anuló en 2026 el procedimiento del Registro Único y el depósito anual ante los Registradores. Hoy no hay que solicitarlo ni renovarlo, así que no lo cobramos. Si una norma nueva lo recupera, te avisaremos.",
  },
  {
    question: "Mi vivienda ya está dada de alta en SES.HOSPEDAJES. ¿Pago el alta?",
    answer:
      "No. El alta solo se cobra si la vivienda todavía no está dada de alta. En el formulario indicas su situación y el precio se ajusta.",
  },
  {
    question: "Tengo reservas antiguas que nunca comuniqué. ¿Las podéis presentar?",
    answer:
      "Es un encargo especial. Primero lo estudiamos y te enviamos presupuesto, sin cobrar nada por adelantado. No podemos prometer que regularizarlas evite una sanción: te explicamos las opciones y decides tú.",
  },
  {
    question: "¿Puedo darme de baja cuando quiera?",
    answer:
      "Sí. En el plan por uso no hay permanencia ni cuota: pagas el alta si la necesitas y las reservas que nos encargas. El saldo de reservas que no uses no caduca mientras mantengas la cuenta.",
  },
];

export const tramitesWhatsappText =
  "Hola, tengo una vivienda turística y me interesa que gestionéis el registro de viajeros y los trámites.";
