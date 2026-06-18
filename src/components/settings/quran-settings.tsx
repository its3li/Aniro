'use client';

import { Book, List } from 'lucide-react';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSettings, type QuranEdition } from '../providers/settings-provider';
import { cn } from '@/lib/utils';

export function QuranSettings() {
  const {
    settings,
    setQuranViewMode,
    setQuranEdition,
    setQuranTajweedEnabled,
  } = useSettings();
  const isArabic = settings.language === 'ar';
  const canUseTajweed = settings.quranEdition === 'uthmani';

  return (
    <GlassCard>
      <GlassCardHeader>
        <h2 className="text-base font-bold">{isArabic ? 'القرآن الكريم' : 'Quran'}</h2>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="divide-y divide-border/70">
          <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
            <div>
              <Label className="text-sm font-semibold">{isArabic ? 'الرواية' : 'Qira’ah'}</Label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {isArabic ? 'المصاحف المتوفرة داخل التطبيق' : 'Verified local Quran datasets'}
              </p>
            </div>
            <Select
              value={settings.quranEdition}
              onValueChange={(value) => setQuranEdition(value as QuranEdition)}
              dir={isArabic ? 'rtl' : 'ltr'}
            >
              <SelectTrigger className="h-9 min-w-[132px] rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uthmani">{isArabic ? 'حفص عن عاصم' : 'Hafs'}</SelectItem>
                <SelectItem value="warsh">{isArabic ? 'ورش عن نافع' : 'Warsh'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <Label htmlFor="quran-tajweed-switch" className="text-sm font-semibold">
                {isArabic ? 'ألوان التجويد' : 'Tajweed Colors'}
              </Label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {isArabic ? 'تعمل مع مصحف حفص فقط' : 'Available for Hafs only'}
              </p>
            </div>
            <Switch
              id="quran-tajweed-switch"
              checked={canUseTajweed && settings.quranTajweedEnabled}
              onCheckedChange={setQuranTajweedEnabled}
              disabled={!canUseTajweed}
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
            <Label className="text-sm font-semibold">{isArabic ? 'طريقة العرض' : 'View Mode'}</Label>
            <div className="premium-control flex items-center gap-1 rounded-lg p-1">
              <button
                type="button"
                className={cn(
                  'grid h-8 w-9 place-items-center rounded-md transition-colors',
                  settings.quranViewMode === 'list'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
                onClick={() => setQuranViewMode('list')}
                aria-label={isArabic ? 'عرض القائمة' : 'List view'}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={cn(
                  'grid h-8 w-9 place-items-center rounded-md transition-colors',
                  settings.quranViewMode === 'page'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground',
                )}
                onClick={() => setQuranViewMode('page')}
                aria-label={isArabic ? 'عرض المصحف' : 'Mushaf view'}
              >
                <Book className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
