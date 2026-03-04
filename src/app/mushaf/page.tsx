'use client';

import { useState } from 'react';
import { MushafPageView } from '@/components/quran/mushaf-page-view';
import { SurahList } from '@/components/quran/surah-list';
import type { SurahInfo } from '@/lib/quran';

export default function MushafPage() {
    const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);

    if (selectedSurah) {
        return (
            <MushafPageView
                surahNumber={selectedSurah.number}
                onBack={() => setSelectedSurah(null)}
            />
        );
    }

    return (
        <div className="px-4 pt-4">
            <h1 className="text-xl font-semibold mb-4">القرآن الكريم</h1>
            <SurahList onSurahSelect={(surah) => setSelectedSurah(surah)} />
        </div>
    );
}
