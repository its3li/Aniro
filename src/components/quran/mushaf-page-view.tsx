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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAudioPlayer } from "../providers/audio-player-provider";
import { useLastRead } from "@/hooks/use-last-read";

interface MushafPageViewProps {
  surahNumber: number;
  initialVerseNumber?: number;
  onBack: () => void;
}

// ============================================
// Main Component
// ============================================
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
  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [selectedAyahForTafseer, setSelectedAyahForTafseer] = useState<PageAyah | null>(null);
  const [isTafseerOpen, setTafseerOpen] = useState(false);

  // Swipe
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchCurrentX = useRef(0);
  const isSwiping = useRef(false);
  const [slideClass, setSlideClass] = useState("");

  // Edition mapping
  const editionMap: Record<string, string> = {
    uthmani: "quran-uthmani",
    tajweed: "quran-tajweed",
    warsh: "quran-warsh",
  };
  const edition = editionMap[settings.quranEdition] || "quran-uthmani";

  // Fetch current page
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

    // Pre-fetch adjacent
    if (currentPage > 1) getPageData(currentPage - 1, edition);
    if (currentPage < TOTAL_MUSHAF_PAGES) getPageData(currentPage + 1, edition);

    return () => {
      cancelled = true;
    };
  }, [currentPage, edition]);

  // Highlight initial verse
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

  // Track target verse across page loads
  const targetVerseRef = useRef<number | null>(null);

  // Find correct page for initial verse
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When page data loads, select and highlight the target verse
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

  // Page navigation with slide animation
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > TOTAL_MUSHAF_PAGES || page === currentPage) return;
      const isForward = page > currentPage;

      setSlideClass(isForward ? "slide-out-right" : "slide-out-left");
      setTimeout(() => {
        setCurrentPage(page);
        setSlideClass(isForward ? "slide-in-left" : "slide-in-right");
        setTimeout(() => setSlideClass(""), 250);
      }, 200);
    },
    [currentPage]
  );

  // === SWIPE — RTL: swipe RIGHT = next page (forward), swipe LEFT = previous ===
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

    if (dx > threshold && currentPage < TOTAL_MUSHAF_PAGES) {
      goToPage(currentPage + 1);
    } else if (dx < -threshold && currentPage > 1) {
      goToPage(currentPage - 1);
    }

    isSwiping.current = false;
  }, [currentPage, goToPage]);

  // Verse interaction handlers
  const handleVerseTap = useCallback((ayah: PageAyah) => {
    setSelectedAyah((prev) => (prev === ayah.number ? null : ayah.number));
  }, []);

  const handleCopyVerse = useCallback(
    (ayah: PageAyah) => {
      const text = `${stripTajweed(ayah.text)} (${
        isArabic ? ayah.surah.name : ayah.surah.englishName
      }:${ayah.numberInSurah})`;
      navigator.clipboard.writeText(text);
      toast({ title: isArabic ? "تم نسخ الآية" : "Verse copied" });
      setSelectedAyah(null);
    },
    [isArabic, toast]
  );

  const handlePlayVerse = useCallback(
    (ayah: PageAyah) => {
      const verse = {
        number: { inQuran: ayah.number, inSurah: ayah.numberInSurah },
        text: ayah.text,
        translation: "",
      };
      const surah = {
        number: ayah.surah.number,
        name: ayah.surah.name,
        englishName: ayah.surah.englishName,
        englishNameTranslation: "",
        numberOfAyahs: 0,
        revelationType: "Meccan" as const,
        verses: [verse],
      };
      playVerse(surah, verse);
      setSelectedAyah(null);
    },
    [playVerse]
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

  // Play all verses on current page continuously
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

  // Page header info
  const juz = pageData?.juz || 1;
  const hizbQuarter = pageData?.hizbQuarter || 1;
  const { hizbNumber, quarterLabel } = getHizbInfo(
    hizbQuarter,
    isArabic ? "ar" : "en"
  );

  // Current surah name — use the last surah on the page
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
      {/* Fixed header */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center gap-2 px-2 py-1.5 border-b border-border/40 bg-background/95 backdrop-blur-md">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-foreground/10 transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
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

      {/* Spacer for fixed header */}
      <div className="h-[40px] shrink-0" />

      {/* Tajweed legend */}
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
            />
          ) : (
            <div className="text-muted-foreground text-center py-8">
              {isArabic ? "فشل تحميل الصفحة" : "Failed to load page"}
            </div>
          )}
        </div>
      </div>

      {/* Portal-based popup */}
      {pageData && selectedAyah !== null && (
        <AyahPopupPortal
          page={pageData}
          selectedAyah={selectedAyah}
          playerState={playerState}
          onPlay={handlePlayVerse}
          onCopy={handleCopyVerse}
          onBookmark={handleBookmarkVerse}
          onTafseer={handleTafseerVerse}
          onClose={() => setSelectedAyah(null)}
        />
      )}

      {/* Tafseer Modal */}
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

