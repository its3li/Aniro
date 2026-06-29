'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { supportedLanguages, useSettings } from '@/components/providers/settings-provider';
import { useLocation } from '@/hooks/use-location';

type OnboardingStep = 'language' | 'location' | 'notifications';

const ONBOARDING_DONE_KEY = 'aniro_onboarding_v2_completed';
const NOTIFICATION_PROMPT_KEY = 'aniro_notifications_seen';

export function OnboardingGate() {
  const { settings, hasLoadedSettings, hadStoredSettings, setLanguage } = useSettings();
  const { refreshLocation, isLoading } = useLocation();
  const isArabic = settings.language === 'ar';
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

        if (!hadStoredSettings) {
          nextSteps.push('language');
        }

        if (!hasLocation) {
          nextSteps.push('location');
        }

        if (Capacitor.isNativePlatform() && localStorage.getItem(NOTIFICATION_PROMPT_KEY) !== '1') {
          try {
            const permissions = await LocalNotifications.checkPermissions();
            if (permissions.display !== 'granted') {
              nextSteps.push('notifications');
            }
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
        return {
          icon: Languages,
          title: isArabic ? 'اختر اللغة' : 'Choose Language',
          description: isArabic ? 'يمكنك تغييرها لاحقًا من الإعدادات.' : 'You can change it later in settings.',
        };
      case 'location':
        return {
          icon: MapPin,
          title: isArabic ? 'حفظ الموقع' : 'Save Location',
          description: isArabic
            ? 'نحفظ آخر موقع معروف حتى تظهر مواقيت الصلاة بدون إنترنت.'
            : 'Your last known location is saved so prayer times work offline.',
        };
      case 'notifications':
        return {
          icon: Bell,
          title: isArabic ? 'تنبيهات الأذان' : 'Azan Notifications',
          description: isArabic
            ? 'اسمح بالتنبيهات حتى يصلك الأذان في وقته.'
            : 'Allow notifications so azan alerts can arrive on time.',
        };
      default:
        return null;
    }
  }, [activeStep, isArabic]);

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
            {isLoading ? (isArabic ? 'جاري التحديد...' : 'Detecting...') : (isArabic ? 'تحديد الموقع' : 'Detect location')}
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
            {isArabic ? 'تفعيل التنبيهات' : 'Enable notifications'}
          </Button>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            {steps.length > 1 ? `${activeIndex + 1}/${steps.length}` : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={goNext}>
              {isArabic ? 'تخطي' : 'Skip'}
            </Button>
            {activeStep === 'language' && (
              <Button onClick={goNext}>
                <Check className="h-4 w-4" />
                {isArabic ? 'متابعة' : 'Continue'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
