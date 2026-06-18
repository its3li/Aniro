'use client';

import { useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { getDailyWisdom, getRandomWisdom, type Wisdom } from '@/lib/wisdom';
import { useSettings } from '../providers/settings-provider';

const arabicReferenceMap: Record<string, string> = {
  'Sahih al-Bukhari': 'صحيح البخاري',
  'Sahih Muslim': 'صحيح مسلم',
  'Jami` at-Tirmidhi': 'جامع الترمذي',
  'Al-Bayhaqi': 'البيهقي',
  'Al-Mu`jam al-Kabir': 'المعجم الكبير',
};

export function DailyWisdomCard() {
  const [wisdom, setWisdom] = useState<Wisdom | null>(() => getDailyWisdom());
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  if (!wisdom) {
    return (
      <GlassCard className="p-4">
        <div className="h-36 w-full animate-pulse rounded-lg bg-muted" />
      </GlassCard>
    );
  }

  const wisdomType = isArabic ? (wisdom.type === 'Quran' ? 'قرآن' : 'حديث') : wisdom.type;
  const wisdomReference = isArabic
    ? arabicReferenceMap[wisdom.reference] ?? wisdom.reference
    : wisdom.reference;

  return (
    <GlassCard>
      <GlassCardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <h2 className="text-base font-bold">{isArabic ? 'ذكر اليوم' : 'Daily Wisdom'}</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setWisdom(getRandomWisdom())}
          aria-label={isArabic ? 'تحديث الذكر' : 'Refresh wisdom'}
          className="h-9 w-9 rounded-lg text-muted-foreground"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="space-y-4">
          <p className="font-quran text-right text-2xl leading-loose text-balance">{wisdom.arabic}</p>
          {!isArabic && (
            <p className="text-sm leading-relaxed text-muted-foreground">&quot;{wisdom.english}&quot;</p>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
            <Badge variant="secondary" className="rounded-lg text-xs font-semibold">{wisdomType}</Badge>
            <p className="truncate text-sm font-semibold text-primary">{wisdomReference}</p>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
