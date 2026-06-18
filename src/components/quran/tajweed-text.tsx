'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { parseTajweed, parseTajweedMarkup, tajweedRulesMap } from '@/lib/tajweed';

const HIGHLIGHT_PREFIX = 'tajweed-v3-';
const HIGHLIGHT_STYLE_ID = 'tajweed-highlight-styles-v3';
const LEGACY_HIGHLIGHT_STYLE_IDS = ['tajweed-highlight-styles', 'tajweed-highlight-styles-v2'];
const LEGACY_HIGHLIGHT_PREFIXES = ['tajweed-', 'tajweed-v2-'];
const TAJWEED_CLASS_NAMES = Array.from(
  new Set(Object.values(tajweedRulesMap).map((rule) => rule.className))
);
const HIGHLIGHT_STYLES = `
  .tajweed-highlight-text { color: inherit; }
  ::highlight(tajweed-v3-madda_necessary) { color: #A10000; }
  ::highlight(tajweed-v3-madda_obligatory) { color: #DD0008; }
  ::highlight(tajweed-v3-madda_permissible) { color: #F15A22; }
  ::highlight(tajweed-v3-madda_normal) { color: #D4A741; }
  ::highlight(tajweed-v3-ikhf_shfw) { color: #169200; }
  ::highlight(tajweed-v3-ikhf) { color: #169200; }
  ::highlight(tajweed-v3-ghn) { color: #169200; }
  ::highlight(tajweed-v3-qlq) { color: #0054B4; }
  ::highlight(tajweed-v3-iqlb) { color: #26BFFD; }
  ::highlight(tajweed-v3-ham_wasl),
  ::highlight(tajweed-v3-slnt) { color: #AAAAAA; }
  ::highlight(tajweed-v3-idghm_shfw) { color: #169200; }
  ::highlight(tajweed-v3-idgh_ghn),
  ::highlight(tajweed-v3-idgh_w_ghn) { color: #169200; }
  ::highlight(tajweed-v3-idgh_mus),
  ::highlight(tajweed-v3-idgh_mut) { color: #A1A1A1; }
`;
const rangesByHighlight = new Map<string, Map<number, Range[]>>();
const dirtyHighlightNames = new Set<string>();
let nextInstanceId = 1;
let rebuildScheduled = false;
let legacyHighlightsCleared = false;

type HighlightRegistryLike = {
  set: (name: string, highlight: unknown) => void;
  delete: (name: string) => boolean;
};

type HighlightConstructorLike = new (...ranges: Range[]) => unknown;

interface TajweedTextProps {
  text: string;
  lang?: 'ar' | 'en';
  className?: string;
}

function getHighlightRegistry() {
  if (typeof window === 'undefined') return null;
  return (window.CSS as typeof CSS & { highlights?: HighlightRegistryLike })?.highlights ?? null;
}

function getHighlightConstructor() {
  if (typeof window === 'undefined') return null;
  return (window as typeof window & { Highlight?: HighlightConstructorLike }).Highlight ?? null;
}

function supportsHighlightApi() {
  return Boolean(getHighlightRegistry() && getHighlightConstructor());
}

function clearLegacyHighlights() {
  if (legacyHighlightsCleared || typeof document === 'undefined') return;

  const registry = getHighlightRegistry();

  for (const styleId of LEGACY_HIGHLIGHT_STYLE_IDS) {
    document.getElementById(styleId)?.remove();
  }

  if (registry) {
    for (const prefix of LEGACY_HIGHLIGHT_PREFIXES) {
      for (const className of TAJWEED_CLASS_NAMES) {
        registry.delete(`${prefix}${className}`);
      }
    }
  }

  legacyHighlightsCleared = true;
}

function ensureHighlightStyles() {
  if (typeof document === 'undefined') {
    return;
  }

  clearLegacyHighlights();

  const existing = document.getElementById(HIGHLIGHT_STYLE_ID);
  if (existing) {
    existing.textContent = HIGHLIGHT_STYLES;
    return;
  }

  const style = document.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = HIGHLIGHT_STYLES;
  document.head.appendChild(style);
}

