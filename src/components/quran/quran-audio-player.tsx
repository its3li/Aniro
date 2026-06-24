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
    getVerseByKey,
  } = useAudioPlayer();

  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  const {
    isPlaying,
    activeVerseKey,
    progress,
    duration,
    surah,
    audioDownload,
  } = playerState;

  const activeVerse = getVerseByKey(activeVerseKey);
  const surahName = surah ? (isArabic ? surah.name : surah.englishName) : '';

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const offlineStatus = audioDownload.isOfflineReady
    ? (isArabic ? 'الصوت جاهز بدون إنترنت' : 'Audio ready offline')
    : audioDownload.isDownloading
      ? (isArabic
        ? `جاري حفظ الصوت ${audioDownload.downloaded}/${audioDownload.total}`
        : `Saving audio ${audioDownload.downloaded}/${audioDownload.total}`)
      : '';

  return (
    <GlassCard className="w-full animate-fade-slide-in p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline font-bold">{surahName}</h3>
          <p className="text-sm text-muted-foreground">
            {isArabic ? 'الآية' : 'Verse'} {activeVerse?.number.inSurah || 0}
          </p>
          {offlineStatus && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {offlineStatus}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setReciterModalOpen(true)}
            className="rounded-full"
            aria-label={isArabic ? 'تغيير القارئ' : 'Change reciter'}
          >
            <BookOpenText className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handlePlayerClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span className="w-10 text-center font-mono text-xs">{formatTime(progress)}</span>
        <Slider
          value={[progress]}
          max={duration || 1}
          onValueChange={(value) => handleSeek(value[0])}
          className="flex-1"
        />
        <span className="w-10 text-center font-mono text-xs">{formatTime(duration)}</span>
      </div>

      <div className="mt-2 flex items-center justify-center">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handlePrev} className="rounded-full">
            <SkipBack />
          </Button>
          <Button size="icon" onClick={handlePlayPause} className="h-12 w-12 rounded-full">
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
