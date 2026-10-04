# Vajra-Cutter Sutra Reader

A single-file reader for the Vajracchedikā Prajñāpāramitā Sūtra in Sanskrit, Tibetan and English,
published at https://donandrutto.github.io/vajra-cutter-sutra/.

`public/index.html` contains the entire reader: the existing UI, styles, all five text variants,
index, glossary, themes, text size, scrolling, pagination, fullscreen, and install control. Open it
directly to read. No Next.js build, Node.js, server, or external JavaScript is needed to run it.
The original Next.js source stays in the repository so both readers use the same components.

## GitHub Pages

The publishing source is **Deploy from a branch → main → /(root)**. The empty root `.nojekyll`
disables Jekyll. Pages serves root `index.html`, an identical copy of `public/index.html`, with
byte-for-byte copies of the existing icon artwork, manifest, offline page, and worker beside it.
All asset and install paths are relative, so `/vajra-cutter-sutra/` and `/public/index.html` work.

When changing the reader source, run `npm run build:static` and commit the regenerated files
together. This is a maintainer tool; Pages serves the checked-in files without running it.

The page icon between **+** and **Fullscreen** switches between scrolling and page turning. Pages turn instantly, keep whole lines, and reflow in portrait or landscape while preserving the passage during text-size and fullscreen changes. Use the page arrows, left/right edge taps, arrow keys, Page Up/Down, or Space / Shift+Space. The mode is saved locally. The up arrow always returns to the beginning of the sutra.

The shared header and bottom controls use Ewam's visual style and exact reader icons. All bottom controls are expanded by default; fullscreen leaves only its expand/contract control, with edge taps and keyboard turns still available. Sanskrit, Tibetan, phonetic variants, English, the index, glossary filter, and offline installation remain available. Automatic and tilt scrolling are disabled in page mode.

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

`public/sw.js` (copied to root `sw.js`) is the service worker. The reader carries its whole text in the HTML and
calls no API at runtime, so caching three things is enough to make it fully usable offline:

| What | Strategy |
| --- | --- |
| Navigations (the app shell) | Network first, falling back to the cached shell, then `public/offline.html` |
| Icons | Pre-cached on install, then cache first |
| Manifest and Apple icon | Pre-cached on install, then stale-while-revalidate |
| Next.js assets when using the retained Next.js app | Cache first |
| Google Fonts (EB Garamond, Inter, Jomolhari) | Pre-cached on install, then stale-while-revalidate |

The worker follows the Google Fonts stylesheet to the font files it names and stores them during
install, so a single online visit is enough for the Tibetan face to survive going offline.

The static HTML registers its worker when served over HTTPS or localhost; opening the file
directly still runs the reader. URLs and cache names derive from the worker's scope, so Pages
works under its project subpath and each installation retains its own cache. If the shell is
missing, `offline.html` provides the fallback and a retry button within that scope.

The retained Next.js app registers only in production; `next dev` unregisters its worker.
**After changing `public/sw.js`, bump `VERSION` in it and run `npm run build:static`** — a bump
discards the previous cache generation within that scope.

## Icons

`scripts/icon-source.webp` is the master artwork. The PNGs under `public/icons/`, plus
`src/app/icon.png` and `src/app/apple-icon.png`, are cut from it — regenerate them rather than
editing them by hand, and replace the source file to change the artwork:

```bash
npm i -D sharp
node scripts/generate-icons.mjs
```

The script trims the artwork to its own bounds and letterboxes it back to a square, so a source
that is not perfectly square still yields square icons.

The `maskable` variants inset the plaque into the inner 80% of the canvas over a field matching
the plaque's black, because Android reshapes maskable icons to its launcher's silhouette and
crops everything outside that safe zone. `apple-icon.png` is flattened onto the same field, since
iOS ignores transparency and applies its own rounded mask.

## Development

```bash
npm run dev        # dev server on :9002
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run build:static # regenerate the checked-in single-file reader and Pages copies
npm run test:static  # serve and verify the static reader at the Pages subpath
```

For browser regression checks, run `npx playwright install chromium`, start the reader, then run `npm run test:reader`. The suite checks every section in all five text variants across portrait, landscape, narrow screens, and maximum text size, along with navigation, reflow, fullscreen, index, glossary, automatic scrolling, and saved mode. Screenshots go to `test-results/`.

Set `READER_URL` to another preview URL or `READER_BROWSER_PATH` to an installed Chrome executable. Set `EWAM_REFERENCE_HTML` to Ewam's revised `index.html` to compare shared icons and rendered styles; a sibling Ewam checkout is detected automatically. To check offline reading as well, build and serve the production app, then run the suite with `READER_OFFLINE=1`.

`npm run test:static` needs no running server or Next.js build. It checks exact text preservation
for all 33 sections in every variant, direct file opening, both static entry points, manifest
installability, unchanged icon bytes, all precached font files, a refresh with the HTTP cache
disabled and network cut, both saved modes, iOS install help, and the `offline.html` fallback.
It then runs the existing reader suite for pagination, Ewam control styles and icon geometry,
fullscreen, glossary, index, keyboard/edge taps, scrolling, and all responsive layouts.
