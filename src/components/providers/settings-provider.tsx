
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Reciter } from '@/lib/reciters';
import { reciters as availableReciters } from '@/lib/reciters';


type Language = 'en' | 'ar';
type QuranViewMode = 'list' | 'page';
export type QuranEdition = 'uthmani' | 'tajweed' | 'warsh' | 'shubah';

import { CalculationMethodName, DSTMode } from '@/lib/prayer';

export type TimeFormat = '12h' | '24h';

type AzanMode = 'full' | 'silent';

type Settings = {
  fontSize: number;
  prayerOffset: number;
  dstMode: DSTMode;
  language: Language;
  quranViewMode: QuranViewMode;
  quranEdition: QuranEdition;
  quranReciter: string;
  calculationMethod: CalculationMethodName;
  timeFormat: TimeFormat;
  widgetTheme: 'default' | 'system' | 'custom';
  widgetBackgroundColor: string;
  appTheme: 'system' | 'light' | 'dark';
  azanMode: AzanMode;
  includeIshraq: boolean;
  fajrQuizEnabled: boolean;
};

type SettingsProviderState = {
  settings: Settings;
  setFontSize: (size: number) => void;
  setPrayerOffset: (offset: number) => void;
  setLanguage: (language: Language) => void;
  setQuranViewMode: (mode: QuranViewMode) => void;
  setQuranEdition: (edition: QuranEdition) => void;
  setQuranReciter: (reciter: string) => void;
  setCalculationMethod: (method: CalculationMethodName) => void;
  setDstMode: (mode: DSTMode) => void;
  setTimeFormat: (format: TimeFormat) => void;
  setWidgetTheme: (theme: 'default' | 'system' | 'custom') => void;
  setWidgetBackgroundColor: (color: string) => void;
  setAppTheme: (theme: 'system' | 'light' | 'dark') => void;
  setAzanMode: (mode: AzanMode) => void;
  setIncludeIshraq: (include: boolean) => void;
  setFajrQuizEnabled: (enabled: boolean) => void;
  availableReciters: Reciter[];
};

const defaultSettings: Settings = {
  fontSize: 16,
  prayerOffset: 0,
  language: 'ar',
  quranViewMode: 'list',
  quranEdition: 'uthmani',
  quranReciter: 'ar.mahermuaiqly',
  calculationMethod: 'muslim_world_league',
  dstMode: 'auto',
  timeFormat: '12h',
  widgetTheme: 'default',
  widgetBackgroundColor: '#24252B',
  appTheme: 'system',
  azanMode: 'full',
  includeIshraq: true,
  fajrQuizEnabled: true,
};

