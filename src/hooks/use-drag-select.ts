'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** Inclusive, sorted index range. */
export interface DragRange { start: number; end: number }

const ITEM_SELECTOR = '[data-select-index]';
const MOVE_TOLERANCE = 10;
const EDGE = 72;
const MAX_SPEED = 16;

function scrollParentOf(el: Element | null): HTMLElement | null {
  for (let node = el?.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null; // window scrolls
}

/**
 * Gallery-style range selection: long-press an item (an element with
 * `data-select-index`) inside `rootRef`, then drag up/down to extend the range.
 * The list auto-scrolls near the edges. While a range exists, tapping an item
 * extends the range to it instead of firing the item's click.
 */
export function useDragSelect(rootRef: RefObject<HTMLElement | null>, { longPressMs = 380, enabled = true } = {}) {
  const [range, setRangeState] = useState<DragRange | null>(null);
  const rangeRef = useRef<DragRange | null>(null);
  const state = useRef({
    timer: 0, pending: false, dragging: false, suppressClick: false,
    anchor: -1, startX: 0, startY: 0, x: 0, y: 0, frame: 0,
    scroller: null as HTMLElement | null,
  });

  const setRange = useCallback((next: DragRange | null) => {
    rangeRef.current = next;
    setRangeState(prev => (prev?.start === next?.start && prev?.end === next?.end ? prev : next));
  }, []);

  const clear = useCallback(() => {
    state.current.anchor = -1;
    setRange(null);
  }, [setRange]);

  const isDragging = useCallback(() => state.current.dragging || state.current.pending, []);

  useEffect(() => {
    if (!enabled) return;
    const s = state.current;

    const itemFrom = (target: EventTarget | null): HTMLElement | null => {
      const el = target instanceof Element ? target.closest<HTMLElement>(ITEM_SELECTOR) : null;
      return el && rootRef.current?.contains(el) ? el : null;
    };
    const indexOf = (el: HTMLElement) => Number(el.dataset.selectIndex);

    // When the finger is over a gap, a fixed bar or the nav, use the vertically nearest item.
    const nearestItem = (y: number): HTMLElement | null => {
      let best: HTMLElement | null = null;
      let bestDistance = Infinity;
      rootRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR).forEach(el => {
        for (const r of el.getClientRects()) {
          const distance = y < r.top ? r.top - y : y > r.bottom ? y - r.bottom : 0;
          if (distance < bestDistance) { bestDistance = distance; best = el; }
        }
      });
      return best;
    };

    const updateFromPoint = () => {
      const el = itemFrom(document.elementFromPoint(s.x, s.y)) ?? nearestItem(s.y);
      if (!el || s.anchor < 0) return;
      const i = indexOf(el);
      setRange({ start: Math.min(s.anchor, i), end: Math.max(s.anchor, i) });
    };

    const autoScroll = () => {
      s.frame = 0;
      if (!s.dragging) return;
      const rect = s.scroller?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight };
      let dy = 0;
      if (s.y < rect.top + EDGE) dy = -MAX_SPEED * Math.min(1, (rect.top + EDGE - s.y) / EDGE);
      else if (s.y > rect.bottom - EDGE) dy = MAX_SPEED * Math.min(1, (s.y - (rect.bottom - EDGE)) / EDGE);
      if (dy) {
        if (s.scroller) s.scroller.scrollTop += dy;
        else window.scrollBy(0, dy);
        updateFromPoint();
      }
      s.frame = requestAnimationFrame(autoScroll);
    };

    const begin = (target: EventTarget | null, x: number, y: number) => {
      const el = itemFrom(target);
      if (!el) return;
      s.pending = true;
      s.startX = s.x = x;
      s.startY = s.y = y;
      window.clearTimeout(s.timer);
      s.timer = window.setTimeout(() => {
        if (!s.pending) return;
        s.pending = false;
        s.dragging = true;
        s.suppressClick = true;
        s.scroller = scrollParentOf(el);
        const i = indexOf(el);
        const current = rangeRef.current;
        // Long-press inside an existing range keeps its far end as the anchor.
        s.anchor = current && i >= current.start && i <= current.end
          ? (i - current.start < current.end - i ? current.end : current.start)
          : i;
        setRange({ start: Math.min(s.anchor, i), end: Math.max(s.anchor, i) });
        navigator.vibrate?.(25);
        if (!s.frame) s.frame = requestAnimationFrame(autoScroll);
      }, longPressMs);
    };

    const move = (x: number, y: number, e: Event) => {
      s.x = x;
      s.y = y;
      if (s.pending && Math.hypot(x - s.startX, y - s.startY) > MOVE_TOLERANCE) {
        s.pending = false;
        window.clearTimeout(s.timer);
      }
      if (s.dragging) {
        if (e.cancelable) e.preventDefault();
        updateFromPoint();
      }
    };

    const end = () => {
      s.pending = false;
      window.clearTimeout(s.timer);
      if (s.dragging) {
        s.dragging = false;
        cancelAnimationFrame(s.frame);
        s.frame = 0;
      }
    };

    const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) begin(e.target, e.touches[0].clientX, e.touches[0].clientY); else end(); };
    const onTouchMove = (e: TouchEvent) => move(e.touches[0].clientX, e.touches[0].clientY, e);
    const onPointerDown = (e: PointerEvent) => { if (e.pointerType === 'mouse' && e.button === 0) begin(e.target, e.clientX, e.clientY); };
    const onPointerMove = (e: PointerEvent) => { if (e.pointerType === 'mouse') move(e.clientX, e.clientY, e); };
    const onPointerUp = (e: PointerEvent) => { if (e.pointerType === 'mouse') end(); };
    const onContextMenu = (e: Event) => { if ((s.pending || s.dragging || s.suppressClick) && itemFrom(e.target)) e.preventDefault(); };
    const onClick = (e: MouseEvent) => {
      const el = itemFrom(e.target);
      if (s.suppressClick) {
        s.suppressClick = false;
        if (el) { e.preventDefault(); e.stopPropagation(); }
        return;
      }
      const current = rangeRef.current;
      if (!el || !current) return;
      // Selection mode: a tap extends the range to the tapped item.
      e.preventDefault();
      e.stopPropagation();
      const i = indexOf(el);
      const anchor = s.anchor >= 0 ? s.anchor : current.start;
      s.anchor = anchor;
      setRange({ start: Math.min(anchor, i), end: Math.max(anchor, i) });
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', end);
    document.addEventListener('touchcancel', end);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('click', onClick, true);
    return () => {
      end();
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', end);
      document.removeEventListener('touchcancel', end);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('click', onClick, true);
    };
  }, [enabled, longPressMs, rootRef, setRange]);

  const isSelected = useCallback((i: number) => !!range && i >= range.start && i <= range.end, [range]);

  return { range, setRange, clear, isSelected, isDragging };
}
