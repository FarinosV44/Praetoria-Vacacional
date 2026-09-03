"use client";

import { usePathname } from "next/navigation";
import { useStay } from "@/domains/booking/stay";
import { track } from "@/lib/analytics";
import type { Locale } from "@/i18n/config";

/**
 * WhatsApp concierge entry point (issue #97 — assisted close). A floating
 * button that opens WhatsApp with a context-aware prefilled message so the
 * guest can resolve a doubt without leaving the funnel. Renders only when
 * NEXT_PUBLIC_WHATSAPP_NUMBER is set; hidden on admin.
 */
const NAMES: Record<string, string> = {
  javalambre: "Javalambre Mountain SuperSki",
  valencia: "Valencia Frente al Mar",
};

export function WhatsAppButton({ number, locale }: { number?: string; locale: Locale }) {
  const pathname = usePathname() ?? "/";
  const [stay] = useStay();

  if (!number || pathname.startsWith("/admin")) return null;

  const es = locale !== "en";
  const label = es ? "Escríbenos por WhatsApp" : "Message us on WhatsApp";

  // A short, honest opening line with whatever context we have.
  const prop = stay.property && NAMES[stay.property];
  const dates =
    stay.checkIn && stay.checkOut ? ` (${stay.checkIn} → ${stay.checkOut})` : "";
  const msg = es
    ? `Hola, tengo una duda sobre ${prop ?? "vuestros apartamentos"}${dates}.`
    : `Hi, I have a question about ${prop ?? "your apartments"}${dates}.`;

  const href = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      onClick={() => track("contact_click", { channel: "whatsapp", path: pathname })}
      className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-lg)] transition-transform duration-[var(--dur-mid)] hover:scale-110 motion-reduce:hover:scale-100 sm:bottom-6"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden>
        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.317zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" />
      </svg>
    </a>
  );
}
