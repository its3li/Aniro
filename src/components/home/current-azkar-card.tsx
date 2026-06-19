'use client';

import Link from 'next/link';
import { Bell, ChevronLeft, ChevronRight, Clock3, HandHeart } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { GlassCard } from '../glass-card';
import { useSettings } from '../providers/settings-provider';
import { useLocation } from '@/hooks/use-location';
import { getPrayerTimes, getTotalOffset, prayerNameMapping, type PrayerTime } from '@/lib/prayer';

type AzkarSuggestion = {
  categoryId: string;
  title: string;
  subtitle: string;
  label: string;
  priority: number;
};

const obligatoryPrayers = new Set(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']);
const arDigits = '٠١٢٣٤٥٦٧٨٩';

function minutesFromMidnight(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function localizeDigits(value: string, isArabic: boolean) {
  return isArabic ? value.replace(/\d/g, digit => arDigits[Number(digit)]) : value;
}

function formatPrayerName(prayer: PrayerTime, isArabic: boolean) {
  return isArabic ? prayerNameMapping[prayer.name].ar : prayerNameMapping[prayer.name].en;
}

export function CurrentAzkarCard() {
  const { settings } = useSettings();
  const { coordinates } = useLocation();
  const isArabic = settings.language === 'ar';
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const intervalId = window.setInterval(update, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const prayerTimes = useMemo(() => {
    if (!now) return [];

    const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
    return getPrayerTimes(
      now,
      coordinates?.latitude,
      coordinates?.longitude,
      totalOffset,
      settings.calculationMethod,
      false
    ).filter(prayer => obligatoryPrayers.has(prayer.name));
  }, [
    coordinates,
    now,
    settings.calculationMethod,
    settings.dstMode,
    settings.prayerOffset,
  ]);

  const suggestion = useMemo<AzkarSuggestion | null>(() => {
    if (!now) return null;

    const nowMs = now.getTime();
    const recentPrayer = prayerTimes.find(prayer => {
      const diffMinutes = (nowMs - prayer.date.getTime()) / 60_000;
      return diffMinutes >= 0 && diffMinutes <= 35;
    });

    if (recentPrayer) {
      const prayerName = formatPrayerName(recentPrayer, isArabic);
      return {
        categoryId: 'after-prayer-azkar',
        title: isArabic ? 'أذكار بعد الصلاة' : 'After-prayer azkar',
        subtitle: isArabic ? `حان وقت أذكار ما بعد ${prayerName}` : `It is time for azkar after ${prayerName}`,
        label: isArabic ? 'افتح الأذكار' : 'Open azkar',
        priority: 1,
      };
    }

    const upcomingPrayer = prayerTimes.find(prayer => {
      const diffMinutes = (prayer.date.getTime() - nowMs) / 60_000;
      return diffMinutes > 0 && diffMinutes <= 20;
    });

    if (upcomingPrayer) {
      const prayerName = formatPrayerName(upcomingPrayer, isArabic);
      return {
        categoryId: 'before-prayer-azkar',
        title: isArabic ? 'أذكار قبل الصلاة' : 'Before-prayer azkar',
        subtitle: isArabic ? `اقترب وقت ${prayerName}` : `${prayerName} is coming soon`,
        label: isArabic ? 'استعد للصلاة' : 'Prepare',
        priority: 2,
      };
    }

    const minute = minutesFromMidnight(now);

    if (minute >= 4 * 60 && minute < 11 * 60) {
      return {
        categoryId: 'morning-azkar',
        title: isArabic ? 'أذكار الصباح' : 'Morning azkar',
        subtitle: isArabic ? 'هذا وقت أذكار الصباح' : 'This is the time for morning azkar',
        label: isArabic ? 'ابدأ الآن' : 'Start now',
        priority: 3,
      };
    }

    if (minute >= 16 * 60 && minute < 21 * 60) {
      return {
        categoryId: 'evening-azkar',
        title: isArabic ? 'أذكار المساء' : 'Evening azkar',
        subtitle: isArabic ? 'هذا وقت أذكار المساء' : 'This is the time for evening azkar',
        label: isArabic ? 'ابدأ الآن' : 'Start now',
        priority: 4,
      };
    }

    if (minute >= 21 * 60 || minute < 3 * 60) {
      return {
        categoryId: 'sleep-dreams',
        title: isArabic ? 'أذكار النوم' : 'Sleep azkar',
        subtitle: isArabic ? 'قبل النوم لا تنس أذكارك' : 'Do not miss your azkar before sleep',
        label: isArabic ? 'افتح الأذكار' : 'Open azkar',
        priority: 5,
      };
    }

    return null;
  }, [isArabic, now, prayerTimes]);

  if (!suggestion) return null;

  const Icon = suggestion.priority <= 2 ? Clock3 : HandHeart;
  const href = `/azkar?category=${suggestion.categoryId}`;

  return (
    <Link href={href} className="block">
      <GlassCard className="p-4 transition-colors active:scale-[0.99]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                <Bell className="h-3.5 w-3.5" />
                <span>{isArabic ? 'أذكار الوقت الحالي' : 'Current azkar'}</span>
              </p>
              <p className="truncate text-lg font-bold">{suggestion.title}</p>
              <p className="truncate text-xs text-muted-foreground">
                {localizeDigits(suggestion.subtitle, isArabic)}
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
