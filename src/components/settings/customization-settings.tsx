"use client";
import { GlassCard, GlassCardContent, GlassCardHeader } from "../glass-card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "../providers/settings-provider";
import { Button } from "../ui/button";
import { Minus, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  calculationMethods,
  calculationMethodsArabic,
  CalculationMethodName,
  DSTMode,
} from "@/lib/prayer";
import type { TimeFormat } from "../providers/settings-provider";

type WidgetTheme = "default" | "system" | "custom";

export function CustomizationSettings() {
  const {
    settings,
    setFontSize,
    setPrayerOffset,
    setQuranReciter,
    setCalculationMethod,
    setDstMode,
    setTimeFormat,
    setWidgetTheme,
    setWidgetBackgroundColor,
    availableReciters,
  } = useSettings();
  const isArabic = settings.language === "ar";

  const handlePrayerOffsetChange = (change: number) => {
    const newOffset = settings.prayerOffset + change;
    if (newOffset >= -12 && newOffset <= 12) {
      setPrayerOffset(newOffset);
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <h2 className="text-base font-semibold">
          {isArabic ? "تخصيص" : "Customization"}
        </h2>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="divide-y divide-border">
          <div className="py-3 first:pt-0 space-y-2">
            <Label htmlFor="font-size-slider" className="text-sm">
              {isArabic ? "حجم الخط" : "Font Size"}
            </Label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">A</span>
              <Slider
                id="font-size-slider"
                min={12}
                max={20}
                step={1}
                value={[settings.fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
              />
              <span className="text-lg text-muted-foreground">A</span>
            </div>
          </div>
          <div className="py-3 space-y-2">
            <Label htmlFor="prayer-offset" className="text-sm">
              {isArabic
                ? "تعديل مواقيت الصلاة (ساعات)"
                : "Prayer Time Offset (Hours)"}
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => handlePrayerOffsetChange(-1)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold font-mono w-10 text-center tabular-nums">
                {settings.prayerOffset > 0
                  ? `+${settings.prayerOffset}`
                  : settings.prayerOffset}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => handlePrayerOffsetChange(1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="py-3 flex items-center justify-between">
            <Label htmlFor="time-format" className="text-sm">
              {isArabic ? "تنسيق الوقت" : "Time Format"}
            </Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(val) => setTimeFormat(val as TimeFormat)}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <SelectTrigger
                id="time-format"
                className="w-auto min-w-[120px] h-8 text-xs rounded-lg"
              >
                <SelectValue
                  placeholder={isArabic ? "اختر التنسيق" : "Select format"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">
                  {isArabic ? "12 ساعة (ص/م)" : "12h (AM/PM)"}
                </SelectItem>
                <SelectItem value="24h">
                  {isArabic ? "24 ساعة" : "24h"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="py-3 flex items-center justify-between">
            <Label htmlFor="dst-mode" className="text-sm">
              {isArabic ? "التوقيت الصيفي" : "Daylight Saving"}
            </Label>
            <Select
              value={settings.dstMode}
              onValueChange={(val) => setDstMode(val as DSTMode)}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <SelectTrigger
                id="dst-mode"
                className="w-auto min-w-[120px] h-8 text-xs rounded-lg"
              >
                <SelectValue
                  placeholder={isArabic ? "اختر التوقيت" : "Select DST mode"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">
                  {isArabic ? "تلقائي" : "Auto"}
                </SelectItem>
                <SelectItem value="on">
                  {isArabic ? "صيفي (+1)" : "Summer (+1)"}
                </SelectItem>
                <SelectItem value="off">
                  {isArabic ? "شتوي" : "Winter"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="py-3 flex items-center justify-between">
            <Label htmlFor="reciter-select" className="text-sm">
              {isArabic ? "القارئ" : "Reciter"}
            </Label>
            <Select
              value={settings.quranReciter}
              onValueChange={setQuranReciter}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <SelectTrigger
                id="reciter-select"
                className="w-auto min-w-[140px] h-8 text-xs rounded-lg"
              >
                <SelectValue
                  placeholder={isArabic ? "اختر القارئ" : "Select reciter"}
                />
              </SelectTrigger>
              <SelectContent>
                {availableReciters.map((reciter) => (
                  <SelectItem
                    key={reciter.identifier}
                    value={reciter.identifier}
                  >
                    {isArabic ? reciter.name : reciter.englishName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="py-3 flex items-center justify-between">
            <Label htmlFor="calculation-method" className="text-sm">
              {isArabic ? "طريقة الحساب" : "Calc. Method"}
            </Label>
            <Select
              value={settings.calculationMethod}
              onValueChange={(val) =>
                setCalculationMethod(val as CalculationMethodName)
              }
              dir={isArabic ? "rtl" : "ltr"}
            >
              <SelectTrigger
                id="calculation-method"
                className="w-auto min-w-[140px] h-8 text-xs rounded-lg"
              >
                <SelectValue
                  placeholder={isArabic ? "اختر" : "Select method"}
                />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(calculationMethods).map(([key, name]) => (
                  <SelectItem key={key} value={key}>
                    {isArabic
                      ? calculationMethodsArabic[key as CalculationMethodName]
                      : name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="py-3 flex items-center justify-between">
            <Label htmlFor="widget-theme" className="text-sm">
              {isArabic ? "مظهر الويدجت" : "Widget Theme"}
            </Label>
            <Select
              value={settings.widgetTheme}
              onValueChange={(val) => setWidgetTheme(val as WidgetTheme)}
              dir={isArabic ? "rtl" : "ltr"}
            >
              <SelectTrigger
                id="widget-theme"
                className="w-auto min-w-[140px] h-8 text-xs rounded-lg"
              >
                <SelectValue
                  placeholder={isArabic ? "اختر المظهر" : "Select theme"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  {isArabic ? "افتراضي" : "Default"}
                </SelectItem>
                <SelectItem value="system">
                  {isArabic ? "Material You" : "Material You"}
                </SelectItem>
                <SelectItem value="custom">
                  {isArabic ? "مخصص" : "Custom"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.widgetTheme === "custom" && (
            <div className="py-3 flex items-center justify-between last:pb-0">
              <Label htmlFor="widget-color" className="text-sm">
                {isArabic ? "لون الويدجت" : "Widget Color"}
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-border">
                  <input
                    type="color"
                    id="widget-color"
                    value={settings.widgetBackgroundColor}
                    onChange={(e) => setWidgetBackgroundColor(e.target.value)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                  />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {settings.widgetBackgroundColor}
                </span>
              </div>
            </div>
          )}
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
