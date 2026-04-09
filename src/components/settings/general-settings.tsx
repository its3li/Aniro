'use client';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/hooks/use-location';
import { useTheme } from '../providers/theme-provider';
import { useSettings } from '../providers/settings-provider';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Brain } from 'lucide-react';

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const { settings, setLanguage, setAzanMode, setIncludeIshraq, setFajrQuizEnabled } = useSettings();
  const { city, country, refreshLocation, isLoading } = useLocation();
  const isArabic = settings.language === 'ar';

  return (
    <GlassCard>
      <GlassCardHeader>
        <h2 className="text-base font-semibold">{isArabic ? 'عام' : 'General'}</h2>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <Label htmlFor="language-switch" className="text-sm">{isArabic ? 'اللغة' : 'Language'}</Label>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs", settings.language === 'en' ? 'text-primary font-medium' : 'text-muted-foreground')}>
                EN
              </span>
              <Switch
                id="language-switch"
                checked={settings.language === 'ar'}
                onCheckedChange={(checked) => setLanguage(checked ? 'ar' : 'en')}
                dir="ltr"
              />
              <span className={cn("text-xs", settings.language === 'ar' ? 'text-primary font-medium' : 'text-muted-foreground')}>
                عربي
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <Label htmlFor="dark-mode-switch" className="text-sm">{isArabic ? 'الوضع الداكن' : 'Dark Mode'}</Label>
            <Switch
              id="dark-mode-switch"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm">{isArabic ? 'الموقع الحالي' : 'Current Location'}</Label>
              <p className="text-[11px] text-muted-foreground">
                {city || (isArabic ? 'جار تحديد الموقع...' : 'Detecting location...')}
                {country ? `, ${country}` : ''}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-lg"
              onClick={() => refreshLocation()}
              disabled={isLoading}
            >
              {isLoading ? (isArabic ? 'جاري...' : 'Updating...') : (isArabic ? 'تحديث' : 'Refresh')}
            </Button>
          </div>

          {/* Azan Mode */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              {settings.azanMode === 'full' ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm">{isArabic ? 'صوت الأذان' : 'Azan Sound'}</Label>
                <p className="text-[11px] text-muted-foreground">
                  {settings.azanMode === 'full' 
                    ? (isArabic ? 'صوت الأذان الكامل' : 'Full azan sound') 
                    : (isArabic ? 'إشعار صامت فقط' : 'Silent notification only')}
                </p>
              </div>
            </div>
            <Switch
              id="azan-mode-switch"
              checked={settings.azanMode === 'full'}
              onCheckedChange={(checked) => setAzanMode(checked ? 'full' : 'silent')}
              dir="ltr"
            />
          </div>

          {/* Include Ishraq */}
          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm">{isArabic ? 'صلاة الضحى' : 'Duha Prayer'}</Label>
              <p className="text-[11px] text-muted-foreground">
                {isArabic ? 'إظهار وقت صلاة الضحى (20 دقيقة بعد الشروق)' : 'Show Duha prayer time (20 min after sunrise)'}
              </p>
            </div>
            <Switch
              id="ishraq-switch"
              checked={settings.includeIshraq}
              onCheckedChange={setIncludeIshraq}
              dir="ltr"
            />
          </div>

          {/* Fajr Quiz */}
          <div className="flex items-center justify-between py-3 last:pb-0">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-500" />
              <div className="flex flex-col gap-0.5">
                <Label className="text-sm">{isArabic ? 'تحدي الاستيقاظ' : 'Wake-up Challenge'}</Label>
                <p className="text-[11px] text-muted-foreground">
                  {isArabic ? 'أكمل الآية لإيقاف أذان الفجر' : 'Complete the verse to stop Fajr adhan'}
                </p>
              </div>
            </div>
            <Switch
              id="fajr-quiz-switch"
              checked={settings.fajrQuizEnabled}
              onCheckedChange={setFajrQuizEnabled}
              dir="ltr"
            />
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
