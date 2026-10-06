const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const {createServer,prefix} = require('./serve-static.cjs');
const root = path.resolve(__dirname,'..');

async function main() {
  const server = process.env.READER_URL ? null : createServer();
  if (server) await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const url = process.env.READER_URL || 'http://127.0.0.1:'+server.address().port+prefix;
  const browser = await chromium.launch(process.env.READER_BROWSER_PATH ? {executablePath:process.env.READER_BROWSER_PATH} : {});
  const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page = await context.newPage(), cdp = await context.newCDPSession(page), errors = [];
  page.on('pageerror',error => errors.push(error.message));
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const font = () => page.locator('#contentArea').evaluate(area => parseFloat(getComputedStyle(area).fontSize));
  const position = () => page.evaluate(() => ({section:Number(document.querySelector('.page-section')?.getAttribute('data-section')),
    page:Number(document.getElementById('pagePosition')?.textContent.split('/')[0])}));
  const send = (type,points) => cdp.send('Input.dispatchTouchEvent',{type,
    touchPoints:points.map(([x,y,id]) => ({x,y,id,radiusX:3,radiusY:3,force:1}))});
  const closeTo = (actual,expected,message) => assert.ok(Math.abs(actual-expected)<.001, message+': '+actual+' vs '+expected);
  async function touchListeners() {
    const {result} = await cdp.send('Runtime.evaluate',{expression:'document.getElementById("contentArea")'});
    return (await cdp.send('DOMDebugger.getEventListeners',{objectId:result.objectId})).listeners.filter(listener => listener.type.startsWith('touch'));
  }
  async function swipe(from,to,cancel=false) {
    await send('touchStart',[[...from,1]]);
    for (let step=1;step<=5;step++) await send('touchMove',[[from[0]+(to[0]-from[0])*step/5,from[1]+(to[1]-from[1])*step/5,1]]);
    await send(cancel ? 'touchCancel' : 'touchEnd',[]);await settle();
  }
  async function pinch(initial,final,sequential=false,cancel=false) {
    const points=gap=>[[195-gap/2,350,1],[195+gap/2,350,2]];
    await send('touchStart',points(initial).slice(0,1));await send('touchStart',points(initial));
    for (let step=1;step<=5;step++) await send('touchMove',points(initial+(final-initial)*step/5));
    if (cancel) await send('touchCancel',[]);
    else {
      if (sequential) {
        await send('touchEnd',points(final).slice(1));await settle();
        const afterResize=await position();
        await send('touchMove',[[320,350,2]]);await send('touchEnd',[]);await settle();
        assert.deepEqual(await position(),afterResize,'remaining finger does not turn an extra page after React font reflow');
      } else await send('touchEnd',[]);
    }
    await settle();
  }
  async function jump(section) {
    await page.getByRole('button',{name:'Index',exact:true}).click();
    await page.locator(`a[href="#section-${section}"]`).click();
    await page.waitForFunction(value=>document.querySelector('.page-section')?.dataset.section===String(value),section);await settle();
  }
  async function language(variant) {
    await page.getByRole('button',{name:variant.startsWith('tibetan')?'Tibetan':variant.startsWith('sanskrit')?'Sanskrit':'English',exact:true}).click();
    const script={'tibetan':'Tibetan script','tibetan-translit':'Tibetan phonetics','sanskrit-devanagari':'Devanagari script','sanskrit-translit':'Sanskrit phonetics'}[variant];
    if (script) await page.getByRole('button',{name:script,exact:true}).click();
    await page.waitForFunction(value=>document.getElementById('contentArea').dataset.language===value,variant);
    await page.evaluate(()=>document.fonts.ready);await settle();
  }
  const captureAnchor=()=>page.evaluate(()=>{
    const area=document.getElementById('contentArea').getBoundingClientRect();
    const walker=document.createTreeWalker(document.querySelector('.page-section'),NodeFilter.SHOW_TEXT);let node;
    while ((node=walker.nextNode())) for (let i=0;i<node.length;i++) {
      const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);const rect=range.getBoundingClientRect();
      if (rect.width && rect.left>=area.left+15 && rect.right<=area.right-15 && rect.top>=area.top-1 && rect.bottom<=area.bottom+1) {window.gestureAnchor=range;return;}
    }
    throw new Error('No visible reading character');
  });
  const anchorVisible=()=>page.evaluate(()=>{
    const area=document.getElementById('contentArea').getBoundingClientRect(),rect=gestureAnchor.getBoundingClientRect();
    return rect.left>=area.left-1 && rect.right<=area.right+1 && rect.top>=area.top-1 && rect.bottom<=area.bottom+1;
  });
  try {
    await page.goto(url);await page.locator('#btnPage').waitFor();await page.evaluate(()=>document.fonts.ready);
    assert.equal((await touchListeners()).length,0,'no custom touch handlers on arrival in scroll mode');
    await page.locator('#btnPage').click();await jump(14);
    assert.equal((await touchListeners()).filter(listener=>!listener.passive).length,3);
    await swipe([320,250],[70,250]);assert.deepEqual(await position(),{section:14,page:2},'left swipe advances exactly once');
    await swipe([70,250],[320,250]);assert.deepEqual(await position(),{section:14,page:1},'right swipe returns exactly once');
    await swipe([190,250],[160,250]);assert.equal((await position()).page,1,'short drag');
    await swipe([190,250],[190,450]);assert.equal((await position()).page,1,'vertical drag');
    await swipe([320,250],[70,250],true);assert.equal((await position()).page,1,'cancelled swipe');
    await page.waitForTimeout(750);await page.touchscreen.tap(370,250);await settle();
    assert.equal((await position()).page,2,'normal edge tap still works');
    const initial=await font();await captureAnchor();await pinch(160,90,true);
    closeTo(await font(),initial-.9,'pinch changes one base pixel');assert.equal(await anchorVisible(),true,'pinch anchor');
    await captureAnchor();await pinch(90,200);closeTo(await font(),initial,'spread changes one base pixel');
    assert.equal(await anchorVisible(),true,'spread anchor');
    await pinch(160,155);closeTo(await font(),initial,'jitter');
    await pinch(160,90,false,true);closeTo(await font(),initial,'cancelled pinch');

    await page.evaluate(()=>{const range=document.createRange();range.selectNodeContents(document.querySelector('.page-section p'));getSelection().removeAllRanges();getSelection().addRange(range);});
    const selected=await position();await swipe([320,250],[70,250]);assert.deepEqual(await position(),selected,'selection takes precedence');
    await page.evaluate(()=>getSelection().removeAllRanges());
    await page.getByRole('button',{name:'Glossary',exact:true}).click();
    const overlaid=await position();await swipe([320,700],[70,700]);assert.deepEqual(await position(),overlaid,'overlay takes precedence');
    await page.getByRole('button',{name:'Close',exact:true}).click();await settle();
    await page.keyboard.press('End');await settle();await swipe([320,250],[70,250]);
    assert.deepEqual(await position(),{section:15,page:1},'swipe crosses section boundary');
    await swipe([70,250],[320,250]);assert.equal((await position()).section,14,'swipe returns across boundary');
    await page.locator('#btnFS').click();await settle();
    const fullscreenBefore=await page.locator('.page-section').getAttribute('style');
    await swipe([320,150],[70,150]);assert.notEqual(await page.locator('.page-section').getAttribute('style'),fullscreenBefore,'fullscreen swipe');
    await page.locator('#btnFS').click();await settle();

    for (const variant of ['english','tibetan','tibetan-translit','sanskrit-devanagari','sanskrit-translit']) {
      await language(variant);const before=await font(),factor=variant==='english'?.9:variant==='tibetan-translit'?.8:1;
      await pinch(160,90);closeTo(await font(),before-factor,'pinch in '+variant);
      await pinch(90,160);closeTo(await font(),before,'spread in '+variant);
    }
    await language('english');await page.locator('#btnPage').click();await settle();
    assert.equal((await touchListeners()).length,0,'scroll mode detaches gesture handlers');
    await page.evaluate(()=>window.scrollTo(0,0));await swipe([190,600],[190,250]);await page.waitForFunction(()=>scrollY>50);
    const scrollFont=await font();await pinch(160,90);await pinch(90,160);closeTo(await font(),scrollFont,'scroll mode does not resize reader text');
    await cdp.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});
    for (let i=0;i<3;i++) {
      await page.locator('#btnPage').click();assert.equal((await touchListeners()).filter(listener=>!listener.passive).length,3);
      await page.locator('#btnPage').click();assert.equal((await touchListeners()).length,0);
    }
    await page.locator('#btnPage').click();
    for (let i=0;i<15;i++) await page.locator('#btnSmaller').click();
    const minimum=await font();await pinch(160,90);closeTo(await font(),minimum,'minimum size');
    for (let i=0;i<25;i++) await page.locator('#btnLarger').click();
    const maximum=await font();await pinch(90,160);closeTo(await font(),maximum,'maximum size');
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
    await context.setOffline(true);await page.reload();await page.locator('#pageNavigation').waitFor();await settle();await jump(14);
    await swipe([320,250],[70,250]);assert.equal((await position()).page,2,'offline swipe');
    const offlineFont=await font();await pinch(160,90);closeTo(await font(),offlineFont-.9,'offline pinch');
    await page.locator('#btnPage').click();assert.equal((await touchListeners()).length,0,'offline native scroll mode');
    assert.deepEqual(errors,[]);
    console.log('PASS: Ewam page-only gesture mechanics, one-unit sizing in all five variants, no scroll-mode touch handlers, React pinch reflow, selection, overlays, boundaries, fullscreen, mode switching, bounds and offline use.');
  } catch (error) {
    fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
    await page.screenshot({path:path.join(root,'test-results/gestures-failure.png')});
    throw error;
  } finally {await browser.close();if (server) await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
