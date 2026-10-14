'use client';
import { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { localDayKey } from '@/lib/azkar-progress';

export function useLocalDay() {
  const [day, setDay] = useState('');
  useEffect(() => {
    let timer: number;
    let disposed = false;
    let resumeListener: PluginListenerHandle | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      const now = new Date();
      setDay(localDayKey(now));
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = window.setTimeout(refresh, Math.max(1, midnight.getTime() - now.getTime() + 25));
    };
    const visible = () => { if (!document.hidden) refresh(); };
    refresh();
    document.addEventListener('visibilitychange', visible);
    window.addEventListener('focus', refresh);
    if (Capacitor.isNativePlatform()) {
      void App.addListener('appStateChange', ({isActive}) => {
        if (isActive && !disposed) refresh();
      }).then(listener => {
        if (disposed) void listener.remove();
        else resumeListener = listener;
      });
    }
    return () => {
      disposed = true;
      void resumeListener?.remove();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', visible);
      window.removeEventListener('focus', refresh);
    };
  }, []);
  return day;
}
