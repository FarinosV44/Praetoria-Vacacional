import type { Locale } from "./config";

/** UI strings. Product copy (property content, guides) lives in `src/content`. */
export interface Dictionary {
  nav: { guides: string; seeAvailability: string; book: string };
  home: {
    eyebrow: string;
    h1: string;
    sub: string;
    chooseHeading: string;
    chooseSub: string;
    whyDirect: string;
    faqHeading: string;
    searchHeading: string;
  };
  search: {
    checkIn: string;
    checkOut: string;
    guests: string;
    submit: string;
    checking: string;
    priceTotal: string;
    notAvailable: string;
    seeProperty: string;
    book: string;
  };
  footer: { tagline: string; accommodations: string; discover: string; legal: string };
}

const es: Dictionary = {
  nav: { guides: "Guías", seeAvailability: "Ver disponibilidad", book: "Reservar" },
  home: {
    eyebrow: "Praetoria Vacacional",
    h1: "Del Mediterráneo a la nieve, desde Valencia. En reserva directa.",
    sub: "Disponibilidad real, precio total y reserva en tres pasos. Sin comisiones de intermediarios y con confirmación inmediata.",
    chooseHeading: "Elige tu escapada",
    chooseSub:
      "El mismo eje —Valencia— y dos experiencias muy distintas: el Mediterráneo a pie de la playa de la Llastra o la nieve de Javalambre desde un pueblo serrano. Cada alojamiento tiene su calendario, sus precios y su personalidad; el motor de reserva y el pago seguro son los mismos.",
    whyDirect: "Por qué reservar directamente",
    faqHeading: "Preguntas frecuentes",
    searchHeading: "Buscar disponibilidad",
  },
  search: {
    checkIn: "Entrada",
    checkOut: "Salida",
    guests: "Huéspedes",
    submit: "Ver disponibilidad",
    checking: "Comprobando…",
    priceTotal: "precio total",
    notAvailable: "No disponible para estas fechas",
    seeProperty: "Ver alojamiento",
    book: "Reservar",
  },
  footer: {
    tagline:
      "Del Mediterráneo a la nieve, desde Valencia. Reserva directa, sin intermediarios y con confirmación inmediata.",
    accommodations: "Alojamientos",
    discover: "Descubre",
    legal: "Legal",
  },
};

const en: Dictionary = {
  nav: { guides: "Guides", seeAvailability: "Check availability", book: "Book" },
  home: {
    eyebrow: "Praetoria Vacacional",
    h1: "From the Mediterranean to the snow, out of Valencia — book direct.",
    sub: "Real-time availability, the full price up front, and booking in three steps. No middleman fees, instant confirmation.",
    chooseHeading: "Choose your getaway",
    chooseSub:
      "One axis — Valencia — and two very different experiences: the Mediterranean right on la Llastra beach, or the Javalambre snow from a mountain village. Each place has its own calendar, prices and character; the booking engine and secure payment are shared.",
    whyDirect: "Why book direct",
    faqHeading: "Frequently asked questions",
    searchHeading: "Check availability",
  },
  search: {
    checkIn: "Check-in",
    checkOut: "Check-out",
    guests: "Guests",
    submit: "Check availability",
    checking: "Checking…",
    priceTotal: "total price",
    notAvailable: "Not available for these dates",
    seeProperty: "View property",
    book: "Book",
  },
  footer: {
    tagline:
      "From the Mediterranean to the snow, out of Valencia. Book direct — no middlemen, instant confirmation.",
    accommodations: "Stays",
    discover: "Discover",
    legal: "Legal",
  },
};

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
