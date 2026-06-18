'use client';

import { useSettings } from '../providers/settings-provider';

export function WelcomeHeader() {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  return (
    <header className="py-1.5 text-center">
      <h1 className="font-quran text-[1.7rem] font-semibold leading-relaxed tracking-normal text-foreground">
        {isArabic ? 'السلام عليكم، يومك مبارك' : 'Salam, may your day be blessed'}
      </h1>
    </header>
  );
}
