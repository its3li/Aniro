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

    if (dx > threshold && currentPage < TOTAL_MUSHAF_PAGES) {
      goToPage(currentPage + 1);
    } else if (dx < -threshold && currentPage > 1) {
      goToPage(currentPage - 1);
    }

    isSwiping.current = false;
  }, [currentPage, goToPage]);

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

      {/* Portal-based popup (Uncomment if AyahPopup is available and imported) */}
      {/* {pageData && selectedAyah !== null && typeof window !== 'undefined' && createPortal(
        <AyahPopup 
          page={pageData}
          selectedAyah={selectedAyah}
          isArabic={isArabic}
          playerState={playerState}
          onPlay={handlePlayVerse}
          onCopy={handleCopyVerse}
          onBookmark={handleBookmarkVerse}
          onTafseer={handleTafseerVerse}
          onClose={() => setSelectedAyah(null)}
        />,
        document.body
      )} */}

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
  onVerseTap: (ayah: PageAyah) => void;
  setSelectedAyah: (ayah: number | null) => void;
  playerState: any;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fitTextToScreen = () => {
      if (!contentRef.current) return;
      const content = contentRef.current;
      const container = content.parentElement;
      if (!container) return;

      // 1. إعطاء النص صلاحية التمدد الكامل
      content.style.width = '100%';
      content.style.transform = 'none'; 
      content.style.textAlign = 'justify';
      content.style.textAlignLast = 'center';

      // 2. خوارزمية العرض: البحث عن أقصى حجم خط ممكن (رفعنا الحد الأقصى لـ 100 للشاشات الدقيقة)
      let minFont = 14; 
      let maxFont = 100; 
      let optimalFont = 22;
      
      // نثبت تباعد الأسطر المبدئي أثناء قياس الخط
      content.style.lineHeight = '1.5';

      while (minFont <= maxFont) {
        let midFont = Math.floor((minFont + maxFont) / 2);
        content.style.fontSize = `${midFont}px`;

        if (content.scrollHeight <= container.clientHeight && content.scrollWidth <= container.clientWidth) {
          optimalFont = midFont;
          minFont = midFont + 1; 
        } else {
          maxFont = midFont - 1; 
        }
      }
      
      content.style.fontSize = `${optimalFont}px`;

      // 3. خوارزمية الطول: البحث عن أفضل تباعد بين الأسطر لملء الفراغ (فوق وتحت)
      let optimalLH = 1.5;
      for (let lh = 1.5; lh <= 2.8; lh += 0.05) {
        content.style.lineHeight = `${lh}`;
        // إذا كان النص سيبدأ بالخروج من الشاشة، نتوقف
        if (content.scrollHeight <= container.clientHeight) {
          optimalLH = lh;
        } else {
          break;
        }
      }
      
      // تطبيق أفضل تباعد أسطر وجدناه
      content.style.lineHeight = `${optimalLH}`;
    };

    const frame = requestAnimationFrame(fitTextToScreen);

    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && contentRef.current?.parentElement) {
      resizeObserver = new ResizeObserver(fitTextToScreen);
      resizeObserver.observe(contentRef.current.parentElement);
    }

    window.addEventListener("resize", fitTextToScreen);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", fitTextToScreen);
    };
  }, [page]);

  useEffect(() => {
    const handleScroll = () => setSelectedAyah(null);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [setSelectedAyah]);

  const surahGroups: {
    surahNumber: number;
    surahName: string;
    ayahs: typeof page.ayahs;
    isNewSurah: boolean;
  }[] = [];
  let currentSurahNum = -1;

  for (const ayah of page.ayahs) {
    if (ayah.surah.number !== currentSurahNum) {
      currentSurahNum = ayah.surah.number;
      surahGroups.push({
        surahNumber: ayah.surah.number,
        surahName: isArabic ? ayah.surah.name : ayah.surah.englishName,
        ayahs: [],
        isNewSurah: ayah.numberInSurah === 1,
      });
    }
    surahGroups[surahGroups.length - 1].ayahs.push(ayah);
  }

  return (
    // تم تقليل المسافات لأقصى حد (px-1) لكي يلامس النص الحواف اليمين واليسار
    <div className="w-full h-full flex items-center justify-center overflow-hidden px-1">
      <div
        ref={contentRef}
        // أزلنا الـ py-6 واستخدمنا pb-2 فقط كحماية للتشكيل في آخر سطر
        className="w-full font-quran pb-2"
        dir="rtl"
      >
        {surahGroups.map((group, groupIdx) => (
          <div key={group.surahNumber} className="mb-2 last:mb-0">
            {group.isNewSurah && (
              // تم إضافة mx-2 لعنوان السورة حتى لا يلتصق هو الآخر بالأطراف تماماً
              <div className="surah-header text-center font-bold text-xl mb-3 p-2 bg-secondary/20 rounded-lg mx-2">
                سورة {group.surahName}
              </div>
            )}
            <div className="w-full block" style={{ textAlign: 'justify', textAlignLast: 'center' }}>
              {group.ayahs.map((ayah) => {
                const isSelected = selectedAyah === ayah.number;
                const isHighlighted = highlightedAyah === ayah.number;
                const isPlaying = playerState.isPlaying && playerState.currentVerse?.number.inQuran === ayah.number;
                
                const displayText = stripBismillah(ayah.text, ayah.surah.number, ayah.numberInSurah);

                return (
                  <span
                    key={ayah.number}
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerseTap(ayah);
                    }}
                    className={`inline cursor-pointer transition-colors duration-200 ${
                      isSelected ? 'bg-primary/20 text-primary rounded px-1' : ''
                    } ${isHighlighted || isPlaying ? 'text-primary' : ''}`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: isTajweed ? parseTajweed(displayText) : displayText }} />
                    <span className="mx-1 text-primary text-sm">
                      ﴿{ayah.numberInSurah}﴾
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
