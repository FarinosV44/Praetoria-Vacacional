import type { FaqItem } from "@/domains/properties/types";

/**
 * Copy for the owner-acquisition page (/propietarios). Every service listed
 * here is something the operator has confirmed they provide; keep it that way
 * — this page makes commercial promises to owners.
 */

export const ownerServices: { title: string; body: string }[] = [
  {
    title: "Licencia turística y trámites",
    body: "Tramitamos la licencia de apartamento turístico, la inscripción en el registro de turismo, el número de registro único de arrendamientos y todo lo relacionado. Tu alojamiento, en regla desde el primer día.",
  },
  {
    title: "Anuncio que vende",
    body: "Preparamos la ficha, los textos y las fotos para que tu alojamiento destaque, y lo publicamos en nuestra web y en Booking, Airbnb y otras plataformas.",
  },
  {
    title: "Calendario sin dobles reservas",
    body: "Todos los canales sincronizados en un único calendario. Reservas directas con pago seguro con tarjeta y confirmación inmediata.",
  },
  {
    title: "Precios que rentabilizan",
    body: "Ajustamos el precio por temporada, fines de semana, puentes y demanda, con estancias mínimas y descuentos por estancia larga cuando conviene.",
  },
  {
    title: "Atención a los huéspedes",
    body: "Respondemos antes, durante y después de la estancia. Mensajes automáticos de llegada, check-in online y entrega de llaves coordinada.",
  },
  {
    title: "Equipo de limpieza propio",
    body: "Limpieza entre reservas, ropa de cama y toallas, y revisión del apartamento. Siempre listo para el siguiente huésped.",
  },
  {
    title: "Mantenimiento e incidencias",
    body: "Nos ocupamos de las averías y los imprevistos. Tú no tienes que coger el teléfono un domingo de agosto.",
  },
  {
    title: "Registro de viajeros y facturación",
    body: "Comunicamos cada estancia en SES.Hospedajes como exige la ley y emitimos las facturas. Recibes informes claros de reservas e ingresos.",
  },
];

export const ownerReasons: { title: string; body: string }[] = [
  {
    title: "Gestión integral de verdad",
    body: "De la licencia a la limpieza. No te pasamos a un tercero ni te dejamos tareas pendientes: un único interlocutor para todo.",
  },
  {
    title: "Equipo en la zona",
    body: "Trabajamos en la costa sur de Valencia —El Perelló, Les Palmeres, La Llastra y Cullera— y en la sierra de Javalambre. Conocemos cada calle y cada temporada.",
  },
  {
    title: "Tecnología propia",
    body: "Esta misma web es nuestra plataforma: reserva directa, precios, calendarios, registro de viajeros y facturación conectados en un solo sistema.",
  },
  {
    title: "Gestionamos como si fuera nuestro",
    body: "Gestionamos nuestros propios apartamentos con el mismo sistema y el mismo cuidado que aplicaremos al tuyo.",
  },
];

export const ownerSteps: { title: string; body: string }[] = [
  {
    title: "Nos cuentas",
    body: "Rellena el formulario o llámanos. Con unos pocos datos de tu alojamiento es suficiente.",
  },
  {
    title: "Lo visitamos",
    body: "Vemos el apartamento, su potencial y lo que necesitaría para alquilarse mejor.",
  },
  {
    title: "Te hacemos una propuesta",
    body: "Con lo que haríamos, una estimación de ingresos realista y nuestras condiciones, sin letra pequeña.",
  },
  {
    title: "Tú solo recibes ingresos",
    body: "Tramitamos lo necesario, lo ponemos a la venta y nos ocupamos del día a día.",
  },
];

export const ownerFaq: FaqItem[] = [
  {
    question: "¿Qué incluye la gestión integral de mi apartamento turístico?",
    answer:
      "Todo lo necesario para alquilarlo sin preocupaciones: licencia turística y trámites, anuncio y fotos, publicación en nuestra web y en las principales plataformas, precios, atención a los huéspedes, check-in, limpieza con equipo propio, mantenimiento, registro de viajeros, facturación e informes de ingresos.",
  },
  {
    question: "¿Tramitáis la licencia de apartamento turístico?",
    answer:
      "Sí. Tramitamos la licencia de apartamento turístico, la inscripción en el registro de turismo correspondiente, el número de registro único de arrendamientos y todo lo relacionado, tanto en la Comunitat Valenciana como en Aragón.",
  },
  {
    question: "¿En qué zonas gestionáis apartamentos?",
    answer:
      "En la costa sur de Valencia —El Perelló, Les Palmeres, La Llastra, Mareny y Cullera—, con especial interés en apartamentos en primera línea de playa, y en la sierra de Javalambre, en Camarena de la Sierra y sus alrededores.",
  },
  {
    question: "¿Cuánto cuesta y cuánto puedo ganar?",
    answer:
      "Cada alojamiento es distinto. Tras visitarlo te presentamos una propuesta personalizada con nuestras condiciones y una estimación de ingresos realista, sin compromiso.",
  },
  {
    question: "Mi apartamento ya está en Booking o Airbnb, ¿podéis gestionarlo?",
    answer:
      "Sí. Nos ocupamos de tus anuncios actuales, los conectamos a nuestro calendario y a nuestra web de reserva directa y gestionamos todo el día a día.",
  },
  {
    question: "¿Puedo seguir usando mi apartamento algunos días?",
    answer: "Sí. Bloqueamos en el calendario las fechas que quieras reservar para ti y tu familia.",
  },
];
