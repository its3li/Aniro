'use client';

import { useEffect, useRef, useState } from 'react';
import { CaretLeftIcon as ChevronLeft } from '@/components/icons/interface-icons';
import { CaretRightIcon as ChevronRight } from '@/components/icons/interface-icons';
import { ArrowCounterClockwiseIcon as RotateCcw } from '@/components/icons/interface-icons';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/components/providers/settings-provider';
import { PageHeading } from '@/components/page-heading';

const COUNTS_KEY = 'tasbeeh_counts';

const defaultAdhkar = [
  'سُبْحَانَ ٱللَّٰهِ',
  'ٱلْحَمْدُ لِلَّٰهِ',
  'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ',
  'ٱللَّٰهُ أَكْبَرُ',
  'أَسْتَغْفِرُ ٱللَّٰهَ',
  'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ',
];

function loadStoredTasbeeh() {
  if (typeof window === 'undefined') {
    return { counts: {} as Record<string, number> };
  }

  try {
    const storedCounts = window.localStorage.getItem(COUNTS_KEY);
    const parsedCounts = storedCounts ? JSON.parse(storedCounts) : {};
    const counts = parsedCounts && typeof parsedCounts === 'object' && !Array.isArray(parsedCounts)
      ? parsedCounts as Record<string, number>
      : {};

    return { counts };
  } catch {
    return { counts: {} as Record<string, number> };
  }
}

export default function TasbeehPage() {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const hasLoadedStorageRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = loadStoredTasbeeh();
      setCounts(stored.counts);
      hasLoadedStorageRef.current = true;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorageRef.current) return;
    try {
      localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
    } catch {}
  }, [counts]);

  const currentDhikr = defaultAdhkar[currentIndex] || defaultAdhkar[0];
  const currentCount = counts[currentDhikr] || 0;

  const goNext = () => setCurrentIndex(prev => (prev + 1) % defaultAdhkar.length);
  const goPrev = () => setCurrentIndex(prev => (prev - 1 + defaultAdhkar.length) % defaultAdhkar.length);

  const incrementCount = () => {
    setCounts(prev => ({ ...prev, [currentDhikr]: (prev[currentDhikr] || 0) + 1 }));
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const resetCount = () => {
    setCounts(prev => ({ ...prev, [currentDhikr]: 0 }));
  };

  return (
    <div className="app-page tasbeeh-page animate-fade-in">
      <PageHeading title="One remembrance at a time" titleAr="ذكرٌ بعد ذكر" description="A quiet space for your daily tasbeeh." descriptionAr="مساحة هادئة لتسبيحك اليومي." />
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        {/* Dhikr Navigation */}
        <section className="tasbeeh-selector w-full">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={goPrev} aria-label={isArabic ? 'الذكر السابق' : 'Previous dhikr'}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1 px-2 text-center">
              <div className="px-2 py-4">
                <p className="font-quran text-2xl leading-[2] text-foreground">{currentDhikr}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={goNext} aria-label={isArabic ? 'الذكر التالي' : 'Next dhikr'}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </section>

        <section className="w-full select-none">
          <button type="button" onClick={incrementCount} aria-label={isArabic ? 'تسبيح، زيادة العداد' : 'Count, increment tasbeeh'} className="counter-dial">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {isArabic ? 'العداد' : 'Counter'}
            </p>
            <p key={currentCount}
              className="counter-value mt-2 font-mono text-6xl font-black leading-none tabular-nums text-accent dark:text-primary"
            >
              {new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en-US').format(currentCount)}
            </p>
            <span>{isArabic ? 'اضغط للتسبيح' : 'Tap to count'}</span>
          </button>

          <div className="counter-reset">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl"
              onClick={resetCount}
              aria-label={isArabic ? 'تصفير العداد' : 'Reset counter'}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
