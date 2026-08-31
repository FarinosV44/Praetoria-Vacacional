import type { FaqItem } from "@/domains/properties/types";

export function FaqBlock({ items, heading = "Preguntas frecuentes" }: { items: FaqItem[]; heading?: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="faq-heading" className="container-page pt-14 pb-10 sm:pb-20">
      <h2 id="faq-heading" className="display-3">
        {heading}
      </h2>
      <div className="pv-faq mt-6">
        {items.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <span aria-hidden className="pv-faq__sign">
                +
              </span>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
