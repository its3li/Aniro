'use client';

/**
 * Share-as-image foundation.
 *
 * Callers (azkar, ayah menu, custom sets) build `ShareItem[]` and either open the
 * dialog via `useShareImage().openShareImage(...)` or call these helpers directly:
 *
 *   const pngs = await renderShareImages({ items, theme: 'navy', aspect: 'square' });
 *   await saveImagesToGallery(pngs);   // or shareImages(pngs, text)
 *
 * PNGs are passed around as `data:image/png;base64,...` URLs.
 */
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { ShareCard, SHARE_FONT_SCALE, SHARE_SIZES } from '@/components/share/share-card';

export { SHARE_SIZES };

export interface ShareItem {
  arabic: string;
  translation?: string;
  reference?: string;
  /** How many times a zikr is said; shown as a badge when > 1. */
  repeat?: number;
  /** Set for Quran ayat: consecutive ayat flow inline and get a range reference. */
  ayah?: { surahAr: string; surahEn: string; number: number };
}

export type ShareTheme =
  | 'navy' | 'night' | 'emerald' | 'ocean' | 'plum' | 'burgundy' | 'slate' | 'olive'
  | 'parchment' | 'sand' | 'rose' | 'sky' | 'mint' | 'white';
export type ShareAspect = 'square' | 'story';
export type SharePattern = 'none' | 'dots' | 'grid' | 'lattice' | 'arches' | 'hexagons' | 'waves' | 'scales';
export type ShareFrame = 'none' | 'thin' | 'double' | 'corners' | 'arch' | 'bold';
export type ShareOrnament = 'none' | 'line' | 'diamond' | 'dots' | 'vine' | 'crescent';

/** Decoration choices for a share card. `textSize` multiplies the largest allowed text size. */
export interface ShareStyle {
  pattern: SharePattern;
  frame: ShareFrame;
  ornament: ShareOrnament;
  textSize: number;
  showWatermark: boolean;
}

export const SHARE_THEMES: ShareTheme[] = ['navy', 'night', 'emerald', 'ocean', 'plum', 'burgundy', 'slate', 'olive', 'parchment', 'sand', 'rose', 'sky', 'mint', 'white'];

export interface ShareImageOptions {
  items: ShareItem[];
  theme?: ShareTheme;
  aspect?: ShareAspect;
  showTranslation?: boolean;
  showReference?: boolean;
  style?: Partial<ShareStyle>;
  /** Give each item its own image (long items may still span several). */
  onePerItem?: boolean;
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

const ALBUM_NAME = 'Aniro';
const QURAN_FONT_FAMILY = 'var(--font-quran-local)';

function withDefaults(opts: ShareImageOptions) {
  return {
    theme: opts.theme ?? 'navy',
    aspect: opts.aspect ?? 'square',
    showTranslation: opts.showTranslation ?? true,
    showReference: opts.showReference ?? true,
    style: opts.style,
  } as const;
}

/** Wait until the Quran font (and other web fonts) can be used for measuring/capturing. */
export async function ensureShareFonts(sample = 'بسم الله'): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    // Resolve the next/font family name behind the CSS variable.
    const probe = document.createElement('span');
    probe.style.fontFamily = QURAN_FONT_FAMILY;
    document.body.appendChild(probe);
    const family = getComputedStyle(probe).fontFamily;
    probe.remove();
    if (family) await document.fonts.load(`56px ${family}`, sample);
    await document.fonts.ready;
  } catch {
    /* Fall back to whatever font is available. */
  }
}

/** Mounts React elements in an invisible, full-size offscreen host. */
function createOffscreen() {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, {
    position: 'fixed',
    left: '-20000px',
    top: '0',
    pointerEvents: 'none',
    opacity: '1',
    zIndex: '-1',
  });
  document.body.appendChild(host);
  const root = createRoot(host);
  return {
    render(element: React.ReactElement): HTMLElement {
      flushSync(() => root.render(element));
      return host.firstElementChild as HTMLElement;
    },
    dispose() {
      root.unmount();
      host.remove();
    },
  };
}

function nextFrame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

function overflows(card: HTMLElement): boolean {
  const body = card.querySelector<HTMLElement>('[data-share-body]');
  if (!body) return false;
  return body.scrollHeight > body.clientHeight + 1;
}

/**
 * Splits items into pages so that each page fits at the minimum font size.
 * A single item that is too long on its own is split by words.
 */
export async function paginateShareItems(opts: ShareImageOptions): Promise<ShareItem[][]> {
  const o = withDefaults(opts);
  const items = opts.items.filter(item => item.arabic.trim());
  if (items.length === 0) return [];
  await ensureShareFonts(items[0].arabic.slice(0, 40));

  const off = createOffscreen();
  try {
    const fits = (pageItems: ShareItem[]) =>
      !overflows(off.render(createElement(ShareCard, { ...o, items: pageItems, fontScale: SHARE_FONT_SCALE.min * Math.max(1, opts.style?.textSize ?? 1) })));

    const queue = [...items];
    const pages: ShareItem[][] = [];
    let current: ShareItem[] = [];
    while (queue.length) {
      const item = queue.shift()!;
      if (opts.onePerItem && current.length) {
        pages.push(current);
        current = [];
      }
      if (fits([...current, item])) {
        current.push(item);
        continue;
      }
      if (current.length) {
        pages.push(current);
        current = [];
        queue.unshift(item);
        continue;
      }
      // Single item too long: take the largest word prefix that fits.
      const words = item.arabic.split(/\s+/);
      const translation = item.translation ?? '';
      let lo = 1;
      let hi = words.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (fits([{ ...item, arabic: words.slice(0, mid).join(' ') + ' …', translation: undefined }])) lo = mid;
        else hi = mid - 1;
      }
      const cut = Math.max(1, lo);
      const ratio = cut / words.length;
      const tWords = translation.split(/\s+/);
      const tCut = Math.round(tWords.length * ratio);
      pages.push([{
        ...item,
        arabic: words.slice(0, cut).join(' ') + ' …',
        translation: translation ? tWords.slice(0, tCut).join(' ') + ' …' : undefined,
      }]);
      queue.unshift({
        ...item,
        arabic: '… ' + words.slice(cut).join(' '),
        translation: translation ? '… ' + tWords.slice(tCut).join(' ') : undefined,
      });
    }
    if (current.length) pages.push(current);
    return pages;
  } finally {
    off.dispose();
  }
}

