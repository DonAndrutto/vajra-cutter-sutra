// Shared touch behavior for the readers. App-specific navigation and sizing
// use the same Ewam thresholds and lifecycle, with cleanup for React unmounts.
type GestureOptions = {
  isPageMode: () => boolean;
  isBlocked: (target: EventTarget | null) => boolean;
  turnPage: (direction: number) => void;
  resizeText: (direction: number) => void;
};
type Gesture = {kind:'ignore'} |
  {kind:'pinch'; initial:number; last:number; finished:boolean} |
  {kind:'swipe'; id:number; x:number; y:number; lastX:number; lastY:number; started:number; paged:boolean; vertical:boolean};

export function installReaderGestures(area: HTMLElement, {isPageMode, isBlocked, turnPage, resizeText}: GestureOptions) {
  let gesture: Gesture | null = null;
  let ignoreClickUntil = 0;
  const distance = (touches: Touch[]) => Math.hypot(touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY);
  const eligible = (target: EventTarget | null) => isPageMode() && !isBlocked(target) && window.getSelection()?.isCollapsed;
  const consume = (event: TouchEvent) => {
    if (event.cancelable) event.preventDefault();
    ignoreClickUntil = performance.now() + 700;
  };

  function onTouchStart(event: TouchEvent) {
    const touches = [...event.touches];
    if (!eligible(event.target) || touches.some(touch => !(touch.target instanceof Node) || !area.contains(touch.target)) || touches.length > 2) {
      gesture = {kind:'ignore'};
      return;
    }
    // A pinch never becomes a swipe when one finger lifts first.
    if (gesture?.kind === 'pinch' || gesture?.kind === 'ignore') return;
    if (touches.length === 2) {
      gesture = {kind:'pinch', initial:distance(touches), last:distance(touches), finished:false};
      consume(event);
    } else if (touches.length === 1) {
      const touch = touches[0];
      gesture = {kind:'swipe', id:touch.identifier, x:touch.clientX, y:touch.clientY,
        lastX:touch.clientX, lastY:touch.clientY, started:performance.now(),
        paged:isPageMode(), vertical:false};
    }
  }

  function onTouchMove(event: TouchEvent) {
    if (!gesture || gesture.kind === 'ignore') return;
    if (!eligible(event.target)) { gesture = {kind:'ignore'}; return; }
    const touches = [...event.touches];
    if (gesture.kind === 'pinch') {
      consume(event);
      if (!gesture.finished && touches.length === 2) gesture.last = distance(touches);
      return;
    }
    const id = gesture.id;
    const touch = touches.find(touch => touch.identifier === id);
    if (!touch) return;
    gesture.lastX = touch.clientX;
    gesture.lastY = touch.clientY;
    const dx = Math.abs(gesture.lastX - gesture.x), dy = Math.abs(gesture.lastY - gesture.y);
    if (dy > 12 && dy > dx) gesture.vertical = true;
    if (gesture.paged && !gesture.vertical && dx > 8 && dx > dy * 1.4) consume(event);
  }

  function onTouchEnd(event: TouchEvent) {
    if (!gesture) return;
    if (gesture.kind === 'pinch') {
      consume(event);
      if (!gesture.finished && eligible(event.target)) {
        gesture.finished = true;
        const delta = gesture.last - gesture.initial;
        if (Math.abs(delta) >= Math.max(12, gesture.initial * .08)) resizeText(delta > 0 ? 1 : -1);
      }
      if (!event.touches.length) gesture = null;
      return;
    }
    if (gesture.kind === 'swipe' && !event.touches.length) {
      const id = gesture.id;
      const touch = [...event.changedTouches].find(touch => touch.identifier === id);
      const dx = (touch?.clientX ?? gesture.lastX) - gesture.x;
      const dy = (touch?.clientY ?? gesture.lastY) - gesture.y;
      if (gesture.paged && isPageMode() && !gesture.vertical && eligible(event.target) &&
          performance.now() - gesture.started < 800 && Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        consume(event);
        turnPage(dx < 0 ? 1 : -1);
      }
    }
    if (!event.touches.length) gesture = null;
  }

  function onTouchCancel() {
    if (gesture?.kind === 'pinch') ignoreClickUntil = performance.now() + 700;
    gesture = null;
  }

  // Some browsers synthesize an edge-tap click after a swipe/pinch. Do not
  // turn a second page; ordinary taps and keyboard activation still work.
  function onClick(event: MouseEvent) {
    if (event.detail && performance.now() < ignoreClickUntil) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  // Non-passive touch listeners make the browser wait for JavaScript before
  // scrolling. Register them only while pages own the gesture, and remove
  // them entirely when scrolling is native again.
  const listeners: [string, EventListener, AddEventListenerOptions][] = [
    ['touchstart', onTouchStart as EventListener, {passive:false}],
    ['touchmove', onTouchMove as EventListener, {passive:false}],
    ['touchend', onTouchEnd as EventListener, {passive:false}],
    ['touchcancel', onTouchCancel, {passive:true}],
    ['click', onClick as EventListener, {capture:true}]
  ];
  let enabled = false;
  function syncMode() {
    const next = isPageMode();
    if (next === enabled) return;
    gesture = null;
    ignoreClickUntil = 0;
    enabled = next;
    for (const [type, listener, options] of listeners) {
      if (enabled) area.addEventListener(type, listener, options);
      else area.removeEventListener(type, listener, options);
    }
  }
  syncMode();
  function dispose() {
    for (const [type, listener, options] of listeners) area.removeEventListener(type, listener, options);
    enabled = false;
    gesture = null;
    ignoreClickUntil = 0;
  }
  return {syncMode, dispose};
}
