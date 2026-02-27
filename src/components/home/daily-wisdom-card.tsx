'use client';
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { getRandomWisdom, type Wisdom } from '@/lib/wisdom';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '../providers/settings-provider';

export function DailyWisdomCard() {
  const [wisdom, setWisdom] = useState<Wisdom | null>(null);
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  const fetchWisdom = () => {
    setWisdom(getRandomWisdom());
  };

  useEffect(() => {
    fetchWisdom();
  }, []);

  if (!wisdom) {
    return (
      <GlassCard className="p-4">
        <div className="h-36 w-full bg-muted animate-pulse rounded-xl" />
      </GlassCard>
    );
  }

  const wisdomType = isArabic ? (wisdom.type === 'Quran' ? 'قرآن' : 'حديث') : wisdom.type;

  return (
    <GlassCard className="py-2">
      <GlassCardHeader className='flex flex-row items-center justify-between pb-3'>
        <h2 className="text-lg font-bold">{isArabic ? 'ذكر اليوم' : 'Daily Wisdom'}</h2>
        <Button variant="ghost" size="icon" onClick={fetchWisdom} aria-label={isArabic ? 'تحديث الذكر' : 'Refresh wisdom'} className="h-10 w-10 text-muted-foreground">
          <RefreshCw className="h-5 w-5" />
        </Button>
      </GlassCardHeader>
      <GlassCardContent className="pt-2">
        <div className="flex flex-col gap-4">
          <p className="font-quran text-2xl leading-loose text-right">{wisdom.arabic}</p>
          {!isArabic && <p className="text-muted-foreground text-base leading-relaxed italic">"{wisdom.english}"</p>}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <Badge variant="secondary" className="text-xs font-medium">{wisdomType}</Badge>
            <p className="text-sm font-medium text-primary">{wisdom.reference}</p>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
