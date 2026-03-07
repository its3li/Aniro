'use client';

import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSettings, type QuranEdition } from '../providers/settings-provider';
import { Book, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

export function QuranSettings() {
    const { settings, setQuranViewMode, setQuranEdition } = useSettings();
    const isArabic = settings.language === 'ar';

    return (
        <GlassCard>
            <GlassCardHeader>
                <h2 className="text-base font-semibold">{isArabic ? 'القرآن الكريم' : 'Quran'}</h2>
            </GlassCardHeader>
            <GlassCardContent>
                <div className="divide-y divide-border">
                    {/* Mushaf Edition */}
                    <div className="flex items-center justify-between py-3 first:pt-0">
                        <Label className="text-sm">{isArabic ? 'نوع المصحف' : 'Mushaf Type'}</Label>
                        <Select
                            value={settings.quranEdition}
                            onValueChange={(v) => setQuranEdition(v as QuranEdition)}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        >
                            <SelectTrigger className="w-auto min-w-[120px] h-8 text-xs rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="uthmani">{isArabic ? "حفص" : "Hafs"}</SelectItem>
                                <SelectItem value="warsh">{isArabic ? "ورش" : "Warsh"}</SelectItem>
                                <SelectItem value="tajweed">{isArabic ? "تجويد" : "Tajweed"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center justify-between py-3 last:pb-0">
                        <Label className="text-sm">{isArabic ? 'طريقة العرض' : 'View Mode'}</Label>
                        <div className='flex items-center gap-1 bg-secondary rounded-lg p-1'>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn('w-8 h-8 rounded-md', settings.quranViewMode === 'list' && 'bg-background text-primary')}
                                onClick={() => setQuranViewMode('list')}
                                aria-label={isArabic ? 'وضع الآيات' : 'Verses mode'}
                            >
                                <List className={cn('w-4 h-4', settings.quranViewMode === 'list' ? 'text-primary' : 'text-muted-foreground')} />
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className={cn('w-8 h-8 rounded-md', settings.quranViewMode === 'page' && 'bg-background text-primary')}
                                onClick={() => setQuranViewMode('page')}
                                aria-label={isArabic ? 'وضع الصفحات' : 'Pages mode'}
                            >
                                <Book className={cn('w-4 h-4', settings.quranViewMode === 'page' ? 'text-primary' : 'text-muted-foreground')} />
                            </Button>
                        </div>
                    </div>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
