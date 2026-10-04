/**
 * Vajra-Cutter Sutra Reader — offline service worker.
 *
 * The reader carries its whole text (Sanskrit, Tibetan, English, glossary) in
 * the single HTML file and talks to no API at runtime, so caching the shell,
 * icons and the three Google fonts is enough to make it fully usable with
 * no network at all.
 *
 * Bump VERSION whenever this file changes: the cache names derive from it, so
 * a bump discards the previous generation on activate.
 */

const VERSION = 'v3';
// Scope both URLs and cache names: Pages and /public/ must not erase each other.
const BASE = self.registration.scope;
const BASE_PATH = new URL(BASE).pathname;
const CACHE_PREFIX = `vcs-${encodeURIComponent(BASE_PATH)}-`;
const SHELL_CACHE = `${CACHE_PREFIX}shell-${VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}assets-${VERSION}`;
const FONT_CACHE = `${CACHE_PREFIX}fonts-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE, FONT_CACHE];

const scoped = (file) => new URL(file, BASE).href;
const SHELL_URLS = [scoped('./'), scoped('offline.html')];
const ASSET_URLS = ['manifest.webmanifest', 'apple-icon.png',
  'icons/icon-192.png', 'icons/icon-512.png',
  'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png'].map(scoped);

/** Kept in sync with the stylesheet link in src/app/layout.tsx. */
const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Jomolhari&display=swap';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/**
 * The font stylesheet is requested while the document parses, before this
 * worker controls the page, so the first visit would otherwise leave the
 * Tibetan face uncached. Fetch the stylesheet here and follow it to the font
 * files it names, so one online visit is enough to read offline afterwards.
 */
async function precacheFonts() {
  try {
    const cache = await caches.open(FONT_CACHE);
    const stylesheet = await fetch(FONT_STYLESHEET, { credentials: 'omit' });
    if (!stylesheet.ok) return;

    const css = await stylesheet.clone().text();
    await cache.put(FONT_STYLESHEET, stylesheet);

    const files = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(
      (match) => match[1]
    );
    await Promise.allSettled(
      files.map(async (url) => {
        const response = await fetch(url, { credentials: 'omit' });
        if (response.ok) await cache.put(url, response);
      })
    );
  } catch {
    // No network while installing; the runtime handler picks the fonts up later.
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      // `cache: 'reload'` keeps a stale HTTP-cache entry out of the shell.
      await shell.addAll(SHELL_URLS.map((url) => new Request(url, { cache: 'reload' })));
      const assets = await caches.open(ASSET_CACHE);
      await assets.addAll(ASSET_URLS.map((url) => new Request(url, { cache: 'reload' })));
      // /index.html is an alias of the shell, including on the Pages subpath.
      await shell.put(scoped('index.html'), (await shell.match(scoped('./'))).clone());
      await precacheFonts();
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => (name.startsWith(CACHE_PREFIX) ||
            (BASE_PATH === '/' && /^vcs-(shell|assets|fonts)-v[12]$/.test(name))) && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request, { ignoreVary: true });
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

function staleWhileRevalidate(event, request, cacheName) {
  return caches.open(cacheName).then(async (cache) => {
    const cached = await cache.match(request, { ignoreVary: true });
    const fromNetwork = fetch(request)
      .then(async (response) => {
        if (response.ok || response.type === 'opaque') {
          await cache.put(request, response.clone());
        }
        return response;
      })
      .catch(() => undefined);

    if (cached) {
      // Let the refresh finish even though the cached copy is returned now.
      event.waitUntil(fromNetwork);
      return cached;
    }
    return (await fromNetwork) ?? new Response('', { status: 504, statusText: 'Offline' });
  });
}

/**
 * Navigations go to the network first so a deploy is picked up immediately,
 * and fall back to the cached shell — then the offline page — when it fails.
 */
async function navigate(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    const pathname = new URL(request.url).pathname;
    if (response.ok && (pathname === BASE_PATH || pathname === `${BASE_PATH}index.html`)) {
      await cache.put(scoped('./'), response.clone());
      await cache.put(scoped('index.html'), response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(scoped('./'), { ignoreSearch: true })) ??
      (await cache.match(scoped('index.html'), { ignoreSearch: true })) ??
      (await cache.match(scoped('offline.html'))) ??
      new Response('', { status: 504, statusText: 'Offline' })
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event, request, FONT_CACHE));
    return;
  }

  // Anything else cross-origin is left to the browser.
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE_PATH)) return;
  const relativePath = url.pathname.slice(BASE_PATH.length);

  // Server data must never be answered from a stale cache.
  if (relativePath.startsWith('api/') || url.searchParams.has('_rsc')) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigate(request));
    return;
  }

  // Build output and icons are content-hashed or stable, so cache wins.
  if (relativePath.startsWith('_next/static/') || relativePath.startsWith('icons/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(event, request, ASSET_CACHE));
});
