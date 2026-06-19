'use client';

import { WelcomeHeader } from '@/components/home/welcome-header';
import { NextPrayerCard } from '@/components/home/next-prayer-card';
import { LastReadCard } from '@/components/home/last-read-card';
import { DailyWisdomCard } from '@/components/home/daily-wisdom-card';
import { CurrentAzkarCard } from '@/components/home/current-azkar-card';
import { useLastRead } from '@/hooks/use-last-read';
import { useEffect } from 'react';

export default function Home() {
  const { refreshLastRead } = useLastRead();

  useEffect(() => {
    refreshLastRead();
  }, [refreshLastRead]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 px-4 pt-4 animate-fade-in">
      <WelcomeHeader />
      <NextPrayerCard />
      <CurrentAzkarCard />
      <LastReadCard />
      <DailyWisdomCard />
    </div>
  );
}
