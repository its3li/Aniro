"use client";
import { useState, useEffect } from "react";
import { GlassCard, GlassCardContent, GlassCardHeader } from "../glass-card";
import {
  getPrayerTimes,
  NextPrayer,
  PrayerTime,
  getNextPrayer,
  prayerNameMapping,
  getTotalOffset,
} from "@/lib/prayer";
import { Sun, Sunrise, Sunset, Moon } from "lucide-react";
import * as Tone from "tone";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSettings } from "../providers/settings-provider";
import { useLocation } from "@/hooks/use-location";

const prayerIcons: { [key: string]: React.ElementType } = {
  fajr: Sunrise,
  ishraq: Sun,
  dhuhr: Sun,
  asr: Sun,
  maghrib: Sunset,
  isha: Moon,
};

export function NextPrayerCard() {
  const { settings } = useSettings();
  const { coordinates } = useLocation();
  const isArabic = settings.language === "ar";
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<NextPrayer | null>(null);
  const [timeToNextPrayer, setTimeToNextPrayer] = useState("");
  const [nextPrayerAzanTime, setNextPrayerAzanTime] = useState("");
  const { toast } = useToast();

  const localizeDigits = (value: string) =>
    isArabic ? value.replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]) : value;

  useEffect(() => {
    const lat = coordinates?.latitude;
    const lng = coordinates?.longitude;

    const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
    const times = getPrayerTimes(
      new Date(),
      lat,
      lng,
      totalOffset,
      settings.calculationMethod,
      settings.includeIshraq
    );
    setPrayerTimes(times);

    const updateNextPrayer = () => {
      const totalOffset = getTotalOffset(
        settings.prayerOffset,
        settings.dstMode
      );
      const next = getNextPrayer(
        lat,
        lng,
        totalOffset,
        settings.calculationMethod
      );
      setNextPrayer(next);
    };

    updateNextPrayer();
    const intervalId = setInterval(updateNextPrayer, 60000);

    return () => clearInterval(intervalId);
  }, [
    settings.prayerOffset,
    settings.dstMode,
    coordinates,
    settings.calculationMethod,
  ]);

  useEffect(() => {
    if (!nextPrayer) {
      setNextPrayerAzanTime("");
      return;
    }

    const hours = nextPrayer.date.getHours();
    const minutes = nextPrayer.date.getMinutes();

    let formattedTime = "";
    if (settings.timeFormat === "12h") {
      const ampm =
        hours >= 12 ? (isArabic ? "م" : "PM") : isArabic ? "ص" : "AM";
      let h = hours % 12;
      if (h === 0) h = 12;
      const displayMinutes = localizeDigits(String(minutes).padStart(2, "0"));
      const displayHours = localizeDigits(String(h));

      formattedTime = `${displayHours}:${displayMinutes} ${ampm}`;
    } else {
      const displayHours = localizeDigits(String(hours).padStart(2, "0"));
      const displayMinutes = localizeDigits(String(minutes).padStart(2, "0"));

      formattedTime = `${displayHours}:${displayMinutes}`;
    }

    setNextPrayerAzanTime(formattedTime);

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextPrayer.date.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeToNextPrayer(isArabic ? "الآن" : "Now");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const displayHours = localizeDigits(String(hours).padStart(2, "0"));
      const displayMinutes = localizeDigits(String(minutes).padStart(2, "0"));
      const displaySeconds = localizeDigits(String(seconds).padStart(2, "0"));

      setTimeToNextPrayer(
        `${displayHours}:${displayMinutes}:${displaySeconds}`
      );
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    const playAzanTone = (prayerName: string) => {
      // Avoid initializing Tone if not strictly necessary in mobile rendering, 
      // but keeping your logic intact:
      const synth = new Tone.Synth().toDestination();
      const now = Tone.now();
      const prayerDisplayName = isArabic
        ? prayerNameMapping[nextPrayer.name].ar
        : prayerNameMapping[nextPrayer.name].en;

      toast({
        title: isArabic
          ? `حان الآن وقت صلاة ${prayerDisplayName}`
          : `It's time for ${prayerDisplayName} prayer`,
        description: isArabic
          ? "تقبل الله طاعتكم."
          : "May your prayers be accepted.",
      });
    };

    const timeToPrayerMs = nextPrayer.date.getTime() - new Date().getTime();
    let azanTimeoutId: NodeJS.Timeout | undefined;
    if (timeToPrayerMs > 0) {
      azanTimeoutId = setTimeout(
        () => playAzanTone(nextPrayer.name),
        timeToPrayerMs
      );
    }

    return () => {
      clearInterval(timer);
      if (azanTimeoutId) {
        clearTimeout(azanTimeoutId);
      }
    };
  }, [nextPrayer, toast, isArabic, settings.timeFormat]);

  if (!nextPrayer || prayerTimes.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 h-40 w-full animate-pulse" />
    );
  }

  const Icon = prayerIcons[nextPrayer.name] || Sun;
  const nextPrayerName = isArabic
    ? prayerNameMapping[nextPrayer.name].ar
    : prayerNameMapping[nextPrayer.name].en;

  return (
    <GlassCard className="py-2 overflow-hidden w-full">
      <GlassCardHeader className="pb-3">
        {/* التعديل هنا: منعنا التفاف العناصر واستخدمنا أحجام مرنة */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg md:text-xl font-bold whitespace-nowrap">{nextPrayerName}</h2>
              <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                {isArabic ? "الصلاة التالية" : "Next Prayer"}
              </p>
            </div>
          </div>
          <div className="text-end shrink-0">
            {/* تم تصغير الخط قليلاً في الشاشات الصغيرة ليناسب المساحة */}
            <p className="text-2xl md:text-3xl font-bold text-primary font-mono tabular-nums whitespace-nowrap">
              {timeToNextPrayer}
            </p>
            {nextPrayerAzanTime && (
              <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                {nextPrayerAzanTime}
              </p>
            )}
          </div>
        </div>
      </GlassCardHeader>
      
      <GlassCardContent className="pt-3">
        {/* التعديل هنا: مسافات متناسبة وإضافة إمكانية السحب (scroll) لو الشاشة ضيقة جداً */}
        <div className="flex justify-between items-center pt-4 border-t border-border gap-1 overflow-x-auto no-scrollbar pb-1">
          {prayerTimes.map((prayer, index) => {
            const IsNext = prayer.name === nextPrayer.name;
            const PrayerIcon = prayerIcons[prayer.name];
            const prayerDisplayName = isArabic
              ? prayerNameMapping[prayer.name].ar
              : prayerNameMapping[prayer.name].en;
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-1.5 text-center min-w-[45px]"
              >
                <PrayerIcon
                  className={cn(
                    "w-4 h-4 md:w-5 md:h-5",
                    IsNext ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <p
                  className={cn(
                    "text-[10px] md:text-xs font-medium whitespace-nowrap",
                    IsNext ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {prayerDisplayName}
                </p>
                <p
                  className={cn(
                    "text-[10px] md:text-xs font-mono tabular-nums whitespace-nowrap",
                    IsNext
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {settings.timeFormat === "12h"
                    ? prayer.date.toLocaleTimeString(
                        isArabic ? "ar-SA" : "en-US",
                        { hour: "numeric", minute: "2-digit", hour12: true }
                      )
                    : prayer.date.toLocaleTimeString(
                        isArabic ? "ar-SA" : "en-US",
                        { hour: "2-digit", minute: "2-digit", hour12: false }
                      )}
                </p>
              </div>
            );
          })}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
