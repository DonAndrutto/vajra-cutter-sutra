"use client";

import { RefObject, useLayoutEffect, useRef } from 'react';
import { ReaderNavigation, useAppContext } from '@/context/app-context';
import { installReaderGestures } from '@/lib/reader-gestures';

type Anchor = { section: number; block: string; offset: number; top: number };

function textRange(element: Element, offset: number) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (offset < (node.textContent?.length || 0)) {
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + 1);
      return range;
    }
    offset -= node.textContent?.length || 0;
  }
  return null;
}

// Native columns keep complete line boxes, including paragraphs longer than a page.
// Anchors identify a character within a paragraph so reflow keeps that passage visible.
export function usePagedReader(areaRef: RefObject<HTMLDivElement>, activeLanguage: string) {
  const {readingMode, textSize, setTextSize, isUiVisible, readerNavigation, setReaderPosition,
    view, isDonationModalOpen} = useAppContext();
  const anchorRef = useRef<Anchor | null>(null);
  const position = useRef({section:0, page:0, count:1, stride:0});
  const command = useRef<(request: ReaderNavigation) => void>(() => {});
  const lastCommand = useRef(0);
  const overlayOpen = useRef(false);
  overlayOpen.current = view === 'index' || view === 'glossary' || isDonationModalOpen;

  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const sections = Array.from(area.querySelectorAll<HTMLElement>('.section-block'));
    const paged = readingMode === 'pages';
    let frame = 0;
    let active = true;
    const readerLine = () => isUiVisible ? (document.getElementById('stickyStack')?.getBoundingClientRect().bottom || 0) + 20 : 20;
    const findBlock = (anchor: Anchor) => area.querySelector<HTMLElement>(`[data-reading-block="${anchor.block}"]`);
    const capture = (): Anchor | null => {
      const bounds = area.getBoundingClientRect();
      const section = paged ? sections[position.current.section] : sections.find(node => node.getBoundingClientRect().bottom > readerLine());
      if (!section) return null;
      const blocks = Array.from(section.querySelectorAll<HTMLElement>('[data-reading-block]'));
      for (const block of blocks) {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
        let node, preceding = 0;
        while ((node = walker.nextNode())) {
          const length = node.textContent?.length || 0;
          if (!length) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          const visible = Array.from(range.getClientRects()).some(rect => rect.width && rect.height &&
            (paged ? rect.right > bounds.left + 16 && rect.left < bounds.right - 16 && rect.bottom > bounds.top && rect.top < bounds.bottom :
              rect.bottom > readerLine() && rect.top < innerHeight - 80));
          if (!visible) { preceding += length; continue; }
          let lo = 0, hi = length - 1;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            range.setStart(node, mid);
            range.setEnd(node, mid + 1);
            const rect = range.getBoundingClientRect();
            if (paged ? rect.right <= bounds.left + 16 : rect.bottom <= readerLine()) lo = mid + 1;
            else hi = mid;
          }
          range.setStart(node, lo);
          range.setEnd(node, lo + 1);
          return {section:Number(section.dataset.section), block:block.dataset.readingBlock!, offset:preceding + lo, top:range.getBoundingClientRect().top};
        }
      }
      return {section:Number(section.dataset.section), block:blocks[0]?.dataset.readingBlock || '', offset:0, top:bounds.top};
    };
    const publish = () => {
      const current = position.current;
      setReaderPosition(previous => previous.section === Number(sections[current.section]?.dataset.section) && previous.page === current.page &&
        previous.count === current.count && previous.sections === sections.length ? previous :
        {section:Number(sections[current.section]?.dataset.section || 0), page:current.page, count:current.count, sections:sections.length});
    };
    const show = () => {
      const current = position.current;
      const section = sections[current.section];
      if (!section) return;
      section.style.transform = `translateX(${-current.page * current.stride}px)`;
      anchorRef.current = capture();
      publish();
    };
    const layout = (anchor: Anchor | null = anchorRef.current) => {
      if (!paged || !active) return;
      const current = position.current;
      if (anchor) {
        const index = sections.findIndex(section => Number(section.dataset.section) === anchor.section);
        if (index >= 0) current.section = index;
      }
      current.section = Math.max(0, Math.min(sections.length - 1, current.section));
      const section = sections[current.section];
      if (!section) return;
      sections.forEach(node => node.classList.toggle('page-section', node === section));
      const barHeight = document.querySelector('.bottom-bar')?.getBoundingClientRect().height || 74;
      const top = isUiVisible ? (document.getElementById('stickyStack')?.getBoundingClientRect().bottom || 0) + 12 : 12;
      const height = Math.max(32, (window.visualViewport?.height || innerHeight) - top - barHeight - (isUiVisible ? 48 : 12));
      document.documentElement.style.setProperty('--reader-bar-h', `${barHeight}px`);
      area.style.setProperty('--page-top', `${top}px`);
      area.style.setProperty('--page-height', `${height}px`);
      area.style.setProperty('--page-font-cap', `${Math.max(4, Math.floor((height - 8) / 3.7))}px`);
      area.style.setProperty('--page-width', `${area.clientWidth - 32}px`);
      current.stride = area.clientWidth;
      current.count = Math.max(1, Math.ceil((section.scrollWidth + 31) / current.stride));
      if (anchor) {
        const block = findBlock(anchor);
        const rect = block && (textRange(block, anchor.offset)?.getClientRects()[0] || block.getClientRects()[0]);
        if (rect) current.page = Math.floor((rect.left - section.getBoundingClientRect().left + 1) / current.stride);
      }
      current.page = Math.max(0, Math.min(current.count - 1, current.page));
      show();
    };
    const turn = (direction: number) => {
      const current = position.current;
      const next = current.page + direction;
      if (next >= 0 && next < current.count) { current.page = next; show(); }
      else if (current.section + direction >= 0 && current.section + direction < sections.length) {
        current.section += direction;
        current.page = direction < 0 ? Number.MAX_SAFE_INTEGER : 0;
        layout(null);
      }
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (paged) layout();
        else {
          anchorRef.current = capture();
          const index = sections.findIndex(section => Number(section.dataset.section) === anchorRef.current?.section);
          if (index >= 0) {position.current.section = index; publish();}
        }
      });
    };
    document.documentElement.classList.toggle('paged-reading', paged);
    if (paged) {
      window.scrollTo({top:0, behavior:'instant'});
      layout();
    } else {
      sections.forEach(section => {section.classList.remove('page-section'); section.style.transform = '';});
      area.style.removeProperty('--page-font-cap');
      const anchor = anchorRef.current;
      const block = anchor && findBlock(anchor);
      if (block && anchor) {
        const rect = textRange(block, anchor.offset)?.getBoundingClientRect() || block.getBoundingClientRect();
        window.scrollBy({top:rect.top - readerLine(), behavior:'instant'});
      }
      anchorRef.current = capture();
    }
    command.current = request => {
      if (request.kind === 'turn') { if (paged) turn(request.value); return; }
      const sectionNumber = request.kind === 'start' ? 0 : request.value;
      const index = sections.findIndex(section => Number(section.dataset.section) === sectionNumber);
      if (index < 0) return;
      if (paged) {position.current.section = index; position.current.page = 0; layout(null);}
      else {
        const top = request.kind === 'start' ? 0 : sections[index].getBoundingClientRect().top + scrollY - readerLine();
        window.scrollTo({top:Math.max(0, top), behavior:'instant'});
        anchorRef.current = capture();
      }
    };
    const blocked = (target: EventTarget | null) => overlayOpen.current || !(target instanceof Element) ||
      !!target.closest('input,textarea,select,[contenteditable="true"],a,button,[role="dialog"]');
    const click = (event: MouseEvent) => {
      if (!paged || blocked(event.target) || !window.getSelection()?.isCollapsed) return;
      const bounds = area.getBoundingClientRect();
      const fraction = (event.clientX - bounds.left) / bounds.width;
      if (fraction < 0.25) turn(-1);
      else if (fraction > 0.75) turn(1);
    };
    const key = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest('button');
      if (button && (event.key === ' ' || event.key === 'Enter')) return;
      if (!paged || blocked(button?.parentElement || target) || event.altKey || event.ctrlKey || event.metaKey) return;
      const direction = ['ArrowRight','ArrowDown','PageDown',' '].includes(event.key) ? (event.shiftKey && event.key === ' ' ? -1 : 1) :
        ['ArrowLeft','ArrowUp','PageUp'].includes(event.key) ? -1 : 0;
      if (direction) {event.preventDefault(); turn(direction);}
      else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); position.current.page = event.key === 'Home' ? 0 : position.current.count - 1; show();
      }
    };
    let lastWheel = 0;
    const wheel = (event: WheelEvent) => {
      if (!paged || blocked(event.target) || event.ctrlKey) return;
      event.preventDefault();
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(delta) >= 10 && performance.now() - lastWheel > 300) {lastWheel = performance.now(); turn(delta > 0 ? 1 : -1);}
    };
    area.addEventListener('click', click);
    window.addEventListener('keydown', key);
    window.addEventListener('wheel', wheel, {passive:false});
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, {passive:true});
    window.visualViewport?.addEventListener('resize', schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    document.fonts.ready.then(() => {if (active) schedule();});
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      area.removeEventListener('click', click);
      window.removeEventListener('keydown', key);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      document.fonts.removeEventListener('loadingdone', schedule);
      document.documentElement.classList.remove('paged-reading');
    };
  }, [areaRef, readingMode, textSize, activeLanguage, isUiVisible, setReaderPosition]);

  useLayoutEffect(() => {
    if (!readerNavigation || readerNavigation.id === lastCommand.current) return;
    lastCommand.current = readerNavigation.id;
    command.current(readerNavigation);
  }, [readerNavigation]);

  // Keep the gesture session alive across font reflow. Recreating it during
  // a pinch would lose the guard against a final finger producing an edge tap.
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area || readingMode !== 'pages') return;
    const gestures = installReaderGestures(area, {
      isPageMode: () => document.documentElement.classList.contains('paged-reading'),
      isBlocked: target => overlayOpen.current || !(target instanceof Element) ||
        !!target.closest('input,textarea,select,[contenteditable="true"],a,button,[role="dialog"]'),
      turnPage: direction => command.current({id:0, kind:'turn', value:direction}),
      resizeText: direction => {
        // Ewam's one-unit base size change is 1px; this reader stores rem.
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        setTextSize(size => Math.max(.5, Math.min(2.5, size + direction / rem)));
      }
    });
    return gestures.dispose;
  }, [areaRef, readingMode, setTextSize]);
}
