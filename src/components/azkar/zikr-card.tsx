'use client';
import { useState, useEffect, useRef } from 'react';
import type { AzkarItem } from "@/lib/azkar";
import { Button } from '@/components/ui/button';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettings } from '../providers/settings-provider';

interface ZikrCardProps {
  item: AzkarItem;
  categoryId: string;
  index: number;
}

export function ZikrCard({ item, categoryId, index }: ZikrCardProps) {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const [count, setCount] = useState(item.repetitions || 0);
  const persistenceKey = `azkar_progress_${categoryId}_${index}`;
  const hasLoadedStorageRef = useRef(false);

  // Load / Save logic
  useEffect(() => {
    hasLoadedStorageRef.current = false;
    const timeoutId = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(persistenceKey);
        setCount(stored !== null ? parseInt(stored) : item.repetitions || 0);
      } catch {
        setCount(item.repetitions || 0);
      } finally {
        hasLoadedStorageRef.current = true;
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [persistenceKey, item.repetitions]);

  useEffect(() => {
    if (!hasLoadedStorageRef.current) return;
    try { localStorage.setItem(persistenceKey, count.toString()); } catch { }
  }, [count, persistenceKey]);

  const handleTap = () => {
    if (count > 0) {
      setCount(c => c - 1);
      if (navigator.vibrate) navigator.vibrate(50);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCount(item.repetitions || 0);
  };

  const total = item.repetitions || 1;
  const progress = ((total - count) / total) * 100;
  const isCompleted = count === 0;

  return (
    <div
      onClick={!isCompleted ? handleTap : undefined}
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card transition-all duration-150 mb-3",
        !isCompleted ? "active:scale-[0.99] cursor-pointer shadow-sm" : "border-primary/20",
        isCompleted && "opacity-80 grayscale-[0.5]"
      )}
    >
      {/* ProgressBar - Bottom Line */}
      <div className="absolute bottom-0 left-0 h-1 bg-primary/10 w-full">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
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
