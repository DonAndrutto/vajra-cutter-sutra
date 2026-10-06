const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
const url = process.env.READER_URL || 'http://127.0.0.1:9002';
const reference = process.env.EWAM_REFERENCE_HTML || path.join(root, '../Ewam/index.html');
const output = path.join(root, 'test-results');
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));

async function main() {
  fs.mkdirSync(output, {recursive:true});
  const browser = await chromium.launch(process.env.READER_BROWSER_PATH ? {executablePath:process.env.READER_BROWSER_PATH} : {});
  const context = await browser.newContext({viewport:{width:390,height:844}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let referenceServer;
  const language = async variant => {
    const labels = {'english':'English','tibetan':'Tibetan','tibetan-translit':'Tibetan','sanskrit-devanagari':'Sanskrit','sanskrit-translit':'Sanskrit'};
    await page.getByRole('button', {name:labels[variant], exact:true}).click();
    if (variant === 'tibetan' || variant === 'tibetan-translit') await page.getByRole('button', {name:variant === 'tibetan' ? 'Tibetan script' : 'Tibetan phonetics', exact:true}).click();
    if (variant.startsWith('sanskrit')) await page.getByRole('button', {name:variant === 'sanskrit-devanagari' ? 'Devanagari script' : 'Sanskrit phonetics', exact:true}).click();
    await page.waitForFunction(value => document.getElementById('contentArea').dataset.language === value, variant);
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
  };
  const jump = async section => {
    await page.getByRole('button', {name:'Index',exact:true}).click();
    await page.locator(`a[href="#section-${section}"]`).click();
    await page.waitForFunction(value => document.querySelector('.page-section')?.dataset.section === String(value), section);
  };
  const captureAnchor = () => page.evaluate(() => {
    const area = document.getElementById('contentArea').getBoundingClientRect();
    const walker = document.createTreeWalker(document.querySelector('.page-section'), NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      for (let i = 0; i < node.length; i++) {
        const range = document.createRange(); range.setStart(node,i); range.setEnd(node,i+1);
        const rect = range.getBoundingClientRect();
        if (rect.width && rect.left >= area.left + 15 && rect.right <= area.right - 15 && rect.top >= area.top - 1 && rect.bottom <= area.bottom + 1) {
          window.testAnchor = range; return;
        }
      }
    }
    throw new Error('No visible character');
  });
  const anchorVisible = () => page.evaluate(() => {
    const rect = testAnchor.getBoundingClientRect();
    const area = document.getElementById('contentArea').getBoundingClientRect();
    return rect.left >= area.left - 1 && rect.right <= area.right + 1 && rect.top >= area.top - 1 && rect.bottom <= area.bottom + 1;
  });
  try {
    await page.goto(url);
    await page.locator('#btnPage').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.reader-toolbar .bar-btn:visible').count(),9);
    assert.equal(await page.locator('#pageNavigation').count(),0);
    assert.equal(await page.locator('#contentArea input').count(),0);
    await page.locator('#btnPage').click();
    assert.equal(await page.locator('#btnPlay').isDisabled(),true);

    if (fs.existsSync(reference)) {
      referenceServer = http.createServer((req,res) => {
        const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
        const file = pathname === '/' ? reference : path.resolve(path.dirname(reference), '.' + pathname);
        if (!file.startsWith(path.dirname(reference) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404).end();return;}
        res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8','.js':'text/javascript',
          '.css':'text/css','.woff2':'font/woff2','.jpg':'image/jpeg','.png':'image/png'}[path.extname(file)] || 'application/octet-stream');
        res.end(fs.readFileSync(file));
      });
      await new Promise(resolve => referenceServer.listen(0,'127.0.0.1',resolve));
      const ewam = await browser.newPage();
      await ewam.goto('http://127.0.0.1:' + referenceServer.address().port);
      await ewam.evaluate(() => {document.getElementById('ykLoader').remove();closeWelcome();toggleReadingMode();});
      const selectors = ['#btnSlower','#btnPlay','#btnFaster','#btnPage','#btnFS','#btnTilt','#btnTheme','#btnSmaller','#btnLarger','#btnPreviousPage','#btnNextPage','.reader-toolbar'];
      const ewamSelectors = ['[onclick="changeSpeed(-1)"]','#btnPlay','[onclick="changeSpeed(1)"]','#btnPage','#btnFS','#btnTilt','#btnTheme','[onclick="changeFontSize(-1)"]','[onclick="changeFontSize(1)"]','#btnPreviousPage','#btnNextPage','.reader-toolbar'];
      const styles = list => list.map(selector => {
        const element = document.querySelector(selector), css = getComputedStyle(element);
        const properties = ['height','padding','borderRadius','backgroundColor','color','border','boxShadow','gap','fontFamily','fontSize','transitionDuration'];
        return Object.fromEntries(properties.map(property => [property,css[property]]));
      });
      const glyphs = list => list.slice(0,-1).map(selector => Array.from(document.querySelector(selector).querySelector('svg:not([style*="display: none"]):not([style*="display:none"])').children,
        child => ({tag:child.tagName,attributes:Object.fromEntries(Array.from(child.attributes,attribute => [attribute.name,attribute.value]))})));
      for (const viewport of [{width:390,height:844},{width:844,height:390}]) {
        await page.setViewportSize(viewport); await ewam.setViewportSize(viewport); await settle(page); await settle(ewam);
        for (let theme=0;theme<2;theme++) {
          assert.deepEqual(await page.evaluate(styles,selectors),await ewam.evaluate(styles,ewamSelectors),'shared Ewam control styles');
          assert.deepEqual(await page.evaluate(glyphs,selectors),await ewam.evaluate(glyphs,ewamSelectors),'shared Ewam icon geometry');
          await page.locator('#btnTheme').click(); await ewam.locator('#btnTheme').click(); await settle(page); await settle(ewam);
        }
      }
      await ewam.close();
      console.log('Shared Ewam icons and rendered styles match in portrait and landscape.');
    }

    let fragments = 0;
    for (const layout of [{width:390,height:844,large:false},{width:320,height:568,large:false},{width:844,height:390,large:false},
      {width:1280,height:800,large:false},{width:390,height:844,large:true},{width:568,height:320,large:true}]) {
      await page.setViewportSize({width:layout.width,height:layout.height});
      if (layout.large && !await page.evaluate(() => window.testLarge)) {
        for (let i=0;i<13;i++) await page.locator('#btnLarger').click();
        await page.evaluate(() => {window.testLarge=true;});
      }
      for (const variant of ['english','tibetan','tibetan-translit','sanskrit-devanagari','sanskrit-translit']) {
        await language(variant);
        const report = await page.evaluate(() => {
          const area = document.getElementById('contentArea'), bounds = area.getBoundingClientRect();
          const sections = Array.from(area.querySelectorAll('.section-block'));
          const active = area.querySelector('.page-section');
          const failures = []; let lines = 0;
          for (const section of sections) {
            active.classList.remove('page-section');
            section.classList.add('page-section');
            const transform = section.style.transform; section.style.transform = '';
            const walker = document.createTreeWalker(section,NodeFilter.SHOW_TEXT); let node;
            while ((node = walker.nextNode())) {
              if (!node.textContent.trim()) continue;
              const range = document.createRange();range.selectNodeContents(node);
              for (const rect of range.getClientRects()) {
                if (!rect.width || !rect.height) continue;
                lines++;
                const column = Math.floor((rect.left - bounds.left - 16 + 1) / area.clientWidth);
                const right = bounds.left + 16 + column * area.clientWidth + area.clientWidth - 32;
                if (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1 || rect.right > right + 1) failures.push({section:section.dataset.section,
                  text:node.textContent.slice(0,25),top:rect.top-bounds.top,bottom:rect.bottom-bounds.bottom,right:rect.right-right});
              }
            }
            section.style.transform = transform; section.classList.remove('page-section');
          }
          active.classList.add('page-section');
          const buttons = Array.from(document.querySelectorAll('.reader-toolbar .bar-btn'),button => button.getBoundingClientRect());
          if (Math.max(...buttons.map(rect => rect.width))-Math.min(...buttons.map(rect=>rect.width))>1 || buttons.some(rect=>rect.left<0 || rect.right>innerWidth)) failures.push({toolbar:true});
          for (const element of document.querySelectorAll('.header-inner button,.header-title')) {
            if (!element.offsetParent) continue;
            const rect = element.getBoundingClientRect();
            if (rect.left < -1 || rect.right > innerWidth + 1) failures.push({header:element.textContent});
          }
          const style = getComputedStyle(area);
          if (style.animationName !== 'none' || style.transitionDuration !== '0s') failures.push({motion:true});
          return {lines,failures:failures.slice(0,10)};
        });
        assert.deepEqual(report.failures,[],JSON.stringify({layout,variant})); fragments += report.lines;
      }
      console.log('Line boundaries:',layout,'passed for all five text variants.');
    }

    await page.setViewportSize({width:390,height:844}); await language('english');
    for (let i=0;i<13;i++) await page.locator('#btnSmaller').click();
    await jump(14);
    const before = await page.locator('#pagePosition').innerText();
    await page.locator('#btnNextPage').click();
    assert.notEqual(await page.locator('#pagePosition').innerText(),before);
    await page.locator('#btnPreviousPage').click();
    assert.equal(await page.locator('#pagePosition').innerText(),before);
    await page.locator('#btnPage').focus(); await page.keyboard.press('ArrowRight');
    const afterKey = await page.locator('#pagePosition').innerText();
    assert.notEqual(afterKey,before);
    await page.mouse.click(20,250); assert.equal(await page.locator('#pagePosition').innerText(),before);
    await page.mouse.click(370,250); assert.equal(await page.locator('#pagePosition').innerText(),afterKey);
    await captureAnchor(); await page.locator('#btnLarger').click(); await settle(page);
    assert.equal(await anchorVisible(),true,'zoom anchor');
    await captureAnchor(); await page.setViewportSize({width:844,height:390}); await settle(page);
    assert.equal(await anchorVisible(),true,'landscape anchor');
    await page.screenshot({path:path.join(output,'landscape.png')});
    await captureAnchor(); await page.locator('#btnFS').click(); await settle(page);
    assert.equal(await page.locator('.reader-toolbar .bar-btn:visible').count(),1);
    assert.equal(await page.locator('#stickyStack').isVisible(),false);
    assert.equal(await page.locator('#pageNavigation').count(),0);
    assert.equal(await anchorVisible(),true,'fullscreen anchor');
    await page.mouse.click(820,150); await page.locator('#btnFS').click(); await settle(page);
    assert.equal(await page.locator('.reader-toolbar .bar-btn:visible').count(),9);
    await page.locator('#btnFS').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.evaluate(() => document.exitFullscreen()); await settle(page);
    assert.equal(await page.locator('#stickyStack').isVisible(),true,'native fullscreen exit restores UI');
    await page.setViewportSize({width:390,height:844}); await settle(page);
    await page.screenshot({path:path.join(output,'portrait.png')});
    await page.locator('#scrollTopBtn').click();
    assert.equal(await page.locator('.page-section').getAttribute('data-section'),'0');
    assert.equal(await page.locator('#btnPreviousPage').isDisabled(),true);
    await jump(32); await page.locator('#btnNextPage').click(); await page.keyboard.press('End');
    assert.equal(await page.locator('#btnNextPage').isDisabled(),true);
    await page.locator('#scrollTopBtn').click();
    await jump(14); await language('tibetan');
    assert.equal(await page.locator('.page-section').getAttribute('data-section'),'14','language keeps section');
    await language('english');

    await page.getByRole('button',{name:'Glossary',exact:true}).click();
    await page.getByPlaceholder('Search glossary...').fill('bodhisattva');
    assert.equal(await page.getByRole('button',{name:'Bodhisattva',exact:true}).count(),1);
    const overlayPage = await page.locator('.page-section').getAttribute('data-section');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.page-section').getAttribute('data-section'),overlayPage);
    await page.getByRole('button',{name:'Bodhisattva',exact:true}).click();
    await page.getByRole('button',{name:'Close',exact:true}).click();
    assert.equal(await page.locator('#contentArea [class~="bg-primary/20"]').count()>0,true,'glossary highlighting');
    await page.locator('#btnPage').click(); await settle(page);
    assert.equal(await page.locator('#btnPlay').isDisabled(),false);
    await page.locator('#scrollTopBtn').click(); await page.waitForFunction(() => scrollY === 0);
    await page.locator('#btnPlay').click(); await page.waitForFunction(() => scrollY > 0);
    await page.locator('#btnPage').click(); await settle(page);
    assert.equal(await page.locator('#btnPlay').getAttribute('aria-pressed'),'false');
    await page.reload(); await page.locator('#pageNavigation').waitFor();
    assert.equal(await page.locator('#btnPage').getAttribute('aria-pressed'),'true');
    if (process.env.READER_OFFLINE === '1') {
      await page.evaluate(async () => {await navigator.serviceWorker.ready;});
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await page.reload(); await page.locator('#pageNavigation').waitFor();
      await context.setOffline(true); await page.reload(); await page.locator('#pageNavigation').waitFor();
      await page.locator('#btnNextPage').click();
      await language('tibetan');
      assert.equal(await page.locator('#contentArea').getAttribute('data-language'),'tibetan');
      await context.setOffline(false);
      console.log('Installed production reader works offline with page turns and Tibetan text.');
    }
    assert.deepEqual(errors,[]);
    console.log('PASS:',fragments,'line fragments; shared Ewam UI, all text variants, page turns, top-of-text, reflow, index, glossary, scrolling, saved mode.');
  } catch(error) {
    await page.screenshot({path:path.join(output,'failure.png')});
    console.error(await page.locator('#pagePosition').textContent().catch(() => 'no page position'));
    throw error;
  } finally {await browser.close(); referenceServer?.close();}
}
main().catch(error => {console.error(error);process.exitCode=1;});
