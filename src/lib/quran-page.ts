import { get, set } from 'idb-keyval';

// ============================================================
// MUSHAF PAGE DATA — Surah start pages (Madani mushaf standard)
// ============================================================

/** First mushaf page for each surah (1-indexed, Surah 1 → page 1, Surah 2 → page 2, etc.) */
export const SURAH_START_PAGE: number[] = [
    0,  // placeholder for index 0
    1, 2, 50, 77, 106, 128, 151, 177, 187, 208,
    221, 235, 249, 255, 262, 267, 282, 293, 305, 312,
    322, 332, 342, 350, 359, 367, 377, 385, 396, 404,
    411, 415, 418, 428, 434, 440, 446, 453, 458, 467,
    477, 483, 489, 496, 499, 502, 507, 511, 515, 518,
    520, 523, 526, 528, 531, 534, 537, 542, 545, 549,
    551, 553, 554, 556, 558, 560, 562, 564, 566, 568,
    570, 572, 574, 575, 577, 578, 580, 582, 583, 585,
    586, 587, 587, 589, 590, 591, 591, 592, 593, 594,
    595, 595, 596, 596, 597, 597, 598, 598, 599, 599,
    600, 600, 601, 601, 601, 602, 602, 602, 603, 603,
    603, 604, 604, 604,
];

const TOTAL_MUSHAF_PAGES = 604;

const PAGE_DATA_PREFIX = 'mushaf_page_';

// ============================================================
// In-memory LRU cache
// ============================================================

const MEM_CACHE_MAX = 30;
const memCache = new Map<string, MushafPage>();

function memCacheGet(key: string): MushafPage | undefined {
    const v = memCache.get(key);
    if (v) {
        memCache.delete(key);
        memCache.set(key, v);
    }
    return v;
}

function memCacheSet(key: string, value: MushafPage) {
    if (memCache.size >= MEM_CACHE_MAX) {
        const oldest = memCache.keys().next().value;
        if (oldest) memCache.delete(oldest);
    }
    memCache.set(key, value);
}

// ============================================================
// Types
// ============================================================

export interface PageAyah {
    number: number;
    numberInSurah: number;
    text: string;
    juz: number;
    hizbQuarter: number;
    page: number;
    surah: {
        number: number;
        name: string;
        englishName: string;
    };
}

export interface MushafPage {
    pageNumber: number;
    ayahs: PageAyah[];
    juz: number;
    hizbQuarter: number;
    surahs: Record<string, { number: number; name: string; englishName: string }>;
}

interface QuranPageApiAyah {
    number: number;
    numberInSurah: number;
    text: string;
    juz: number;
    hizbQuarter: number;
    page: number;
    surah: {
        number: number;
        name: string;
        englishName: string;
    };
}

interface QuranPageApiData {
    number: number;
    ayahs: QuranPageApiAyah[];
    surahs: Record<string, { number: number; name: string; englishName: string }>;
}

interface QuranPageApiResponse {
    code: number;
    data?: QuranPageApiData;
}

// ============================================================
// In-flight request deduplication
// ============================================================

const inflightRequests = new Map<string, Promise<MushafPage | null>>();

// ============================================================
// Bundled JSON loader
// ============================================================

async function loadBundledPage(pageNumber: number, edition: string): Promise<MushafPage | null> {
    try {
        const res = await fetch(`/data/quran/page/${edition}/${pageNumber}.json`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// ============================================================
// API
// ============================================================

/**
 * Get the page range for a given surah.
 */
export function getPageRange(surahNumber: number): { startPage: number; endPage: number } {
    const startPage = SURAH_START_PAGE[surahNumber] || 1;
    const endPage = surahNumber < 114
        ? (SURAH_START_PAGE[surahNumber + 1] || TOTAL_MUSHAF_PAGES) - 1
        : TOTAL_MUSHAF_PAGES;
    return { startPage, endPage: Math.max(startPage, endPage) };
}

/**
 * Fetch a single mushaf page: Memory → IDB → bundled JSON → network.
 */
export async function getPageData(
    pageNumber: number,
    edition: string = 'quran-uthmani'
): Promise<MushafPage | null> {
    if (pageNumber < 1 || pageNumber > TOTAL_MUSHAF_PAGES) return null;

    const cacheKey = `${PAGE_DATA_PREFIX}${pageNumber}_${edition}`;

    // Tier 1: In-memory LRU
    const inMem = memCacheGet(cacheKey);
    if (inMem) return inMem;

    // Deduplicate
    const existing = inflightRequests.get(cacheKey);
    if (existing) return existing;

    const fetchPromise = fetchPageInternal(pageNumber, edition, cacheKey);
    inflightRequests.set(cacheKey, fetchPromise);

    try {
        return await fetchPromise;
    } finally {
        inflightRequests.delete(cacheKey);
    }
}

async function fetchPageInternal(
    pageNumber: number,
    edition: string,
    cacheKey: string
): Promise<MushafPage | null> {
    try {
        // Tier 2: IndexedDB
        const cached = await get(cacheKey);
        if (cached) {
            const page = cached as MushafPage;
            memCacheSet(cacheKey, page);
            return page;
        }

        // Tier 3: Bundled JSON (local file in APK)
        const bundled = await loadBundledPage(pageNumber, edition);
        if (bundled) {
            memCacheSet(cacheKey, bundled);
            set(cacheKey, bundled).catch(() => { });
            return bundled;
        }

        // Tier 4: Network API fallback with retry
        const page = await fetchFromNetwork(pageNumber, edition);
        if (!page) return null;

        memCacheSet(cacheKey, page);
        set(cacheKey, page).catch(() => { });
        return page;
    } catch (error) {
        console.error(`[Quran] Failed to fetch page ${pageNumber}:`, error);
        return null;
    }
}

async function fetchFromNetwork(
    pageNumber: number,
    edition: string,
    retries = 2,
    delay = 500
): Promise<MushafPage | null> {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(
                `https://api.alquran.cloud/v1/page/${pageNumber}/${edition}`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const json = await response.json() as QuranPageApiResponse;
            if (json.code !== 200 || !json.data) throw new Error('Invalid API response');

            const apiData = json.data;

            return {
                pageNumber: apiData.number,
                ayahs: apiData.ayahs.map((a) => ({
                    number: a.number,
                    numberInSurah: a.numberInSurah,
                    text: a.text,
                    juz: a.juz,
                    hizbQuarter: a.hizbQuarter,
                    page: a.page,
                    surah: {
                        number: a.surah.number,
                        name: a.surah.name,
                        englishName: a.surah.englishName,
                    },
                })),
                juz: apiData.ayahs[0]?.juz || 1,
                hizbQuarter: apiData.ayahs[0]?.hizbQuarter || 1,
                surahs: apiData.surahs,
            };
        } catch (error) {
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, delay * (attempt + 1)));
                continue;
            }
            throw error;
        }
    }
    return null;
}

/**
 * Returns a human-readable hizb quarter label.
 */
export function getHizbInfo(
    hizbQuarter: number,
    lang: 'ar' | 'en'
): { hizbNumber: number; quarterLabel: string } {
    const hizbNumber = Math.ceil(hizbQuarter / 4);
    const quarterInHizb = ((hizbQuarter - 1) % 4) + 1;

    const quarterLabels = {
        ar: { 1: '', 2: '¼', 3: '½', 4: '¾' },
        en: { 1: '', 2: '¼', 3: '½', 4: '¾' },
    };

    return {
        hizbNumber,
        quarterLabel: quarterLabels[lang]?.[quarterInHizb as 1 | 2 | 3 | 4] || '',
    };
}

export { TOTAL_MUSHAF_PAGES };
