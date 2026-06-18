'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useSettings } from '@/components/providers/settings-provider';

const STORAGE_KEY = 'tasbeeh_custom_adhkar';
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
    return { adhkar: defaultAdhkar, counts: {} as Record<string, number> };
  }

  try {
    const storedAdhkar = window.localStorage.getItem(STORAGE_KEY);
    const parsedAdhkar = storedAdhkar ? JSON.parse(storedAdhkar) : [];
    const customAdhkar = Array.isArray(parsedAdhkar) && parsedAdhkar.every(item => typeof item === 'string')
      ? parsedAdhkar
      : [];

    const storedCounts = window.localStorage.getItem(COUNTS_KEY);
    const parsedCounts = storedCounts ? JSON.parse(storedCounts) : {};
    const counts = parsedCounts && typeof parsedCounts === 'object' && !Array.isArray(parsedCounts)
      ? parsedCounts as Record<string, number>
      : {};

    return { adhkar: [...defaultAdhkar, ...customAdhkar], counts };
  } catch {
    return { adhkar: defaultAdhkar, counts: {} as Record<string, number> };
  }
}

export default function TasbeehPage() {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const [adhkar, setAdhkar] = useState<string[]>(defaultAdhkar);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newDhikr, setNewDhikr] = useState('');
  const [isPressed, setIsPressed] = useState(false);
  const hasLoadedStorageRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const stored = loadStoredTasbeeh();
      setAdhkar(stored.adhkar);
      setCounts(stored.counts);
      hasLoadedStorageRef.current = true;
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!hasLoadedStorageRef.current) return;
    try {
      const customAdhkar = adhkar.filter(dhikr => !defaultAdhkar.includes(dhikr));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customAdhkar));
    } catch {}
  }, [adhkar]);

  useEffect(() => {
    if (!hasLoadedStorageRef.current) return;
    try {
      localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
    } catch {}
  }, [counts]);

  const currentDhikr = adhkar[currentIndex] || defaultAdhkar[0];
  const currentCount = counts[currentDhikr] || 0;

  const goNext = () => setCurrentIndex(prev => (prev + 1) % adhkar.length);
  const goPrev = () => setCurrentIndex(prev => (prev - 1 + adhkar.length) % adhkar.length);

  const incrementCount = () => {
    setCounts(prev => ({ ...prev, [currentDhikr]: (prev[currentDhikr] || 0) + 1 }));
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 150);
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const resetCount = () => {
    setCounts(prev => ({ ...prev, [currentDhikr]: 0 }));
  };

  const handleAddDhikr = () => {
    const value = newDhikr.trim();
    if (!value) return;
    if (adhkar.includes(value)) {
      setNewDhikr('');
      setIsAddOpen(false);
      return;
    }
    setAdhkar(prev => [...prev, value]);
    setCurrentIndex(adhkar.length);
    setNewDhikr('');
    setIsAddOpen(false);
  };

  return (
    <div className="min-h-screen px-4 pt-4 pb-24 animate-fade-in">
      <div className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md flex-col items-center gap-5">
        {/* Dhikr Navigation */}
        <section className="w-full rounded-[2rem] border border-border bg-card px-4 py-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{isArabic ? 'السبحة الإلكترونية' : 'Electronic Tasbeeh'}</h1>
              <p className="text-sm text-muted-foreground">{isArabic ? 'اضغط على الزرار لزيادة العداد' : 'Press the button to increment the counter'}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 shrink-0 rounded-2xl"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={goPrev}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1 px-2 text-center">
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground/80">{isArabic ? 'الذكر الحالي' : 'Current dhikr'}</div>
              <div className="mt-2 rounded-[1.5rem] border border-primary/15 bg-primary/5 px-4 py-4">
                <p className="font-quran text-2xl leading-[2] text-foreground">{currentDhikr}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={goNext}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </section>

        <section className="w-full select-none rounded-[2rem] border border-border bg-card px-4 py-5 shadow-sm">
          <div className="rounded-2xl border border-accent/15 bg-accent/10 px-4 py-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
              {isArabic ? 'العداد' : 'Counter'}
            </p>
            <p
              className="mt-2 font-mono text-6xl font-black leading-none tabular-nums text-accent transition-transform duration-150 dark:text-primary"
              style={{ transform: isPressed ? 'scale(1.06)' : 'scale(1)' }}
            >
              {currentCount}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-[3.25rem_1fr] items-center gap-3">
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
            <Button
              type="button"
              className="h-16 rounded-2xl text-lg font-bold active:scale-[0.98]"
              onClick={incrementCount}
            >
              {isArabic ? 'تسبيح' : 'Count'}
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'إضافة ذكر جديد' : 'Add new dhikr'}</DialogTitle>
            <DialogDescription>
              {isArabic ? 'اكتب الذكر الذي تريد إضافته وسيظهر ضمن الأسهم.' : 'Add a custom dhikr and it will appear in the navigation list.'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newDhikr}
            onChange={(e) => setNewDhikr(e.target.value)}
            placeholder={isArabic ? 'مثال: سبحان الله وبحمده' : 'Example: Subhan Allah wa bihamdih'}
            className="text-right font-quran"
            dir="auto"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddDhikr();
              }
            }}
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>{isArabic ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleAddDhikr}>{isArabic ? 'إضافة' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
