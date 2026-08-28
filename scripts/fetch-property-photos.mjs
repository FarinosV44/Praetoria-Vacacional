/**
 * Downloads the owner-authorised property photos from their Booking listings
 * (issue #35) and re-encodes them locally to AVIF + WebP at responsive widths.
 *
 * The signed CDN URLs below were captured from the two Booking listings the
 * owner provided as reference. Booking is a REFERENCE source only — after this
 * runs, the site serves images from /public and never depends on Booking at
 * runtime. Signatures are size-agnostic and not session-bound; if Booking
 * rotates them, re-capture from the listings.
 *
 * Run: node scripts/fetch-property-photos.mjs
 * Requires: sharp (already a dependency via Next.js).
 */
import { mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const WIDTHS = [480, 768, 1200, 1600];
const url = (id, k) =>
  `https://cf.bstatic.com/xdata/images/hotel/max1920/${id}.jpg?k=${k}&o=`;

/**
 * slug -> ordered [{ base, id, k, alt }]. `base` is the filename stem and the
 * gallery order. `alt` is Spanish descriptive text (kept natural, not stuffed).
 */
const PHOTOS = {
  javalambre: [
    ["salon-comedor", "494824659", "82c9b0498441598c070943ac5a79371743d71910af0eb71d5adc37acc3710200", "Salón-comedor del apartamento con mesa de madera y sofá, con vistas al valle de Camarena de la Sierra"],
    ["salon-chimenea", "600199569", "aa6a59df6bcc033df7b10a92c5db59556fffe75d3bd9bed46e87a05a15dbdbac", "Zona de estar del apartamento con sofá y chimenea de pellets"],
    ["salon-2", "464284736", "5cbceee31b9c16a55586797408db37ea7acbd6576a16fc6d62bd3bb5d4cccb20", "Salón del apartamento de Javalambre con acceso al balcón"],
    ["cocina-1", "464284738", "5d1d7dd4183cacab3c217e7ca9353071911d71268de0de36d7a4edaa33bd85d0", "Cocina equipada del apartamento con frigorífico y zona de fregadero"],
    ["cocina-2", "464284742", "14cf6630ef882875744744b267e43d62702389af334a6ee2e15581035b27acbf", "Cocina del apartamento de Javalambre totalmente equipada"],
    ["dormitorio-1", "464284729", "335de5f3cf56329edac1e692a33f447a6bdc34c8687f61f3f380f6bff4b72f56", "Dormitorio del apartamento con cama doble grande y ventana con vistas a la montaña"],
    ["bano", "464284737", "5dd081d09638b167064c479935b1b8aa8d3c18176b46bfd66dadb8b2caf5ee2a", "Baño completo del apartamento con ducha y bidé"],
    ["edificio", "464284750", "f7d90a77e5fd121c2862f0389a5cd8495279b284dfb1fa25243228ad2f228487", "Edificio en el que se encuentra el apartamento, en el pueblo de Camarena de la Sierra"],
    ["vistas-montana", "462061041", "4fa7c0e186536ae4521f69293b32cd492c4e0d51f6e4b1bb03b6d097fcbd023f", "Vistas a las cumbres de la sierra de Javalambre desde el apartamento"],
    ["invierno", "462061032", "68737b780d3f5b98a3c4e96b136558b309c30515cc30c3f3767974f65e972563", "El entorno de Camarena de la Sierra y Javalambre cubierto de nieve en invierno"],
    ["pistas-esqui", "463880469", "8563d82d860a3fb8da2924c52400fedfc486c7cff25a795b5e1aebb2296d5d43", "Snowboard en las pistas de la estación de esquí de Javalambre, a unos 10 minutos en coche"],
  ],
  valencia: [
    ["salon-vista-mar", "590920576", "f2ffafc8706e0614038102c3941a1c49057d21e7221d0d83f58e6038e23b42c1", "Salón del apartamento con vistas frontales al mar Mediterráneo, en la playa de la Llastra"],
    ["salon-vistas-1", "590878011", "024d369361a3c653288c0b668d5ef102ac822116685f8eb5fab0dc793fc64378", "Zona de estar del apartamento a pie de la playa de la Llastra"],
    ["salon-comedor", "590920653", "1d95f5a4364f086368d763d00d1e78199f440c266b98748005c5e660eeaf3707", "Salón-comedor del apartamento con mesa, sillas y sofá"],
    ["cocina", "590878058", "4155a5fa63cab0ba43c4e97c2ad4da35f37e47607c9f0588e161f3c06b4957b9", "Cocina totalmente equipada del apartamento de Valencia frente al mar"],
    ["dormitorio-1", "590878048", "4b67faf8924b5ebf477ad2da972a13a6865525a80e3f10b1d735c07de3834559", "Dormitorio del apartamento con armario azul"],
    ["bano", "590878043", "356ccb4ed6045b238b68c6b7acf98fa7408289b0a0d272eb056d888f346b7952", "Baño del apartamento con lavabo, inodoro y espejo"],
    ["paseo-maritimo", "590920455", "bf7c0a0c8b9fdf722d8298c75c41e92bf15690098c9a63642bc3101b2e72e896", "Paseo marítimo junto a la playa de la Llastra, al lado del apartamento"],
    ["vista-mar", "590920753", "d6d8267771ac52e234d046c549217987cadd3b838fde612090dbd530ce4adbf6", "Vista al mar Mediterráneo desde el apartamento"],
    ["atardecer-playa", "590924109", "293c1d1a485a610415aae2cf939b7df1c39283bbda700628fd444424bf37376e", "Atardecer en la playa de la Llastra, junto al apartamento"],
    ["entorno", "590924218", "2163aa5a8bcf1f71a1207b8bb6b6a3da06adea1c84d8c5a4fad04c073233e8bf", "Entorno de playa y dunas cerca del apartamento, en el litoral sur de Valencia"],
  ],
};

async function download(u) {
  const res = await fetch(u, { headers: { "user-agent": "Mozilla/5.0 PraetoriaVacacional/1.0" } });
  if (!res.ok) throw new Error(`${u} → HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function run() {
  const manifest = {};
  for (const [slug, list] of Object.entries(PHOTOS)) {
    const dir = join(ROOT, "public", "images", "properties", slug);
    mkdirSync(dir, { recursive: true });
    manifest[slug] = [];

    for (let i = 0; i < list.length; i++) {
      const [base, id, k, alt] = list[i];
      const marker = join(dir, `${base}-1600.webp`);
      let input = null;
      if (!existsSync(marker) || process.env.FORCE) {
        console.log(`fetch ${slug}/${base}  (${id})`);
        input = await download(url(id, k));
      } else {
        console.log(`skip  ${slug}/${base} (exists)`);
      }

      let meta;
      if (input) {
        meta = await sharp(input).metadata();
        for (const w of WIDTHS) {
          if (w > meta.width * 1.2) continue; // don't upscale much
          const pipe = sharp(input).resize({ width: w, withoutEnlargement: true });
          writeFileSync(join(dir, `${base}-${w}.webp`), await pipe.clone().webp({ quality: 82 }).toBuffer());
          writeFileSync(join(dir, `${base}-${w}.avif`), await pipe.clone().avif({ quality: 58 }).toBuffer());
        }
      }

      const aspect = meta ? Number((meta.width / meta.height).toFixed(4)) : 1.3333;
      manifest[slug].push({
        base,
        sourceId: id,
        order: i,
        alt,
        aspect,
        widths: WIDTHS.filter((w) => !meta || w <= meta.width * 1.2),
      });
    }
  }

  writeFileSync(
    join(ROOT, "src", "content", "properties", "photo-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log("\nwrote src/content/properties/photo-manifest.json");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
