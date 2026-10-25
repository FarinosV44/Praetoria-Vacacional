/**
 * Encodes owner-supplied photo files into the responsive AVIF + WebP set the
 * site serves from /public (issue #100). Unlike fetch-property-photos.mjs this
 * never touches the network and never rewrites photo-manifest.json: it prints
 * the width list and aspect ratio so the manifest entry can be added by hand
 * with its alt text, category and `kind` (alojamiento / entorno).
 *
 * Run: node scripts/import-local-photos.mjs <slug> <base> <source-file> [maxWidth]
 * Requires: sharp (already a dependency via Next.js).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ALL_WIDTHS = [480, 768, 1200, 1600, 2000];
const [slug, base, file, maxArg] = process.argv.slice(2);
if (!slug || !base || !file) {
  console.error("usage: node scripts/import-local-photos.mjs <slug> <base> <source-file> [maxWidth]");
  process.exit(1);
}

const dir = join(process.cwd(), "public", "images", "properties", slug);
mkdirSync(dir, { recursive: true });

// .rotate() honours EXIF orientation; metadata is stripped by default.
const input = await sharp(file).rotate().toBuffer();
const meta = await sharp(input).metadata();
const max = Number(maxArg) || 2000;
const widths = ALL_WIDTHS.filter((w) => w <= max && w <= meta.width * 1.2);

for (const w of widths) {
  const pipe = sharp(input).resize({ width: w, withoutEnlargement: false });
  writeFileSync(join(dir, `${base}-${w}.webp`), await pipe.clone().webp({ quality: 80 }).toBuffer());
  writeFileSync(join(dir, `${base}-${w}.avif`), await pipe.clone().avif({ quality: 55 }).toBuffer());
}

console.log(
  JSON.stringify({ base, aspect: Number((meta.width / meta.height).toFixed(4)), widths }),
);
