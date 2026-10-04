// Run only when updating the checked-in HTML. GitHub Pages never runs a build.
import { build } from 'esbuild';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import { readFile, writeFile, copyFile, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
const bundle = await build({
  entryPoints: ['scripts/static-reader.tsx'], bundle: true, write: false,
  format: 'iife', platform: 'browser', target: 'es2020', jsx: 'automatic',
  minify: true, charset: 'utf8', legalComments: 'inline',
  define: { 'process.env.NODE_ENV': '"production"' },
});
const globals = await readFile('src/app/globals.css', 'utf8');
const css = await postcss([tailwindcss('./tailwind.config.ts')]).process(globals, { from: 'src/app/globals.css' });
const readerCss = await readFile('src/app/reader.css', 'utf8');
const fonts = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&family=Jomolhari&display=swap';
const html = `<!doctype html>
<!-- Generated from the current reader by scripts/build-static-reader.mjs.
     All application code, styles, sutra variants, and glossary are inline. -->
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#121214">
  <meta name="description" content="Read and recite the Vajracchedikā Prajñāpāramitā Sūtra in Sanskrit, Tibetan and English — available offline.">
  <meta name="application-name" content="Vajracchedikā">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="Vajracchedikā">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>Vajra-Cutter Sutra Reader</title>
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" type="image/png" href="icons/icon-192.png">
  <link rel="apple-touch-icon" href="apple-icon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous">
  <link rel="stylesheet" href="${fonts.replaceAll('&', '&amp;')}">
  <script>
    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      window.__vcsInstallPrompt = event;
      window.dispatchEvent(new Event('vcs:installprompt'));
    });
  </script>
  <style>${css.css}\n${readerCss}</style>
</head>
<body>
  <div id="reader"></div>
  <noscript>Please enable JavaScript to read the sutra.</noscript>
  <script>${bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>
`;
await writeFile('public/index.html', html);
// Pages publishes main /(root); public/index.html remains directly openable.
await writeFile('index.html', html);
await writeFile('.nojekyll', '');
for (const file of ['sw.js', 'offline.html', 'manifest.webmanifest']) {
  await copyFile(path.join('public', file), file);
}
await copyFile('src/app/apple-icon.png', 'public/apple-icon.png');
await copyFile('src/app/apple-icon.png', 'apple-icon.png');
await mkdir('icons', { recursive: true });
for (const file of await readdir('public/icons')) {
  await copyFile(path.join('public/icons', file), path.join('icons', file));
}
console.log(`Static reader written to public/index.html and index.html (${Buffer.byteLength(html)} bytes each).`);
