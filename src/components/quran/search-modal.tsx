'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, Search, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuranSearch, type QuranSearchResult } from '@/hooks/use-quran-search';
import { useSettings } from '@/components/providers/settings-provider';
import { getSurahWithTranslation } from '@/lib/quran';
import { cn } from '@/lib/utils';
import { cleanSurahName, stripTajweedTags } from '@/lib/arabic';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ar = {
    title: 'البحث في القرآن',
    placeholder: 'ابحث عن آية أو كلمة...',
    building: 'جار إنشاء الفهرس...',
    error: 'تعذر تحميل فهرس البحث. حاول مرة أخرى.',
    result: 'نتيجة',
    results: 'نتيجة',
    surah: 'سورة',
    ayah: 'آية',
    noResults: 'لم يتم العثور على نتائج',
    tryDifferent: 'حاول البحث بكلمات مختلفة',
    startTyping: 'ابدأ الكتابة للبحث',
    searchHint: 'يمكنك البحث بالعربية أو الإنجليزية',
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { search, preload, searchResults, searchError, clearResults, isIndexing } = useQuranSearch();
    const { settings } = useSettings();
    const isArabic = settings.language === 'ar';

    const editionMap: Record<string, string> = {
        warsh: 'quran-warsh',
    };
    const activeEdition = settings.quranEdition === 'uthmani' && settings.quranTajweedEnabled
        ? 'quran-tajweed'
        : editionMap[settings.quranEdition] ?? 'quran-uthmani';
    const translationEdition = isArabic ? 'ar.jalalayn' : 'en.sahih';

    useEffect(() => {
        if (!isOpen) return;

        const run = () => {
            void preload(activeEdition);
        };

        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(run, { timeout: 1000 });
            return () => window.cancelIdleCallback(idleId);
        }

        const timeoutId = globalThis.setTimeout(run, 0);
        return () => globalThis.clearTimeout(timeoutId);
    }, [isOpen, preload, activeEdition]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (query.trim().length >= 2) {
                void search(query, activeEdition);
            } else {
                clearResults();
            }
        }, 220);

        return () => window.clearTimeout(timeoutId);
    }, [query, search, clearResults, activeEdition]);

    useEffect(() => {
        if (isOpen) {
            window.setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleResultSelect = useCallback(
        (result: QuranSearchResult) => {
            void getSurahWithTranslation(result.surahNumber, activeEdition, translationEdition);
            router.push(`/quran?surah=${result.surahNumber}&ayah=${result.ayahNumber}`);
            onClose();
            setQuery('');
            clearResults();
        },
        [router, onClose, clearResults, activeEdition, translationEdition]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            } else if (event.key === 'Enter' && searchResults.length > 0) {
                handleResultSelect(searchResults[0]);
            }
        },
        [onClose, searchResults, handleResultSelect]
    );

    const resultCountLabel = isArabic
        ? `${searchResults.length} ${searchResults.length === 1 ? ar.result : ar.results}`
        : `${searchResults.length} ${searchResults.length === 1 ? 'result' : 'results'}`;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="flex max-h-[80vh] flex-col gap-0 p-0 sm:max-w-[600px]">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="text-center font-headline">
                        {isArabic ? ar.title : 'Search the Quran'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder={isArabic ? ar.placeholder : 'Search for a verse or word...'}
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleKeyDown}
                            className="h-12 rounded-xl border-foreground/10 bg-foreground/5 pl-10 pr-10"
                            dir={isArabic ? 'rtl' : 'ltr'}
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                                onClick={() => {
                                    setQuery('');
                                    clearResults();
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {isIndexing && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{isArabic ? ar.building : 'Building search index...'}</span>
                        </div>
                    )}

                    {searchError && (
                        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {isArabic ? ar.error : searchError}
                        </div>
                    )}
                </div>

                <div className="max-h-[50vh] flex-1 overflow-y-auto px-4 pb-4">
                    {searchResults.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <p className="mb-1 text-right text-xs text-muted-foreground">
                                {resultCountLabel}
                            </p>
                            {searchResults.map((result, index) => (
                                <button
                                    key={`${result.id}-${index}`}
                                    onClick={() => handleResultSelect(result)}
                                    className={cn(
                                        'w-full rounded-xl border border-transparent bg-foreground/5 p-4 text-left',
                                        'cursor-pointer transition-colors hover:border-primary/20 hover:bg-foreground/10',
                                        'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center justify-between gap-2">
                                                <span className="text-sm font-semibold">
                                                    {isArabic ? `${ar.surah} ${cleanSurahName(result.surahName)}` : result.surahEnglishName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {isArabic ? `${ar.ayah} ${result.ayahNumber}` : `Ayah ${result.ayahNumber}`}
                                                </span>
                                            </div>
                                            <p
                                                className="line-clamp-2 font-quran text-sm leading-relaxed text-muted-foreground"
                                                dir="rtl"
                                            >
                                                {stripTajweedTags(result.ayahText)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 && !isIndexing ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Search className="mx-auto mb-3 h-12 w-12 opacity-50" />
                            <p>{isArabic ? ar.noResults : 'No results found'}</p>
                            <p className="mt-1 text-sm">
                                {isArabic ? ar.tryDifferent : 'Try searching with different words'}
                            </p>
                        </div>
                    ) : query.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">
                            <Search className="mx-auto mb-3 h-12 w-12 opacity-50" />
                            <p>{isArabic ? ar.startTyping : 'Start typing to search'}</p>
                            <p className="mt-1 text-sm">
                                {isArabic ? ar.searchHint : 'Search in Arabic or English'}
                            </p>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
