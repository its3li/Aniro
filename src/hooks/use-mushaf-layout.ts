'use client';

import { useLayoutEffect, useRef } from 'react';

/** Fit live text to its viewport while respecting the reader's minimum font size. */
export function useMushafLayout(content: object, preferredSize: number, opening: boolean) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const dismissedForContentRef = useRef<object | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const text = textRef.current;
    const footer = footerRef.current;
    const cue = scrollCueRef.current;
    if (!viewport || !text || !footer || !cue) return;
    let disposed = false;
    let frame = 0;
    let lastWidth = 0;
    let lastHeight = 0;
    const hideCue = () => {
      cue.dataset.visible = 'false';
      cue.setAttribute('aria-hidden', 'true');
    };
    const onScroll = () => {
      if (viewport.scrollTop <= 0 || dismissedForContentRef.current === content) return;
      dismissedForContentRef.current = content;
      hideCue();
    };

    const fit = () => {
      if (disposed) return;
      const style = getComputedStyle(viewport);
      // Leave room for the folio and vowel marks.
      const available = viewport.clientHeight - parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom) - footer.offsetHeight - 4;
      if (available <= 0 || !viewport.clientWidth) return;
      const min = opening ? Math.max(18, preferredSize * 1.1) : preferredSize;
      // Wider devices can use a larger face instead of leaving half the sheet empty.
      const max = Math.max(min, opening
        ? Math.min(48, Math.max(28, preferredSize * 1.8, text.clientWidth * .09))
        : Math.min(44, Math.max(preferredSize * 1.65, text.clientWidth * .065)));
      const baseLeading = opening ? 1.85 : 2.15;
      text.style.lineHeight = String(baseLeading);
      text.style.fontSize = min + 'px';
      const canFit = text.scrollHeight <= available;
      if (canFit) {
        // Bounded work on content/font/viewport changes; no work on scroll or audio ticks.
        let low = min;
        let high = max;
        for (let step = 0; step < 8; step++) {
          const mid = (low + high) / 2;
          text.style.fontSize = mid + 'px';
          if (text.scrollHeight <= available) low = mid;
          else high = mid;
        }
        text.style.fontSize = (Math.floor(low * 10) / 10) + 'px';
        if (!opening) {
          let lowLeading = baseLeading;
          let highLeading = 2.45;
          for (let step = 0; step < 6; step++) {
            const mid = (lowLeading + highLeading) / 2;
            text.style.lineHeight = String(mid);
            if (text.scrollHeight <= available) lowLeading = mid;
            else highLeading = mid;
          }
          text.style.lineHeight = String(lowLeading);
        }
      }
      viewport.dataset.layout = canFit ? 'fitted' : 'scroll';
      const showCue = viewport.scrollHeight > viewport.clientHeight + 2 &&
        viewport.scrollTop === 0 && dismissedForContentRef.current !== content;
      cue.dataset.visible = String(showCue);
      cue.setAttribute('aria-hidden', String(!showCue));
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    fit();
    viewport.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(() => {
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      if (width === lastWidth && height === lastHeight) return;
      lastWidth = width;
      lastHeight = height;
      schedule();
    });
    observer.observe(viewport);
    void document.fonts.ready.then(() => { if (!disposed) schedule(); });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      viewport.removeEventListener('scroll', onScroll);
      hideCue();
    };
  }, [content, preferredSize, opening]);

  return { viewportRef, textRef, footerRef, scrollCueRef };
}
