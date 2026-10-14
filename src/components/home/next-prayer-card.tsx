"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CloudSunIcon as CloudSun } from '@/components/icons/interface-icons';
import { MapPinAreaIcon as MapPin } from '@/components/icons/interface-icons';
import { MoonStarsIcon as MoonStar } from '@/components/icons/interface-icons';
import { ArrowsClockwiseIcon as RefreshCw } from '@/components/icons/interface-icons';
import { SunIcon as Sun } from '@/components/icons/interface-icons';
import { SunHorizonIcon as SunMedium } from '@/components/icons/interface-icons';
import { SunHorizonIcon as Sunrise } from '@/components/icons/interface-icons';
import { SunHorizonIcon as Sunset } from '@/components/icons/interface-icons';
import { Button } from "@/components/ui/button";
import { GlassCard, GlassCardContent, GlassCardHeader } from "../glass-card";
import {
  getNextPrayer,
  getPrayerTimes,
  getTotalOffset,
  prayerNameMapping,
  type NextPrayer,
} from "@/lib/prayer";
import { useSettings } from "../providers/settings-provider";
import { useLocation } from "@/hooks/use-location";
import { cn } from "@/lib/utils";

const prayerIcons: Record<string, React.ElementType> = {
  fajr: Sunrise,
  ishraq: CloudSun,
  dhuhr: Sun,
  asr: SunMedium,
  maghrib: Sunset,
  isha: MoonStar,
};

const arDigits = "٠١٢٣٤٥٦٧٨٩";

type DisplayPrayer = Pick<NextPrayer, "name" | "date">;

function PrayerCountdown({ date, isArabic }: { date: Date; isArabic: boolean }) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => { if (!document.hidden) setNow(Date.now()); };
    tick();
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, []);
  const diff = Math.max(0, date.getTime() - now);
  const digits = [Math.floor(diff / 3_600_000), Math.floor((diff % 3_600_000) / 60_000), Math.floor((diff % 60_000) / 1000)]
    .map(part => String(part).padStart(2, '0')).join(':');
  const value = !now ? '' : diff === 0 ? (isArabic ? 'الآن' : 'Now') : isArabic ? digits.replace(/\d/g, digit => arDigits[Number(digit)]) : digits;
  return <p dir="ltr" className="countdown-digits">{value}</p>;
}

