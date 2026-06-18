'use client';

import { useSettings } from '../providers/settings-provider';

/**
 * Tajweed legend items grouped by color category, matching the mushaf tajweed standard.
 * Each item has its CSS color, Arabic label, and English label.
 */
const legendItems = [
    { color: '#A10000', labelAr: 'مد لازم', labelEn: 'Madd Lazim (6)' },
    { color: '#DD0008', labelAr: 'مد واجب', labelEn: 'Madd Wajib (4-5)' },
    { color: '#F15A22', labelAr: 'مد جائز', labelEn: 'Madd Jaiz (2,4,6)' },
    { color: '#D4A741', labelAr: 'مد طبيعي', labelEn: 'Madd (2)' },
    { color: '#169200', labelAr: 'إخفاء / غنة', labelEn: 'Ikhfa / Ghunnah' },
    { color: '#0054B4', labelAr: 'قلقلة', labelEn: 'Qalqalah' },
    { color: '#26BFFD', labelAr: 'إقلاب', labelEn: 'Iqlab' },
    { color: '#AAAAAA', labelAr: 'إدغام / صامت', labelEn: 'Idgham / Silent' },
];

export function TajweedLegend() {
    const { settings } = useSettings();
    const isArabic = settings.language === 'ar';

    return (
        <div
            className="w-full overflow-x-auto whitespace-nowrap py-2.5 px-4 bg-background/95 backdrop-blur-md border-t border-border/50 flex items-center gap-4 no-scrollbar"
            dir={isArabic ? 'rtl' : 'ltr'}
        >
            {legendItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 flex-shrink-0">
                    <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {isArabic ? item.labelAr : item.labelEn}
                    </span>
                </div>
            ))}
        </div>
    );
}
