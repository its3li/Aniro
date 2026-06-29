
'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Reciter } from '@/lib/reciters';
import { reciters as availableReciters } from '@/lib/reciters';


export type Language = 'en' | 'ar' | 'ur' | 'fa';
type QuranViewMode = 'list' | 'page';
export type QuranEdition = 'uthmani' | 'warsh';

import { CalculationMethodName, DSTMode } from '@/lib/prayer';

export type TimeFormat = '12h' | '24h';

type AzanMode = 'full' | 'silent';

export const supportedLanguages: Array<{ code: Language; name: string; nativeName: string; dir: 'ltr' | 'rtl' }> = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
];

export function isSupportedLanguage(value: unknown): value is Language {
  return supportedLanguages.some(language => language.code === value);
}

export function getLanguageDirection(language: Language) {
  return supportedLanguages.find(item => item.code === language)?.dir ?? 'ltr';
}

type Settings = {
  fontSize: number;
  prayerOffset: number;
  dstMode: DSTMode;
  language: Language;
  quranViewMode: QuranViewMode;
  quranEdition: QuranEdition;
  quranTajweedEnabled: boolean;
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
  hasLoadedSettings: boolean;
  hadStoredSettings: boolean;
  setFontSize: (size: number) => void;
  setPrayerOffset: (offset: number) => void;
  setLanguage: (language: Language) => void;
  setQuranViewMode: (mode: QuranViewMode) => void;
  setQuranEdition: (edition: QuranEdition) => void;
  setQuranTajweedEnabled: (enabled: boolean) => void;
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
  quranTajweedEnabled: false,
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
  hasLoadedSettings: false,
  hadStoredSettings: false,
  setFontSize: () => null,
  setPrayerOffset: () => null,
  setLanguage: () => null,
  setQuranViewMode: () => null,
  setQuranEdition: () => null,
  setQuranTajweedEnabled: () => null,
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
  const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
  const [hadStoredSettings, setHadStoredSettings] = useState(false);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('app-settings');
      setHadStoredSettings(Boolean(storedSettings));
      if (storedSettings) {
        // Merge stored settings with defaults to avoid breaking changes
        const parsedSettings = JSON.parse(storedSettings);
        const wasLegacyTajweed = parsedSettings.quranEdition === 'tajweed';
        const knownEditions: QuranEdition[] = ['uthmani', 'warsh'];
        const storedEdition = knownEditions.includes(parsedSettings.quranEdition)
          ? parsedSettings.quranEdition
          : 'uthmani';
        const storedLanguage = isSupportedLanguage(parsedSettings.language)
          ? parsedSettings.language
          : defaultSettings.language;
        setSettings({
          ...defaultSettings,
          ...parsedSettings,
          language: storedLanguage,
          quranEdition: wasLegacyTajweed ? 'uthmani' : storedEdition,
          quranTajweedEnabled: Boolean(parsedSettings.quranTajweedEnabled || wasLegacyTajweed),
        });
      }
    } catch (error) {
      console.error("Could not load settings", error);
    } finally {
      setHasLoadedSettings(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedSettings) return;

    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
      document.documentElement.style.fontSize = `${settings.fontSize}px`;
      document.documentElement.dir = getLanguageDirection(settings.language);
      document.documentElement.lang = settings.language;
    } catch (error) {
      console.error("Could not save settings", error);
    }
  }, [hasLoadedSettings, settings]);

  const setFontSize = useCallback((size: number) => {
    setSettings(s => ({ ...s, fontSize: size }));
  }, []);

  const setPrayerOffset = useCallback((offset: number) => {
    setSettings(s => ({ ...s, prayerOffset: offset }));
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setSettings(s => ({ ...s, language }));
  }, []);

  const setQuranViewMode = useCallback((mode: QuranViewMode) => {
    setSettings(s => ({ ...s, quranViewMode: mode }));
  }, []);

  const setQuranEdition = useCallback((edition: QuranEdition) => {
    setSettings(s => ({
      ...s,
      quranEdition: edition,
      quranTajweedEnabled: edition === 'uthmani' ? s.quranTajweedEnabled : false,
    }));
  }, []);

  const setQuranTajweedEnabled = useCallback((enabled: boolean) => {
    setSettings(s => ({
      ...s,
      quranTajweedEnabled: s.quranEdition === 'uthmani' ? enabled : false,
    }));
  }, []);

  const setAppTheme = useCallback((theme: 'system' | 'light' | 'dark') => {
    setSettings(s => ({ ...s, appTheme: theme }));
  }, []);

  const setQuranReciter = useCallback((reciter: string) => {
    setSettings(s => ({ ...s, quranReciter: reciter }));
  }, []);

  const setCalculationMethod = useCallback((method: CalculationMethodName) => {
    setSettings(s => s.calculationMethod === method ? s : ({ ...s, calculationMethod: method }));
  }, []);

  const setDstMode = useCallback((mode: DSTMode) => {
    setSettings(s => ({ ...s, dstMode: mode }));
  }, []);

  const setTimeFormat = useCallback((format: TimeFormat) => {
    setSettings(s => ({ ...s, timeFormat: format }));
  }, []);

  const setWidgetTheme = useCallback((theme: 'default' | 'system' | 'custom') => {
    setSettings(s => ({ ...s, widgetTheme: theme }));
  }, []);

  const setWidgetBackgroundColor = useCallback((color: string) => {
    setSettings(s => ({ ...s, widgetBackgroundColor: color }));
  }, []);

  const setAzanMode = useCallback((mode: AzanMode) => {
    setSettings(s => ({ ...s, azanMode: mode }));
  }, []);

  const setIncludeIshraq = useCallback((include: boolean) => {
    setSettings(s => ({ ...s, includeIshraq: include }));
  }, []);

  const setFajrQuizEnabled = useCallback((enabled: boolean) => {
    setSettings(s => ({ ...s, fajrQuizEnabled: enabled }));
  }, []);

  const value = useMemo(() => ({
    settings,
    hasLoadedSettings,
    hadStoredSettings,
    setFontSize,
    setPrayerOffset,
    setLanguage,
    setQuranViewMode,
    setQuranEdition,
    setQuranTajweedEnabled,
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
  }), [
    settings,
    hasLoadedSettings,
    hadStoredSettings,
    setFontSize,
    setPrayerOffset,
    setLanguage,
    setQuranViewMode,
    setQuranEdition,
    setQuranTajweedEnabled,
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
  ]);

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

