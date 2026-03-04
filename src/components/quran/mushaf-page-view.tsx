"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
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
import { parseTajweed, stripTajweed } from "@/lib/tajweed";
import { useSettings } from "../providers/settings-provider";
import { Skeleton } from "../ui/skeleton";
import { TajweedLegend } from "./tajweed-legend";
import { TafseerModal } from "./tafseer-modal";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Pause,
  Copy,
  PlayCircle,
  PauseCircle,
  BookmarkPlus,
  BookOpen,
} from "lucide-react";
import { useAudioPlayer } from "../providers/audio-player-provider";
import { useLastRead } from "@/hooks/use-last-read";

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
  onBack: () => void;
}

export function MushafPageView({
  surahNumber,
  initialVerseNumber,
  onBack,
}: MushafPageViewProps) {
  const { settings } = useSettings();
  const isArabic = settings.language === "ar";
  const isTajweed = settings.quranEdition === "tajweed";
  const { toast } = useToast();
  const {
    playerState,
    playVerse,
    playSurah,
    handlePlayPause,
    handlePlayerClose,
  } = useAudioPlayer();
  const { saveLastRead } = useLastRead();

  const { startPage } = getPageRange(surahNumber);

  const [currentPage, setCurrentPage] = useState(startPage);
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
  const touchCurrentX = useRef(0);
  const isSwiping = useRef(false);
  const [slideClass, setSlideClass] = useState("");

  const editionMap: Record<string, string> = {
    uthmani: "quran-uthmani",
    tajweed: "quran-tajweed",
    warsh: "quran-warsh",
  };
  const edition = editionMap[settings.quranEdition] || "quran-uthmani";

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
    if (initialVerseNumber && pageData) {
      const found = pageData.ayahs.find(
        (a) =>
          a.surah.number === surahNumber &&
          a.numberInSurah === initialVerseNumber
      );
      if (found) {
        setHighlightedAyah(found.number);
        setTimeout(() => setHighlightedAyah(null), 3000);
      }
    }
  }, [pageData, initialVerseNumber, surahNumber]);

  const targetVerseRef = useRef<number | null>(null);

  useEffect(() => {
    if (!initialVerseNumber) return;
    const findPage = async () => {
      const { startPage: sp, endPage: ep } = getPageRange(surahNumber);
      for (let p = sp; p <= ep; p++) {
        const data = await getPageData(p, edition);
        if (data) {
          const found = data.ayahs.find(
            (a) =>
              a.surah.number === surahNumber &&
              a.numberInSurah === initialVerseNumber
          );
          if (found) {
            targetVerseRef.current = found.number;
            setCurrentPage(p);
            return;
          }
        }
      }
    };
    findPage();
  }, []);

  useEffect(() => {
    if (pageData && targetVerseRef.current) {
      const foundOnPage = pageData.ayahs.find(a => a.number === targetVerseRef.current);
      if (foundOnPage) {
        setSelectedAyah(foundOnPage.number);
        setHighlightedAyah(foundOnPage.number);
        targetVerseRef.current = null;
      }
    }
  }, [pageData]);

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > TOTAL_MUSHAF_PAGES || page === currentPage) return;
      const isForward = page > currentPage;

      // Because Arabic is RTL:
      // Forward (Next page) means swiping right (dx > 0) -> Old page slides out right, new slides in from left
      // Backward (Prev page) means swiping left (dx < 0) -> Old page slides out left, new slides in from right
      setSlideClass(isForward ? "slide-out-right" : "slide-out-left");
      setTimeout(() => {
        setCurrentPage(page);
        setSlideClass(isForward ? "slide-in-left" : "slide-in-right");
        setTimeout(() => setSlideClass(""), 250);
      }, 200);
    },
    [currentPage]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0].clientX;
    const dx = touchCurrentX.current - touchStartX.current;
    if (!isSwiping.current && Math.abs(dx) > 15) {
      isSwiping.current = true;
    }
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
          const y = e.clientY - 60;
          const x = Math.max(8, Math.min(e.clientX - 90, window.innerWidth - 188));
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
      setSelectedAyahPos(null);
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
      className="mushaf-container flex h-[100dvh] flex-col overflow-hidden"
      onClick={() => setSelectedAyah(null)}
    >
      <div className="shrink-0 z-30 flex items-center gap-2 px-2 pb-2 border-b border-border/40 bg-background/95 pt-[max(env(safe-area-inset-top,20px),_0.75rem)]">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
        </button>

        <span className="font-quran text-sm text-foreground truncate">
          {currentSurahName}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
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
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors shrink-0"
        >
          {isPagePlaying ? (
            <PauseCircle className="w-[18px] h-[18px] text-primary" />
          ) : (
            <PlayCircle className="w-[18px] h-[18px] text-muted-foreground" />
          )}
        </button>
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
        <div className={`mushaf-page-wrapper h-full px-2 ${slideClass}`}>
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
              playerState={playerState}
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
          className="fixed z-[9999] flex items-center gap-1 bg-background shadow-xl rounded-full px-2 py-1.5 border border-border"
          style={{
            top: Math.max(8, selectedAyahPos.y),
            left: selectedAyahPos.x,
            width: '180px',
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
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  onClick={() => handlePlayVerse(verse)}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  onClick={() => handleCopyVerse(verse)}
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors"
                  onClick={() => handleBookmarkVerse(verse)}
                >
                  <BookmarkPlus className="w-5 h-5" />
                </button>
                <button
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

// ============================================================
// مكون محتوى الصفحة
// ============================================================
// ============================================================
// مكون محتوى الصفحة (بعد التحديث الجذري لملء الشاشة بالكامل)
// ============================================================
// ============================================================
// مكون محتوى الصفحة (محاذاة كاملة للأطراف مع تحسين المسافات)
// ============================================================
const MushafPageContent = React.memo(function MushafPageContent({
  page,
  isArabic,
  isTajweed,
  selectedAyah,
  highlightedAyah,
  onVerseTap,
  setSelectedAyah,
  playerState,
}: {
  page: MushafPage;
  isArabic: boolean;
  isTajweed: boolean;
  selectedAyah: number | null;
  highlightedAyah: number | null;
  onVerseTap: (ayah: PageAyah, e: React.MouseEvent) => void;
  setSelectedAyah: (ayah: number | null) => void;
  playerState: any;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const playingRef = useRef<HTMLSpanElement>(null);

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
      playingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [playerState.activeVerseKey]);

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden px-4 py-4">
      <div
        ref={contentRef}
        className="w-full quran-text"
        style={{ fontSize: '1.25rem' }}
      >
        {page.ayahs.map((ayah) => {
          const isSelected = selectedAyah === ayah.number;
          const isHighlighted = highlightedAyah === ayah.number;
          const verseKey = `${ayah.surah.number}:${ayah.numberInSurah}`;
          const isPlaying = playerState.isPlaying && playerState.activeVerseKey === verseKey;
          const displayText = stripBismillah(ayah.text, ayah.surah.number, ayah.numberInSurah);

          return (
            <React.Fragment key={ayah.number}>
              {/* عنوان السورة عند بداية سورة جديدة */}
              {ayah.numberInSurah === 1 && (
                <div
                  className="w-full text-center my-3 py-2 px-4 rounded-xl border border-primary/30 bg-primary/5"
                  style={{ lineHeight: 'normal' }}
                >
                  <span
                    className="font-bold text-primary text-base"
                    style={{ fontFamily: '"Noto Naskh Arabic","Scheherazade New","Amiri",serif' }}
                  >
                    {isArabic ? ayah.surah.name : `Surah ${ayah.surah.englishName}`}
                  </span>
                </div>
              )}

              {/* الآية: inline تتدفق جنب بعضها */}
              <span
                ref={isPlaying ? playingRef : undefined}
                onClick={(e) => { e.stopPropagation(); onVerseTap(ayah, e); }}
                className={cn(
                  'cursor-pointer rounded-md transition-all duration-500 ease-in-out px-1 py-0.5',
                  isSelected && 'bg-primary/15 text-primary',
                  isPlaying && 'playing-ayah bg-primary/20 text-primary',
                  !isPlaying && isHighlighted && 'bg-primary/10',
                )}
              >
                {isTajweed
                  ? <span dangerouslySetInnerHTML={{ __html: parseTajweed(displayText, isArabic ? 'ar' : 'en') }} />
                  : displayText
                }
                {/* رقم الآية في دائرة */}
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 0.25em', fontSize: '0.6em', lineHeight: 1 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '1.9em', height: '1.9em',
                    border: '1px solid hsl(var(--primary))',
                    color: 'hsl(var(--primary))',
                    borderRadius: '50%',
                    fontFamily: 'serif',
                    lineHeight: 1,
                  }}>
                    {toArabicNumerals(ayah.numberInSurah)}
                  </span>
                </span>
                {' '}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
});
