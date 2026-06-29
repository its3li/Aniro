import type { Language } from '@/components/providers/settings-provider';

export function pickLanguage<T>(language: Language, values: Partial<Record<Language, T>> & { en: T }): T {
  return values[language] ?? values.en;
}

export function isArabicLike(language: Language) {
  return language === 'ar' || language === 'ur' || language === 'fa';
}
