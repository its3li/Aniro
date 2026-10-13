"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  getPageData,
  getPageRange,
  getHizbInfo,
  TOTAL_MUSHAF_PAGES,
  type MushafPage,
  type PageAyah,
} from "@/lib/quran-page";
import { cn } from "@/lib/utils";
import { stripTajweed } from "@/lib/tajweed";
import { useSettings } from "../providers/settings-provider";
import { Skeleton } from "../ui/skeleton";
import { TajweedLegend } from "./tajweed-legend";
import { TajweedText } from "./tajweed-text";
import { TafseerModal } from "./tafseer-modal";
import { useToast } from "@/hooks/use-toast";
import { PlayIcon as Play } from '@/components/icons/interface-icons';
import { PauseIcon as Pause } from '@/components/icons/interface-icons';
import { CopySimpleIcon as Copy } from '@/components/icons/interface-icons';
import { PlayCircleIcon as PlayCircle } from '@/components/icons/interface-icons';
import { PauseCircleIcon as PauseCircle } from '@/components/icons/interface-icons';
import { BookmarkSimpleIcon as BookmarkPlus } from '@/components/icons/interface-icons';
import { BookOpenIcon as BookOpen } from '@/components/icons/interface-icons';
import { SlidersHorizontalIcon as Settings2 } from '@/components/icons/interface-icons';
import { ArrowLeftIcon as ArrowLeft } from '@/components/icons/interface-icons';
import { useAudioPlayback } from "../providers/audio-player-provider";
import { useLastRead } from "@/hooks/use-last-read";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

// Strip Bismillah prefix from first verse of surah (except Al-Fatiha and At-Tawbah)
function stripBismillah(text: string, surahNumber: number, verseNumberInSurah: number): string {
  if (verseNumberInSurah !== 1) return text;
  if (surahNumber === 1 || surahNumber === 9) return text;

  const normalizedText = text
    .replace(/[\u064B-\u065F\u0670\u0653-\u0656\u06D6-\u06ED]/g, '')
    .replace(/[ٱأإآ]/g, 'ا');

  const bismillahBase = 'بسم الله الرحمن الرحيم';

  if (normalizedText.startsWith(bismillahBase)) {
    const rahimMatch = text.match(/ح[\u064B-\u065F\u0670]*[يی][\u064B-\u065F\u0670]*م[\u064B-\u065F\u0670]*\s+/);
    if (rahimMatch) {
      const endIndex = text.indexOf(rahimMatch[0]) + rahimMatch[0].length;
      const remaining = text.slice(endIndex);
      if (remaining.length > 0) {
        return remaining;
      }
    }
  }

  return text;
}

// ============================================================
// مكون التحميل الوهمي (الذي كان يسبب الخطأ)
// ============================================================
function PageSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-start px-4 py-8 gap-4 opacity-50">
      <Skeleton className="w-1/3 h-12 rounded-lg mx-auto mb-6" />
      <Skeleton className="w-full h-10 rounded" />
      <Skeleton className="w-11/12 h-10 rounded mx-auto" />
      <Skeleton className="w-full h-10 rounded" />
      <Skeleton className="w-5/6 h-10 rounded mx-auto" />
      <Skeleton className="w-full h-10 rounded" />
      <Skeleton className="w-4/5 h-10 rounded mx-auto" />
      <Skeleton className="w-full h-10 rounded" />
      <Skeleton className="w-11/12 h-10 rounded mx-auto" />
    </div>
  );
}

// ============================================================
// مكون واجهة المصحف الرئيسي
// ============================================================
interface MushafPageViewProps {
  surahNumber: number;
  initialVerseNumber?: number;
  initialPageNumber?: number;
  onBack: () => void;
}

