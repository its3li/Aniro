'use client';
import { useState, useEffect } from 'react';
import type { AzkarItem } from "@/lib/azkar";
import { Button } from '@/components/ui/button';
import { ArrowCounterClockwiseIcon as RotateCcw } from '@/components/icons/interface-icons';
import { WarningIcon as AlertTriangle } from '@/components/icons/interface-icons';
import { cn } from '@/lib/utils';
import { useSettings } from '../providers/settings-provider';
import { localDayKey, readAzkarProgress } from '@/lib/azkar-progress';

interface ZikrCardProps {
  item: AzkarItem;
  categoryId: string;
  index: number;
  day: string;
}

export function ZikrCard({ item, categoryId, index, day }: ZikrCardProps) {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const repetitions = item.repetitions ?? 1;
  const [progressState, setProgressState] = useState({ key: '', day: '', remaining: repetitions });
  const persistenceKey = `azkar_progress_${categoryId}_${index}`;
  const isLoaded = progressState.key === persistenceKey && progressState.day === day && day !== '';
  const count = isLoaded ? progressState.remaining : repetitions;

  useEffect(() => {
    if (!day) return;
    const timeoutId = window.setTimeout(() => {
      let remaining = repetitions;
      try {
        remaining = readAzkarProgress(localStorage.getItem(persistenceKey), day, repetitions);
      } catch { /* Reading still works when storage is unavailable. */ }
      setProgressState({ key: persistenceKey, day, remaining });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [persistenceKey, repetitions, day]);

  const save = (remaining: number, today: string) => {
    setProgressState({ key: persistenceKey, day: today, remaining });
    try { localStorage.setItem(persistenceKey, JSON.stringify({ day: today, remaining })); } catch { }
  };

  const handleTap = () => {
    if (!isLoaded) return;
    const today = localDayKey();
    const remaining = today === progressState.day ? progressState.remaining : repetitions;
    if (remaining > 0) {
      save(remaining - 1, today);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    save(repetitions, localDayKey());
  };

  const total = repetitions || 1;
  const progress = ((total - count) / total) * 100;
  const isCompleted = isLoaded && count === 0;

  return (
    <div
      onClick={!isCompleted ? handleTap : undefined}
      data-remaining={count}
      data-completed={isCompleted}
      className={cn(
        "zikr-reading-card relative overflow-hidden rounded-2xl border bg-card transition-all duration-150 mb-3",
        !isCompleted ? "active:scale-[0.99] cursor-pointer shadow-sm" : "border-primary/20",
        isCompleted && "opacity-80 grayscale-[0.5]"
      )}
    >
      {/* ProgressBar - Bottom Line */}
      <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full">
        <div
          className="h-full w-full origin-left bg-primary transition-transform duration-300"
          style={{ transform: 'scaleX(' + (progress / 100) + ')' }}
        />
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Arabic Text */}
        <p className={cn(
          "text-xl md:text-2xl leading-[2] text-center font-quran text-foreground/90",
          isCompleted && "text-muted-foreground"
        )}>
          {item.arabic}
        </p>

        {/* Note Alert */}
        {item.note && (
          <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="text-amber-700 dark:text-amber-400 font-medium leading-relaxed">{item.note}</span>
          </div>
        )}

        {/* Translation (if not Arabic language setting) */}
        {!isArabic && (
          <p className="text-sm text-center text-muted-foreground italic leading-relaxed">
            &ldquo;{item.translation}&rdquo;
          </p>
        )}

        {/* Controls / Counter */}
        <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            {isArabic ? 'إعادة' : 'Reset'}
          </Button>

          <div className={cn(
            "flex flex-col items-center justify-center w-12 h-12 rounded-xl border bg-muted/20 shrink-0 transition-colors",
            isCompleted ? "border-primary/50 bg-primary/10 text-primary" : "border-border text-foreground"
          )}>
            <span className="text-xl font-bold font-mono tracking-tighter tabular-nums">{count}</span>
          </div>

          <div className="w-16"></div> {/* Spacer for symmetry */}
        </div>
      </div>
    </div>
  );
}
