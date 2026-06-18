
export interface Word {
  text: string;
  tajweed: {
    rule: string;
    color: string;
  } | null;
}

export interface Verse {
  number: {
    inQuran: number;
    inSurah: number;
  };
  text: string;
  translation: string;
  page?: number;
  tafseer?: string;
  words?: Word[];
}

export interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

export interface Surah extends SurahInfo {
  verses: Verse[];
}

interface QuranAyahData {
  number: number;
  numberInSurah: number;
  text: string;
  page?: number;
}

interface QuranSurahData {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  ayahs: QuranAyahData[];
}

interface QuranApiResponse<T> {
  code: number;
  data?: T;
}

// ============================================
// OFFLINE-FIRST: bundled JSON → IDB cache → network fallback
// ============================================

import { get, set } from 'idb-keyval';

const SURAH_DATA_PREFIX = 'surah_';
const SURAH_LIST_KEY = 'surah_list';
const SURAH_API_BASE = 'https://api.alquran.cloud/v1/surah';

// ============================================
// In-memory LRU cache
// ============================================

const MEM_CACHE_MAX = 20;
const memCache = new Map<string, Surah | SurahInfo[]>();

function memGet<T>(key: string): T | undefined {
  const v = memCache.get(key);
  if (v) {
    memCache.delete(key);
    memCache.set(key, v);
  }
  return v as T | undefined;
}

function memSet(key: string, value: Surah | SurahInfo[]) {
  if (memCache.size >= MEM_CACHE_MAX) {
    const oldest = memCache.keys().next().value;
    if (oldest) memCache.delete(oldest);
  }
  memCache.set(key, value);
}

// ============================================
// Request deduplication
// ============================================

const inflightRequests = new Map<string, Promise<Surah | null>>();

// ============================================
// Retry helper with timeout
// ============================================

