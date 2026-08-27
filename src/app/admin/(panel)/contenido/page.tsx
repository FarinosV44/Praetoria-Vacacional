import { getAllProperties, localizedProperty } from "@/domains/properties/registry";
import { getPropertyOverride } from "@/domains/properties/content";
import { guides as baseGuides } from "@/content/guides";
import { getGuideOverride } from "@/content/guides/overrides";
import { savePropertyOverrideAction, saveGuideOverrideAction } from "@/domains/admin/content-actions";
import { PropertyContentForm } from "@/components/admin/PropertyContentForm";
import { GuideOverrideForm } from "@/components/admin/GuideOverrideForm";

export const metadata = { title: "Contenido" };

export default async function AdminContentPage() {
  const properties = await Promise.all(
    getAllProperties().map(async (p) => ({
      base: localizedProperty(p, "es"),
      override: await getPropertyOverride(p.slug),
    })),
  );

  const guides = await Promise.all(
    baseGuides
      .filter((g) => !g.pillar)
      .map(async (g) => ({ base: g, override: await getGuideOverride(g.propertySlug, g.slug) })),
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-2xl">Contenido</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          Edita textos, SEO, ventajas, distancias y FAQ de cada alojamiento, y el título, extracto y
          estado (borrador / publicada) de cada guía — sin desplegar código. Deja un campo vacío para
          usar el valor original. Los cambios se reflejan en unos minutos (revalidación).
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="font-display text-xl">Alojamientos</h2>
        {properties.map(({ base, override }) => (
          <PropertyContentForm
            key={base.slug}
            slug={base.slug}
            name={base.name}
            base={{
              metaTitle: base.seo.metaTitle,
              metaDescription: base.seo.metaDescription,
              h1: base.seo.h1,
              tagline: base.tagline,
              shortIntro: base.shortIntro,
              highlights: base.highlights,
              nearby: base.nearby.map((n) => ({ name: n.name, distance: n.distance })),
              faq: base.faq,
            }}
            override={override}
            action={savePropertyOverrideAction}
          />
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-xl">Guías</h2>
        {guides.map(({ base, override }) => (
          <GuideOverrideForm
            key={`${base.propertySlug}/${base.slug}`}
            propertySlug={base.propertySlug}
            slug={base.slug}
            base={{
              title: base.title,
              description: base.description,
              lead: base.lead,
              published: base.published,
            }}
            override={override}
            action={saveGuideOverrideAction}
          />
        ))}
      </section>
    </div>
  );
}
