'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSettings } from '@/components/providers/settings-provider';
import { DEFAULT_SHARE_STYLE, SHARE_FRAMES, SHARE_ORNAMENTS, SHARE_PATTERNS, ShareCard, SHARE_SIZES, SHARE_THEME_TOKENS } from '@/components/share/share-card';
import {
  SHARE_THEMES, canCopyImage, copyImage, paginateShareItems, renderSharePages, saveImagesToGallery, shareImages, shareText,
  type ShareAspect, type ShareItem, type ShareStyle, type ShareTheme,
} from '@/lib/share-image';
import { DownloadSimpleIcon as DownloadSimple } from '@/components/icons/interface-icons';
import { ShareNetworkIcon as ShareNetwork } from '@/components/icons/interface-icons';
import { CopySimpleIcon as CopySimple } from '@/components/icons/interface-icons';
import { TextAaIcon as TextAa } from '@/components/icons/interface-icons';
import { CaretLeftIcon as CaretLeft } from '@/components/icons/interface-icons';
import { CaretRightIcon as CaretRight } from '@/components/icons/interface-icons';
import { SpinnerGapIcon as SpinnerGap } from '@/components/icons/interface-icons';

export interface ShareImageRequest {
  items: ShareItem[];
  /** Sheet title, e.g. the azkar category or surah name. */
  title?: string;
  /** Optional caption passed to the share sheet alongside the images. */
  text?: string;
  /** When set, the sheet also offers "Share as text" with this text. */
  shareText?: string;
  /** One image per item (e.g. a whole azkar set). */
  onePerItem?: boolean;
}

interface SharePrefs {
  theme: ShareTheme;
  aspect: ShareAspect;
  showTranslation: boolean;
  showReference: boolean;
  style: ShareStyle;
}

const PREFS_KEY = 'aniro_share_image_prefs';
const DEFAULT_PREFS: SharePrefs = { theme: 'navy', aspect: 'square', showTranslation: true, showReference: true, style: DEFAULT_SHARE_STYLE };
const TEXT_SIZES = [{ value: 0.75, ar: 'صغير', en: 'Small' }, { value: 1, ar: 'متوسط', en: 'Medium' }, { value: 1.3, ar: 'كبير', en: 'Large' }];

function readStyle(raw: Partial<ShareStyle> | undefined): ShareStyle {
  const pick = <T extends string>(value: unknown, options: { id: T }[], fallback: T) =>
    options.some(o => o.id === value) ? (value as T) : fallback;
  return {
    pattern: pick(raw?.pattern, SHARE_PATTERNS, DEFAULT_SHARE_STYLE.pattern),
    frame: pick(raw?.frame, SHARE_FRAMES, DEFAULT_SHARE_STYLE.frame),
    ornament: pick(raw?.ornament, SHARE_ORNAMENTS, DEFAULT_SHARE_STYLE.ornament),
    textSize: TEXT_SIZES.some(t => t.value === raw?.textSize) ? raw!.textSize! : DEFAULT_SHARE_STYLE.textSize,
    showWatermark: raw?.showWatermark ?? true,
  };
}

function readPrefs(): SharePrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<SharePrefs>;
    return {
      theme: SHARE_THEMES.includes(parsed.theme as ShareTheme) ? (parsed.theme as ShareTheme) : DEFAULT_PREFS.theme,
      aspect: parsed.aspect === 'story' ? 'story' : 'square',
      showTranslation: parsed.showTranslation ?? true,
      showReference: parsed.showReference ?? true,
      style: readStyle(parsed.style),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function PickerRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label={label}>{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={active} onClick={onClick}
      className={cn('h-10 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/15 text-foreground' : 'border-border text-muted-foreground')}>
      {children}
    </button>
  );
}