// ============================================
// Page Content Component
// ============================================
const MushafPageContent = React.memo(function MushafPageContent({
  page,
  isArabic,
  isTajweed,
  selectedAyah,
  highlightedAyah,
  onVerseTap,
}: {
  page: MushafPage;
  isArabic: boolean;
  isTajweed: boolean;
  selectedAyah: number | null;
  highlightedAyah: number | null;
  onVerseTap: (ayah: PageAyah) => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const adjustScale = () => {
      if (!contentRef.current) return;
      const content = contentRef.current;
      const container = content.parentElement;
      if (!container) return;

      const contentHeight = content.scrollHeight;
      const contentWidth = content.scrollWidth;
      const containerHeight = container.clientHeight;
      const containerWidth = container.clientWidth;

      const heightScale = containerHeight / contentHeight;
      const widthScale = containerWidth / contentWidth;
      const newScale = Math.min(1, heightScale, widthScale);

      setScale(Math.max(0.4, newScale));
    };

    requestAnimationFrame(adjustScale);
    window.addEventListener("resize", adjustScale);
    return () => window.removeEventListener("resize", adjustScale);
  }, [page]);

  const surahGroups = useMemo(() => {
    const groups: {
      surahNumber: number;
      surahName: string;
      ayahs: typeof page.ayahs;
      isNewSurah: boolean;
    }[] = [];
    let currentSurahNum = -1;

    for (const ayah of page.ayahs) {
      if (ayah.surah.number !== currentSurahNum) {
        currentSurahNum = ayah.surah.number;
        groups.push({
          surahNumber: ayah.surah.number,
          surahName: isArabic ? ayah.surah.name : ayah.surah.englishName,
          ayahs: [],
          isNewSurah: ayah.numberInSurah === 1,
        });
      }
      groups[groups.length - 1].ayahs.push(ayah);
    }
    return groups;
  }, [page.ayahs, isArabic]);

  return (
    <div className="h-full w-full overflow-hidden flex items-start justify-center">
      <div
        ref={contentRef}
        className="mushaf-page font-quran text-[1.2rem] leading-[2.2] text-justify w-full max-w-[920px] overflow-hidden"
        dir="rtl"
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {surahGroups.map((group, gi) => (
          <div key={`${group.surahNumber}-${gi}`}>
            {/* Surah header */}
            {group.isNewSurah && (
              <div className="flex items-center justify-center my-2">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-1 text-center">
                  <p className="font-quran text-base text-primary font-bold">
                    {group.surahName}
                  </p>
                </div>
              </div>
            )}

            {/* Bismillah */}
            {group.isNewSurah &&
              group.surahNumber !== 1 &&
              group.surahNumber !== 9 && (
                <p className="text-center text-sm text-muted-foreground mb-1 font-quran">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
              )}

            {/* Verses */}
            {group.ayahs.map((ayah) => {
              const isSelected = selectedAyah === ayah.number;
              const isHighlighted = highlightedAyah === ayah.number;

              return (
                <span
                  key={ayah.number}
                  data-ayah-number={ayah.number}
                  className={`inline relative cursor-pointer select-none ${
                    isHighlighted ? "mushaf-highlight" : ""
                  } ${isSelected ? "bg-primary/15 rounded px-1" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerseTap(ayah);
                  }}
                >
                  {isTajweed ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: parseTajweed(ayah.text),
                      }}
                    />
                  ) : (
                    <span>{ayah.text}</span>
                  )}
                  <span className="inline-flex items-center justify-center mx-0.5 text-primary font-sans text-[0.6rem] align-middle select-none">
                    ﴿{toArabicNumber(ayah.numberInSurah)}﴾
                  </span>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

// ============================================
// Portal Popup Component - Completely separate from scaled container
// ============================================
function AyahPopupPortal({
  page,
  selectedAyah,
  playerState,
  onPlay,
  onCopy,
  onBookmark,
  onTafseer,
  onClose,
}: {
  page: MushafPage;
  selectedAyah: number;
  playerState: any;
  onPlay: (ayah: PageAyah) => void;
  onCopy: (ayah: PageAyah) => void;
  onBookmark: (ayah: PageAyah) => void;
  onTafseer: (ayah: PageAyah) => void;
  onClose: () => void;
}) {
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Calculate position based on the selected ayah element
  useEffect(() => {
    const updatePosition = () => {
      const ayahEl = document.querySelector(`[data-ayah-number="${selectedAyah}"]`) as HTMLElement;
      if (!ayahEl) return;

      const ayahRect = ayahEl.getBoundingClientRect();
      const popupWidth = 160;
      const popupHeight = 44;
      const padding = 12;
      
      // Default: center above the ayah
      let left = ayahRect.left + (ayahRect.width / 2) - (popupWidth / 2);
      let top = ayahRect.top - popupHeight - padding;
      
      // Clamp to screen edges
      const maxLeft = window.innerWidth - popupWidth - padding;
      left = Math.max(padding, Math.min(left, maxLeft));
      
      // If not enough space above, show below
      if (top < padding + 50) {
        top = ayahRect.bottom + padding;
      }
      
      // Ensure it doesn't go off bottom
      const maxTop = window.innerHeight - popupHeight - padding;
      top = Math.min(top, maxTop);
      
      setPosition({ top, left, width: popupWidth });
    };

    // Initial calculation
    updatePosition();
    
    // Re-calculate after a short delay to ensure layout is stable
    const timeout = setTimeout(updatePosition, 50);
    
    // Update on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [selectedAyah]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      const isInsidePopup = popupRef.current?.contains(target);
      const isInsideAyah = target.closest('[data-ayah-number]') !== null;
      
      if (!isInsidePopup && !isInsideAyah) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  const ayah = page.ayahs.find(a => a.number === selectedAyah);
  if (!ayah || !position) return null;

  const verseKey = `${ayah.surah.number}:${ayah.numberInSurah}`;
  const isPlaying = playerState.activeVerseKey === verseKey && playerState.isPlaying;

  const buttonClass = "w-9 h-9 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors touch-manipulation";

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] flex items-center gap-1 bg-background/95 backdrop-blur-sm shadow-xl rounded-full px-2 py-1.5 border border-border"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay(ayah);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay(ayah);
        }}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopy(ayah);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopy(ayah);
        }}
      >
        <Copy className="w-4 h-4" />
      </button>
      
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBookmark(ayah);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBookmark(ayah);
        }}
      >
        <BookmarkPlus className="w-4 h-4" />
      </button>
      
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTafseer(ayah);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTafseer(ayah);
        }}
      >
        <BookOpen className="w-4 h-4" />
      </button>
    </div>,
    document.body
  );
}

// ============================================
// Skeleton Loader
// ============================================
function PageSkeleton() {
  return (
    <div className="space-y-3 py-4 w-full">
      <Skeleton className="h-8 w-40 mx-auto rounded-xl" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-11/12" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-10/12" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-9/12" />
    </div>
  );
}

// ============================================
// Utilities
// ============================================
function toArabicNumber(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}