const SettingsProviderContext = createContext<SettingsProviderState>({
  settings: defaultSettings,
  setFontSize: () => null,
  setPrayerOffset: () => null,
  setLanguage: () => null,
  setQuranViewMode: () => null,
  setQuranEdition: () => null,
  setQuranReciter: () => null,
  setCalculationMethod: () => null,
  setDstMode: () => null,
  setTimeFormat: () => null,
  setWidgetTheme: () => null,
  setWidgetBackgroundColor: () => null,
  setAppTheme: () => null,
  setAzanMode: () => null,
  setIncludeIshraq: () => null,
  setFajrQuizEnabled: () => null,
  availableReciters: availableReciters,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('app-settings');
      if (storedSettings) {
        // Merge stored settings with defaults to avoid breaking changes
        const parsedSettings = JSON.parse(storedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error("Could not load settings", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
      document.documentElement.style.fontSize = `${settings.fontSize}px`;
      document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = settings.language;
    } catch (error) {
      console.error("Could not save settings", error);
    }
  }, [settings]);

  // Sync with Native Widget
  useEffect(() => {
    const syncWidget = async () => {
      try {
        // @ts-expect-error WidgetData is registered only in native builds
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.WidgetData) {
          // Get cached location from localStorage (set by useLocation hook)
          let latitude = 21.4225; // Default: Mecca (Kaaba)
          let longitude = 39.8262;
          
          try {
            const cached = localStorage.getItem('aniro_location');
            if (cached) {
              const loc = JSON.parse(cached);
              if (loc.latitude && loc.longitude) {
                latitude = loc.latitude;
                longitude = loc.longitude;
              }
            }
          } catch {}
          
          // @ts-expect-error WidgetData is registered only in native builds
          await window.Capacitor.Plugins.WidgetData.updateData({
            latitude,
            longitude,
            calculationMethod: settings.calculationMethod,
            prayerOffset: settings.prayerOffset,
            dstMode: settings.dstMode,
            widgetBackgroundColor: settings.widgetTheme === 'default' ? '#24252B' : settings.widgetBackgroundColor,
            useSystemWidgetColor: settings.widgetTheme === 'system',
            language: settings.language,
            azanMode: settings.azanMode,
            includeIshraq: settings.includeIshraq
          });
        }
      } catch (e) {
        console.error("Failed to sync widget data", e);
      }
    };
    syncWidget();
  }, [settings.calculationMethod, settings.prayerOffset, settings.dstMode, settings.widgetBackgroundColor, settings.widgetTheme, settings.language, settings.azanMode, settings.includeIshraq]);

  const setFontSize = (size: number) => {
    setSettings(s => ({ ...s, fontSize: size }));
  };

  const setPrayerOffset = (offset: number) => {
    setSettings(s => ({ ...s, prayerOffset: offset }));
  };

  const setLanguage = (language: Language) => {
    setSettings(s => ({ ...s, language }));
  };

  const setQuranViewMode = (mode: QuranViewMode) => {
    setSettings(s => ({ ...s, quranViewMode: mode }));
  };

  const setQuranEdition = (edition: QuranEdition) => {
    setSettings(s => ({ ...s, quranEdition: edition }));
  };

  const setAppTheme = (theme: 'system' | 'light' | 'dark') => {
    setSettings(s => ({ ...s, appTheme: theme }));
  };

  const setQuranReciter = (reciter: string) => {
    setSettings(s => ({ ...s, quranReciter: reciter }));
  }

  const setCalculationMethod = (method: CalculationMethodName) => {
    setSettings(s => ({ ...s, calculationMethod: method }));
  }

  const setDstMode = (mode: DSTMode) => {
    setSettings(s => ({ ...s, dstMode: mode }));
  }

  const setTimeFormat = (format: TimeFormat) => {
    setSettings(s => ({ ...s, timeFormat: format }));
  }

  const setWidgetTheme = (theme: 'default' | 'system' | 'custom') => {
    setSettings(s => ({ ...s, widgetTheme: theme }));
  }

  const setWidgetBackgroundColor = (color: string) => {
    setSettings(s => ({ ...s, widgetBackgroundColor: color }));
  }

  const setAzanMode = (mode: AzanMode) => {
    setSettings(s => ({ ...s, azanMode: mode }));
  }

  const setIncludeIshraq = (include: boolean) => {
    setSettings(s => ({ ...s, includeIshraq: include }));
  }

  const setFajrQuizEnabled = (enabled: boolean) => {
    setSettings(s => ({ ...s, fajrQuizEnabled: enabled }));
  }

  const value = {
    settings,
    setFontSize,
    setPrayerOffset,
    setLanguage,
    setQuranViewMode,
    setQuranEdition,
    setQuranReciter,
    setCalculationMethod,
    setDstMode,
    setTimeFormat,
    setWidgetTheme,
    setWidgetBackgroundColor,
    setAppTheme,
    setAzanMode,
    setIncludeIshraq,
    setFajrQuizEnabled,
    availableReciters,
  };

  return (
    <SettingsProviderContext.Provider value={value}>
      {children}
    </SettingsProviderContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsProviderContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
