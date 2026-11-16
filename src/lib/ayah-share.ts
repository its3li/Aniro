import { stripTajweed } from '@/lib/tajweed';
import { cleanSurahName, toArabicDigits } from '@/lib/arabic';
import type { ShareItem } from '@/lib/share-image';

export interface AyahShareSource {
  text: string;
  numberInSurah: number;
  surahName: string;
  surahEnglishName: string;
  translation?: string;
}

/** "البقرة ٢٥٥ · Al-Baqarah 255" */
export function ayahReference(a: Pick<AyahShareSource, 'numberInSurah' | 'surahName' | 'surahEnglishName'>): string {
  return `${cleanSurahName(a.surahName)} ${toArabicDigits(String(a.numberInSurah))} · ${a.surahEnglishName} ${a.numberInSurah}`;
}

export function ayahShareItem(a: AyahShareSource): ShareItem {
  return {
    arabic: `${stripTajweed(a.text).trim()} ﴿${toArabicDigits(String(a.numberInSurah))}﴾`,
    translation: a.translation || undefined,
    reference: ayahReference(a),
    ayah: { surahAr: cleanSurahName(a.surahName), surahEn: a.surahEnglishName, number: a.numberInSurah },
  };
}

/** Plain text for sharing / copying one or more ayat. */
export function ayahShareText(ayat: AyahShareSource[]): string {
  if (ayat.length === 0) return '';
  const body = ayat.map(a => `${stripTajweed(a.text).trim()} ﴿${toArabicDigits(String(a.numberInSurah))}﴾`).join(' ');
  const first = ayat[0];
  const last = ayat[ayat.length - 1];
  const range = ayat.length > 1 && first.surahEnglishName === last.surahEnglishName
    ? `${cleanSurahName(first.surahName)} ${toArabicDigits(String(first.numberInSurah))}–${toArabicDigits(String(last.numberInSurah))} · ${first.surahEnglishName} ${first.numberInSurah}–${last.numberInSurah}`
    : ayahReference(first);
  const translations = ayat.map(a => a.translation).filter(Boolean).join(' ');
  return [body, translations, `[${range}]`].filter(Boolean).join('\n\n');
}
