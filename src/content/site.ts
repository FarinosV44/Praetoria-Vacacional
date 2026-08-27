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

export const homeFaq: FaqItem[] = [
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
