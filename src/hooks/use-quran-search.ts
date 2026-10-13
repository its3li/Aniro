'use client';

import { useState, useCallback, useRef } from 'react';
import MiniSearch from 'minisearch';
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

function getEditionKey(): string {
    // The documents include every edition. Share one index across all consumers.
    return 'all';
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

    const CHUNK_SIZE = 100;
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

async function ensureIndex(): Promise<MiniSearch<SearchDocument> | null> {
    const editionKey = getEditionKey();
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
            const index = await buildIndexFromDocuments();
            sharedMiniSearchByEdition.set(editionKey, index);
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
    const searchRevision = useRef(0);
    const [isIndexing, setIsIndexing] = useState(false);
    const [isIndexed, setIsIndexed] = useState(() => sharedMiniSearchByEdition.size > 0);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<QuranSearchResult[]>([]);

    const initIndex = useCallback(async (): Promise<void> => {
        const editionKey = getEditionKey();
        if (sharedMiniSearchByEdition.has(editionKey)) {
            setIsIndexed(true);
            setSearchError(null);
            return;
        }

        setIsIndexing(true);
        const index = await ensureIndex();
        setIsIndexing(false);
        setIsIndexed(Boolean(index));
        setSearchError(index ? null : 'Search index could not be loaded.');
    }, []);

    const search = useCallback(async (query: string, edition?: string): Promise<QuranSearchResult[]> => {
        const revision = ++searchRevision.current;
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            setIsIndexing(false);
            setSearchError(null);
            setSearchResults([]);
            return [];
        }

        const cacheKey = `${edition ?? 'all'}:${normalizeArabic(trimmedQuery).toLowerCase()}`;
        const cached = resultCache.get(cacheKey);
        if (cached) {
            setIsIndexing(false);
            setSearchError(null);
            setSearchResults(cached);
            return cached;
        }

        const editionKey = getEditionKey();
        setIsIndexing(!sharedMiniSearchByEdition.has(editionKey));
        const index = await ensureIndex();
        if (revision !== searchRevision.current) return [];
        setIsIndexing(false);

        if (!index) {
            setSearchError('Search index could not be loaded.');
            setSearchResults([]);
            return [];
        }

        const rawResults = index.search(trimmedQuery, {
            filter: result => !edition || result.edition === edition,
        }).slice(0, SEARCH_RESULT_LIMIT);
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
        searchRevision.current++;
        setIsIndexing(false);
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
