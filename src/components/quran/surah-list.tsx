'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { SurahInfo } from '@/lib/quran';
import { getSurahList, getSurahWithTranslation } from '@/lib/quran';
import { Input } from '@/components/ui/input';
import { GlassCard } from '../glass-card';
import { useSettings } from '../providers/settings-provider';
import { Skeleton } from '../ui/skeleton';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, BookOpen, ChevronDown } from 'lucide-react';
import { useQuranSearch, type QuranSearchResult } from '@/hooks/use-quran-search';
import { cn } from '@/lib/utils';

// Juz-Surah mapping: which Juz each Surah starts in
const SURAH_JUZ_START: number[] = [
  1, 1, 3, 4, 5, 6, 7, 8, 10, 11, 11, 12, 13, 14, 14, 14, 15, 15, 16, 16,
  17, 17, 18, 18, 18, 19, 19, 20, 20, 21, 21, 21, 21, 22, 22, 22, 23, 23, 23, 24,
  24, 25, 25, 25, 25, 26, 26, 26, 26, 26, 26, 27, 27, 27, 27, 27, 27, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 29, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30
];

// Get Juz range for a Surah
function getJuzRangeForSurah(surahNumber: number): { startJuz: number; endJuz: number } {
  const startJuz = SURAH_JUZ_START[surahNumber - 1] || 1;
  // Find end Juz by checking next surah's start
  const endJuz = surahNumber < 114 ? SURAH_JUZ_START[surahNumber] || startJuz : startJuz;
  return { startJuz, endJuz: Math.max(startJuz, endJuz) };
}

// Get Hizb range (2 Hizb per Juz)
function getHizbRangeForSurah(surahNumber: number): { startHizb: number; endHizb: number } {
  const { startJuz, endJuz } = getJuzRangeForSurah(surahNumber);
  return { startHizb: (startJuz - 1) * 2 + 1, endHizb: endJuz * 2 };
}

const RESULTS_PER_PAGE = 20;
const RECENT_SEARCHES_KEY = 'aniro_recent_quran_searches';

interface SurahListProps {
  onSurahSelect: (surah: SurahInfo, initialVerse?: number) => void;
}

