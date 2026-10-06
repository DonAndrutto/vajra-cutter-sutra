const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { buildSync } = require('esbuild');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const prefix = '/vajra-cutter-sutra/';
const output = path.join(root, 'test-results');
const variants = ['english', 'tibetan', 'tibetan-translit', 'sanskrit-devanagari', 'sanskrit-translit'];
const workerVersion = fs.readFileSync(path.join(root,'public/sw.js'),'utf8').match(/const VERSION = '([^']+)'/)[1];
const source = new Module(path.join(root, 'sutra-source.cjs'));
source._compile(buildSync({ entryPoints: [path.join(root, 'src/data/sutra-data.ts')],
  bundle: true, platform: 'node', format: 'cjs', write: false }).outputFiles[0].text, source.id);
const expected = source.exports.sutraData;

async function selectLanguage(page, variant) {
  const language = variant.startsWith('sanskrit') ? 'Sanskrit' : variant.startsWith('tibetan') ? 'Tibetan' : 'English';
  await page.getByRole('button', { name: language, exact: true }).click();
  const script = { tibetan: 'Tibetan script', 'tibetan-translit': 'Tibetan phonetics',
    'sanskrit-devanagari': 'Devanagari script', 'sanskrit-translit': 'Sanskrit phonetics' }[variant];
  if (script) await page.getByRole('button', { name: script, exact: true }).click();
  await page.waitForFunction(value => document.getElementById('contentArea').dataset.language === value, variant);
}

