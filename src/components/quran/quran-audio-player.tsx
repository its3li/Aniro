
'use client';

import { GlassCard } from '../glass-card';
import { Button } from '../ui/button';
import { BookOpenText, Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { Slider } from '../ui/slider';
import { useSettings } from '../providers/settings-provider';
import { useAudioPlayer } from '../providers/audio-player-provider';

export function QuranAudioPlayer() {
  const {
    playerState,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    handlePlayerClose,
    setReciterModalOpen,
    getVerseByKey
  } = useAudioPlayer();

  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  const {
    isPlaying,
    activeVerseKey,
    progress,
    duration,
    surah
  } = playerState;

  const activeVerse = getVerseByKey(activeVerseKey);
  const surahName = surah ? (isArabic ? surah.name : surah.englishName) : '';

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <GlassCard className="p-4 w-full animate-fade-slide-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold font-headline">{surahName}</h3>
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'الآية' : 'Verse'} {activeVerse?.number.inSurah || 0}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setReciterModalOpen(true)}
            className="rounded-full"
            aria-label={isArabic ? 'تغيير القارئ' : 'Change reciter'}
          >
            <BookOpenText className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePlayerClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs font-mono w-10 text-center">{formatTime(progress)}</span>
        <Slider
          value={[progress]}
          max={duration || 1}
          onValueChange={(value) => handleSeek(value[0])}
          className='flex-1'
        />
        <span className="text-xs font-mono w-10 text-center">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center justify-center mt-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full">
            <SkipBack />
          </Button>
          <Button size="icon" onClick={handlePlayPause} className="w-12 h-12 rounded-full">
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNext} className="rounded-full">
            <SkipForward />
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