export function MushafPageView({
  surahNumber,
  initialVerseNumber,
  initialPageNumber,
  onBack,
}: MushafPageViewProps) {
  const { settings, setFontSize, setQuranTajweedEnabled } = useSettings();
  const isArabic = settings.language === "ar";
  const canUseTajweed = settings.quranEdition === "uthmani";
  const isTajweed = settings.quranEdition === "uthmani" && settings.quranTajweedEnabled;
  const { toast } = useToast();
  const {
    playerState,
    playSurah,
    handlePlayerClose,
  } = useAudioPlayback();
  const { saveLastRead } = useLastRead();

  const { startPage } = getPageRange(surahNumber);

  const [currentPage, setCurrentPage] = useState(initialPageNumber ?? startPage);
  const [pageData, setPageData] = useState<MushafPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null);
  const [selectedAyahPos, setSelectedAyahPos] = useState<{ x: number; y: number } | null>(null);
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [selectedAyahForTafseer, setSelectedAyahForTafseer] = useState<PageAyah | null>(null);
  const [isTafseerOpen, setTafseerOpen] = useState(false);

  // Swipe
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const isSwiping = useRef(false);
  const [slideClass, setSlideClass] = useState("");
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);

  const editionMap: Record<string, string> = {
    uthmani: "quran-uthmani",
    warsh: "quran-warsh",
  };
  const edition = isTajweed
    ? "quran-tajweed"
    : editionMap[settings.quranEdition] || "quran-uthmani";

  useEffect(() => {
    let cancelled = false;
    const fetchPage = async () => {
      setIsLoading(true);
      const data = await getPageData(currentPage, edition);
      if (!cancelled) {
        setPageData(data);
        setIsLoading(false);
      }
    };
    fetchPage();

    if (currentPage > 1) getPageData(currentPage - 1, edition);
    if (currentPage < TOTAL_MUSHAF_PAGES) getPageData(currentPage + 1, edition);

    return () => {
      cancelled = true;
    };
  }, [currentPage, edition]);

  useEffect(() => {
    let clearHighlightId: number | undefined;

    if (initialVerseNumber && pageData) {
      const found = pageData.ayahs.find(
        (a) =>
          a.surah.number === surahNumber &&
          a.numberInSurah === initialVerseNumber
      );
      if (found) {
        const highlightId = window.setTimeout(() => {
          setHighlightedAyah(found.number);
          clearHighlightId = window.setTimeout(() => setHighlightedAyah(null), 3000);
        }, 0);

        return () => {
          window.clearTimeout(highlightId);
          if (clearHighlightId) window.clearTimeout(clearHighlightId);
        };
      }
    }
  }, [pageData, initialVerseNumber, surahNumber]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > TOTAL_MUSHAF_PAGES || page === currentPage) return;
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      setSelectedAyah(null);
      setCurrentPage(page);
      setSlideClass(page > currentPage ? "slide-in-left" : "slide-in-right");
      transitionTimer.current = setTimeout(() => setSlideClass(""), 280);
    },
    [currentPage]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const dx = touchCurrentX.current - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    isSwiping.current = Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping.current) return;
    const dx = touchCurrentX.current - touchStartX.current;
    const threshold = 50;

    // Swipe RIGHT (dx > 0) → NEXT page (page + 1)
    // Swipe LEFT  (dx < 0) → PREVIOUS page (page - 1)
    if (dx > threshold && currentPage < TOTAL_MUSHAF_PAGES) {
      goToPage(currentPage + 1);
    } else if (dx < -threshold && currentPage > 1) {
      goToPage(currentPage - 1);
    }

    isSwiping.current = false;
  }, [currentPage, goToPage]);

  const handleVerseTap = useCallback((ayah: PageAyah, e?: React.MouseEvent) => {
    setSelectedAyah((prev) => {
      if (prev === ayah.number) {
        setTimeout(() => setSelectedAyahPos(null), 0);
        return null;
      } else {
        if (e) {
          const popupWidth = 180;
          const y = e.clientY - 60;
          const x = Math.max(8, Math.min(e.clientX - popupWidth / 2, window.innerWidth - popupWidth - 8));
          setTimeout(() => setSelectedAyahPos({ x, y }), 0);
        } else {
          setTimeout(() => setSelectedAyahPos(null), 0);
        }
        return ayah.number;
      }
    });
  }, []);

  useEffect(() => {
    if (selectedAyah === null) {
      const timeoutId = window.setTimeout(() => setSelectedAyahPos(null), 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [selectedAyah]);

  const handleCopyVerse = useCallback(
    (ayah: PageAyah) => {
      const text = `${stripTajweed(ayah.text)} (${isArabic ? ayah.surah.name : ayah.surah.englishName
        }:${ayah.numberInSurah})`;
      navigator.clipboard.writeText(text);
      toast({ title: isArabic ? "تم نسخ الآية" : "Verse copied" });
      setSelectedAyah(null);
    },
    [isArabic, toast]
  );

  const handlePlayVerse = useCallback(
    (ayah: PageAyah) => {
      if (!pageData) return;

      const allVerses = pageData.ayahs.map((a) => ({
        number: { inQuran: a.number, inSurah: a.numberInSurah },
        text: a.text,
        translation: "",
      }));

      const verse = {
        number: { inQuran: ayah.number, inSurah: ayah.numberInSurah },
        text: ayah.text,
        translation: "",
      };

      const firstAyah = pageData.ayahs[0];
      const fakeSurah = {
        number: firstAyah.surah.number,
        name: firstAyah.surah.name,
        englishName: firstAyah.surah.englishName,
        englishNameTranslation: "",
        numberOfAyahs: allVerses.length,
        revelationType: "Meccan" as const,
        verses: allVerses,
      };

      playSurah(fakeSurah, verse);
      setSelectedAyah(null);
    },
    [pageData, playSurah]
  );

  const handleBookmarkVerse = useCallback(
    (ayah: PageAyah) => {
      const hizbInfo = getHizbInfo(pageData?.hizbQuarter ?? 1, "en");

      saveLastRead({
        surahName: ayah.surah.englishName,
        surahNameAr: ayah.surah.name,
        surahNumber: ayah.surah.number,
        verseNumber: ayah.numberInSurah,
        pageNumber: pageData?.pageNumber ?? currentPage,
        juzNumber: pageData?.juz ?? 1,
        hizbNumber: hizbInfo.hizbNumber,
        timestamp: Date.now(),
      });

      toast({
        title: isArabic ? "تم حفظ العلامة" : "Bookmark saved",
        description: isArabic
          ? `${ayah.surah.name} • الآية ${ayah.numberInSurah}`
          : `${ayah.surah.englishName} • Ayah ${ayah.numberInSurah}`,
      });
      setSelectedAyah(null);
    },
    [currentPage, isArabic, pageData, saveLastRead, toast]
  );

  const handleTafseerVerse = useCallback(
    (ayah: PageAyah) => {
      setSelectedAyahForTafseer(ayah);
      setTafseerOpen(true);
      setSelectedAyah(null);
    },
    []
  );

  const handlePlayPage = useCallback(() => {
    if (!pageData) return;

    const isCurrPlaying = playerState.isContinuous && playerState.isPlaying;
    if (isCurrPlaying) {
      handlePlayerClose();
      return;
    }

    const allVerses = pageData.ayahs.map((a) => ({
      number: { inQuran: a.number, inSurah: a.numberInSurah },
      text: a.text,
      translation: "",
    }));

    const firstAyah = pageData.ayahs[0];
    const fakeSurah = {
      number: firstAyah.surah.number,
      name: firstAyah.surah.name,
      englishName: firstAyah.surah.englishName,
      englishNameTranslation: "",
      numberOfAyahs: allVerses.length,
      revelationType: "Meccan" as const,
      verses: allVerses,
    };

    playSurah(fakeSurah);
  }, [pageData, playerState, playSurah, handlePlayerClose]);

  const juz = pageData?.juz || 1;
  const hizbQuarter = pageData?.hizbQuarter || 1;
  const { hizbNumber, quarterLabel } = getHizbInfo(
    hizbQuarter,
    isArabic ? "ar" : "en"
  );

  const currentSurahName = pageData
    ? (() => {
      const surahs = Object.values(pageData.surahs);
      const s = surahs[surahs.length - 1];
      return isArabic ? s.name : s.englishName;
    })()
    : "";

  const isPagePlaying = playerState.isContinuous && playerState.isPlaying;

  return (
    <div
      className={cn("mushaf-container flex flex-col overflow-hidden", playerState.showPlayer && "has-audio-player")}
      onClick={() => setSelectedAyah(null)}
    >
      <div className="mushaf-toolbar shrink-0 z-30 flex items-center gap-1 px-2 border-b border-border/40 bg-background">
        <button
          onClick={onBack}
          aria-label={isArabic ? "العودة إلى السور" : "Back to surahs"}
          className="reader-icon-button shrink-0"
        >
          <ArrowLeft className={cn("h-5 w-5", isArabic && "rotate-180")} />
        </button>

        <span className="mushaf-toolbar-name text-foreground">
          {currentSurahName}
        </span>

        <div className="mushaf-page-meta flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
          <span>{isArabic ? `ج${juz}` : `J${juz}`}</span>
          <span className="opacity-40">•</span>
          <span>
            {isArabic ? `ح${hizbNumber}` : `H${hizbNumber}`}
            {quarterLabel}
          </span>
          <span className="opacity-40">•</span>
          <span className="font-mono">{currentPage}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPage();
          }}
          aria-label={isPagePlaying ? (isArabic ? "إيقاف التلاوة" : "Stop recitation") : (isArabic ? "تشغيل الصفحة" : "Play page")}
          className="reader-icon-button shrink-0"
        >
          {isPagePlaying ? (
            <PauseCircle className="w-[18px] h-[18px] text-primary" />
          ) : (
            <PlayCircle className="w-[18px] h-[18px] text-muted-foreground" />
          )}
        </button>

        <Sheet>
          <SheetTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="reader-icon-button shrink-0"
              aria-label={isArabic ? "إعدادات القراءة" : "Reader settings"}
            >
              <Settings2 className="w-[18px] h-[18px] text-muted-foreground" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-lg border-border bg-background pb-[calc(1.5rem+var(--safe-area-bottom,0px))]"
            onClick={(e) => e.stopPropagation()}
          >
            <SheetHeader className="text-start">
              <SheetTitle>{isArabic ? "إعدادات المصحف" : "Mushaf Settings"}</SheetTitle>
            </SheetHeader>
            <div className="mt-5 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{isArabic ? "حجم الخط" : "Font Size"}</Label>
                  <span className="font-mono text-xs text-muted-foreground">{settings.fontSize}px</span>
                </div>
                <Slider
                  min={14}
                  max={24}
                  step={1}
                  value={[settings.fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                />
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 p-3">
                <div>
                  <Label htmlFor="mushaf-tajweed" className="text-sm font-semibold">
                    {isArabic ? "ألوان التجويد" : "Tajweed Colors"}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isArabic ? "متاحة لمصحف حفص فقط" : "Available for Hafs only"}
                  </p>
                </div>
                <Switch
                  id="mushaf-tajweed"
                  checked={isTajweed}
                  onCheckedChange={setQuranTajweedEnabled}
                  disabled={!canUseTajweed}
                  dir="ltr"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {isTajweed && (
        <div className="shrink-0">
          <TajweedLegend />
        </div>
      )}

      {/* Page content with swipe */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div key={isLoading ? 'loading' : currentPage} className={`mushaf-page-wrapper h-full px-2 ${slideClass}`}>
          {isLoading ? (
            <PageSkeleton />
          ) : pageData ? (
            <MushafPageContent
              page={pageData}
              isArabic={isArabic}
              isTajweed={isTajweed}
              selectedAyah={selectedAyah}
              highlightedAyah={highlightedAyah}
              onVerseTap={handleVerseTap}
              setSelectedAyah={setSelectedAyah}
              activeVerseKey={playerState.activeVerseKey}
              isPlaying={playerState.isPlaying}
              fontSize={settings.fontSize}
            />
          ) : (
            <div className="text-muted-foreground text-center py-8">
              {isArabic ? "فشل تحميل الصفحة" : "Failed to load page"}
            </div>
          )}
        </div>
      </div>

      {/* Portal-based popup */}
      {pageData && selectedAyah !== null && selectedAyahPos !== null && typeof window !== 'undefined' && createPortal(
        <div
          className="verse-action-popover fixed z-[9999] flex items-center gap-1 rounded-full px-1.5 py-1.5 border border-border"
          style={{
            top: Math.max(8, selectedAyahPos.y),
            left: selectedAyahPos.x,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {(() => {
            const verse = pageData.ayahs.find(a => a.number === selectedAyah);
            if (!verse) return null;

            const verseKey = `${verse.surah.number}:${verse.numberInSurah}`;
            const isPlaying = playerState.activeVerseKey === verseKey && playerState.isPlaying;

            return (
              <>
                <button
                  aria-label={isArabic ? "تشغيل الآية" : "Play ayah"}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  onClick={() => handlePlayVerse(verse)}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  aria-label={isArabic ? "نسخ الآية" : "Copy ayah"}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  onClick={() => handleCopyVerse(verse)}
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  aria-label={isArabic ? "حفظ العلامة" : "Bookmark ayah"}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  onClick={() => handleBookmarkVerse(verse)}
                >
                  <BookmarkPlus className="w-5 h-5" />
                </button>
                <button
                  aria-label={isArabic ? "التفسير" : "Tafseer"}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors outline-none focus:outline-none focus-visible:outline-none"
                  onClick={() => handleTafseerVerse(verse)}
                >
                  <BookOpen className="w-5 h-5" />
                </button>
              </>
            );
          })()}
        </div>,
        document.body
      )}

      {selectedAyahForTafseer && (
        <TafseerModal
          verse={{
            number: { inQuran: selectedAyahForTafseer.number, inSurah: selectedAyahForTafseer.numberInSurah },
            text: selectedAyahForTafseer.text,
            translation: "",
          }}
          surahName={isArabic ? selectedAyahForTafseer.surah.name : selectedAyahForTafseer.surah.englishName}
          surahNumber={selectedAyahForTafseer.surah.number}
          isOpen={isTafseerOpen}
          onClose={() => setTafseerOpen(false)}
        />
      )}
    </div>
  );
}

// Memoized live Quran text: audio progress does not repaint the page.
const MushafPageContent = React.memo(function MushafPageContent({
  page,
  isArabic,
  isTajweed,
  selectedAyah,
  highlightedAyah,
  onVerseTap,
  setSelectedAyah,
  activeVerseKey,
  isPlaying,
  fontSize,
}: {
  page: MushafPage;
  isArabic: boolean;
  isTajweed: boolean;
  selectedAyah: number | null;
  highlightedAyah: number | null;
  onVerseTap: (ayah: PageAyah, e: React.MouseEvent) => void;
  setSelectedAyah: (ayah: number | null) => void;
  activeVerseKey: string | null;
  isPlaying: boolean;
  fontSize: number;
}) {
  const playingRef = useRef<HTMLSpanElement>(null);
  const isOpeningPage = page.pageNumber === 1 || page.pageNumber === 2;

  // تحويل الأرقام الإنجليزية إلى عربية
  const toArabicNumerals = (num: number) => {
    return String(num).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
  };

  useEffect(() => {
    const handleScroll = () => setSelectedAyah(null);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setSelectedAyah]);

  // Auto-scroll to the currently playing verse
  useEffect(() => {
    if (playingRef.current) {
      playingRef.current.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }
  }, [activeVerseKey]);

  return (
    <div className="mushaf-reading-scroll w-full h-full overflow-y-auto overflow-x-hidden" onScroll={() => setSelectedAyah(null)}>
      <div
        className={cn("w-full quran-text mushaf-text", isOpeningPage && "mushaf-opening", isOpeningPage && ('mushaf-opening-' + page.pageNumber))}
        data-page={page.pageNumber}
        style={{ fontSize: (isOpeningPage ? Math.max(24, fontSize * 1.35) : fontSize) + 'px' }}
      >
        {page.ayahs.map((ayah) => {
          const isSelected = selectedAyah === ayah.number;
          const isHighlighted = highlightedAyah === ayah.number;
          const verseKey = `${ayah.surah.number}:${ayah.numberInSurah}`;
          const isVersePlaying = isPlaying && activeVerseKey === verseKey;
          const displayText = stripBismillah(ayah.text, ayah.surah.number, ayah.numberInSurah);

          return (
            <React.Fragment key={ayah.number}>
              {/* عنوان السورة عند بداية سورة جديدة */}
              {ayah.numberInSurah === 1 && (
                <div
                  className="mushaf-surah-heading"
                >
                  <span
                    className="font-quran text-primary"
                  >
                    {isArabic ? ayah.surah.name : `Surah ${ayah.surah.englishName}`}
                  </span>
                </div>
              )}
              {ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9 && (
                <div className="mushaf-bismillah font-quran" dir="rtl" lang="ar">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
              )}

              {/* الآية: inline تتدفق جنب بعضها */}
              <span
                ref={isVersePlaying ? playingRef : undefined}
                onClick={(e) => { e.stopPropagation(); onVerseTap(ayah, e); }}
                className={cn(
                  'mushaf-ayah cursor-pointer rounded-md transition-colors duration-200 px-1 py-0.5',
                  isSelected && (isTajweed ? 'bg-primary/5' : 'bg-primary/15 text-primary'),
                  isVersePlaying && (isTajweed ? 'playing-ayah-tajweed bg-primary/5' : 'playing-ayah bg-primary/20 text-primary'),
                  !isVersePlaying && isHighlighted && (isTajweed ? 'bg-primary/5' : 'bg-primary/10'),
                )}
                dir="rtl"
                lang="ar"
              >
                {isTajweed
                  ? <TajweedText text={displayText} lang={isArabic ? 'ar' : 'en'} />
                  : displayText
                }
                {/* رقم الآية في دائرة */}
                <span
                  className="mushaf-ayah-number"
                  aria-label={isArabic ? `الآية ${ayah.numberInSurah}` : `Ayah ${ayah.numberInSurah}`}
                >
                  <span className="mushaf-ayah-number-text">
                    {toArabicNumerals(ayah.numberInSurah)}
                  </span>
                </span>
              </span>
            </React.Fragment>
          );
        })}
        {isOpeningPage && <div className="mushaf-opening-folio" aria-hidden="true">{toArabicNumerals(page.pageNumber)}</div>}
      </div>
    </div>
  );
});
