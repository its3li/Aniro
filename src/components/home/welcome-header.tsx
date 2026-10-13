'use client';

import { useMemo } from 'react';
import { useSettings, type Language } from '../providers/settings-provider';
import { pickLanguage } from '@/lib/i18n';
import Link from 'next/link';
import { SlidersHorizontalIcon as SlidersHorizontal } from '@/components/icons/interface-icons';

const hijriMonths: Record<Language, string[]> = {
  ar: ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaaban', 'Ramadan', 'Shawwal', 'Dhu al-Qidah', 'Dhu al-Hijjah'],
  ur: ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذوالقعدہ', 'ذوالحجہ'],
  fa: ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاول', 'جمادی الثانی', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذی القعده', 'ذی الحجه'],
};

const numberLocales: Record<Language, string> = {
  ar: 'ar-EG',
  en: 'en-US',
  ur: 'ur-PK',
  fa: 'fa-IR',
};

function formatNumber(value: number, language: Language) {
  return new Intl.NumberFormat(numberLocales[language], { useGrouping: false }).format(value);
}

function getHijriParts(date: Date) {
  const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const day = Number(parts.find(part => part.type === 'day')?.value);
  const month = Number(parts.find(part => part.type === 'month')?.value);
  const year = Number(parts.find(part => part.type === 'year')?.value);

  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year) || year < 1300 || year > 1700) {
    return null;
  }

  return { day, month, year };
}

function formatHijriDate(language: Language) {
  try {
    const parts = getHijriParts(new Date());
    if (!parts) return '';

    const monthName = hijriMonths[language][parts.month - 1] ?? hijriMonths.en[parts.month - 1];
    return `${formatNumber(parts.day, language)} ${monthName} ${formatNumber(parts.year, language)} هـ`;
  } catch {
    return '';
  }
}

export function WelcomeHeader() {
  const { settings } = useSettings();
  const hijriDate = useMemo(() => formatHijriDate(settings.language), [settings.language]);
  const greeting = pickLanguage(settings.language, {
    ar: 'السلام عليكم، يومك مبارك',
    en: 'Salam, may your day be blessed',
    ur: 'السلام علیکم، آپ کا دن مبارک ہو',
    fa: 'سلام علیکم، روزتان مبارک',
  });

  return (
    <header className="home-heading">
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="brand-wordmark" data-arabic={settings.language === 'ar'}>{settings.language === 'ar' ? 'أنيرو' : 'aniro'}<span>.</span></Link>
        <Link href="/settings" className="heading-settings" aria-label={settings.language === 'ar' ? 'الإعدادات' : 'Settings'}><SlidersHorizontal size={20} strokeWidth={1.5} /></Link>
      </div>
      <h1 className="text-[1.5rem] font-semibold leading-relaxed tracking-normal text-foreground">
        {greeting}
      </h1>
      {hijriDate && (
        <p className="mt-2 text-sm font-medium text-muted-foreground" dir="auto">
          {hijriDate}
        </p>
      )}
    </header>
  );
}
