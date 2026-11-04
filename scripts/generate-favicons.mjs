/**
 * Regenerates every raster icon from the master public/favicon.svg:
 *   favicon.ico (16, 32, 48), apple-touch-icon.png, icon-192.png, icon-512.png
 *   and icon-maskable-512.png.
 *
 * The master holds three drawings and picks one by painted size with media
 * queries: `.l` is the full symbol, `.m` is redrawn on the 32-pixel grid and `.s`
 * on the 16-pixel grid, keeping only peak, horizon and sea.
 *
 * Run by hand after editing the master: `node scripts/generate-favicons.mjs`.
 * `sharp` comes with Next; the generated files are committed, so the build
 * never runs this.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import sharp from "sharp";

const pub = resolve(import.meta.dirname, "../public");
const master = readFileSync(resolve(pub, "favicon.svg"), "utf8");

/** The master with one drawing fixed, as the rasteriser has no painted size to query. */
const only = (drawing) => {
  const hidden = ["l", "m", "s"].filter((d) => d !== drawing).map((d) => `.${d}`).join(",");
  return master.replace(/<style>.*<\/style>/, `<style>${hidden}{display:none}</style>`);
};
/** No rounded corners: for platforms that apply their own mask. */
const square = (svg) => svg.replace(' rx="14"', "");
/** A finer line for the sizes where the 3-unit tab stroke would look heavy. */
const fine = (svg) => svg.replace('stroke-width="3"', 'stroke-width="2.5"');
/** Android crops maskable icons to its safe zone: shrink the symbol to fit it. */
const maskable = fine(square(only("l"))).replace(
  '<g class="l"',
  '<g class="l" transform="translate(32 32) scale(.78) translate(-32 -32)"',
);

const png = (svg, size) =>
  sharp(Buffer.from(svg), { density: 72 * Math.max(1, Math.ceil(size / 16)) })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();

/** ICO container with PNG payloads (supported by every browser in use). */
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const write = (name, data) => {
  writeFileSync(resolve(pub, name), data);
  console.log(`${name}: ${data.length} bytes`);
};

write(
  "favicon.ico",
  ico([
    { size: 16, data: await png(only("s"), 16) },
    { size: 32, data: await png(only("m"), 32) },
    { size: 48, data: await png(only("l"), 48) },
  ]),
);
// iOS fills transparency with black and rounds the corners itself.
write("apple-touch-icon.png", await png(fine(square(only("l"))), 180));
write("icon-192.png", await png(fine(only("l")), 192));
write("icon-512.png", await png(fine(only("l")), 512));
write("icon-maskable-512.png", await png(maskable, 512));
