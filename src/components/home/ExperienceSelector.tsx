"use client";

import { useState } from "react";
import Link from "next/link";
import { Picture } from "@/components/media/Picture";
import { RatingBadge } from "@/components/property/RatingBadge";
import type { ResponsivePhoto } from "@/content/properties/photos";
import { localizedPath, type Locale } from "@/i18n/config";

export interface ExperienceOption {
  slug: string;
  experience: "ski" | "sea";
  name: string;
  area: string;
  region: string;
  intro: string;
  photo: ResponsivePhoto | undefined;
  rating: { value: number; count: number; source: "booking" } | null;
  headline: { label: string; value: string };
}

const STR = {
  es: { sea: "Mar", ski: "Nieve", discover: (n: string) => `Ver ${n}`, chooseYour: "Elige tu escapada" },
  en: { sea: "Sea", ski: "Snow", discover: (n: string) => `View ${n}`, chooseYour: "Choose your getaway" },
} as const;

/**
 * MAR / NIEVE visual selector (issue #86 §5). Two large editorial panels, one
 * tap to switch, real photos and rating. Premium, not themed-cartoonish.
 */
export function ExperienceSelector({
  options,
  locale = "es",
}: {
  options: ExperienceOption[];
  locale?: Locale;
}) {
  const t = STR[locale === "en" ? "en" : "es"];
  const [active, setActive] = useState<"sea" | "ski">(options[0]?.experience ?? "sea");
  const current = options.find((o) => o.experience === active) ?? options[0];
  if (!current) return null;

  return (
    <section aria-label={t.chooseYour} className="container-page section-y-tight">
      <div className="mx-auto flex w-fit rounded-full bg-[var(--color-mist)] p-1 text-sm shadow-[inset_0_0_0_1px_var(--color-line)]">
        {options.map((o) => (
          <button
            key={o.slug}
            type="button"
            data-experience={o.experience}
            aria-pressed={active === o.experience}
            onClick={() => setActive(o.experience)}
            className={`rounded-full px-6 py-2 font-medium transition-all ${
              active === o.experience
                ? "bg-[var(--accent-600)] text-white shadow-[var(--shadow-sm)]"
                : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            <span aria-hidden className="mr-1.5">
              {o.experience === "ski" ? "❄" : "☀"}
            </span>
            {o.experience === "ski" ? t.ski : t.sea}
          </button>
        ))}
      </div>

      <div
        key={current.slug}
        data-experience={current.experience}
        className="pv-card pv-card--soft reveal mt-6 grid items-stretch gap-0 overflow-hidden !p-0 md:grid-cols-2"
      >
        <div className="relative min-h-[260px] md:min-h-[400px]">
          {current.photo && (
            <Picture
              photo={current.photo}
              sizes="(max-width: 768px) 100vw, 50vw"
              imgClassName="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="eyebrow">
            {current.area} · {current.region}
          </p>
          <h2 className="mt-2 display-3">{current.name}</h2>
          <div className="mt-2">
            <RatingBadge rating={current.rating} locale={locale} size="xs" />
          </div>
          <p className="lede mt-3">{current.intro}</p>
          <p className="mt-3 text-sm font-medium">
            {current.headline.label} · {current.headline.value}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={localizedPath(locale, `/${current.slug}`)}
              className="pv-btn pv-btn--primary"
            >
              {t.discover(current.name)}
            </Link>
            <a href="#buscador" className="pv-btn pv-btn--secondary">
              {locale === "en" ? "Check dates" : "Comprobar fechas"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
