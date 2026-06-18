
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
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pt-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-normal">{isArabic ? 'الإعدادات' : 'Settings'}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isArabic ? 'الصلاة والقرآن والتنبيهات والمظهر والتحديثات في مكان واحد.' : 'Prayer, Quran, notifications, appearance, and updates in one place.'}
        </p>
      </div>
      <GeneralSettings />
      <QuranSettings />
      <CustomizationSettings />
      <AboutSettings />
    </div>
  );
}