function rebuildHighlight(name: string) {
  const registry = getHighlightRegistry();
  const HighlightCtor = getHighlightConstructor();
  if (!registry || !HighlightCtor) return;

  const instanceRanges = rangesByHighlight.get(name);
  const ranges = instanceRanges ? Array.from(instanceRanges.values()).flat() : [];

  if (ranges.length === 0) {
    registry.delete(name);
    rangesByHighlight.delete(name);
    return;
  }

  registry.set(name, new HighlightCtor(...ranges));
}

function scheduleRebuild(names: Iterable<string>) {
  for (const name of names) dirtyHighlightNames.add(name);
  if (rebuildScheduled) return;

  rebuildScheduled = true;
  queueMicrotask(() => {
    rebuildScheduled = false;
    const namesToRebuild = Array.from(dirtyHighlightNames);
    dirtyHighlightNames.clear();
    namesToRebuild.forEach(rebuildHighlight);
  });
}

function setInstanceRanges(instanceId: number, rangesByName: Map<string, Range[]>) {
  const touchedNames = new Set<string>();

  for (const [name, instanceRanges] of rangesByHighlight) {
    if (instanceRanges.delete(instanceId)) touchedNames.add(name);
  }

  for (const [name, ranges] of rangesByName) {
    let instanceRanges = rangesByHighlight.get(name);
    if (!instanceRanges) {
      instanceRanges = new Map<number, Range[]>();
      rangesByHighlight.set(name, instanceRanges);
    }

    instanceRanges.set(instanceId, ranges);
    touchedNames.add(name);
  }

  scheduleRebuild(touchedNames);
}

function clearInstanceRanges(instanceId: number) {
  const touchedNames = new Set<string>();

  for (const [name, instanceRanges] of rangesByHighlight) {
    if (instanceRanges.delete(instanceId)) touchedNames.add(name);
  }

  scheduleRebuild(touchedNames);
}

export const TajweedText = memo(function TajweedText({
  text,
  lang = 'en',
  className,
}: TajweedTextProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const instanceIdRef = useRef<number | null>(null);
  const [useHtmlFallback, setUseHtmlFallback] = useState(false);
  const parsed = useMemo(() => parseTajweedMarkup(text, lang), [lang, text]);
  const fallbackHtml = useMemo(() => parseTajweed(text, lang), [lang, text]);

  if (instanceIdRef.current === null) {
    instanceIdRef.current = nextInstanceId++;
  }

  useEffect(() => {
    const instanceId = instanceIdRef.current;
    const element = elementRef.current;

    const highlightSupported = supportsHighlightApi();
    setUseHtmlFallback(!highlightSupported);

    if (instanceId === null || !element || !highlightSupported) {
      clearLegacyHighlights();
      if (instanceId !== null) clearInstanceRanges(instanceId);
      return;
    }

    ensureHighlightStyles();

    const textNode = Array.from(element.childNodes).find(
      (node): node is Text => node.nodeType === Node.TEXT_NODE
    );

    if (!textNode) {
      clearInstanceRanges(instanceId);
      return;
    }

    const rangesByName = new Map<string, Range[]>();

    for (const tajweedRange of parsed.ranges) {
      if (tajweedRange.start >= tajweedRange.end || tajweedRange.end > textNode.length) {
        continue;
      }

      const range = document.createRange();
      range.setStart(textNode, tajweedRange.start);
      range.setEnd(textNode, tajweedRange.end);

      const highlightName = `${HIGHLIGHT_PREFIX}${tajweedRange.className}`;
      const ranges = rangesByName.get(highlightName) ?? [];
      ranges.push(range);
      rangesByName.set(highlightName, ranges);
    }

    setInstanceRanges(instanceId, rangesByName);

    return () => clearInstanceRanges(instanceId);
  }, [parsed]);

  if (useHtmlFallback) {
    return (
      <span
        ref={elementRef}
        className={cn('tajweed-text tajweed-highlight-text', className)}
        dir="rtl"
        lang="ar"
        dangerouslySetInnerHTML={{ __html: fallbackHtml }}
      />
    );
  }

  return (
    <span
      ref={elementRef}
      className={cn('tajweed-text tajweed-highlight-text', className)}
      dir="rtl"
      lang="ar"
    >
      {parsed.text}
    </span>
  );
});
