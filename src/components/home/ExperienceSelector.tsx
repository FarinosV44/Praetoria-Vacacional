import Link from "next/link";
import { Picture } from "@/components/media/Picture";
import {
  PHOTO_KIND_LABEL,
  photoCaption,
  type ResponsivePhoto,
} from "@/content/properties/photos";
import { localizedPath, type Locale } from "@/i18n/config";

export interface ExperienceOption {
  slug: string;
  experience: "ski" | "sea";
  name: string;
  area: string;
  photo: ResponsivePhoto | undefined;
}

const STR = {
  es: { sea: "Mar", ski: "Montaña", explore: "Explorar", label: "Elige tu escapada" },
  en: { sea: "Sea", ski: "Mountains", explore: "Explore", label: "Choose your getaway" },
} as const;

/**
 * MAR / MONTAÑA diptych (issues #86 §5 and #101, creative direction 2026).
 *
 * The two worlds share the first screen as equals: two full-height photographic
 * panels, each a single link to its property, with the exact property name, a
 * truthful place label and a caption saying what the photo shows. Server
 * rendered — no client state, nothing to hydrate. On phones the panels stack so
 * neither destination hides behind a carousel or a tab.
 */
export function ExperienceSelector({
  options,
  locale = "es",
}: {
  options: ExperienceOption[];
  locale?: Locale;
}) {
  const lang = locale === "en" ? "en" : "es";
  const t = STR[lang];

  return (
    <ul aria-label={t.label} className="grid md:h-full md:grid-cols-2">
      {options.map((o, i) => (
        <li key={o.slug} data-experience={o.experience} className="relative">
          <Link
            href={localizedPath(locale, `/${o.slug}`)}
            className="pv-zoom pv-scrim on-photo group relative flex h-[42svh] min-h-[300px] flex-col justify-end overflow-hidden bg-[var(--color-ink)] text-white md:h-full md:min-h-[560px]"
          >
            {o.photo && (
              <Picture
                photo={o.photo}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                imgClassName="h-full w-full object-cover"
              />
            )}
            <span className="relative z-10 block px-5 pb-5 md:px-[clamp(2rem,4.4vw,4rem)] md:pb-28">
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-white/85">
                {o.experience === "sea" ? t.sea : t.ski} · {o.area}
              </span>
              <span className="mt-2 block text-[clamp(1.4rem,1rem+1.3vw,2.1rem)] font-semibold leading-tight tracking-[-0.02em]">
                {o.name}
              </span>
              <span className="mt-3 inline-flex items-center gap-2 border-b border-white/80 pb-0.5 text-sm font-semibold">
                {t.explore} <span aria-hidden>→</span>
              </span>
              {o.photo?.caption && o.photo.kind && (
                <span className="photo-caption mt-4">
                  <span className="photo-tag">{PHOTO_KIND_LABEL[lang][o.photo.kind]}</span>
                  {photoCaption(o.photo, lang)}
                </span>
              )}
            </span>
            {i === 0 && (
              <span aria-hidden className="absolute inset-y-0 right-0 z-10 hidden w-px bg-white/20 md:block" />
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
