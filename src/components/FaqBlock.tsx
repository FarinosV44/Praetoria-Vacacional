import type { FaqItem } from "@/domains/properties/types";

export function FaqBlock({ items, heading = "Preguntas frecuentes" }: { items: FaqItem[]; heading?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading" className="container-page pt-14 pb-10 sm:pb-20">
      <h2 id="faq-heading" className="font-display text-2xl sm:text-3xl">
        {heading}
      </h2>
      <div className="mt-6 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
        {items.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {item.question}
              <span className="text-[var(--accent-600)] transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-[var(--color-ink-soft)]">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
