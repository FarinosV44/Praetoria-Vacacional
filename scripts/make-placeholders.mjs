/**
 * Generates the placeholder SVGs referenced by property content (D-004).
 * Run: node scripts/make-placeholders.mjs
 * These are clearly-marked placeholders — replace with real authorised photos.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function svg({ w = 1600, h = 1067, from, to, label }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <text x="50%" y="49%" text-anchor="middle" font-family="Georgia, serif" font-size="46" fill="rgba(255,255,255,0.92)">${label}</text>
  <text x="50%" y="55%" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="rgba(255,255,255,0.7)">Imagen pendiente de confirmación del propietario</text>
</svg>`;
}

const files = [
  ["images/placeholders/javalambre-hero.svg", "#3b5ba9", "#8fb2e6", "Javalambre · Nieve"],
  ["images/placeholders/javalambre-2.svg", "#2f4d92", "#7aa0d8", "Sierra de Javalambre"],
  ["images/placeholders/javalambre-3.svg", "#24407f", "#6f97d0", "Montaña de Javalambre"],
  ["images/placeholders/valencia-hero.svg", "#0f7ea8", "#f2c879", "Valencia · Playa"],
  ["images/placeholders/valencia-2.svg", "#0e88ad", "#f4d190", "Playa de Valencia"],
  ["images/placeholders/valencia-3.svg", "#127f9c", "#f7dca8", "Mediterráneo en Valencia"],
  ["images/og/default.svg", "#1f3a6b", "#0f7ea8", "Praetoria Vacacional"],
  ["images/og/javalambre.svg", "#2f4d92", "#8fb2e6", "Alojamiento en Javalambre"],
  ["images/og/valencia.svg", "#0f7ea8", "#f2c879", "Apartamento frente al mar en Valencia"],
];

for (const [rel, from, to, label] of files) {
  const w = rel.includes("/og/") ? 1200 : 1600;
  const h = rel.includes("/og/") ? 630 : 1067;
  writeFileSync(join(root, "public", rel), svg({ w, h, from, to, label }));
  console.log("wrote", rel);
}
