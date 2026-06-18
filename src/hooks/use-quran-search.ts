'use client';

import { useState, useCallback } from 'react';
import MiniSearch from 'minisearch';
import { get, set } from 'idb-keyval';
import { normalizeArabic, stripTajweedTags } from '@/lib/arabic';

export interface QuranSearchResult {
    id: string;
    surahNumber: number;
    surahName: string;
    surahEnglishName: string;
    ayahNumber: number;
    ayahText: string;
    edition: string;
    score: number;
}

interface CompactAyah {
    id: string;
    s: number;
    n: string;
    e: string;
    a: number;
    t: string;
    ed: string;
}

type SearchDocument = QuranSearchResult & {
    normalizedText: string;
};

const INDEX_CACHE_KEY = 'quran_search_index_v8';
const RESULT_CACHE_MAX = 40;
const SEARCH_RESULT_LIMIT = 80;

const miniSearchOptions = {
    fields: ['normalizedText', 'ayahText', 'surahName'],
    storeFields: ['surahNumber', 'surahName', 'surahEnglishName', 'ayahNumber', 'ayahText', 'edition'],
    searchOptions: {
        boost: { normalizedText: 3, ayahText: 1, surahName: 2 },
        fuzzy: 0.15,
        prefix: true,
        combineWith: 'AND' as const,
    },
    processTerm: (term: string) => normalizeArabic(term).toLowerCase(),
};

const sharedMiniSearchByEdition = new Map<string, MiniSearch<SearchDocument>>();
const sharedInitPromiseByEdition = new Map<string, Promise<MiniSearch<SearchDocument> | null>>();
const resultCache = new Map<string, QuranSearchResult[]>();

function getEditionKey(edition?: string): string {
    return edition || 'all';
}

function yieldToBrowser() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

function rememberResults(key: string, results: QuranSearchResult[]) {
    if (resultCache.has(key)) {
        resultCache.delete(key);
    }

    resultCache.set(key, results);

    if (resultCache.size > RESULT_CACHE_MAX) {
        const oldestKey = resultCache.keys().next().value;
        if (typeof oldestKey === 'string') {
            resultCache.delete(oldestKey);
        }
    }
}

async function buildIndexFromDocuments(): Promise<MiniSearch<SearchDocument>> {
    const response = await fetch('/data/quran/search/all-ayat.json');
    if (!response.ok) {
        throw new Error(`Search data unavailable (${response.status})`);
    }

    const compactDocs: CompactAyah[] = await response.json();
    const miniSearch = new MiniSearch<SearchDocument>(miniSearchOptions);

    const CHUNK_SIZE = 750;
    for (let index = 0; index < compactDocs.length; index += CHUNK_SIZE) {
        const documents = compactDocs.slice(index, index + CHUNK_SIZE).map(doc => {
            const ayahText = stripTajweedTags(doc.t);
            return {
                id: doc.id,
                surahNumber: doc.s,
                surahName: doc.n,
                surahEnglishName: doc.e,
                ayahNumber: doc.a,
                ayahText,
                edition: doc.ed,
                normalizedText: normalizeArabic(ayahText),
                score: 0,
            };
        });

        miniSearch.addAll(documents);
        await yieldToBrowser();
    }

    return miniSearch;
}

async function ensureIndex(edition?: string): Promise<MiniSearch<SearchDocument> | null> {
    const editionKey = getEditionKey(edition);
    const existingIndex = sharedMiniSearchByEdition.get(editionKey);
    if (existingIndex) {
        return existingIndex;
    }

    const existingPromise = sharedInitPromiseByEdition.get(editionKey);
    if (existingPromise) {
        return existingPromise;
    }

    const initPromise = (async () => {
        try {
            const cacheKey = `${INDEX_CACHE_KEY}_${editionKey}`;
            const cached = await get(cacheKey);
            if (typeof cached === 'string' && cached.length > 0) {
                const loaded = MiniSearch.loadJSON<SearchDocument>(cached, miniSearchOptions);
                sharedMiniSearchByEdition.set(editionKey, loaded);
                return loaded;
            }

            const index = await buildIndexFromDocuments();

            sharedMiniSearchByEdition.set(editionKey, index);
            void set(cacheKey, JSON.stringify(index)).catch(() => undefined);
            return index;
        } catch (error) {
            console.error('[QuranSearch] Init failed:', error);
            return null;
        } finally {
            sharedInitPromiseByEdition.delete(editionKey);
        }
    })();

    sharedInitPromiseByEdition.set(editionKey, initPromise);
    return initPromise;
}

export function useQuranSearch() {
    const [isIndexing, setIsIndexing] = useState(false);
    const [isIndexed, setIsIndexed] = useState(() => sharedMiniSearchByEdition.size > 0);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<QuranSearchResult[]>([]);

    const initIndex = useCallback(async (edition?: string): Promise<void> => {
        const editionKey = getEditionKey(edition);
        if (sharedMiniSearchByEdition.has(editionKey)) {
            setIsIndexed(true);
            setSearchError(null);
            return;
        }

        setIsIndexing(true);
        const index = await ensureIndex(edition);
        setIsIndexing(false);
        setIsIndexed(Boolean(index));
        setSearchError(index ? null : 'Search index could not be loaded.');
    }, []);

    const search = useCallback(async (query: string, edition?: string): Promise<QuranSearchResult[]> => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setSearchResults([]);
            return [];
        }

        const cacheKey = `${edition ?? 'all'}:${normalizeArabic(trimmedQuery).toLowerCase()}`;
        const cached = resultCache.get(cacheKey);
        if (cached) {
            setSearchResults(cached);
            return cached;
        }

        const editionKey = getEditionKey(edition);
        setIsIndexing(!sharedMiniSearchByEdition.has(editionKey));
        const index = await ensureIndex(edition);
        setIsIndexing(false);

        if (!index) {
            setSearchError('Search index could not be loaded.');
            setSearchResults([]);
            return [];
        }

        const rawResults = index.search(trimmedQuery).slice(0, SEARCH_RESULT_LIMIT);
        const seen = new Set<string>();
        const mappedResults: QuranSearchResult[] = [];

        for (const result of rawResults) {
            const resultEdition = result.edition as string | undefined;
            if (edition && resultEdition && resultEdition !== edition) continue;

            const key = `${result.surahNumber as number}:${result.ayahNumber as number}`;
            if (seen.has(key)) continue;
            seen.add(key);

            mappedResults.push({
                id: result.id as string,
                surahNumber: result.surahNumber as number,
                surahName: result.surahName as string,
                surahEnglishName: result.surahEnglishName as string,
                ayahNumber: result.ayahNumber as number,
                ayahText: result.ayahText as string,
                edition: resultEdition || '',
                score: result.score,
            });
        }

        setSearchError(null);
        rememberResults(cacheKey, mappedResults);
        setSearchResults(mappedResults);
        return mappedResults;
    }, []);

    const clearResults = useCallback(() => {
        setSearchResults([]);
        setSearchError(null);
    }, []);

    return {
        search,
        preload: initIndex,
        searchResults,
        searchError,
        clearResults,
        isIndexing,
        isIndexed,
    };
}
