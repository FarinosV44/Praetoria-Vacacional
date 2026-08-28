import type { FaqItem } from "@/domains/properties/types";

/** Reusable "why book direct" points (issues #3, #30). Concrete, no false urgency. */
export const directBookingAdvantages: { title: string; body: string; icon: string }[] = [
  {
    title: "Sin comisiones de intermediarios",
    body: "Reservas directamente con el alojamiento, sin recargos de plataformas externas.",
    icon: "tag",
  },
  {
    title: "Precio total desde el principio",
    body: "Ves el importe final con la limpieza incluida antes de pagar. Sin sorpresas al final.",
    icon: "receipt",
  },
  {
    title: "Confirmación inmediata y fechas bloqueadas",
    body: "Tras el pago seguro recibes el email con tu localizador y las fechas quedan reservadas al instante.",
    icon: "check",
  },
  {
    title: "Trato directo con el propietario",
    body: "Cualquier duda antes, durante o después de la estancia se resuelve con la persona que gestiona el alojamiento.",
    icon: "chat",
  },
];

export const trustSignals: { label: string }[] = [
  { label: "Pago seguro con tarjeta vía Stripe" },
  { label: "Alojamientos verificados por el propietario" },
  { label: "Opiniones reales, con su procedencia" },
  { label: "Cancelación según la política de cada alojamiento" },
];

export const directBookingAdvantagesEn: { title: string; body: string }[] = [
  {
    title: "No middleman fees",
    body: "You book directly with the owner — no platform surcharges.",
  },
  {
    title: "The full price up front",
    body: "You see the final amount, cleaning included, before you pay. No surprises at the end.",
  },
  {
    title: "Instant confirmation, dates blocked",
    body: "After the secure payment you get your booking reference by email and the dates are reserved at once.",
  },
  {
    title: "Deal directly with the owner",
    body: "Any question before, during or after your stay goes to the person who manages the property.",
  },
];

export const trustSignalsEn = [
  "Secure card payment via Stripe",
  "Properties verified by the owner",
  "Real reviews, with their source",
  "Cancellation per each property's policy",
];

export const homeFaqEn: FaqItem[] = [
  {
    question: "How does direct booking with Praetoria Vacacional work?",
    answer:
      "Choose the property, enter your dates and the number of guests, check availability and the full price, and complete the secure payment online. Once the payment is confirmed you receive your booking confirmation and the dates are blocked.",
  },
  {
    question: "What's the difference between booking here and booking through a platform?",
    answer:
      "You book directly with Praetoria Vacacional, with no intermediaries: direct support, clear pricing and access to exclusive promotions when they are available.",
  },
  {
    question: "How do I know if my dates are available?",
    answer:
      "Enter check-in, check-out and the number of guests in the search box. We tell you immediately whether Javalambre, Valencia, both or neither is free, with the full price for each.",
  },
  {
    question: "Do I need an account to book?",
    answer:
      "No. The booking is completed in three steps with no sign-up: dates and guests, your contact details and the secure payment.",
  },
  {
    question: "Is the payment secure?",
    answer:
      "Yes. Payment is processed by Stripe and your card details never pass through our servers. The booking is confirmed only once payment has completed successfully.",
  },
  {
    question: "Can I book both places for the same dates?",
    answer:
      "Yes. Javalambre and Valencia have independent calendars and prices, so the same dates can be available at both at once.",
  },
];

export const homeFaq: FaqItem[] = [
  {
    question: "¿Cómo funciona la reserva directa con Praetoria Vacacional?",
    answer:
      "Selecciona el alojamiento, indica las fechas y huéspedes, comprueba la disponibilidad y el precio total y completa el pago seguro online. Una vez confirmado el pago, recibirás la confirmación de la reserva y las fechas quedarán bloqueadas.",
  },
  {
    question: "¿Qué diferencia hay entre reservar aquí y hacerlo a través de una plataforma?",
    answer:
      "La reserva es directamente con Praetoria Vacacional, sin intermediarios, con atención directa, información clara del precio y acceso a promociones exclusivas cuando estén disponibles.",
  },
  {
    question: "¿Cómo sé si hay disponibilidad para mis fechas?",
    answer:
      "Introduce entrada, salida y número de huéspedes en el buscador. Te decimos al momento si está libre Javalambre, Valencia, ambos o ninguno, con el precio total de cada uno.",
  },
  {
    question: "¿Necesito crear una cuenta para reservar?",
    answer:
      "No. La reserva se completa en tres pasos sin registro: fechas y huéspedes, tus datos de contacto y el pago seguro.",
  },
  {
    question: "¿El pago es seguro?",
    answer:
      "Sí. El cobro se procesa con Stripe y los datos de la tarjeta nunca pasan por nuestros servidores. La reserva solo se confirma cuando el pago se ha completado correctamente.",
  },
  {
    question: "¿Puedo reservar los dos alojamientos para las mismas fechas?",
    answer:
      "Sí. Javalambre y Valencia tienen calendarios y precios independientes, así que unas mismas fechas pueden estar disponibles en los dos a la vez.",
  },
  {
    question: "¿Qué pasa si mis fechas dejan de estar disponibles durante el pago?",
    answer:
      "Comprobamos la disponibilidad otra vez antes de cobrar. Si las fechas se ocupan mientras pagas, no se realiza ningún cargo y te lo indicamos para que elijas otras.",
  },
];
