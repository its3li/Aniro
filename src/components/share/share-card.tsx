'use client';

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import type { ShareAspect, ShareFrame, ShareItem, ShareOrnament, SharePattern, ShareStyle, ShareTheme } from '@/lib/share-image';

export const SHARE_SIZES: Record<ShareAspect, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
};

/** Multiplier applied to the base type sizes; auto-fit searches inside this range. */
export const SHARE_FONT_SCALE = { min: 0.5, max: 1.6 } as const;

export const DEFAULT_SHARE_STYLE: ShareStyle = {
  pattern: 'none', frame: 'thin', ornament: 'line', textSize: 1, showWatermark: true,
};

interface ThemeTokens {
  background: string;
  text: string;
  muted: string;
  accent: string;
  label: { ar: string; en: string };
}

const g = (a: string, b: string) => `linear-gradient(165deg, ${a} 0%, ${b} 100%)`;

export const SHARE_THEME_TOKENS: Record<ShareTheme, ThemeTokens> = {
  navy: { background: g('#13213a', '#0b1424'), text: '#f4eddd', muted: '#b8c0cd', accent: '#f2a93b', label: { ar: 'كحلي', en: 'Navy' } },
  night: { background: g('#0d1016', '#050608'), text: '#ffffff', muted: '#9aa1ad', accent: '#f2a93b', label: { ar: 'ليلي', en: 'Night' } },
  emerald: { background: g('#123129', '#0a1d18'), text: '#f2ebd8', muted: '#b2c3ba', accent: '#d8b25e', label: { ar: 'زمردي', en: 'Emerald' } },
  ocean: { background: g('#0f2f3d', '#081a24'), text: '#eef6f7', muted: '#a9c2c9', accent: '#7fd1c7', label: { ar: 'بحري', en: 'Ocean' } },
  plum: { background: g('#2c1a33', '#170d1c'), text: '#f6ecf4', muted: '#c6b0c4', accent: '#e3b26b', label: { ar: 'بنفسجي', en: 'Plum' } },
  burgundy: { background: g('#3a1418', '#1f0a0c'), text: '#f7ebe3', muted: '#cfb0a8', accent: '#e8b765', label: { ar: 'عنابي', en: 'Burgundy' } },
  slate: { background: g('#2b3340', '#171c24'), text: '#f1f3f6', muted: '#aeb6c2', accent: '#9ec3ff', label: { ar: 'رمادي', en: 'Slate' } },
  olive: { background: g('#2f3320', '#191b10'), text: '#f3f0e1', muted: '#bfbda4', accent: '#d6c27a', label: { ar: 'زيتوني', en: 'Olive' } },
  parchment: { background: g('#f8f2e4', '#eee4cf'), text: '#13213a', muted: '#566073', accent: '#b5741a', label: { ar: 'رقّ', en: 'Parchment' } },
  sand: { background: g('#f3e6d0', '#e2cfae'), text: '#3a2a16', muted: '#6e5a40', accent: '#9b5d1c', label: { ar: 'رملي', en: 'Sand' } },
  rose: { background: g('#f8ebe9', '#efd8d4'), text: '#3a1f24', muted: '#76565b', accent: '#b45a64', label: { ar: 'وردي', en: 'Rose' } },
  sky: { background: g('#eaf3fa', '#d6e6f3'), text: '#14293d', muted: '#4f6579', accent: '#2f6fa8', label: { ar: 'سماوي', en: 'Sky' } },
  mint: { background: g('#e9f5ef', '#d3ebdf'), text: '#12302a', muted: '#4c6a62', accent: '#2c8a6a', label: { ar: 'نعناعي', en: 'Mint' } },
  white: { background: g('#ffffff', '#f3f4f6'), text: '#111827', muted: '#4b5563', accent: '#b7791f', label: { ar: 'أبيض', en: 'White' } },
};

/** Subtle repeating SVG tiles drawn in the theme accent. */
function patternImage(pattern: SharePattern, color: string): string | null {
  const c = encodeURIComponent(color);
  const tiles: Record<Exclude<SharePattern, 'none'>, string> = {
    dots: `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><circle cx='18' cy='18' r='2.2' fill='${c}'/></svg>`,
    grid: `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'><path d='M48 0H0V48' fill='none' stroke='${c}' stroke-width='1.2'/></svg>`,
    lattice: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56'><path d='M28 0L56 28L28 56L0 28Z' fill='none' stroke='${c}' stroke-width='1.2'/></svg>`,
    waves: `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='28'><path d='M0 14Q20 0 40 14T80 14' fill='none' stroke='${c}' stroke-width='1.4'/></svg>`,
    arches: `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='88'><path d='M12 76V40Q12 22 32 12Q52 22 52 40V76Z' fill='none' stroke='${c}' stroke-width='1.1' stroke-linejoin='round'/></svg>`,
    hexagons: `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='97'><path d='M28 0L56 16V48L28 64L0 48V16ZM28 64V97' fill='none' stroke='${c}' stroke-width='1.2'/></svg>`,
    scales: `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='24'><path d='M0 24A24 24 0 0 1 48 24M-24 0A24 24 0 0 0 24 0M24 0A24 24 0 0 0 72 0' fill='none' stroke='${c}' stroke-width='1.2'/></svg>`,
  };
  return pattern === 'none' ? null : `url("data:image/svg+xml,${tiles[pattern]}")`;
}

