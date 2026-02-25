
'use client';
import { CustomizationSettings } from "@/components/settings/customization-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { QuranSettings } from "@/components/settings/quran-settings";
import { AboutSettings } from "@/components/settings/about-settings";
import { useSettings } from "@/components/providers/settings-provider";

export default function SettingsPage() {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <div className="px-4 pt-4 flex flex-col gap-4 animate-fade-in">
      <h1 className="text-xl font-semibold">{isArabic ? 'الإعدادات' : 'Settings'}</h1>
      <GeneralSettings />
      <QuranSettings />
      <CustomizationSettings />
      <AboutSettings />
    </div>
  );
}
