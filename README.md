# Vajra-Cutter Sutra Reader

A Next.js reader for the Vajracchedikā Prajñāpāramitā Sūtra in Sanskrit, Tibetan and English.
To get started, take a look at `src/app/page.tsx`.

## Installing the app

The reader is a progressive web app: it can be installed to a phone's home screen and read with
no connection at all.

- **Android / Chrome / Edge** — an **Install** button appears in the header once the browser
  offers installation, or use the browser's own "Install app" menu item.
- **iOS / Safari** — the same button explains the manual step: **Share → Add to Home Screen**.
  Safari does not expose a programmatic install.
- **Desktop** — the install control in the address bar works as well.

Installed copies launch standalone (no browser chrome) and show the gold-on-black sutra icon.

## Offline reading

`public/sw.js` is the service worker. The reader carries its whole text in the client bundle and
calls no API at runtime, so caching three things is enough to make it fully usable offline:

| What | Strategy |
| --- | --- |
| Navigations (the app shell) | Network first, falling back to the cached shell, then `public/offline.html` |
| `/_next/static/**`, `/icons/**` | Cache first (content-hashed or stable) |
| Google Fonts (EB Garamond, Inter, Jomolhari) | Pre-cached on install, then stale-while-revalidate |

The worker follows the Google Fonts stylesheet to the font files it names and stores them during
install, so a single online visit is enough for the Tibetan face to survive going offline.

The worker registers only in production builds; `next dev` unregisters any worker left behind so a
cached shell never shadows the code being edited. **After changing `public/sw.js`, bump `VERSION`
in it** — the cache names derive from it, and a bump discards the previous generation.

## Icons

`scripts/icon-source.svg` is the master artwork. The PNGs under `public/icons/`, plus
`src/app/icon.png` and `src/app/apple-icon.png`, are its build output — regenerate them rather
than editing them by hand:

```bash
npm i -D playwright && npx playwright install chromium
node scripts/generate-icons.mjs
```

The artwork sets Tibetan in [Jomolhari](https://fonts.google.com/specimen/Jomolhari) and the
wordmark in [EB Garamond](https://fonts.google.com/specimen/EB+Garamond); both must be installed
locally or the renderer falls back to a face with no Tibetan glyphs.

The `maskable` variants inset the plaque into the inner 80% of the canvas, because Android
reshapes maskable icons to its launcher's silhouette and crops everything outside that safe zone.

## Development

```bash
npm run dev        # dev server on :9002
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
```