export const SHARE_PATTERNS: { id: SharePattern; ar: string; en: string }[] = [
  { id: 'none', ar: 'بدون', en: 'None' }, { id: 'dots', ar: 'نقاط', en: 'Dots' }, { id: 'grid', ar: 'شبكة', en: 'Grid' },
  { id: 'lattice', ar: 'معيّنات', en: 'Lattice' }, { id: 'arches', ar: 'أقواس', en: 'Arches' }, { id: 'hexagons', ar: 'سداسي', en: 'Hexagons' },
  { id: 'waves', ar: 'أمواج', en: 'Waves' }, { id: 'scales', ar: 'قشور', en: 'Scales' },
];
export const SHARE_FRAMES: { id: ShareFrame; ar: string; en: string }[] = [
  { id: 'none', ar: 'بدون', en: 'None' }, { id: 'thin', ar: 'رفيع', en: 'Thin' }, { id: 'double', ar: 'مزدوج', en: 'Double' },
  { id: 'corners', ar: 'زوايا', en: 'Corners' }, { id: 'arch', ar: 'محراب', en: 'Arch' }, { id: 'bold', ar: 'عريض', en: 'Bold' },
];
export const SHARE_ORNAMENTS: { id: ShareOrnament; ar: string; en: string }[] = [
  { id: 'none', ar: 'بدون', en: 'None' }, { id: 'line', ar: 'خط', en: 'Line' }, { id: 'diamond', ar: 'معيّن', en: 'Diamond' },
  { id: 'dots', ar: 'نقاط', en: 'Dots' }, { id: 'vine', ar: 'غصن', en: 'Vine' }, { id: 'crescent', ar: 'هلال', en: 'Crescent' },
];

function Frame({ frame, color }: { frame: ShareFrame; color: string }) {
  const base: CSSProperties = { position: 'absolute', pointerEvents: 'none' };
  switch (frame) {
    case 'thin':
      return <div aria-hidden style={{ ...base, inset: 36, borderRadius: 36, border: `2px solid ${color}`, opacity: 0.4 }} />;
    case 'bold':
      return <div aria-hidden style={{ ...base, inset: 30, borderRadius: 28, border: `8px solid ${color}`, opacity: 0.55 }} />;
    case 'double':
      return (
        <>
          <div aria-hidden style={{ ...base, inset: 30, borderRadius: 30, border: `2px solid ${color}`, opacity: 0.45 }} />
          <div aria-hidden style={{ ...base, inset: 44, borderRadius: 22, border: `1px solid ${color}`, opacity: 0.35 }} />
        </>
      );
    case 'arch':
      return <div aria-hidden style={{ ...base, inset: 40, border: `2px solid ${color}`, opacity: 0.45, borderRadius: '50% 50% 28px 28px / 18% 18% 28px 28px' }} />;
    case 'corners': {
      const arm = 90;
      const s = (pos: CSSProperties, sides: string): CSSProperties => ({
        ...base, ...pos, width: arm, height: arm, opacity: 0.7,
        borderStyle: 'solid', borderColor: color, borderWidth: sides,
      });
      return (
        <>
          <div aria-hidden style={s({ top: 36, left: 36 }, '3px 0 0 3px')} />
          <div aria-hidden style={s({ top: 36, right: 36 }, '3px 3px 0 0')} />
          <div aria-hidden style={s({ bottom: 36, left: 36 }, '0 0 3px 3px')} />
          <div aria-hidden style={s({ bottom: 36, right: 36 }, '0 3px 3px 0')} />
        </>
      );
    }
    default:
      return null;
  }
}

