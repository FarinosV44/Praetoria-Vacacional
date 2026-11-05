/**
 * Renders JSON-LD, one <script> per entity: some parsers do not look inside a
 * top-level array. Server component — safe, no hydration.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return [data].flat().map((entity, i) => (
    <script
      key={i}
      type="application/ld+json"
      // JSON.stringify output is safe inside a script tag once "<" is escaped.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(entity).replace(/</g, "\\u003c") }}
    />
  ));
}