async function checkText(page) {
  for (const variant of variants) {
    await selectLanguage(page, variant);
    const rendered = await page.locator('.section-block').evaluateAll(sections => sections.map(section => ({
      section: Number(section.dataset.section),
      paragraphs: Array.from(section.querySelectorAll('.sutra-title-text,.sutra-paragraph'), p => p.textContent),
    })));
    assert.deepEqual(rendered, expected.map(section => ({ section: section.section, paragraphs: section.content[variant] })),
      `Every original paragraph in ${variant}`);
    assert.equal(rendered.length, 33);
    assert.ok(rendered.every(section => section.paragraphs.length));
  }
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  for (const name of ['index.html', 'sw.js', 'offline.html', 'manifest.webmanifest', 'apple-icon.png']) {
    assert.deepEqual(fs.readFileSync(path.join(root, name)), fs.readFileSync(path.join(root, 'public', name)), `Pages copy: ${name}`);
  }
  assert.equal(fs.statSync(path.join(root, '.nojekyll')).size, 0);
  for (const name of fs.readdirSync(path.join(root, 'public/icons'))) {
    assert.deepEqual(fs.readFileSync(path.join(root, 'icons', name)), fs.readFileSync(path.join(root, 'public/icons', name)));
  }
  const server = require('./serve-static.cjs').createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}${prefix}`;
  const browser = await chromium.launch(process.env.READER_BROWSER_PATH ? { executablePath: process.env.READER_BROWSER_PATH } : {});
  const errors = [];
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const nextRequests = [];
    page.on('request', request => { if (/\/_next\/|\/api\//.test(request.url())) nextRequests.push(request.url()); });
    await page.goto(url);
    await page.locator('#btnPage').waitFor();
    await checkText(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    assert.equal(await page.evaluate(() => navigator.serviceWorker.controller.scriptURL), url + 'sw.js');
    const session = await context.newCDPSession(page);
    const { data: manifestData, errors: manifestErrors } = await session.send('Page.getAppManifest');
    assert.deepEqual(manifestErrors, []);
    const manifest = JSON.parse(manifestData);
    for (const field of ['id', 'start_url', 'scope']) assert.equal(new URL(manifest[field], url + 'manifest.webmanifest').href, url);
    assert.equal(manifest.icons.length, 4);
    for (const icon of manifest.icons) {
      const response = await page.request.get(new URL(icon.src, url).href);
      assert.ok(response.ok());
      assert.deepEqual(await response.body(), fs.readFileSync(path.join(root, 'public', icon.src)));
    }
    // Playwright's isolated context is incognito; that browser policy is expected.
    assert.deepEqual((await session.send('Page.getInstallabilityErrors')).installabilityErrors.filter(error => error.errorId !== 'in-incognito'), []);
    // Exercise the prompt control without actually installing on this computer.
    await page.evaluate(() => {
      window.installCalls = 0;
      window.__vcsInstallPrompt = { prompt: async () => { window.installCalls++; }, userChoice: Promise.resolve({ outcome: 'dismissed' }) };
      window.dispatchEvent(new Event('vcs:installprompt'));
    });
    await page.getByRole('button', { name: 'Install app', exact: true }).click();
    assert.equal(await page.evaluate(() => window.installCalls), 1);
    await page.getByRole('button', { name: 'English', exact: true }).click();
    await page.locator('#btnPage').click();
    await page.reload();
    await page.locator('#pageNavigation').waitFor();
    await page.locator('#btnPage').click();
    await page.reload();
    assert.equal(await page.locator('#btnPage').getAttribute('aria-pressed'), 'false');
    const stylesheetUrl = await page.locator('link[rel="stylesheet"]').getAttribute('href');
    const stylesheet = await page.request.get(stylesheetUrl, { headers: { 'User-Agent': await page.evaluate(() => navigator.userAgent) } });
    assert.ok(stylesheet.ok());
    const fonts = await page.evaluate(async ({css,version}) => {
      const cacheName = (await caches.keys()).find(name => name.includes('fonts-' + version));
      const cache = await caches.open(cacheName);
      const urls = (await cache.keys()).map(request => request.url);
      // The stylesheet requested by <link> is opaque; check its key and use the
      // same-UA readable network copy to identify every precached font file.
      const files = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(match => match[1]);
      return { css, files, urls };
    }, {css:await stylesheet.text(),version:workerVersion});
    assert.ok(fonts.urls.includes(stylesheetUrl));
    for (const family of ['EB Garamond', 'Inter', 'Jomolhari']) assert.ok(fonts.css.includes(family), `${family}: ${fonts.css.slice(0, 500)}`);
    assert.ok(fonts.files.length);
    for (const file of fonts.files) assert.ok(fonts.urls.includes(file), `Precached font ${file}`);
    // Disable the HTTP cache; the worker's cached shell must survive a hard reload.
    await session.send('Network.enable');
    await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await context.setOffline(true);
    await session.send('Page.reload', { ignoreCache: true });
    await page.waitForLoadState('load');
    await page.locator('#btnPage').waitFor();
    await checkText(page);
    await page.locator('#btnPage').click();
    await page.locator('#btnNextPage').click();
    assert.ok(await page.locator('#pagePosition').isVisible());
    await page.screenshot({ path: path.join(output, 'static-offline.png') });
    await page.goto(url + 'index.html');
    await page.locator('#btnPage').waitFor();
    await context.setOffline(false);
    // /public/index.html must also be a working standalone entry and scoped PWA.
    await page.goto(url + 'public/index.html');
    await page.locator('#btnPage').waitFor();
    await page.waitForFunction(expected => navigator.serviceWorker.controller?.scriptURL === expected, url + 'public/sw.js');
    await context.setOffline(true);
    await page.reload();
    await page.locator('#btnPage').waitFor();
    await checkText(page);
    await context.setOffline(false);
    // Remove only this shell to exercise the retained offline.html fallback.
    await page.goto(url);
    await page.evaluate(async version => {
      const cache = await caches.open((await caches.keys()).find(name => name.includes('shell-' + version) && !name.includes('%2Fpublic%2F')));
      for (const request of await cache.keys()) if (!request.url.endsWith('/offline.html')) await cache.delete(request);
    }, workerVersion);
    await context.setOffline(true);
    await page.goto(url + 'uncached/nested-page');
    await page.getByRole('heading', { name: 'The reader is offline' }).waitFor();
    assert.equal(await page.locator('base').getAttribute('href'), url);
    await page.waitForFunction(() => document.querySelector('img').naturalWidth === 192);
    await context.setOffline(false);
    await context.close();
    const fileContext = await browser.newContext({ offline: true });
    const filePage = await fileContext.newPage();
    await filePage.goto(pathToFileURL(path.join(root, 'public/index.html')).href);
    await filePage.locator('#btnPage').waitFor();
    await checkText(filePage);
    await fileContext.close();
    const ios = await browser.newContext({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const iosPage = await ios.newPage();
    await iosPage.goto(url);
    await iosPage.getByRole('button', { name: 'Install app', exact: true }).click();
    await iosPage.getByRole('heading', { name: 'Add to Home Screen' }).waitFor();
    await iosPage.getByRole('button', { name: 'Close', exact: true }).last().click();
    await ios.close();
    assert.deepEqual(nextRequests, []);
    assert.deepEqual(errors, []);
    console.log(`PASS: all 33 sections exactly match source in five variants; Pages and public entry points, file opening, manifest/install eligibility, original icons, ${fonts.files.length} cached fonts, hard offline refresh, both saved modes, and offline.html fallback.`);
    await new Promise((resolve, reject) => {
      const regression = spawn(process.execPath, [path.join(root, 'tests/reader.cjs')], {
        cwd: root, stdio: 'inherit', env: { ...process.env, READER_URL: url, READER_OFFLINE: '1' },
      });
      regression.on('error', reject);
      regression.on('exit', code => code === 0 ? resolve() : reject(new Error(`Reader regression exited ${code}`)));
    });
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