async function fetchWithRetry(
  url: string,
  retries = 2,
  delay = 500,
  timeoutMs = 10000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delay * (attempt + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Unreachable');
}

// ============================================
// Load from bundled static JSON (in public/data/quran/)
// ============================================

async function loadBundledSurah(surahId: number, edition: string): Promise<QuranSurahData | null> {
  try {
    const res = await fetch(`/data/quran/surah/${edition}/${surahId}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadBundledSurahList(): Promise<SurahInfo[] | null> {
  try {
    const res = await fetch('/data/quran/surah-list.json');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ============================================
// Public API
// ============================================

/**
 * Get a Surah — Offline first (bundled JSON → IDB → network).
 */
export async function getSurah(
  surahId: number,
  edition: string = 'quran-uthmani'
): Promise<Surah | null> {
  const cacheKey = `${SURAH_DATA_PREFIX}${surahId}_${edition}`;

  // Tier 1: In-memory
  const inMem = memGet<Surah>(cacheKey);
  if (inMem) return inMem;

  // Deduplicate
  const existing = inflightRequests.get(cacheKey);
  if (existing) return existing;

  const fetchPromise = fetchSurahInternal(surahId, edition, cacheKey);
  inflightRequests.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

async function fetchSurahInternal(
  surahId: number,
  edition: string,
  cacheKey: string
): Promise<Surah | null> {
  try {
    // Tier 2: IndexedDB
    const cachedData = await get(cacheKey);
    if (cachedData) {
      memSet(cacheKey, cachedData as Surah);
      return cachedData as Surah;
    }

    // Tier 3: Bundled JSON (local file in APK)
    const bundled = await loadBundledSurah(surahId, edition);
    if (bundled) {
      const surah: Surah = {
        number: bundled.number,
        name: bundled.name,
        englishName: bundled.englishName,
        englishNameTranslation: bundled.englishNameTranslation,
        numberOfAyahs: bundled.numberOfAyahs,
        revelationType: bundled.revelationType,
        verses: bundled.ayahs.map((a) => ({
          number: { inQuran: a.number, inSurah: a.numberInSurah },
          text: a.text,
          translation: '',
          page: a.page,
        })),
      };
      memSet(cacheKey, surah);
      set(cacheKey, surah).catch(() => { });
      return surah;
    }

    // Tier 4: Network API fallback
    const response = await fetchWithRetry(`${SURAH_API_BASE}/${surahId}/${edition}`);
    const json = await response.json() as QuranApiResponse<QuranSurahData>;
    if (json.code !== 200 || !json.data) throw new Error('Invalid API response');

    const apiData = json.data;
    const surah: Surah = {
      number: apiData.number,
      name: apiData.name,
      englishName: apiData.englishName,
      englishNameTranslation: apiData.englishNameTranslation,
      numberOfAyahs: apiData.numberOfAyahs,
      revelationType: apiData.revelationType,
      verses: apiData.ayahs.map((ayah) => ({
        number: { inQuran: ayah.number, inSurah: ayah.numberInSurah },
        text: ayah.text,
        translation: '',
        page: ayah.page,
      })),
    };

    memSet(cacheKey, surah);
    set(cacheKey, surah).catch(() => { });
    return surah;
  } catch (error) {
    console.error(`[Quran] Failed to get Surah ${surahId}:`, error);
    return null;
  }
}

/**
 * Get Surah with translation — loads Arabic + translation from bundled JSON.
 */
export async function getSurahWithTranslation(
  surahId: number,
  arabicEdition: string = 'quran-uthmani',
  translationEdition: string = 'en.sahih'
): Promise<Surah | null> {
  const cacheKey = `${SURAH_DATA_PREFIX}${surahId}_${arabicEdition}_${translationEdition}`;

  // Tier 1: In-memory
  const inMem = memGet<Surah>(cacheKey);
  if (inMem) return inMem;

  // Deduplicate
  const existing = inflightRequests.get(cacheKey);
  if (existing) return existing;

  const fetchPromise = fetchSurahWithTranslationInternal(surahId, arabicEdition, translationEdition, cacheKey);
  inflightRequests.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
}

async function fetchSurahWithTranslationInternal(
  surahId: number,
  arabicEdition: string,
  translationEdition: string,
  cacheKey: string
): Promise<Surah | null> {
  try {
    // Tier 2: IndexedDB
    const cachedData = await get(cacheKey);
    if (cachedData) {
      memSet(cacheKey, cachedData as Surah);
      return cachedData as Surah;
    }

    // Tier 3: Bundled JSON — load Arabic + translation from local files
    const [bundledArabic, bundledTranslation] = await Promise.all([
      loadBundledSurah(surahId, arabicEdition),
      loadBundledSurah(surahId, translationEdition),
    ]);

    if (bundledArabic && bundledTranslation) {
      const surah: Surah = {
        number: bundledArabic.number,
        name: bundledArabic.name,
        englishName: bundledArabic.englishName,
        englishNameTranslation: bundledArabic.englishNameTranslation,
        numberOfAyahs: bundledArabic.numberOfAyahs,
        revelationType: bundledArabic.revelationType,
        verses: bundledArabic.ayahs.map((a, i) => ({
          number: { inQuran: a.number, inSurah: a.numberInSurah },
          text: a.text,
          translation: bundledTranslation.ayahs[i]?.text || '',
          page: a.page,
        })),
      };
      memSet(cacheKey, surah);
      set(cacheKey, surah).catch(() => { });
      return surah;
    }

    // Tier 4: Network API fallback (parallel fetch)
    const [arabicResponse, translationResponse] = await Promise.all([
      fetchWithRetry(`${SURAH_API_BASE}/${surahId}/${arabicEdition}`),
      fetchWithRetry(`${SURAH_API_BASE}/${surahId}/${translationEdition}`),
    ]);

    const [arabicJson, translationJson] = await Promise.all([
      arabicResponse.json() as Promise<QuranApiResponse<QuranSurahData>>,
      translationResponse.json() as Promise<QuranApiResponse<QuranSurahData>>,
    ]);

    if (arabicJson.code !== 200 || translationJson.code !== 200 || !arabicJson.data || !translationJson.data) {
      throw new Error('Invalid API response');
    }

    const arabicData = arabicJson.data;
    const translationData = translationJson.data;

    const surah: Surah = {
      number: arabicData.number,
      name: arabicData.name,
      englishName: arabicData.englishName,
      englishNameTranslation: arabicData.englishNameTranslation,
      numberOfAyahs: arabicData.numberOfAyahs,
      revelationType: arabicData.revelationType,
      verses: arabicData.ayahs.map((ayah, index) => ({
        number: { inQuran: ayah.number, inSurah: ayah.numberInSurah },
        text: ayah.text,
        translation: translationData.ayahs[index]?.text || '',
        page: ayah.page,
      })),
    };

    memSet(cacheKey, surah);
    set(cacheKey, surah).catch(() => { });
    return surah;
  } catch (error) {
    console.error(`[Quran] Failed to get Surah ${surahId} with translation:`, error);
    return null;
  }
}

/**
 * Get the list of all Surahs — from bundled JSON first, then IDB, then network.
 */
export async function getSurahList(): Promise<SurahInfo[]> {
  // Tier 1: In-memory
  const inMem = memGet<SurahInfo[]>(SURAH_LIST_KEY);
  if (inMem) return inMem;

  try {
    // Tier 2: IndexedDB
    const cachedList = await get(SURAH_LIST_KEY);
    if (cachedList) {
      memSet(SURAH_LIST_KEY, cachedList as SurahInfo[]);
      return cachedList as SurahInfo[];
    }

    // Tier 3: Bundled JSON
    const bundled = await loadBundledSurahList();
    if (bundled) {
      memSet(SURAH_LIST_KEY, bundled);
      set(SURAH_LIST_KEY, bundled).catch(() => { });
      return bundled;
    }

    // Tier 4: Network
    const response = await fetchWithRetry(SURAH_API_BASE);
    const json = await response.json();
    if (json.code !== 200 || !json.data) throw new Error('Invalid API response');

    const surahList: SurahInfo[] = json.data;
    memSet(SURAH_LIST_KEY, surahList);
    set(SURAH_LIST_KEY, surahList).catch(() => { });
    return surahList;
  } catch (error) {
    console.error('[Quran] Failed to get Surah list:', error);
    return [];
  }
}

/**
 * Check if a Surah is available offline.
 */
export async function isSurahCached(
  surahId: number,
  edition: string = 'quran-uthmani'
): Promise<boolean> {
  const cacheKey = `${SURAH_DATA_PREFIX}${surahId}_${edition}`;
  if (memGet(cacheKey)) return true;
  const data = await get(cacheKey);
  return data !== undefined;
}

/**
 * Prefetch a Surah in the background (for preloading).
 */
export async function prefetchSurah(surahId: number): Promise<void> {
  await getSurah(surahId);
}
