'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Surah, Verse } from '@/lib/quran';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, PlayCircle, PauseCircle, Copy, BookmarkPlus, BookOpen } from 'lucide-react';
import { TafseerModal } from './tafseer-modal';
import { useSettings } from '../providers/settings-provider';
import { parseTajweed, stripTajweed } from '@/lib/tajweed';
import { TajweedLegend } from './tajweed-legend';
import { MushafPageView } from './mushaf-page-view';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from '../providers/audio-player-provider';

// Juz starts at specific Surah numbers
const JUZ_STARTS = [1, 2, 2, 3, 4, 4, 5, 6, 7, 8, 9, 11, 12, 15, 17, 18, 21, 23, 25, 27, 29, 33, 36, 39, 41, 46, 51, 58, 67, 78];

function getJuzForSurah(surahNumber: number): number {
  for (let i = JUZ_STARTS.length - 1; i >= 0; i--) {
    if (surahNumber >= JUZ_STARTS[i]) return i + 1;
  }
  return 1;
}

interface QuranReaderProps {
  surah: Surah;
  onBack: () => void;
  initialVerseNumber?: number;
}

// ============================================
// Main Component
// ============================================
export function QuranReader({ surah, onBack, initialVerseNumber }: QuranReaderProps) {
  const { settings } = useSettings();
  const { quranViewMode, language, quranEdition } = settings;
  const isArabic = language === 'ar';
  const { toast } = useToast();

  const juz = useMemo(() => getJuzForSurah(surah.number), [surah.number]);
  const hizb = useMemo(() => (juz - 1) * 2 + 1, [juz]);

  const { playerState, playVerse, playSurah, handlePlayPause, handlePlayerClose } = useAudioPlayer();

  const [selectedVerseForTafseer, setSelectedVerseForTafseer] = useState<Verse | null>(null);
  const [isTafseerOpen, setTafseerOpen] = useState(false);
  const [selectedVerseForPopup, setSelectedVerseForPopup] = useState<Verse | null>(null);

  const verseRefs = useRef<Map<string, HTMLElement | null>>(new Map());

  // Scroll to active verse when playing
  useEffect(() => {
    const activeKey = playerState.activeVerseKey;
    if (activeKey && playerState.isPlaying) {
      setTimeout(() => {
        verseRefs.current.get(activeKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [playerState.activeVerseKey, playerState.isPlaying]);

  // Scroll to initial verse (from search)
  useEffect(() => {
    if (quranViewMode === 'page') return;
    if (surah && typeof surah.number === 'number' && typeof initialVerseNumber === 'number') {
      const verseKey = `${surah.number}:${initialVerseNumber}`;
      setTimeout(() => {
        const element = verseRefs.current.get(verseKey);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-primary/20');
          setTimeout(() => {
            element.classList.remove('bg-primary/20');
          }, 2000);
        }
      }, 500);
    }
  }, [surah, initialVerseNumber, quranViewMode]);

  // Handlers
  const handleVersePlayClick = useCallback((verse: Verse) => {
    const verseKey = `${surah.number}:${verse.number.inSurah}`;
    if (playerState.activeVerseKey === verseKey && playerState.isPlaying) {
      handlePlayPause();
    } else {
      playVerse(surah, verse);
    }
  }, [surah, playerState.activeVerseKey, playerState.isPlaying, handlePlayPause, playVerse]);

  const handleToggleContinuousPlay = useCallback(() => {
    const { isPlaying, isContinuous, activeVerseKey } = playerState;
    if (isContinuous && isPlaying) {
      handlePlayerClose();
    } else {
      const startVerse = activeVerseKey 
        ? surah.verses.find(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey) 
        : undefined;
      playSurah(surah, startVerse);
    }
  }, [surah, playerState, handlePlayerClose, playSurah]);

  const handleVerseClick = useCallback((verse: Verse) => {
    setSelectedVerseForPopup(prev => 
      prev?.number.inQuran === verse.number.inQuran ? null : verse
    );
  }, []);

  const handleCopyVerse = useCallback((verse: Verse) => {
    const textToCopy = `${stripTajweed(verse.text)} (${isArabic ? surah.name : surah.englishName}:${verse.number.inSurah})`;
    navigator.clipboard.writeText(textToCopy);
    toast({ title: isArabic ? 'تم نسخ الآية' : 'Verse copied' });
    setSelectedVerseForPopup(null);
  }, [isArabic, surah, toast]);

  const handleBookmarkVerse = useCallback((verse: Verse) => {
    toast({ 
      title: isArabic ? 'تم حفظ العلامة' : 'Bookmark saved', 
      description: `${isArabic ? surah.name : surah.englishName} • ${isArabic ? 'الآية' : 'Ayah'} ${verse.number.inSurah}` 
    });
    setSelectedVerseForPopup(null);
  }, [isArabic, surah, toast]);

  const handleOpenTafseer = useCallback((verse: Verse) => {
    setSelectedVerseForTafseer(verse);
    setTafseerOpen(true);
    setSelectedVerseForPopup(null);
  }, []);

  const isSurahPlaying = playerState.isContinuous && playerState.isPlaying;

  return (
    <div>
      {quranViewMode === 'page' ? (
        <MushafPageView surahNumber={surah.number} initialVerseNumber={initialVerseNumber} onBack={onBack} />
      ) : (
        <>
          {/* Header */}
          <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-2.5 safe-area-top">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="shrink-0 w-9 h-9" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold truncate">{isArabic ? surah.name : surah.englishName}</h1>
                <p className="text-xs text-muted-foreground truncate">{isArabic ? surah.englishName : surah.name}</p>
              </div>
              <Button variant="ghost" size="icon" className="shrink-0 w-9 h-9" onClick={handleToggleContinuousPlay}>
                {isSurahPlaying ? <PauseCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
              </Button>
            </div>
          </header>

          {/* Tajweed legend */}
          {quranEdition === 'tajweed' && (
            <div className="sticky top-[52px] z-10">
              <TajweedLegend />
            </div>
          )}

          {/* Verses list */}
          <div className="px-4 py-3">
            <div className="flex flex-col gap-2">
              {surah.verses.map((verse) => {
                const verseKey = `${surah.number}:${verse.number.inSurah}`;
                const isVerseActive = playerState.activeVerseKey === verseKey;
                const isSelected = selectedVerseForPopup?.number.inQuran === verse.number.inQuran;

                return (
                  <VerseCard
                    key={verse.number.inQuran}
                    verse={verse}
                    verseKey={verseKey}
                    surah={surah}
                    isSelected={isSelected}
                    isVerseActive={isVerseActive}
                    quranEdition={quranEdition}
                    onClick={() => handleVerseClick(verse)}
                    onRef={(el) => { verseRefs.current.set(verseKey, el); }}
                  />
                );
              })}
            </div>
          </div>

          {/* Portal-based popup */}
          {selectedVerseForPopup && (
            <VersePopupPortal
              verse={selectedVerseForPopup}
              surah={surah}
              playerState={playerState}
              verseRefs={verseRefs}
              onPlay={handleVersePlayClick}
              onCopy={handleCopyVerse}
              onBookmark={handleBookmarkVerse}
              onTafseer={handleOpenTafseer}
              onClose={() => setSelectedVerseForPopup(null)}
            />
          )}
        </>
      )}

      {/* Tafseer Modal */}
      {selectedVerseForTafseer && (
        <TafseerModal
          verse={selectedVerseForTafseer}
          surahName={isArabic ? surah.name : surah.englishName}
          surahNumber={surah.number}
          isOpen={isTafseerOpen}
          onClose={() => setTafseerOpen(false)}
        />
      )}
    </div>
  );
}

// ============================================
// Verse Card Component
// ============================================
interface VerseCardProps {
  verse: Verse;
  verseKey: string;
  surah: Surah;
  isSelected: boolean;
  isVerseActive: boolean;
  quranEdition: string;
  onClick: () => void;
  onRef: (el: HTMLElement | null) => void;
}

const VerseCard = React.memo(function VerseCard({
  verse,
  verseKey,
  isSelected,
  isVerseActive,
  quranEdition,
  onClick,
  onRef,
}: VerseCardProps) {
  return (
    <div
      ref={onRef}
      data-verse-key={verseKey}
      onClick={onClick}
      className={cn(
        "bg-card border border-border p-4 rounded-xl text-center cursor-pointer select-none touch-manipulation transition-colors",
        isVerseActive && 'bg-primary/10',
        isSelected && 'bg-primary/10 ring-2 ring-primary/30'
      )}
    >
      <p className="text-right font-quran text-xl leading-loose">
        {quranEdition === 'tajweed' ? (
          <span dangerouslySetInnerHTML={{ __html: parseTajweed(verse.text) }} />
        ) : (
          verse.text
        )}
        <span className="text-primary font-sans text-sm mx-1.5">
          ({verse.number.inSurah})
        </span>
      </p>
    </div>
  );
});

// ============================================
// Portal Popup Component - Verse List View
// ============================================
interface VersePopupPortalProps {
  verse: Verse;
  surah: Surah;
  playerState: any;
  verseRefs: React.MutableRefObject<Map<string, HTMLElement | null>>;
  onPlay: (verse: Verse) => void;
  onCopy: (verse: Verse) => void;
  onBookmark: (verse: Verse) => void;
  onTafseer: (verse: Verse) => void;
  onClose: () => void;
}

function VersePopupPortal({
  verse,
  surah,
  playerState,
  verseRefs,
  onPlay,
  onCopy,
  onBookmark,
  onTafseer,
  onClose,
}: VersePopupPortalProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Calculate popup position
  useEffect(() => {
    const updatePosition = () => {
      const verseKey = `${surah.number}:${verse.number.inSurah}`;
      const verseEl = verseRefs.current.get(verseKey);
      
      if (!verseEl) return;

      const rect = verseEl.getBoundingClientRect();
      const popupWidth = 180;
      const popupHeight = 48;
      const padding = 12;
      
      // Position above the verse
      let left = rect.left + (rect.width / 2) - (popupWidth / 2);
      let top = rect.top - popupHeight - padding;
      
      // Clamp to screen edges
      const maxLeft = window.innerWidth - popupWidth - padding;
      left = Math.max(padding, Math.min(left, maxLeft));
      
      // If not enough space above, show below
      if (top < padding + 50) {
        top = rect.bottom + padding;
      }
      
      setPosition({ top, left });
    };

    updatePosition();
    const timeout = setTimeout(updatePosition, 50);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, { passive: true });
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [verse, surah.number, verseRefs]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      const isInsidePopup = popupRef.current?.contains(target);
      const isInsideVerse = target.closest('[data-verse-key]') !== null;
      
      if (!isInsidePopup && !isInsideVerse) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [onClose]);

  if (!position) return null;

  const verseKey = `${surah.number}:${verse.number.inSurah}`;
  const isPlaying = playerState.activeVerseKey === verseKey && playerState.isPlaying;

  // Button class with NO focus/highlight styles
  const buttonClass = "w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors touch-manipulation";

  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] flex items-center gap-1 bg-background/95 backdrop-blur-sm shadow-xl rounded-full px-2 py-1.5 border border-border"
      style={{
        top: position.top,
        left: position.left,
        width: '180px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay(verse);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay(verse);
        }}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopy(verse);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCopy(verse);
        }}
      >
        <Copy className="w-5 h-5" />
      </button>
      
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBookmark(verse);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onBookmark(verse);
        }}
      >
        <BookmarkPlus className="w-5 h-5" />
      </button>
      
      <button 
        className={buttonClass}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTafseer(verse);
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onTafseer(verse);
        }}
      >
        <BookOpen className="w-5 h-5" />
      </button>
    </div>,
    document.body
  );
}
