'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Bell, Check, Languages, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { scheduleFridayKahfReminder } from '@/lib/friday-kahf-reminder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supportedLanguages, useSettings, type Language } from '@/components/providers/settings-provider';
import { pickLanguage } from '@/lib/i18n';
import { useLocation } from '@/hooks/use-location';

type OnboardingStep = 'language' | 'location' | 'notifications';

const ONBOARDING_DONE_KEY = 'aniro_onboarding_v2_completed';
const NOTIFICATION_PROMPT_KEY = 'aniro_notifications_seen';

const copy = {
  languageTitle: { ar: 'اختر اللغة', en: 'Choose Language', ur: 'زبان منتخب کریں', fa: 'زبان را انتخاب کنید' },
  languageDescription: {
    ar: 'يمكنك تغييرها لاحقًا من الإعدادات.',
    en: 'You can change it later in settings.',
    ur: 'آپ اسے بعد میں سیٹنگز سے بدل سکتے ہیں۔',
    fa: 'بعداً می توانید آن را از تنظیمات تغییر دهید.',
  },
  locationTitle: { ar: 'حفظ الموقع', en: 'Save Location', ur: 'مقام محفوظ کریں', fa: 'ذخیره مکان' },
  locationDescription: {
    ar: 'نحفظ آخر موقع معروف حتى تظهر مواقيت الصلاة بدون إنترنت.',
    en: 'Your last known location is saved so prayer times work offline.',
    ur: 'آخری معلوم مقام محفوظ ہوتا ہے تاکہ نماز کے اوقات آف لائن بھی کام کریں۔',
    fa: 'آخرین مکان شناخته شده ذخیره می شود تا اوقات نماز بدون اینترنت هم کار کند.',
  },
  notificationsTitle: { ar: 'تنبيهات الأذان', en: 'Azan Notifications', ur: 'اذان کی اطلاعات', fa: 'اعلان های اذان' },
  notificationsDescription: {
    ar: 'اسمح بالتنبيهات حتى يصلك الأذان في وقته.',
    en: 'Allow notifications so azan alerts can arrive on time.',
    ur: 'اطلاعات کی اجازت دیں تاکہ اذان وقت پر مل سکے۔',
    fa: 'اعلان ها را فعال کنید تا اذان به موقع برسد.',
  },
  detecting: { ar: 'جاري التحديد...', en: 'Detecting...', ur: 'معلوم کیا جا رہا ہے...', fa: 'در حال تشخیص...' },
  detectLocation: { ar: 'تحديد الموقع', en: 'Detect location', ur: 'مقام معلوم کریں', fa: 'تشخیص مکان' },
  enableNotifications: { ar: 'تفعيل التنبيهات', en: 'Enable notifications', ur: 'اطلاعات فعال کریں', fa: 'فعال کردن اعلان ها' },
  skip: { ar: 'تخطي', en: 'Skip', ur: 'چھوڑ دیں', fa: 'رد کردن' },
  continue: { ar: 'متابعة', en: 'Continue', ur: 'جاری رکھیں', fa: 'ادامه' },
} satisfies Record<string, Record<Language, string>>;

export function OnboardingGate() {
  const { settings, hasLoadedSettings, hadStoredSettings, setLanguage } = useSettings();
  const { refreshLocation, isLoading } = useLocation();
  const t = useCallback((key: keyof typeof copy) => pickLanguage(settings.language, copy[key]), [settings.language]);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!hasLoadedSettings) return;

    let cancelled = false;
    const buildSteps = async () => {
      try {
        if (localStorage.getItem(ONBOARDING_DONE_KEY) === '1') return;

        const nextSteps: OnboardingStep[] = [];
        const hasLocation = Boolean(localStorage.getItem('aniro_location'));

        if (!hadStoredSettings) nextSteps.push('language');
        if (!hasLocation) nextSteps.push('location');

        if (Capacitor.isNativePlatform() && localStorage.getItem(NOTIFICATION_PROMPT_KEY) !== '1') {
          try {
            const permissions = await LocalNotifications.checkPermissions();
            if (permissions.display !== 'granted') nextSteps.push('notifications');
          } catch {
            nextSteps.push('notifications');
          }
        }

        if (!cancelled && nextSteps.length > 0) {
          setSteps(nextSteps);
          setActiveIndex(0);
          setIsOpen(true);
        } else if (!cancelled) {
          localStorage.setItem(ONBOARDING_DONE_KEY, '1');
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    };

    void buildSteps();
    return () => {
      cancelled = true;
    };
  }, [hadStoredSettings, hasLoadedSettings]);

  const activeStep = steps[activeIndex];
  const isLastStep = activeIndex >= steps.length - 1;

  const complete = () => {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    setIsOpen(false);
  };

  const goNext = () => {
    if (isLastStep) {
      complete();
      return;
    }
    setActiveIndex((index) => index + 1);
  };

  const content = useMemo(() => {
    switch (activeStep) {
      case 'language':
        return { icon: Languages, title: t('languageTitle'), description: t('languageDescription') };
      case 'location':
        return { icon: MapPin, title: t('locationTitle'), description: t('locationDescription') };
      case 'notifications':
        return { icon: Bell, title: t('notificationsTitle'), description: t('notificationsDescription') };
      default:
        return null;
    }
  }, [activeStep, t]);

  if (isChecking || !content) return null;

  const Icon = content.icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && complete()}>
      <DialogContent className="max-w-[92vw] rounded-lg border-border bg-background p-5 sm:max-w-sm">
        <DialogHeader className="text-start">
          <div className="mb-2 grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <DialogTitle>{content.title}</DialogTitle>
          <DialogDescription>{content.description}</DialogDescription>
        </DialogHeader>

        {activeStep === 'language' && (
          <div className="grid grid-cols-2 gap-2">
            {supportedLanguages.map(language => (
              <Button
                key={language.code}
                variant={settings.language === language.code ? 'default' : 'outline'}
                onClick={() => setLanguage(language.code)}
              >
                {language.nativeName}
              </Button>
            ))}
          </div>
        )}

        {activeStep === 'location' && (
          <Button
            className="w-full"
            disabled={isLoading}
            onClick={async () => {
              await refreshLocation();
              goNext();
            }}
          >
            <MapPin className="h-4 w-4" />
            {isLoading ? t('detecting') : t('detectLocation')}
          </Button>
        )}

        {activeStep === 'notifications' && (
          <Button
            className="w-full"
            onClick={async () => {
              localStorage.setItem(NOTIFICATION_PROMPT_KEY, '1');
              try {
                await LocalNotifications.requestPermissions();
                await scheduleFridayKahfReminder(settings);
              } catch {
                // The app can still run; users can enable notifications from settings later.
              }
              goNext();
            }}
          >
            <Bell className="h-4 w-4" />
            {t('enableNotifications')}
          </Button>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {steps.length > 1 ? `${activeIndex + 1}/${steps.length}` : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={goNext}>
              {t('skip')}
            </Button>
            {activeStep === 'language' && (
              <Button onClick={goNext}>
                <Check className="h-4 w-4" />
                {t('continue')}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
