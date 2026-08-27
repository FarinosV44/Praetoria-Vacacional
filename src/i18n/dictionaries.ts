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
    h1: "La nieve de Javalambre y el mar de Valencia, en reserva directa.",
    sub: "Disponibilidad real, precio total y reserva en tres pasos. Sin comisiones de intermediarios y con confirmación inmediata.",
    chooseHeading: "Elige tu escapada",
    chooseSub:
      "Cada alojamiento tiene su propio calendario, sus precios y su personalidad. El motor de reserva y el pago seguro son los mismos.",
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
      "Reserva directa en alojamientos de playa y montaña. Sin intermediarios, con confirmación inmediata.",
    accommodations: "Alojamientos",
    discover: "Descubre",
    legal: "Legal",
  },
};

const en: Dictionary = {
  nav: { guides: "Guides", seeAvailability: "Check availability", book: "Book" },
  home: {
    eyebrow: "Praetoria Vacacional",
    h1: "The snow of Javalambre and the sea of Valencia — book direct.",
    sub: "Real-time availability, the full price up front, and booking in three steps. No middleman fees, instant confirmation.",
    chooseHeading: "Choose your getaway",
    chooseSub:
      "Each place has its own calendar, prices and character. The booking engine and secure payment are shared.",
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
      "Book beach and mountain stays directly. No middlemen, instant confirmation.",
    accommodations: "Stays",
    discover: "Discover",
    legal: "Legal",
  },
};

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
