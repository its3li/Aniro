'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2, BookOpen } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuranSearch, type QuranSearchResult } from '@/hooks/use-quran-search';
import { useSettings } from '@/components/providers/settings-provider';
import { stripTajweed } from '@/lib/tajweed';
import { cn } from '@/lib/utils';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const { search, searchResults, clearResults, isIndexing, isIndexed } = useQuranSearch();
    const { settings } = useSettings();
    const isArabic = settings.language === 'ar';

    // Map settings edition key → JSON edition string
    const editionMap: Record<string, string> = {
        uthmani: 'quran-uthmani',
        tajweed: 'quran-tajweed',
        warsh: 'quran-warsh',
        shubah: 'quran-shouba',
    };
    const activeEdition = editionMap[settings.quranEdition] || 'quran-uthmani';

    // Debounced search — pass edition to filter from inside the hook
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (query.trim().length >= 2) {
                search(query, activeEdition);
            } else {
                clearResults();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query, search, clearResults, activeEdition]);

    // Clean surah name: strip "سورة " prefix and tashkeel
    const cleanSurahName = (name: string) =>
        name
            .replace(/^سُورَةُ\s*/u, '')
            .replace(/^سورة\s*/u, '')
            .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');

    // Clean ayah text: aggressively remove ALL tajweed bracket tags securely without deleting Arabic text
    const cleanAyahText = (text: string) => {
        // Tajweed tags format: [ruleCode[ArabicText]] or [ruleCode:number[ArabicText]]
        // This regex removes the opening tag part e.g. `[h[`, `[h:8630[`
        let clean = text.replace(/\[[a-zA-Z0-9:]+\[/g, '');
        // Remove the closing bracket part e.g. `]`
        clean = clean.replace(/\]/g, '');
        // Remove remaining stray English letters, colons, and brackets
        clean = clean.replace(/[a-zA-Z\[\]:]/g, '');
        // Clean up extra spaces
        return clean.replace(/\s+/g, ' ').trim();
    };

    // Results already filtered + deduped inside hook
    const filteredResults = searchResults;

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Handle result selection - navigate to the verse
    const handleResultSelect = useCallback(
        (result: QuranSearchResult) => {
            router.push(`/quran?surah=${result.surahNumber}&ayah=${result.ayahNumber}`);
            onClose();
            setQuery('');
            clearResults();
        },
        [router, onClose, clearResults]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && searchResults.length > 0) {
                handleResultSelect(searchResults[0]);
            }
        },
        [onClose, searchResults, handleResultSelect]
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="text-center font-headline">
                        {isArabic ? 'البحث في القرآن' : 'Search the Quran'}
                    </DialogTitle>
                </DialogHeader>

                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                        <Input
                            ref={inputRef}
                            type="text"
                            placeholder={isArabic ? 'ابحث عن آية أو كلمة...' : 'Search for a verse or word...'}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10 pr-10 h-12 bg-foreground/5 border-foreground/10 rounded-xl"
                            dir={isArabic ? 'rtl' : 'ltr'}
                        />
                        {query && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                onClick={() => {
                                    setQuery('');
                                    clearResults();
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    {/* Status indicators */}
                    {isIndexing && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{isArabic ? 'جارٍ إنشاء الفهرس...' : 'Building search index...'}</span>
                        </div>
                    )}
                </div>

                {/* Search Results */}
                <div className="flex-1 overflow-y-auto max-h-[50vh] px-4 pb-4">
                    <div className="px-4 pb-4">
                        {filteredResults.length > 0 ? (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-muted-foreground mb-1 text-right">
                                    {isArabic
                                        ? `${filteredResults.length} نتيجة`
                                        : `${filteredResults.length} results`}
                                </p>
                                {filteredResults.map((result, index) => (
                                    <button
                                        key={`${result.id}-${index}`}
                                        onClick={() => handleResultSelect(result)}
                                        className={cn(
                                            'w-full text-left p-4 rounded-xl bg-foreground/5 hover:bg-foreground/10',
                                            'transition-colors cursor-pointer border border-transparent hover:border-primary/20',
                                            'focus:outline-none focus:ring-2 focus:ring-primary/50'
                                        )}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary shrink-0">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="font-semibold text-sm">
                                                        {isArabic ? `سورة ${cleanSurahName(result.surahName)}` : result.surahEnglishName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {isArabic ? `آية ${result.ayahNumber}` : `Ayah ${result.ayahNumber}`}
                                                    </span>
                                                </div>
                                                <p
                                                    className="text-sm text-muted-foreground line-clamp-2 font-quran leading-relaxed"
                                                    dir="rtl"
                                                >
                                                    {cleanAyahText(result.ayahText)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query.length >= 2 && !isIndexing ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>{isArabic ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
                                <p className="text-sm mt-1">
                                    {isArabic
                                        ? 'حاول البحث بكلمات مختلفة'
                                        : 'Try searching with different words'}
                                </p>
                            </div>
                        ) : query.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>{isArabic ? 'ابدأ الكتابة للبحث' : 'Start typing to search'}</p>
                                <p className="text-sm mt-1">
                                    {isArabic
                                        ? 'يمكنك البحث بالعربية أو الإنجليزية'
                                        : 'Search in Arabic or English'}
                                </p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
