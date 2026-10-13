
'use client';
import { CustomizationSettings } from "@/components/settings/customization-settings";
import { GeneralSettings } from "@/components/settings/general-settings";
import { QuranSettings } from "@/components/settings/quran-settings";
import { AboutSettings } from "@/components/settings/about-settings";
import { useSettings } from "@/components/providers/settings-provider";
import { PageHeading } from '@/components/page-heading';

export default function SettingsPage() {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <div className="app-page settings-page animate-fade-in">
      <PageHeading title="Make it yours" titleAr="على طريقتك" description="Set your prayer, reading, and listening preferences." descriptionAr="اضبط الصلاة والقراءة والاستماع بما يناسبك." />
      <nav className="settings-index" aria-label={isArabic ? 'أقسام الإعدادات' : 'Settings sections'}>
        <a href="#general">{isArabic ? 'عام وتنبيهات' : 'General & alerts'}</a><a href="#reading">{isArabic ? 'القراءة' : 'Reading'}</a><a href="#preferences">{isArabic ? 'التفضيلات' : 'Preferences'}</a><a href="#about">{isArabic ? 'حول أنيرو' : 'About Aniro'}</a>
      </nav>
      <section id="general"><GeneralSettings /></section>
      <section id="reading"><QuranSettings /></section>
      <section id="preferences"><CustomizationSettings /></section>
      <section id="about"><AboutSettings /></section>
    </div>
  );
}
