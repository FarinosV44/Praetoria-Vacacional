"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Pages that exist in both locales (issue #29). Others fall back to the home. */
const BILINGUAL = [/^\/$/, /^\/javalambre$/, /^\/valencia$/];

export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const neutral = isEn ? pathname.replace(/^\/en/, "") || "/" : pathname;

  const hasCounterpart = BILINGUAL.some((re) => re.test(neutral));

  const target = isEn
    ? hasCounterpart
      ? neutral
      : "/"
    : hasCounterpart
      ? `/en${neutral === "/" ? "" : neutral}`
      : "/en";

  const otherLabel = isEn ? "ES" : "EN";
  const otherName = isEn ? "Español" : "English";

  return (
    <Link
      href={target}
      hrefLang={isEn ? "es" : "en"}
      aria-label={`Ver en ${otherName}`}
      className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink-soft)] ring-1 ring-[var(--color-line)] hover:text-[var(--accent-700)]"
    >
      {otherLabel}
    </Link>
  );
}
