'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import type { Verse } from '@/lib/quran';
import { BookOpen, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSettings } from '../providers/settings-provider';
import { stripTajweed } from '@/lib/tajweed';

interface TafseerModalProps {
  verse: Verse;
  surahName: string;
  surahNumber: number;
  isOpen: boolean;
  onClose: () => void;
}

type TafseerResponse = {
  ayahs?: Array<{
    numberInSurah: number;
    text?: string;
  }>;
};

export function TafseerModal({ verse, surahName, surahNumber, isOpen, onClose }: TafseerModalProps) {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const [tafseerContent, setTafseerContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && verse && surahNumber) {
      const fetchTafseer = async () => {
        setIsLoading(true);
        setTafseerContent(null);
        try {
          // Load from local offline files
          const response = await fetch(`/data/quran/surah/ar.jalalayn/${surahNumber}.json`);
          if (!response.ok) {
            throw new Error('Failed to load tafseer');
          }
          const data = await response.json() as TafseerResponse;
          
          // Find the specific ayah
          const ayah = data.ayahs?.find((a) => a.numberInSurah === verse.number.inSurah);
          if (ayah && ayah.text) {
            setTafseerContent(ayah.text);
          } else {
            setTafseerContent(isArabic ? 'لم يُوجد تفسير لهذه الآية' : 'Tafseer not found for this verse');
          }
        } catch {
          setTafseerContent(isArabic ? 'تعذر تحميل التفسير' : 'Could not load tafseer');
        } finally {
          setIsLoading(false);
        }
      };

      fetchTafseer();
    }
  }, [isOpen, verse, surahNumber, isArabic]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[90vw] sm:max-w-lg mx-auto p-0 bg-background border-border/50 rounded-2xl overflow-hidden shadow-xl [&>button]:hidden"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {isArabic ? 'التفسير' : 'Tafseer'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {surahName} • {isArabic ? 'الآية' : 'Ayah'} {verse.number.inSurah}
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Verse Text */}
        <div className="px-4 py-3 bg-muted/30">
          <p className="font-quran text-lg text-center leading-relaxed">
            {stripTajweed(verse.text)}
          </p>
        </div>

        {/* Tafseer Content */}
        <div className="px-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                {isArabic ? 'جاري التحميل...' : 'Loading...'}
              </span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-foreground/90">
              {tafseerContent}
            </p>
          )}
        </div>

        {/* Source Tag */}
        <div className="px-4 pb-3">
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
            {isArabic ? 'تفسير الجلالين' : 'Tafsir Al-Jalalayn'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