function Ornament({ ornament, color }: { ornament: ShareOrnament; color: string }): ReactNode {
  const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, height: 40 };
  const line = (w: number) => <span style={{ height: 2, width: w, background: color, opacity: 0.55 }} />;
  switch (ornament) {
    case 'line':
      return <div aria-hidden style={row}>{line(260)}</div>;
    case 'diamond':
      return <div aria-hidden style={row}>{line(120)}<span style={{ width: 14, height: 14, background: color, transform: 'rotate(45deg)' }} />{line(120)}</div>;
    case 'dots':
      return <div aria-hidden style={row}>{[8, 12, 8].map((d, i) => <span key={i} style={{ width: d, height: d, borderRadius: '50%', background: color, opacity: 0.85 }} />)}</div>;
    case 'vine':
      return (
        <div aria-hidden style={row}>
          <svg width="320" height="40" viewBox="0 0 320 40" fill={color}>
            <rect x="12" y="19" width="116" height="2" rx="1" opacity="0.55" />
            <rect x="192" y="19" width="116" height="2" rx="1" opacity="0.55" />
            <path d="M128 20C138 9 149 10 154 20C149 30 138 31 128 20Z" opacity="0.85" />
            <path d="M192 20C182 9 171 10 166 20C171 30 182 31 192 20Z" opacity="0.85" />
            <path d="M160 4C151 12 151 28 160 36C169 28 169 12 160 4Z" />
          </svg>
        </div>
      );
    case 'crescent':
      return (
        <div aria-hidden style={row}>
          {line(110)}
          <svg width="34" height="34" viewBox="0 0 34 34"><path d="M22 4a13 13 0 1 0 8 23A11 11 0 1 1 22 4Z" fill={color} /></svg>
          {line(110)}
        </div>
      );
    default:
      return null;
  }
}

export interface ShareCardProps {
  items: ShareItem[];
  theme?: ShareTheme;
  aspect?: ShareAspect;
  showTranslation?: boolean;
  showReference?: boolean;
  style?: Partial<ShareStyle>;
  /** Fixed font scale; when omitted the card shrinks/grows text to fit. */
  fontScale?: number;
  /** Overrides the reference line derived from the items. */
  reference?: string;
}

const arDigits = (n: number) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

function repeatLabel(n: number): string {
  if (n === 2) return 'مرّتان';
  return n <= 10 ? `${arDigits(n)} مرات` : `${arDigits(n)} مرة`;
}

/** All items are ayat of one surah → they can be shown as one flowing passage. */
function ayahRun(items: ShareItem[]) {
  const first = items[0]?.ayah;
  if (!first || items.length < 2 || !items.every(i => i.ayah && i.ayah.surahEn === first.surahEn)) return null;
  return { first, last: items[items.length - 1].ayah! };
}

function referenceLine(items: ShareItem[]): string {
  const run = ayahRun(items);
  if (run) {
    const { first, last } = run;
    return `${first.surahAr} ${arDigits(first.number)}–${arDigits(last.number)} · ${first.surahEn} ${first.number}–${last.number}`;
  }
  const refs = [...new Set(items.map(i => i.reference?.trim()).filter((r): r is string => !!r))];
  if (refs.length <= 2) return refs.join('  ·  ');
  return `${refs[0]}  —  ${refs[refs.length - 1]}`;
}

function isOverflowing(body: HTMLElement) {
  return body.scrollHeight > body.clientHeight + 1;
}

/**
 * A fixed-size (1080×1080 or 1080×1920) card for sharing ayat / azkar as an image.
 * Rendered at full size; scale it with a CSS transform for previews.
 */