export function SurahList({ onSurahSelect }: SurahListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [surahs, setSurahs] = useState<SurahInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedCount, setDisplayedCount] = useState(RESULTS_PER_PAGE);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  // Use the offline verse search hook
  const { search, preload, searchResults, clearResults, isIndexing } = useQuranSearch();
  const editionMap: Record<string, string> = {
    warsh: 'quran-warsh',
  };
  const selectedEdition = settings.quranEdition === 'uthmani' && settings.quranTajweedEnabled
    ? 'quran-tajweed'
    : editionMap[settings.quranEdition] ?? 'quran-uthmani';
  const translationEdition = isArabic ? 'ar.jalalayn' : 'en.sahih';

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  const rememberSearch = useCallback((query: string) => {
    const normalized = query.trim();
    if (normalized.length < 2) return;

    setRecentSearches((previous) => {
      const next = [normalized, ...previous.filter((item) => item !== normalized)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // Best-effort UX cache only.
      }
      return next;
    });
  }, []);

  // Load surah list on mount
  useEffect(() => {
    const fetchSurahs = async () => {
      setIsLoading(true);
      try {
        const surahList = await getSurahList();
        setSurahs(surahList);
      } catch (error) {
        console.error('Failed to load surah list:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurahs();
  }, []);

  useEffect(() => {
    const run = () => {
      void preload(selectedEdition);
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(run, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(run, 0);
    return () => clearTimeout(timeoutId);
  }, [preload, selectedEdition]);

  // Debounced verse search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        void search(searchTerm, selectedEdition).then((results) => {
          if (results.length > 0) rememberSearch(searchTerm);
        });
        setDisplayedCount(RESULTS_PER_PAGE); // Reset pagination on new search
      } else {
        clearResults();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, search, selectedEdition, clearResults, rememberSearch]);

  // Handle verse result click - navigate to the verse
  const handleVerseClick = useCallback((result: QuranSearchResult) => {
    void getSurahWithTranslation(result.surahNumber, selectedEdition, translationEdition);
    router.push(`/quran?surah=${result.surahNumber}&ayah=${result.ayahNumber}`);
  }, [router, selectedEdition, translationEdition]);

  const handleSurahClick = useCallback((surah: SurahInfo) => {
    void getSurahWithTranslation(surah.number, selectedEdition, translationEdition);
    onSurahSelect(surah);
  }, [onSurahSelect, selectedEdition, translationEdition]);

  // Load more results
  const handleLoadMore = useCallback(() => {
    setDisplayedCount(prev => prev + RESULTS_PER_PAGE);
  }, []);

  // Paginated results - only render what we need
  const displayedResults = useMemo(() => {
    return searchResults.slice(0, displayedCount);
  }, [searchResults, displayedCount]);

  const hasMoreResults = searchResults.length > displayedCount;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const isSearching = searchTerm.trim().length >= 2;

  return (
    <div className="flex flex-col gap-6">
      {/* Verse Search Bar */}
      <div className="relative">
        <Search className={cn("absolute top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground", isArabic ? "right-3" : "left-3")} />
        <Input
          type="text"
          placeholder={isArabic ? "ابحث عن آية أو كلمة..." : "Search for a verse or word..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 120)}
          className={cn("h-12 rounded-lg border-border/80 bg-background/70 px-10", isArabic ? "text-right" : "text-left")}
          dir="auto"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className={cn("absolute top-1/2 h-8 w-8 -translate-y-1/2", isArabic ? "left-1" : "right-1")}
            onClick={() => {
              setSearchTerm('');
              clearResults();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isSearchFocused && !isSearching && recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">
            {isArabic ? 'آخر بحث' : 'Recent'}
          </span>
          {recentSearches.map((term) => (
            <button
              key={term}
              type="button"
              className="rounded-lg border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-medium text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setSearchTerm(term)}
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Indexing indicator */}
      {isIndexing && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{isArabic ? 'جاري تجهيز البحث...' : 'Preparing search...'}</span>
        </div>
      )}

      {/* Verse Search Results */}
      {isSearching && searchResults.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-lg font-headline">
            {isArabic
              ? `نتائج البحث (${displayedResults.length} من ${searchResults.length})`
              : `Search Results (${displayedResults.length} of ${searchResults.length})`}
          </h3>
          <div className="flex flex-col gap-2">
            {displayedResults.map((result, index) => (
              <GlassCard
                key={`${result.id}-${index}`}
                onClick={() => handleVerseClick(result)}
                className="cursor-pointer p-4 transition-colors hover:bg-foreground/10"
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
                      <span className="font-semibold">
                        {isArabic ? result.surahName : result.surahEnglishName}
                      </span>
                      <span>{isArabic ? `آية ${result.ayahNumber}` : `Ayah ${result.ayahNumber}`}</span>
                    </div>
                    <p className="font-quran text-lg text-right line-clamp-2" dir="rtl">
                      {result.ayahText}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Load More Button */}
          {hasMoreResults && (
            <Button
              variant="outline"
              className="w-full mt-2 gap-2"
              onClick={handleLoadMore}
            >
              <ChevronDown className="h-4 w-4" />
              {isArabic
                ? `تحميل المزيد (${searchResults.length - displayedCount} متبقي)`
                : `Load More (${searchResults.length - displayedCount} remaining)`}
            </Button>
          )}
        </div>
      )}

      {/* No results */}
      {isSearching && searchResults.length === 0 && !isIndexing && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>{isArabic ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
          <p className="text-sm mt-1">
            {isArabic ? 'جرّب كلمة مختلفة أو رقم آية' : 'Try a different word or ayah number'}
          </p>
        </div>
      )}

      {/* Surah List - only show when not actively searching */}
      {!isSearching && (
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-lg font-headline">{isArabic ? 'السور' : 'Surahs'}</h3>
          {surahs.map((surah) => {
            const { startJuz, endJuz } = getJuzRangeForSurah(surah.number);
            const { startHizb, endHizb } = getHizbRangeForSurah(surah.number);
            const juzText = startJuz === endJuz
              ? (isArabic ? `الجزء ${startJuz}` : `Juz ${startJuz}`)
              : (isArabic ? `الجزء ${startJuz} - ${endJuz}` : `Juz ${startJuz}-${endJuz}`);
            const hizbText = startHizb === endHizb
              ? (isArabic ? `الحزب ${startHizb}` : `Hizb ${startHizb}`)
              : (isArabic ? `الحزب ${startHizb} - ${endHizb}` : `Hizb ${startHizb}-${endHizb}`);

            return (
              <GlassCard
                key={surah.number}
                onClick={() => handleSurahClick(surah)}
                className="flex cursor-pointer items-center justify-between rounded-lg p-4 transition-transform hover:bg-foreground/10 active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary font-bold">
                    {surah.number}
                  </span>
                  <div>
                    <p className="font-quran text-2xl">{surah.name}</p>
                    <p className="text-sm text-muted-foreground">{surah.numberOfAyahs} {isArabic ? 'آيات' : 'verses'}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-semibold">{juzText}</p>
                  <p className="text-xs text-muted-foreground">{hizbText}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