/** Renders already-paginated pages to PNG data URLs. */
export async function renderSharePages(pages: ShareItem[][], opts: Omit<ShareImageOptions, 'items'>): Promise<string[]> {
  const o = withDefaults({ ...opts, items: [] });
  const { width, height } = SHARE_SIZES[o.aspect];
  await ensureShareFonts();
  const { toPng, getFontEmbedCSS } = await import('html-to-image');

  const off = createOffscreen();
  try {
    const results: string[] = [];
    let fontEmbedCSS: string | undefined;
    for (const pageItems of pages) {
      const card = off.render(createElement(ShareCard, { ...o, items: pageItems }));
      await nextFrame();
      if (fontEmbedCSS === undefined) {
        try { fontEmbedCSS = await getFontEmbedCSS(card); } catch { fontEmbedCSS = ''; }
      }
      results.push(await toPng(card, { width, height, pixelRatio: 1, cacheBust: false, fontEmbedCSS }));
    }
    return results;
  } finally {
    off.dispose();
  }
}

/** Paginates and renders `items` to one or more PNG data URLs. */
export async function renderShareImages(opts: ShareImageOptions): Promise<string[]> {
  const pages = await paginateShareItems(opts);
  return renderSharePages(pages, opts);
}

function base64Of(dataUrl: string) {
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

function fileNameFor(index: number, stamp: number) {
  return `aniro-${stamp}-${index + 1}`;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}

function downloadAll(pngs: string[]) {
  const stamp = Date.now();
  pngs.forEach((png, i) => {
    const a = document.createElement('a');
    a.href = png;
    a.download = fileNameFor(i, stamp) + '.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
}

async function findOrCreateAlbumId(): Promise<string | undefined> {
  const { Media } = await import('@capacitor-community/media');
  const isAndroid = Capacitor.getPlatform() === 'android';
  const albumsPath = isAndroid ? (await Media.getAlbumsPath()).path : '';
  const find = async () =>
    (await Media.getAlbums()).albums.find(a => a.name === ALBUM_NAME && (!isAndroid || a.identifier.startsWith(albumsPath)));
  let album = await find();
  if (!album) {
    await Media.createAlbum({ name: ALBUM_NAME });
    album = await find();
  }
  return album?.identifier;
}

/** Saves PNGs to the device gallery ("Aniro" album) on native; downloads them on web. */
export async function saveImagesToGallery(pngs: string[]): Promise<'saved' | 'downloaded'> {
  if (!Capacitor.isNativePlatform()) {
    downloadAll(pngs);
    return 'downloaded';
  }
  const { Media } = await import('@capacitor-community/media');
  const albumIdentifier = await findOrCreateAlbumId();
  const stamp = Date.now();
  for (let i = 0; i < pngs.length; i++) {
    await Media.savePhoto({ path: pngs[i], albumIdentifier, fileName: fileNameFor(i, stamp) });
  }
  return 'saved';
}

function isCancel(error: unknown) {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /cancel|abort/i.test(message);
}

/** Opens the system share sheet with the images (and optional text). */
export async function shareImages(pngs: string[], text?: string): Promise<ShareOutcome> {
  const stamp = Date.now();
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const files: string[] = [];
    for (let i = 0; i < pngs.length; i++) {
      const { uri } = await Filesystem.writeFile({
        path: `share/${fileNameFor(i, stamp)}.png`,
        data: base64Of(pngs[i]),
        directory: Directory.Cache,
        recursive: true,
      });
      files.push(uri);
    }
    try {
      await Share.share({ files, text, dialogTitle: 'Aniro' });
      return 'shared';
    } catch (error) {
      if (isCancel(error)) return 'cancelled';
      throw error;
    }
  }

  const files = await Promise.all(
    pngs.map(async (png, i) => new File([await dataUrlToBlob(png)], fileNameFor(i, stamp) + '.png', { type: 'image/png' })),
  );
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, text });
      return 'shared';
    } catch (error) {
      if (isCancel(error)) return 'cancelled';
      throw error;
    }
  }
  downloadAll(pngs);
  return 'downloaded';
}

/** Whether `copyImage` can work here (web clipboard with image support). */
export function canCopyImage(): boolean {
  return (
    typeof window !== 'undefined' &&
    !Capacitor.isNativePlatform() &&
    typeof ClipboardItem !== 'undefined' &&
    typeof navigator.clipboard?.write === 'function'
  );
}

/** Copies a single PNG to the clipboard. */
export async function copyImage(png: string): Promise<void> {
  const blob = await dataUrlToBlob(png);
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}

/** Shares plain text via the system sheet; copies it when sharing isn't available. */
export async function shareText(text: string): Promise<ShareOutcome | 'copied'> {
  try {
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({ text, dialogTitle: 'Aniro' });
      return 'shared';
    }
    if (typeof navigator.share === 'function') {
      await navigator.share({ text });
      return 'shared';
    }
  } catch (error) {
    if (isCancel(error)) return 'cancelled';
    throw error;
  }
  await navigator.clipboard.writeText(text);
  return 'copied';
}