function ScaledPreview({ aspect, children }: { aspect: ShareAspect; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const { width, height } = SHARE_SIZES[aspect];

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setBox({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const scale = box.w && box.h ? Math.min(box.w / width, box.h / height) : 0;
  return (
    <div ref={boxRef} className="flex h-[min(46dvh,420px)] w-full items-center justify-center">
      {scale > 0 && (
        <div
          className="relative overflow-hidden rounded-xl shadow-md ring-1 ring-border"
          style={{ width: width * scale, height: height * scale }}
        >
          <div dir="ltr" style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function ShareImageSheet({ request, onClose }: { request: ShareImageRequest | null; onClose: () => void }) {
  const { settings } = useSettings();
  const ar = settings.language === 'ar';
  const L = (arText: string, enText: string) => (ar ? arText : enText);

  const [prefs, setPrefs] = useState<SharePrefs>(DEFAULT_PREFS);
  const [pageIndex, setPageIndex] = useState(0);
  const [busy, setBusy] = useState<null | 'save' | 'share' | 'copy'>(null);
  const [paged, setPaged] = useState<{ key: string; pages: ShareItem[][] }>({ key: '', pages: [] });
  const rendered = useRef<{ key: string; pngs: string[] }>({ key: '', pngs: [] });
  const copySupported = useMemo(() => (request ? canCopyImage() : false), [request]);

  useEffect(() => {
    const id = window.setTimeout(() => setPrefs(readPrefs()), 0);
    return () => window.clearTimeout(id);
  }, []);

  const updatePrefs = (patch: Partial<SharePrefs> | ((prev: SharePrefs) => Partial<SharePrefs>)) => {
    setPrefs(prev => {
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
      try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch { /* optional */ }
      return next;
    });
  };

  const updateStyle = (patch: Partial<ShareStyle>) => updatePrefs(prev => ({ style: { ...prev.style, ...patch } }));

  const items = request?.items;
  const onePerItem = !!request?.onePerItem;
  const layoutKey = items ? JSON.stringify([items, onePerItem, prefs.aspect, prefs.showTranslation, prefs.showReference, prefs.style.ornament, prefs.style.showWatermark, prefs.style.textSize]) : '';
  const loading = !!items && paged.key !== layoutKey;
  const pages = loading ? [] : paged.pages;
  const current = Math.min(pageIndex, Math.max(0, pages.length - 1));

  useEffect(() => {
    if (!items) return;
    let cancelled = false;
    paginateShareItems({ items, onePerItem, aspect: prefs.aspect, showTranslation: prefs.showTranslation, showReference: prefs.showReference, style: prefs.style })
      .then(result => { if (!cancelled) { setPaged({ key: layoutKey, pages: result }); setPageIndex(0); } })
      .catch(() => { if (!cancelled) setPaged({ key: layoutKey, pages: [items] }); });
    return () => { cancelled = true; };
    // layoutKey captures items + layout prefs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  const getPngs = async () => {
    const key = layoutKey + prefs.theme + JSON.stringify(prefs.style);
    if (rendered.current.key === key) return rendered.current.pngs;
    const pngs = await renderSharePages(pages, prefs);
    rendered.current = { key, pngs };
    return pngs;
  };

  const run = async (kind: 'save' | 'share' | 'copy') => {
    if (busy || loading || pages.length === 0) return;
    setBusy(kind);
    try {
      const pngs = await getPngs();
      if (kind === 'save') {
        const outcome = await saveImagesToGallery(pngs);
        toast({ title: outcome === 'saved' ? L('تم الحفظ في المعرض ✓', 'Saved to gallery ✓') : L('تم التنزيل ✓', 'Downloaded ✓') });
      } else if (kind === 'share') {
        const outcome = await shareImages(pngs, request?.text);
        if (outcome === 'downloaded') toast({ title: L('تم التنزيل ✓', 'Downloaded ✓') });
      } else {
        await copyImage(pngs[current]);
        toast({ title: L('تم النسخ ✓', 'Copied ✓') });
      }
    } catch (error) {
      console.error('[share-image]', error);
      toast({
        variant: 'destructive',
        title: kind === 'save' ? L('تعذّر الحفظ', 'Could not save') : kind === 'share' ? L('تعذّرت المشاركة', 'Could not share') : L('تعذّر النسخ', 'Could not copy'),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(null);
    }
  };

  const spinner = <SpinnerGap className="h-5 w-5 animate-spin" />;

  return (
    <Sheet open={!!request} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent
        side="bottom"
        dir={ar ? 'rtl' : 'ltr'}
        className="max-h-[94dvh] overflow-y-auto rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5"
      >
        <SheetTitle className="text-center text-base">{request?.title || L('مشاركة كصورة', 'Share as image')}</SheetTitle>
        <SheetDescription className="sr-only">{L('معاينة الصورة وحفظها أو مشاركتها', 'Preview, save or share the image')}</SheetDescription>

        <div className="mt-3 flex flex-col gap-4">
          <div className="relative">
            <ScaledPreview aspect={prefs.aspect}>
              {pages[current] && (
                <ShareCard
                  items={pages[current]}
                  theme={prefs.theme}
                  aspect={prefs.aspect}
                  showTranslation={prefs.showTranslation}
                  showReference={prefs.showReference}
                  style={prefs.style}
                />
              )}
            </ScaledPreview>
            {loading && <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">{spinner}</div>}
          </div>

          {pages.length > 1 && (
            <div className="flex items-center justify-center gap-3" dir="ltr">
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={L('السابق', 'Previous')}
                disabled={current === 0} onClick={() => setPageIndex(current - 1)}>
                <CaretLeft className="h-5 w-5" />
              </Button>
              <span className="min-w-20 text-center text-sm tabular-nums text-muted-foreground" dir={ar ? 'rtl' : 'ltr'}>
                {L(`${current + 1} من ${pages.length}`, `${current + 1} of ${pages.length}`)}
              </span>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label={L('التالي', 'Next')}
                disabled={current >= pages.length - 1} onClick={() => setPageIndex(current + 1)}>
                <CaretRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button className="h-12 gap-2 text-base" variant="secondary" disabled={!!busy || loading} onClick={() => run('save')}>
              {busy === 'save' ? spinner : <DownloadSimple className="h-5 w-5" />}
              {L('حفظ في المعرض', 'Save to gallery')}
            </Button>
            <Button className="h-12 gap-2 text-base" disabled={!!busy || loading} onClick={() => run('share')}>
              {busy === 'share' ? spinner : <ShareNetwork className="h-5 w-5" />}
              {L('مشاركة', 'Share')}
            </Button>
          </div>
          {(copySupported || request?.shareText) && (
          <div className="flex flex-wrap items-center justify-center gap-2">
          {request?.shareText && (
            <Button variant="ghost" className="h-11 gap-2" disabled={!!busy} onClick={async () => {
              try {
                const outcome = await shareText(request.shareText!);
                if (outcome === 'copied') toast({ title: L('تم نسخ النص ✓', 'Text copied ✓') });
              } catch (error) {
                toast({ variant: 'destructive', title: L('تعذّرت المشاركة', 'Could not share'), description: error instanceof Error ? error.message : undefined });
              }
            }}>
              <TextAa className="h-5 w-5" />
              {L('مشاركة كنص', 'Share as text')}
            </Button>
          )}
          {request?.shareText && (
            <Button variant="ghost" className="h-11 gap-2" disabled={!!busy} onClick={async () => {
              try {
                await navigator.clipboard.writeText(request.shareText!);
                toast({ title: L('تم نسخ النص ✓', 'Text copied ✓') });
              } catch (error) {
                toast({ variant: 'destructive', title: L('تعذّر النسخ', 'Could not copy'), description: error instanceof Error ? error.message : undefined });
              }
            }}>
              <CopySimple className="h-5 w-5" />
              {L('نسخ النص', 'Copy text')}
            </Button>
          )}
          {copySupported && (
            <Button variant="ghost" className="h-11 gap-2" disabled={!!busy || loading} onClick={() => run('copy')}>
              {busy === 'copy' ? spinner : <CopySimple className="h-5 w-5" />}
              {pages.length > 1 ? L('نسخ الصورة الحالية', 'Copy current image') : L('نسخ الصورة', 'Copy image')}
            </Button>
          )}
          </div>
          )}
          {/* Customisation — remembered for next time */}
          <div className="mt-2 flex flex-col gap-4 border-t border-border pt-4">
            <div className="mx-auto grid w-full max-w-xs grid-cols-2 rounded-xl bg-muted p-1" role="radiogroup" aria-label={L('المقاس', 'Size')}>
              {(['square', 'story'] as const).map(aspect => (
                <button key={aspect} type="button" role="radio" aria-checked={prefs.aspect === aspect} onClick={() => updatePrefs({ aspect })}
                  className={cn('h-10 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    prefs.aspect === aspect ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground')}>
                  {aspect === 'square' ? L('مربع', 'Square') : L('ستوري', 'Story')}
                </button>
              ))}
            </div>

            <PickerRow label={L('الخلفية', 'Background')}>
              {SHARE_THEMES.map(theme => {
                const tokens = SHARE_THEME_TOKENS[theme];
                const active = prefs.theme === theme;
                return (
                  <button key={theme} type="button" role="radio" aria-checked={active} aria-label={ar ? tokens.label.ar : tokens.label.en}
                    onClick={() => updatePrefs({ theme })}
                    className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active ? 'border-primary' : 'border-transparent')}>
                    <span className="grid h-8 w-8 place-items-center rounded-full ring-1 ring-border" style={{ background: tokens.background }}>
                      <span className="block h-2 w-2 rounded-full" style={{ background: tokens.accent }} />
                    </span>
                  </button>
                );
              })}
            </PickerRow>

            <PickerRow label={L('النقش', 'Pattern')}>
              {SHARE_PATTERNS.map(o => <Chip key={o.id} active={prefs.style.pattern === o.id} onClick={() => updateStyle({ pattern: o.id })}>{ar ? o.ar : o.en}</Chip>)}
            </PickerRow>
            <PickerRow label={L('الإطار', 'Frame')}>
              {SHARE_FRAMES.map(o => <Chip key={o.id} active={prefs.style.frame === o.id} onClick={() => updateStyle({ frame: o.id })}>{ar ? o.ar : o.en}</Chip>)}
            </PickerRow>
            <PickerRow label={L('الزخرفة', 'Ornament')}>
              {SHARE_ORNAMENTS.map(o => <Chip key={o.id} active={prefs.style.ornament === o.id} onClick={() => updateStyle({ ornament: o.id })}>{ar ? o.ar : o.en}</Chip>)}
            </PickerRow>
            <PickerRow label={L('حجم الخط', 'Text size')}>
              {TEXT_SIZES.map(o => <Chip key={o.value} active={prefs.style.textSize === o.value} onClick={() => updateStyle({ textSize: o.value })}>{ar ? o.ar : o.en}</Chip>)}
            </PickerRow>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <Switch id="share-translation" checked={prefs.showTranslation} onCheckedChange={v => updatePrefs({ showTranslation: v })} />
                <Label htmlFor="share-translation">{L('الترجمة', 'Translation')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="share-reference" checked={prefs.showReference} onCheckedChange={v => updatePrefs({ showReference: v })} />
                <Label htmlFor="share-reference">{L('المرجع', 'Reference')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="share-watermark" checked={prefs.style.showWatermark} onCheckedChange={v => updateStyle({ showWatermark: v })} />
                <Label htmlFor="share-watermark">{L('اسم التطبيق', 'App name')}</Label>
              </div>
            </div>
            <Button type="button" variant="ghost" className="mx-auto h-10 text-sm text-muted-foreground" onClick={() => updatePrefs({ ...DEFAULT_PREFS })}>
              {L('إعادة التصميم الافتراضي', 'Reset to default design')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ShareImageContextValue {
  openShareImage: (request: ShareImageRequest) => void;
  /** True while the share sheet is showing. */
  isOpen: boolean;
}

const ShareImageContext = createContext<ShareImageContextValue | null>(null);

export function ShareImageProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ShareImageRequest | null>(null);
  const openShareImage = useCallback((next: ShareImageRequest) => {
    if (next.items.some(item => item.arabic.trim())) setRequest(next);
  }, []);
  const isOpen = request !== null;
  const value = useMemo(() => ({ openShareImage, isOpen }), [openShareImage, isOpen]);
  return (
    <ShareImageContext.Provider value={value}>
      {children}
      <ShareImageSheet request={request} onClose={() => setRequest(null)} />
    </ShareImageContext.Provider>
  );
}

/** `const { openShareImage } = useShareImage(); openShareImage({ items, title });` */
export function useShareImage(): ShareImageContextValue {
  const ctx = useContext(ShareImageContext);
  if (!ctx) throw new Error('useShareImage must be used inside <ShareImageProvider>');
  return ctx;
}
