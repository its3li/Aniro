'use client';

import Link from 'next/link';
import { BookmarkSimpleIcon as BookmarkCheck } from '@/components/icons/interface-icons';
import { CaretLeftIcon as ChevronLeft } from '@/components/icons/interface-icons';
import { CaretRightIcon as ChevronRight } from '@/components/icons/interface-icons';
import { useLastRead } from '@/hooks/use-last-read';
import { useSettings } from '../providers/settings-provider';
import { GlassCard } from '../glass-card';

export function LastReadCard() {
  const { lastRead } = useLastRead();
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  if (!lastRead) return <Link href="/quran" className="reading-entry">
    <BookmarkCheck className="text-primary" size={25} strokeWidth={1.5} />
    <div><p className="section-kicker">{isArabic ? 'وردك اليومي' : 'A moment with Quran'}</p><h2>{isArabic ? 'ابدأ القراءة' : 'Begin reading'}</h2><p>{isArabic ? 'اقرأ واستمع، وسيُحفظ موضعك تلقائيًا.' : 'Read or listen. Your place is saved as you go.'}</p></div>
    {isArabic ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
  </Link>;

  const surahName = isArabic ? lastRead.surahNameAr : lastRead.surahName;
  const ayahLabel = isArabic ? `الآية ${lastRead.verseNumber}` : `Ayah ${lastRead.verseNumber}`;
  const pageLabel = isArabic ? `صفحة ${lastRead.pageNumber}` : `Page ${lastRead.pageNumber}`;

  return (
    <Link href={`/quran?surah=${lastRead.surahNumber}&ayah=${lastRead.verseNumber}`} className="block">
      <GlassCard className="reading-resume p-4 transition-colors active:scale-[0.99]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/15 dark:text-primary dark:ring-primary/15">
              <BookmarkCheck className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {isArabic ? 'تابع القراءة' : 'Continue Reading'}
              </p>
              <p className="text-lg font-bold leading-relaxed">{surahName}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
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
