/**
 * Cuts the PWA icon set from scripts/icon-source.webp.
 *
 * The icons under public/icons, plus src/app/icon.png and src/app/apple-icon.png,
 * are this script's output — regenerate them rather than editing them by hand.
 * To change the artwork, replace icon-source.webp and re-run:
 *
 *   npm i -D sharp
 *   node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'scripts/icon-source.webp');

/** The plaque's own near-black, so a padded field reads as part of the artwork. */
const FIELD = { r: 0x12, g: 0x12, b: 0x14, alpha: 1 };

/**
 * The artwork sits on transparency and is a little taller than it is wide, so
 * trim it to its own bounds and letterbox it back to a square before resizing.
 */
async function square() {
  const trimmed = await sharp(source).trim().toBuffer({ resolveWithObject: true });
  const side = Math.max(trimmed.info.width, trimmed.info.height);
  return sharp(trimmed.data)
    .resize(side, side, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
}

const master = await square();

const targets = [
  // Chrome reads these two straight from the manifest; the rounded plaque and
  // its transparent corners are shown as drawn.
  { file: 'public/icons/icon-192.png', size: 192 },
  { file: 'public/icons/icon-512.png', size: 512 },

  // Android reshapes maskable icons to its launcher's silhouette and crops
  // everything outside the inner 80%, so the plaque is inset into that safe
  // zone over a full-bleed field rather than having its gold frame shaved off.
  { file: 'public/icons/icon-maskable-192.png', size: 192, inset: 0.2, field: FIELD },
  { file: 'public/icons/icon-maskable-512.png', size: 512, inset: 0.2, field: FIELD },

  // Next's file conventions: the browser tab, and the iOS home screen. iOS
  // ignores transparency and applies its own rounded mask, which lands close
  // to the plaque's own corners, so that one is flattened onto the field.
  { file: 'src/app/icon.png', size: 512 },
  { file: 'src/app/apple-icon.png', size: 180, field: FIELD },
];

for (const target of targets) {
  const inset = target.inset ?? 0;
  const art = Math.round(target.size * (1 - inset));
  const pad = Math.round((target.size - art) / 2);

  const resized = await sharp(master)
    .resize(art, art, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const out = path.join(root, target.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });

  await sharp({
    create: {
      width: target.size,
      height: target.size,
      channels: 4,
      background: target.field ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, top: pad, left: pad }])
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(`${target.file} (${target.size}×${target.size})`);
}
