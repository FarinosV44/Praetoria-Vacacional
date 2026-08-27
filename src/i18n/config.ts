/**
 * i18n (issue #29). Spanish is the principal language, served at the root with
 * no prefix. English priority pages live under `/en`. Adding a locale = adding
 * a dictionary entry + a thin route folder; no component or data change.
 */
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

export const localeMeta: Record<Locale, { label: string; htmlLang: string; ogLocale: string }> = {
  es: { label: "Español", htmlLang: "es-ES", ogLocale: "es_ES" },
  en: { label: "English", htmlLang: "en-GB", ogLocale: "en_GB" },
};

/** Prefix for a locale: "" for the default, "/en" otherwise. */
export function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/** Build a path in a given locale from a locale-neutral path ("/javalambre"). */
export function localizedPath(locale: Locale, neutralPath: string): string {
  const clean = neutralPath.startsWith("/") ? neutralPath : `/${neutralPath}`;
  return `${localePrefix(locale)}${clean}` || "/";
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