export function NextPrayerCard() {
  const { settings } = useSettings();
  const { coordinates, displayName, isLoading, refreshLocation } = useLocation();
  const isArabic = settings.language === "ar";
  const [isClientReady, setIsClientReady] = useState(false);
  const [minuteTick, setMinuteTick] = useState(0);
  const [nowTime, setNowTime] = useState(0);
  const [selectedPrayer, setSelectedPrayer] = useState<{ name: string; expiresAt: number } | null>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsClientReady(true), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => setMinuteTick((tick) => tick + 1), 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const initialTickId = window.setTimeout(() => setNowTime(Date.now()), 0);
    const intervalId = window.setInterval(() => setNowTime(Date.now()), 60000);
    return () => {
      window.clearTimeout(initialTickId);
      window.clearInterval(intervalId);
    };
  }, []);

  const prayerTimes = useMemo(() => {
    void minuteTick;
    const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
    return getPrayerTimes(
      new Date(),
      coordinates?.latitude,
      coordinates?.longitude,
      totalOffset,
      settings.calculationMethod,
      settings.includeIshraq
    );
  }, [
    coordinates,
    settings.prayerOffset,
    settings.dstMode,
    settings.calculationMethod,
    settings.includeIshraq,
    minuteTick,
  ]);

  const nextPrayer = useMemo<NextPrayer | null>(() => {
    void minuteTick;
    const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
    return getNextPrayer(
      coordinates?.latitude,
      coordinates?.longitude,
      totalOffset,
      settings.calculationMethod,
      settings.includeIshraq
    );
  }, [
    coordinates,
    settings.prayerOffset,
    settings.dstMode,
    settings.calculationMethod,
    settings.includeIshraq,
    minuteTick,
  ]);

  const formatPrayerTime = useCallback((date: Date) => {
    const locale = isArabic ? "ar-EG" : "en-US";
    return date.toLocaleTimeString(locale, {
      hour: settings.timeFormat === "12h" ? "numeric" : "2-digit",
      minute: "2-digit",
      hour12: settings.timeFormat === "12h",
    });
  }, [isArabic, settings.timeFormat]);

  useEffect(() => {
    if (!selectedPrayer) return;

    const delay = Math.max(selectedPrayer.expiresAt - Date.now(), 0);
    const timeoutId = window.setTimeout(() => setSelectedPrayer(null), delay);
    return () => window.clearTimeout(timeoutId);
  }, [selectedPrayer]);

  const displayPrayer = useMemo<DisplayPrayer | null>(() => {
    if (selectedPrayer && nowTime > 0 && selectedPrayer.expiresAt > nowTime) {
      const selected = prayerTimes.find((prayer) => prayer.name === selectedPrayer.name);
      if (selected) {
        const selectedDate = new Date(selected.date);
        if (selectedDate.getTime() <= nowTime) {
          selectedDate.setDate(selectedDate.getDate() + 1);
        }
        return { name: selected.name, date: selectedDate };
      }
    }

    return nextPrayer;
  }, [nextPrayer, nowTime, prayerTimes, selectedPrayer]);

  if (!isClientReady || !nextPrayer || !displayPrayer || prayerTimes.length === 0) {
    return <div className="premium-panel h-48 w-full animate-pulse rounded-lg" />;
  }

  const Icon = prayerIcons[displayPrayer.name] || Sun;
  const nextPrayerName = isArabic
    ? prayerNameMapping[displayPrayer.name].ar
    : prayerNameMapping[displayPrayer.name].en;
  const locationLabel = displayName || (isArabic ? "الموقع محفوظ" : "Saved location");

  const isShowingSelectedPrayer = selectedPrayer?.name === displayPrayer.name && selectedPrayer.expiresAt > nowTime;
  const prayerStatusLabel = isShowingSelectedPrayer
    ? (isArabic ? "الصلاة المختارة" : "Selected Prayer")
    : (isArabic ? "الصلاة التالية" : "Next Prayer");

  return (
    <GlassCard className="prayer-panel overflow-hidden">
      <GlassCardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                {prayerStatusLabel}
              </p>
              <h2 className="text-2xl font-bold leading-relaxed" title={prayerStatusLabel}>{nextPrayerName}</h2>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-lg"
            onClick={() => refreshLocation()}
            disabled={isLoading}
            aria-label={isArabic ? "تحديث الموقع" : "Refresh location"}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </GlassCardHeader>

      <GlassCardContent className="space-y-3">
        <div className="prayer-countdown">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {isArabic ? "متبقي على الأذان" : "Time remaining"}
              </p>
              <PrayerCountdown date={displayPrayer.date} isArabic={isArabic} />
            </div>
            <div className="prayer-azan-time text-end">
              <p className="text-xs text-muted-foreground">{isArabic ? "وقت الأذان" : "Azan time"}</p>
              <p className="text-lg font-bold">{formatPrayerTime(displayPrayer.date)}</p>
            </div>
          </div>
        </div>

        <div className="prayer-timeline" style={{ gridTemplateColumns: 'repeat(' + prayerTimes.length + ', minmax(0, 1fr))' }}>
          {prayerTimes.map((prayer) => {
            const isNext = prayer.name === nextPrayer.name;
            const isSelected = isShowingSelectedPrayer && prayer.name === displayPrayer.name;
            const PrayerIcon = prayerIcons[prayer.name] || Sun;
            const prayerDisplayName = isArabic
              ? prayerNameMapping[prayer.name].ar
              : prayerNameMapping[prayer.name].en;

            return (
              <button
                type="button"
                key={prayer.name}
                onClick={() => setSelectedPrayer({ name: prayer.name, expiresAt: Date.now() + 5000 })}
                className={cn(
                  "rounded-lg px-2 py-2 text-center transition-colors active:scale-[0.98]",
                  isSelected
                    ? "bg-accent/10 text-accent ring-1 ring-accent/20 dark:text-primary dark:ring-primary/20"
                    : isNext
                    ? "bg-primary/10 text-primary"
                    : "bg-background/35 text-muted-foreground"
                )}
                aria-pressed={isSelected}
              >
                <PrayerIcon className="mx-auto mb-1 h-4 w-4" />
                <p className="truncate text-[11px] font-semibold">{prayerDisplayName}</p>
                <p className="mt-0.5 font-mono text-[11px] tabular-nums">{formatPrayerTime(prayer.date)}</p>
              </button>
            );
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
