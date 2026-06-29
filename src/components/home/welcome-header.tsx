'use client';

import { useMemo } from 'react';
import { useSettings } from '../providers/settings-provider';

const hijriLocales = {
  ar: 'ar-SA-u-ca-islamic-umalqura',
  en: 'en-US-u-ca-islamic-umalqura',
  ur: 'ur-PK-u-ca-islamic-umalqura',
  fa: 'fa-IR-u-ca-islamic-umalqura',
};

export function WelcomeHeader() {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const hijriDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(hijriLocales[settings.language], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return '';
    }
  }, [settings.language]);

  return (
    <header className="py-1.5 text-center">
      <h1 className="font-quran text-[1.7rem] font-semibold leading-relaxed tracking-normal text-foreground">
        {isArabic ? 'السلام عليكم، يومك مبارك' : 'Salam, may your day be blessed'}
      </h1>
      {hijriDate && (
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          {hijriDate}
        </p>
      )}
    </header>
  );
}
