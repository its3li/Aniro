'use client';

import { useCallback, useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from '@/hooks/use-location';
import { useTheme } from '../providers/theme-provider';
import { supportedLanguages, useSettings, type Language } from '../providers/settings-provider';
import { checkAzanPermissionStatus } from '@/hooks/use-azan-scheduler';
import { scheduleFridayKahfReminder } from '@/lib/friday-kahf-reminder';
import { NativeAzan, type AzanStatus } from '@/lib/native-azan';

const ar = {
  general: 'عام',
  language: 'اللغة',
  darkMode: 'الوضع الداكن',
  currentLocation: 'الموقع الحالي',
  detectingLocation: 'جار تحديد الموقع...',
  updating: 'جاري...',
  refresh: 'تحديث',
  azanSound: 'صوت الأذان',
  fullAzan: 'صوت الأذان الكامل',
  silentOnly: 'إشعار صامت فقط',
  duhaPrayer: 'صلاة الضحى',
  duhaDescription: 'إظهار وقت صلاة الضحى (20 دقيقة بعد الشروق)',
  wakeChallenge: 'تحدي الاستيقاظ',
  wakeDescription: 'أكمل الآية لإيقاف أذان الفجر',
  azanPermissions: 'صلاحيات الأذان',
  azanPermissionsReady: 'كل الصلاحيات الأساسية مفعلة',
  azanPermissionsDescription: 'فعّل المطلوب فقط عند الحاجة',
  notifications: 'التنبيهات',
  exactAlarm: 'منبهات دقيقة',
  battery: 'الخلفية والبطارية',
  enable: 'تفعيل',
  open: 'فتح',
  checking: 'جاري الفحص...',
};

export function GeneralSettings() {
  const { theme, setTheme } = useTheme();
  const { settings, setLanguage, setAzanMode, setIncludeIshraq, setFajrQuizEnabled } = useSettings();
  const { displayName, refreshLocation, isLoading } = useLocation();
  const isArabic = settings.language === 'ar';
  const [azanStatus, setAzanStatus] = useState<AzanStatus | null>(null);
  const [isCheckingAzanStatus, setIsCheckingAzanStatus] = useState(false);

  const refreshAzanStatus = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    setIsCheckingAzanStatus(true);
    try {
      setAzanStatus(await checkAzanPermissionStatus());
    } finally {
      setIsCheckingAzanStatus(false);
    }
  }, []);

  useEffect(() => {
    void refreshAzanStatus();

    let didUnmount = false;
    let removeListener: (() => void) | undefined;
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void refreshAzanStatus();
      }
    }).then(listener => {
      if (didUnmount) {
        void listener.remove();
        return;
      }
      removeListener = () => {
        void listener.remove();
      };
    });

    return () => {
      didUnmount = true;
      removeListener?.();
    };
  }, [refreshAzanStatus]);

  const requestNotifications = async () => {
    await LocalNotifications.requestPermissions();
    await scheduleFridayKahfReminder(settings);
    await refreshAzanStatus();
  };

  const requestExactAlarm = async () => {
    await NativeAzan.requestExactAlarmPermission();
  };

  const openBatterySettings = async () => {
    await NativeAzan.openBatteryOptimizationSettings();
  };

  const needsAzanPermissions = Boolean(
    azanStatus && (!azanStatus.notifications || !azanStatus.exactAlarm || !azanStatus.ignoringBatteryOptimizations)
  );

  return (
    <GlassCard>
      <GlassCardHeader>
        <h2 className="text-base font-semibold">{isArabic ? ar.general : 'General'}</h2>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <Label htmlFor="language-select" className="text-sm">{isArabic ? ar.language : 'Language'}</Label>
            <Select value={settings.language} onValueChange={(value) => setLanguage(value as Language)}>
              <SelectTrigger id="language-select" className="h-9 w-40 rounded-lg" dir="ltr">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(language => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.nativeName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between py-3">
            <Label htmlFor="dark-mode-switch" className="text-sm">{isArabic ? ar.darkMode : 'Dark Mode'}</Label>
            <Switch
              id="dark-mode-switch"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm">{isArabic ? ar.currentLocation : 'Current Location'}</Label>
              <p className="text-[11px] text-muted-foreground">
                {displayName || (isArabic ? ar.detectingLocation : 'Detecting location...')}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => refreshLocation()}
              disabled={isLoading}
            >
              {isLoading ? (isArabic ? ar.updating : 'Updating...') : (isArabic ? ar.refresh : 'Refresh')}
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm">{isArabic ? ar.azanSound : 'Azan Sound'}</Label>
              <p className="text-[11px] text-muted-foreground">
                {settings.azanMode === 'full'
                  ? (isArabic ? ar.fullAzan : 'Full azan sound')
                  : (isArabic ? ar.silentOnly : 'Silent notification only')}
              </p>
            </div>
            <Switch
              id="azan-mode-switch"
              checked={settings.azanMode === 'full'}
              onCheckedChange={(checked) => setAzanMode(checked ? 'full' : 'silent')}
              dir="ltr"
            />
          </div>

          {Capacitor.isNativePlatform() && (
            <div className="flex items-start justify-between gap-3 py-3">
              <div className="flex flex-col gap-1">
                <Label className="text-sm">{isArabic ? ar.azanPermissions : 'Azan Permissions'}</Label>
                <p className="text-[11px] text-muted-foreground">
                  {isCheckingAzanStatus
                    ? (isArabic ? ar.checking : 'Checking...')
                    : needsAzanPermissions
                      ? (isArabic ? ar.azanPermissionsDescription : 'Enable only what is needed')
                      : (isArabic ? ar.azanPermissionsReady : 'All core permissions are enabled')}
                </p>
                {needsAzanPermissions && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {!azanStatus?.notifications && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => void requestNotifications()}
                      >
                        {isArabic ? ar.enable : 'Enable'} {isArabic ? ar.notifications : 'Notifications'}
                      </Button>
                    )}
                    {!azanStatus?.exactAlarm && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => void requestExactAlarm()}
                      >
                        {isArabic ? ar.open : 'Open'} {isArabic ? ar.exactAlarm : 'Exact alarms'}
                      </Button>
                    )}
                    {!azanStatus?.ignoringBatteryOptimizations && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-lg text-xs"
                        onClick={() => void openBatterySettings()}
                      >
                        {isArabic ? ar.open : 'Open'} {isArabic ? ar.battery : 'Battery'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 rounded-lg text-xs"
                onClick={() => void refreshAzanStatus()}
                disabled={isCheckingAzanStatus}
              >
                {isArabic ? ar.refresh : 'Refresh'}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between py-3">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm">{isArabic ? ar.duhaPrayer : 'Duha Prayer'}</Label>
              <p className="text-[11px] text-muted-foreground">
                {isArabic ? ar.duhaDescription : 'Show Duha prayer time (20 min after sunrise)'}
              </p>
            </div>
            <Switch
              id="ishraq-switch"
              checked={settings.includeIshraq}
              onCheckedChange={setIncludeIshraq}
              dir="ltr"
            />
          </div>

          <div className="flex items-center justify-between py-3 last:pb-0">
            <div className="flex flex-col gap-0.5">
              <Label className="text-sm">{isArabic ? ar.wakeChallenge : 'Wake-up Challenge'}</Label>
              <p className="text-[11px] text-muted-foreground">
                {isArabic ? ar.wakeDescription : 'Complete the verse to stop Fajr azan'}
              </p>
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
