/**
 * Rasterises scripts/icon-source.svg into the PWA icon set.
 *
 * The icons committed under public/icons are the build output of this script;
 * re-run it only when the artwork in icon-source.svg changes.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node scripts/generate-icons.mjs
 *
 * The artwork sets Tibetan text in Jomolhari and the wordmark in EB Garamond
 * (the same two faces the app itself loads). Both must be installed locally,
 * otherwise the renderer falls back to a face without Tibetan glyphs:
 *
 *   fonts.google.com/specimen/Jomolhari
 *   fonts.google.com/specimen/EB+Garamond
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(root, 'scripts/icon-source.svg'), 'utf8');

/**
 * inset — fraction of the canvas kept clear around the artwork. Android crops
 * maskable icons to a shape that can be as small as the inner 80% circle, so
 * those variants shrink the plaque into that safe zone over a full-bleed field.
 * bg — 'none' renders on transparency; iOS composites over black itself, but a
 * flat field avoids a grey halo in older launchers.
 */
const targets = [
  { file: 'public/icons/icon-192.png', size: 192, inset: 0, bg: 'none' },
  { file: 'public/icons/icon-512.png', size: 512, inset: 0, bg: 'none' },
  { file: 'public/icons/icon-maskable-192.png', size: 192, inset: 0.2, bg: '#0b0a09' },
  { file: 'public/icons/icon-maskable-512.png', size: 512, inset: 0.2, bg: '#0b0a09' },
  // Next's file conventions: the browser tab icon and the iOS home-screen icon.
  // iOS applies its own rounded mask and does not composite transparency, so
  // the Apple variant is rendered on a flat field.
  { file: 'src/app/icon.png', size: 512, inset: 0, bg: 'none' },
  { file: 'src/app/apple-icon.png', size: 180, inset: 0, bg: '#0b0a09' },
];

const browser = await chromium.launch();

for (const target of targets) {
  const page = await browser.newPage({
    viewport: { width: target.size, height: target.size },
    deviceScaleFactor: 1,
  });

  const pad = Math.round((target.size * target.inset) / 2);
  const inner = target.size - pad * 2;

  await page.setContent(
    `<!doctype html><meta charset="utf-8"><style>
       html,body{margin:0;width:${target.size}px;height:${target.size}px;overflow:hidden;
         background:${target.bg === 'none' ? 'transparent' : target.bg}}
       #art{position:absolute;left:${pad}px;top:${pad}px;width:${inner}px;height:${inner}px}
       svg{width:100%;height:100%;display:block}
     </style><div id="art">${svg}</div>`,
    { waitUntil: 'load' }
  );
  await page.evaluate(() => document.fonts.ready);

  const out = path.join(root, target.file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: out, omitBackground: target.bg === 'none' });
  await page.close();

  console.log(`${target.file} (${target.size}×${target.size})`);
}

await browser.close();
