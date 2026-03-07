'use client';

import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSettings, type QuranEdition } from '../providers/settings-provider';
import { Book, Rows3 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                        <div className='flex items-center gap-2 bg-secondary rounded-lg p-1.5'>
                            <Label htmlFor="quran-view-mode" className="flex items-center gap-1 text-xs">
                                <Rows3 className={cn("w-4 h-4", settings.quranViewMode === 'list' ? 'text-primary' : 'text-muted-foreground')} />
                                <span className={cn(settings.quranViewMode === 'list' ? 'text-foreground' : 'text-muted-foreground')}>
                                    {isArabic ? 'آيات' : 'Verses'}
                                </span>
                            </Label>
                            <Switch
                                id="quran-view-mode"
                                checked={settings.quranViewMode === 'list'}
                                onCheckedChange={(checked) => setQuranViewMode(checked ? 'list' : 'page')}
                                dir="ltr"
                            />
                            <Label htmlFor="quran-view-mode" className="flex items-center gap-1 text-xs">
                                <Book className={cn("w-4 h-4", settings.quranViewMode === 'page' ? 'text-primary' : 'text-muted-foreground')} />
                                <span className={cn(settings.quranViewMode === 'page' ? 'text-foreground' : 'text-muted-foreground')}>
                                    {isArabic ? 'صفحات' : 'Pages'}
                                </span>
                            </Label>
                        </div>
                    </div>
                </div>
            </GlassCardContent>
        </GlassCard>
    );
}