export function ShareCard({
  items,
  theme = 'navy',
  aspect = 'square',
  showTranslation = true,
  showReference = true,
  style: styleProp,
  fontScale,
  reference,
}: ShareCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const t = SHARE_THEME_TOKENS[theme] ?? SHARE_THEME_TOKENS.navy;
  const st = { ...DEFAULT_SHARE_STYLE, ...styleProp };
  const { width, height } = SHARE_SIZES[aspect];
  const isStory = aspect === 'story';
  const ref = reference ?? referenceLine(items);
  const run = ayahRun(items);
  const contentKey = JSON.stringify([items, aspect, showTranslation, showReference, ref, st.ornament, st.showWatermark, st.textSize]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    if (!root || !body) return;
    const apply = (s: number) => root.style.setProperty('--share-scale', String(s));
    if (fontScale !== undefined) {
      apply(fontScale);
      return;
    }
    // Large text raises the floor too (pagination then splits sooner); small text shrinks the fitted size.
    const grow = Math.max(1, st.textSize);
    let lo: number = SHARE_FONT_SCALE.min * grow;
    let hi: number = SHARE_FONT_SCALE.max * grow;
    apply(hi);
    if (isOverflowing(body)) {
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        apply(mid);
        if (isOverflowing(body)) hi = mid;
        else lo = mid;
      }
    } else {
      lo = hi;
    }
    apply(st.textSize < 1 ? lo * st.textSize : lo);
  }, [contentKey, fontScale, st.textSize]);

  const pattern = patternImage(st.pattern, t.accent);
  const pad = isStory ? 128 : 96;
  const rootStyle = {
    width, height,
    backgroundColor: '#000',
    backgroundImage: pattern ? `${pattern}, ${t.background}` : t.background,
    color: t.text,
    padding: pad,
    boxSizing: 'border-box',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: isStory ? 56 : 32,
    overflow: 'hidden',
    '--share-scale': fontScale ?? 1,
  } as CSSProperties;
  // Keep patterns faint: a translucent wash of the background over the tiles.
  const patternWash = pattern ? <div aria-hidden style={{ position: 'absolute', inset: 0, background: t.background, opacity: 0.84, pointerEvents: 'none' }} /> : null;

  const arabicStyle: CSSProperties = {
    margin: 0, textAlign: 'center',
    fontFamily: 'var(--font-quran-local), "Noto Naskh Arabic", serif',
    fontSize: 'calc(58px * var(--share-scale))', lineHeight: 1.85,
    overflowWrap: 'break-word',
  };
  const translationStyle: CSSProperties = {
    margin: 0, textAlign: 'center', color: t.muted,
    fontFamily: 'var(--font-ui), var(--font-ui-arabic), sans-serif',
    fontSize: 'calc(28px * var(--share-scale))', lineHeight: 1.5,
  };
  const repeatBadge = (n?: number) => n && n > 1 ? (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <span dir="rtl" style={{
        border: `2px solid ${t.accent}`, color: t.accent, borderRadius: 999,
        padding: 'calc(6px * var(--share-scale)) calc(26px * var(--share-scale))',
        fontFamily: 'var(--font-ui-arabic), var(--font-ui), sans-serif', fontWeight: 700,
        fontSize: 'calc(26px * var(--share-scale))', lineHeight: 1.5,
      }}>
        {repeatLabel(n)}
      </span>
    </div>
  ) : null;

  return (
    <div ref={rootRef} style={rootStyle} data-share-card="">
      {patternWash}
      <Frame frame={st.frame} color={t.accent} />

      <div style={{ position: 'relative' }}><Ornament ornament={st.ornament} color={t.accent} /></div>

      {/* Text body */}
      <div
        ref={bodyRef}
        data-share-body=""
        style={{ position: 'relative', flex: '1 1 0', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      >
        {/* Auto margins centre the text but never push overflow above the top edge. */}
        <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: 'calc(36px * var(--share-scale))' }}>
          {run ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'calc(24px * var(--share-scale))' }}>
              <p dir="rtl" lang="ar" style={arabicStyle}>{items.map(item => item.arabic).join(' ')}</p>
              {showTranslation && items.some(item => item.translation) && (
                <p dir="auto" style={translationStyle}>
                  {items.map(item => item.translation ? `${item.translation} (${item.ayah!.number})` : '').filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          ) : items.map((item, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 'calc(20px * var(--share-scale))' }}>
              {i > 0 && (
                <div aria-hidden style={{ display: 'flex', justifyContent: 'center' }}>
                  <span style={{ width: 'calc(12px * var(--share-scale))', height: 'calc(12px * var(--share-scale))', background: t.accent, transform: 'rotate(45deg)', opacity: 0.7 }} />
                </div>
              )}
              <p dir="rtl" lang="ar" style={arabicStyle}>{item.arabic}</p>
              {repeatBadge(item.repeat)}
              {showTranslation && item.translation && <p dir="auto" style={translationStyle}>{item.translation}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Footer: reference + watermark */}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
        {st.ornament !== 'none' && (showReference && ref || st.showWatermark) && <Ornament ornament={st.ornament} color={t.accent} />}
        {showReference && ref && (
          <div dir="auto" style={{
            width: '100%', color: t.accent, textAlign: 'center',
            fontFamily: 'var(--font-ui), var(--font-ui-arabic), sans-serif',
            fontSize: 30, fontWeight: 600, lineHeight: 1.4,
          }}>
            {ref}
          </div>
        )}
        {st.showWatermark && (
          <div dir="rtl" lang="ar" style={{
            color: t.muted, opacity: 0.8, whiteSpace: 'nowrap', lineHeight: 1.6,
            fontFamily: 'var(--font-ui-arabic), var(--font-ui), sans-serif', fontSize: 26, fontWeight: 700,
          }}>
            أنيرو
          </div>
        )}
      </div>
    </div>
  );
}
