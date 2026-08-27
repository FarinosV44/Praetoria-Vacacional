import type { Locale } from "./config";

export interface CheckoutStrings {
  steps: [string, string, string];
  cannotContinue: string;
  chooseDates: (name: string) => string;
  confirmGetaway: string;
  needChange: string;
  backToProperty: string;
  continue: string;
  oneMoment: string;
  yourDetails: string;
  noAccount: string;
  fullName: string;
  email: string;
  phoneOptional: string;
  acceptPre: string;
  bookingTerms: string;
  and: string;
  privacy: string;
  back: string;
  toPayment: string;
  saving: string;
  securePayment: string;
  secureBlurb: string;
  pay: (amount: string) => string;
  redirecting: string;
  noChargeYet: string;
  provisionalRef: string;
  total: string;
  finalPrice: string;
  accommodationN: (n: string) => string;
  extraGuests: string;
  cleaning: string;
  taxes: string;
  connError: string;
  reviewData: string;
  datesGone: string;
  chooseOther: string;
  // success / error / simulator
  confirmedHeading: string;
  confirmedSub: string;
  ref: string;
  property: string;
  checkIn: string;
  checkOut: string;
  stay: string;
  amountPaid: string;
  backHome: string;
  confirmingHeading: string;
  confirmingSub: string;
  notFoundSub: string;
  failedHeading: string;
  failedSub: string;
  retry: string;
  simDemoNote: string;
  simHeading: string;
  simOk: string;
  simFail: string;
}

const es: CheckoutStrings = {
  steps: ["Fechas", "Tus datos", "Pago"],
  cannotContinue: "No podemos continuar con estas fechas",
  chooseDates: (n) => `Elegir fechas en ${n}`,
  confirmGetaway: "Confirma tu escapada",
  needChange: "¿Necesitas cambiar algo?",
  backToProperty: "Volver al alojamiento",
  continue: "Continuar",
  oneMoment: "Un momento…",
  yourDetails: "Tus datos de contacto",
  noAccount: "No necesitas crear ninguna cuenta.",
  fullName: "Nombre y apellidos",
  email: "Email",
  phoneOptional: "Teléfono (opcional)",
  acceptPre: "He leído y acepto las ",
  bookingTerms: "condiciones de reserva",
  and: " y la ",
  privacy: "política de privacidad",
  back: "Atrás",
  toPayment: "Ir al pago",
  saving: "Guardando…",
  securePayment: "Pago seguro",
  secureBlurb:
    "El cobro se procesa con Stripe. Los datos de tu tarjeta no pasan por nuestros servidores. La reserva se confirma automáticamente cuando el pago se completa.",
  pay: (a) => `Pagar ${a}`,
  redirecting: "Redirigiendo…",
  noChargeYet: "No se cobra nada hasta el último paso. Precio total, sin comisiones ocultas.",
  provisionalRef: "Localizador provisional",
  total: "Total",
  finalPrice: "Precio final. Sin comisiones de intermediarios.",
  accommodationN: (n) => `Alojamiento · ${n}`,
  extraGuests: "Huéspedes adicionales",
  cleaning: "Limpieza",
  taxes: "Impuestos",
  connError: "Problema de conexión",
  reviewData: "Revisa los datos",
  datesGone: "Las fechas ya no están disponibles",
  chooseOther: "Elegir otras fechas",
  confirmedHeading: "Reserva confirmada",
  confirmedSub: "Hemos enviado la confirmación a tu correo. Guarda tu localizador.",
  ref: "Localizador",
  property: "Alojamiento",
  checkIn: "Entrada",
  checkOut: "Salida",
  stay: "Estancia",
  amountPaid: "Importe pagado",
  backHome: "Volver al inicio",
  confirmingHeading: "Estamos confirmando tu pago",
  confirmingSub:
    "En cuanto el pago quede verificado recibirás el email de confirmación. Puedes actualizar esta página en unos segundos.",
  notFoundSub: "No encontramos esta reserva. Si acabas de pagar, revisa tu correo en unos minutos.",
  failedHeading: "No se ha completado el pago",
  failedSub:
    "No se ha realizado ningún cargo. Tus fechas siguen disponibles mientras nadie más las reserve; puedes intentarlo de nuevo.",
  retry: "Reintentar la reserva",
  simDemoNote:
    "Modo demostración: Stripe no está configurado. Este paso simula la pasarela de pago para poder probar el flujo completo. Configura Stripe para el cobro real (docs/SETUP.md).",
  simHeading: "Pasarela de pago (simulada)",
  simOk: "Simular pago correcto",
  simFail: "Simular pago fallido",
};

const en: CheckoutStrings = {
  steps: ["Dates", "Your details", "Payment"],
  cannotContinue: "We can't continue with these dates",
  chooseDates: (n) => `Choose dates at ${n}`,
  confirmGetaway: "Confirm your getaway",
  needChange: "Need to change something?",
  backToProperty: "Back to the property",
  continue: "Continue",
  oneMoment: "One moment…",
  yourDetails: "Your contact details",
  noAccount: "No account needed.",
  fullName: "Full name",
  email: "Email",
  phoneOptional: "Phone (optional)",
  acceptPre: "I have read and accept the ",
  bookingTerms: "booking terms",
  and: " and the ",
  privacy: "privacy policy",
  back: "Back",
  toPayment: "Go to payment",
  saving: "Saving…",
  securePayment: "Secure payment",
  secureBlurb:
    "Payment is processed by Stripe. Your card details never pass through our servers. The booking is confirmed automatically once payment completes.",
  pay: (a) => `Pay ${a}`,
  redirecting: "Redirecting…",
  noChargeYet: "Nothing is charged until the last step. Full price, no hidden fees.",
  provisionalRef: "Provisional reference",
  total: "Total",
  finalPrice: "Final price. No middleman fees.",
  accommodationN: (n) => `Accommodation · ${n}`,
  extraGuests: "Extra guests",
  cleaning: "Cleaning",
  taxes: "Taxes",
  connError: "Connection problem",
  reviewData: "Please check your details",
  datesGone: "These dates are no longer available",
  chooseOther: "Choose other dates",
  confirmedHeading: "Booking confirmed",
  confirmedSub: "We've emailed your confirmation. Keep your reference.",
  ref: "Reference",
  property: "Property",
  checkIn: "Check-in",
  checkOut: "Check-out",
  stay: "Stay",
  amountPaid: "Amount paid",
  backHome: "Back to home",
  confirmingHeading: "We're confirming your payment",
  confirmingSub:
    "As soon as the payment is verified you'll get the confirmation email. You can refresh this page in a few seconds.",
  notFoundSub: "We couldn't find this booking. If you just paid, check your email in a few minutes.",
  failedHeading: "Payment was not completed",
  failedSub:
    "No charge was made. Your dates are still available until someone else books them; you can try again.",
  retry: "Try the booking again",
  simDemoNote:
    "Demo mode: Stripe is not configured. This step simulates the payment gateway so the full flow can be tested. Configure Stripe for real charges (docs/SETUP.md).",
  simHeading: "Payment gateway (simulated)",
  simOk: "Simulate successful payment",
  simFail: "Simulate failed payment",
};

export function getCheckoutStrings(locale: Locale): CheckoutStrings {
  return locale === "en" ? en : es;
}
