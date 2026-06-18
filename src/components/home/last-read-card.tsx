'use client';

import Link from 'next/link';
import { BookmarkCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLastRead } from '@/hooks/use-last-read';
import { useSettings } from '../providers/settings-provider';
import { GlassCard } from '../glass-card';

export function LastReadCard() {
  const { lastRead } = useLastRead();
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  if (!lastRead) return null;

  const surahName = isArabic ? lastRead.surahNameAr : lastRead.surahName;
  const ayahLabel = isArabic ? `الآية ${lastRead.verseNumber}` : `Ayah ${lastRead.verseNumber}`;
  const pageLabel = isArabic ? `صفحة ${lastRead.pageNumber}` : `Page ${lastRead.pageNumber}`;

  return (
    <Link href={`/quran?surah=${lastRead.surahNumber}&ayah=${lastRead.verseNumber}`} className="block">
      <GlassCard className="p-4 transition-colors active:scale-[0.99]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/15 dark:text-primary dark:ring-primary/15">
              <BookmarkCheck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {isArabic ? 'تابع القراءة' : 'Continue Reading'}
              </p>
              <p className="truncate text-lg font-bold">{surahName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {ayahLabel} • {pageLabel}
              </p>
            </div>
          </div>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {isArabic ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
