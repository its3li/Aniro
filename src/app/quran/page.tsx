'use client';
import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SurahList } from '@/components/quran/surah-list';
import { QuranReader } from '@/components/quran/quran-reader';
import type { Surah, SurahInfo } from '@/lib/quran';
import { getSurahList, getSurahWithTranslation } from '@/lib/quran';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/components/providers/settings-provider';

function QuranPageContent() {
  const searchParams = useSearchParams();
  const [selectedSurahInfo, setSelectedSurahInfo] = useState<SurahInfo | null>(null);
  const [fullSurah, setFullSurah] = useState<Surah | null>(null);
  const [initialVerseNumber, setInitialVerseNumber] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  const hasHandledParamsRef = useRef(false);

  useEffect(() => {
    if (hasHandledParamsRef.current) return;

    const surahParam = searchParams.get('surah');
    const ayahParam = searchParams.get('ayah');

    if (surahParam) {
      hasHandledParamsRef.current = true;
      const surahNumber = parseInt(surahParam, 10);
      const ayahNumber = ayahParam ? parseInt(ayahParam, 10) : undefined;

      getSurahList().then((surahs) => {
        const surah = surahs.find(s => s.number === surahNumber);
        if (surah) {
          setSelectedSurahInfo(surah);
          setInitialVerseNumber(ayahNumber);
        }
      });
    }
  }, [searchParams]);

  // Fetch full surah — uses offline-first cached function (bundled JSON → IDB → network)
  useEffect(() => {
    if (!selectedSurahInfo) {
      setFullSurah(null);
      return;
    }

    const fetchSurah = async () => {
      setIsLoading(true);
      try {
        const editionMap: Record<string, string> = {
          warsh: 'quran-warsh',
        };
        const selectedEdition = settings.quranEdition === 'uthmani' && settings.quranTajweedEnabled
          ? 'quran-tajweed'
          : editionMap[settings.quranEdition] ?? 'quran-uthmani';
        const translationEdition = isArabic ? 'ar.jalalayn' : 'en.sahih';

        const surah = await getSurahWithTranslation(
          selectedSurahInfo.number,
          selectedEdition,
          translationEdition
        );

        if (!surah) {
          throw new Error(isArabic ? 'فشل تحميل السورة' : 'Failed to load Surah');
        }

        setFullSurah(surah);
      } catch (error) {
        console.error("Failed to fetch Surah data:", error);
        toast({
          variant: "destructive",
          title: isArabic ? "فشل تحميل السورة" : "Failed to load Surah",
          description: error instanceof Error ? error.message : (isArabic ? "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى." : "Please check your internet connection and try again."),
        });
        setSelectedSurahInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurah();
  }, [selectedSurahInfo, toast, isArabic, settings.quranEdition, settings.quranTajweedEnabled]);

  const handleBack = () => {
    setSelectedSurahInfo(null);
    setFullSurah(null);
    setInitialVerseNumber(undefined);
    hasHandledParamsRef.current = false;
  }

  const handleSurahSelect = (surah: SurahInfo, initialVerse?: number) => {
    setSelectedSurahInfo(surah);
    setInitialVerseNumber(initialVerse);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="px-4 pt-4 space-y-3">
          <h1 className="text-xl font-semibold mb-2">{isArabic ? 'القرآن الكريم' : 'The Holy Quran'}</h1>
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        </div>
      );
    }

    if (fullSurah) {
      return <QuranReader surah={fullSurah} onBack={handleBack} initialVerseNumber={initialVerseNumber} />;
    }

    return (
      <div className="px-4 pt-4 animate-fade-in">
        <h1 className="text-xl font-semibold mb-4">{isArabic ? 'القرآن الكريم' : 'The Holy Quran'}</h1>
        <SurahList onSurahSelect={handleSurahSelect} />
      </div>
    );
  }

  return (
    <div>
      {renderContent()}
    </div>
  );
}

export default function QuranPage() {
  return (
    <Suspense fallback={<div className="px-4 pt-4" />}>
      <QuranPageContent />
    </Suspense>
  );
}
