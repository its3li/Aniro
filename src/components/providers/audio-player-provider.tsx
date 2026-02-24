
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Surah, Verse } from '@/lib/quran';
import { useSettings } from './settings-provider';

type PlayerState = {
  showPlayer: boolean;
  isPlaying: boolean;
  isContinuous: boolean;
  activeVerseKey: string | null;
  progress: number;
  duration: number;
  surah: Surah | null;
};

type AudioPlayerContextType = {
  playerState: PlayerState;
  isReciterModalOpen: boolean;
  setReciterModalOpen: (isOpen: boolean) => void;
  pendingActionRef: React.MutableRefObject<(() => void) | null>;
  playVerse: (surah: Surah, verse: Verse) => void;
  playSurah: (surah: Surah, startVerse?: Verse) => void;
  handlePlayPause: () => void;
  handleNext: () => void;
  handlePrev: () => void;
  handleSeek: (value: number) => void;
  handlePlayerClose: () => void;
  getVerseByKey: (key: string | null) => Verse | undefined;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    showPlayer: false,
    isPlaying: false,
    isContinuous: false,
    activeVerseKey: null,
    progress: 0,
    duration: 0,
    surah: null,
  });
  const [isReciterModalOpen, setReciterModalOpen] = useState(false);

  const { settings } = useSettings();
  const { quranReciter } = settings;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<{ verseKey: string; url: string }[]>([]);
  const isSeekingRef = useRef(false);
  const playerStateRef = useRef(playerState);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const isPlayingAudioRef = useRef(false);

  // Ref to track latest reciter value (avoids stale closures)
  const reciterRef = useRef(quranReciter);

  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  // Keep reciterRef in sync with latest reciter
  useEffect(() => {
    reciterRef.current = quranReciter;
  }, [quranReciter]);

  const getVerseByKey = useCallback((key: string | null): Verse | undefined => {
    if (!key || !playerStateRef.current.surah) return undefined;
    const verseNum = parseInt(key.split(':')[1]);
    return playerStateRef.current.surah.verses.find(v => v.number.inSurah === verseNum);
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onerror = null;
    }
    audioQueueRef.current = [];
    isPlayingAudioRef.current = false;
  }, []);

  const handlePlayerClose = useCallback(() => {
    cleanupAudio();
    setPlayerState({
      showPlayer: false,
      isPlaying: false,
      isContinuous: false,
      activeVerseKey: null,
      progress: 0,
      duration: 0,
      surah: null,
    });
  }, [cleanupAudio]);

  const fillAudioQueue = useCallback(async (surah: Surah, startVerseIndex: number) => {
    if (startVerseIndex >= surah.verses.length) return;

    const versesToQueue = surah.verses.slice(startVerseIndex, startVerseIndex + 5);
    const currentReciter = reciterRef.current;

    // Open cache for audio files
    const cache = await caches.open('quran-audio-cache').catch(() => null);

    const promises = versesToQueue.map(async (verse) => {
      try {
        const verseRef = `${surah.number}:${verse.number.inSurah}`;
        const apiUrl = `https://api.alquran.cloud/v1/ayah/${verseRef}/${currentReciter}`;
        
        // Try cache first
        let audioUrl: string | null = null;
        
        if (cache) {
          const cachedResponse = await cache.match(apiUrl);
          if (cachedResponse) {
            const data = await cachedResponse.json();
            if (data.data?.audio) {
              audioUrl = data.data.audio;
            }
          }
        }
        
        // If not in cache, fetch from API
        if (!audioUrl) {
          const apiResponse = await fetch(apiUrl);
          if (!apiResponse.ok) return null;
          const data = await apiResponse.json();
          if (data.code !== 200 || !data.data.audio) return null;
          
          // Store in cache
          if (cache) {
            await cache.put(apiUrl, new Response(JSON.stringify(data)));
          }
          
          audioUrl = data.data.audio;
        }

        return { verseKey: verseRef, url: audioUrl };
      } catch {
        return null;
      }
    });

    const results = (await Promise.all(promises)).filter((r): r is { verseKey: string; url: string } => r !== null);

    const existingKeys = new Set(audioQueueRef.current.map(item => item.verseKey));
    const newItems = results.filter(item => !existingKeys.has(item.verseKey));

    audioQueueRef.current.push(...newItems);

  }, []);

  const playNextInQueue = useCallback(async () => {
    if (isPlayingAudioRef.current) return;

    const { surah, isContinuous, activeVerseKey } = playerStateRef.current;

    // Pre-buffer logic
    if (isContinuous && surah && audioQueueRef.current.length < 3) {
      const currentVerseIndex = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey);
      const lastQueuedVerseIndex = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === audioQueueRef.current[audioQueueRef.current.length - 1]?.verseKey);
      const nextIndexToQueue = Math.max(currentVerseIndex, lastQueuedVerseIndex) + 1;

      if (nextIndexToQueue < surah.verses.length) {
        await fillAudioQueue(surah, nextIndexToQueue);
      }
    }

    if (audioQueueRef.current.length === 0) {
      if (isContinuous) handlePlayerClose();
      else setPlayerState(s => ({ ...s, isPlaying: false, progress: s.duration }));
      return;
    }

    isPlayingAudioRef.current = true;
    const { verseKey, url } = audioQueueRef.current.shift()!;

    setPlayerState(s => ({ ...s, isPlaying: true, activeVerseKey: verseKey, progress: 0, duration: 0 }));

    if (!audioRef.current) audioRef.current = new Audio();
    const currentAudio = audioRef.current;
    currentAudio.src = url;

    currentAudio.onloadedmetadata = () => setPlayerState(s => s.activeVerseKey === verseKey ? { ...s, duration: currentAudio.duration } : s);
    currentAudio.ontimeupdate = () => {
      if (!isSeekingRef.current) {
        setPlayerState(s => s.activeVerseKey === verseKey ? { ...s, progress: currentAudio.currentTime } : s);
      }
    };

    currentAudio.onended = () => {
      if (isSeekingRef.current) return;
      isPlayingAudioRef.current = false;
      const { isContinuous: isCont } = playerStateRef.current;
      if (isCont) {
        playNextInQueue();
      } else {
        setPlayerState(s => ({ ...s, isPlaying: false, progress: s.duration }));
      }
    };

    currentAudio.onerror = () => {
      console.error(`Error playing audio for ${verseKey}`);
      isPlayingAudioRef.current = false;
      if (playerStateRef.current.isContinuous) playNextInQueue(); // Silently skip to next
      else handlePlayerClose();
    };

    try {
      await currentAudio.play();
    } catch (error) {
      // This can happen if another play request interrupts.
      // The error handler will take care of moving on.
    }
  }, [getVerseByKey, handlePlayerClose, fillAudioQueue]);

  const startPlayback = useCallback(async (surah: Surah, verseKey: string, isContinuous: boolean) => {
    cleanupAudio();
    const verseIndex = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === verseKey);
    if (verseIndex === -1) return;

    setPlayerState(s => ({
      ...s,
      surah,
      isContinuous,
      activeVerseKey: verseKey,
      showPlayer: true,
      isPlaying: true
    }));

    await fillAudioQueue(surah, verseIndex);
    playNextInQueue();
  }, [cleanupAudio, fillAudioQueue, playNextInQueue]);

  const ensureReciterIsSet = (callback: () => void) => {
    const hasSetReciter = localStorage.getItem('hasSetReciter') === 'true';
    if (hasSetReciter) {
      callback();
    } else {
      pendingActionRef.current = callback;
      setReciterModalOpen(true);
    }
  };

  const playVerse = (surah: Surah, verse: Verse) => {
    ensureReciterIsSet(() => {
      const verseKey = `${surah.number}:${verse.number.inSurah}`;
      startPlayback(surah, verseKey, false);
    });
  };

  const playSurah = (surah: Surah, startVerse?: Verse) => {
    ensureReciterIsSet(() => {
      const startVerseKey = startVerse ? `${surah.number}:${startVerse.number.inSurah}` : `${surah.number}:${surah.verses[0].number.inSurah}`;
      startPlayback(surah, startVerseKey, true);
    });
  };

  const handlePlayPause = () => {
    const { isPlaying, activeVerseKey, surah, isContinuous } = playerStateRef.current;
    if (isPlaying) {
      audioRef.current?.pause();
      setPlayerState(s => ({ ...s, isPlaying: false }));
    } else if (audioRef.current?.src) {
      audioRef.current.play().catch(() => { });
      setPlayerState(s => ({ ...s, isPlaying: true }));
    } else if (activeVerseKey && surah) {
      startPlayback(surah, activeVerseKey, isContinuous);
    }
  };

  const handleNext = () => {
    const { isContinuous, activeVerseKey, surah } = playerStateRef.current;
    if (!activeVerseKey || !surah) return;
    const currentIdx = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey);
    if (currentIdx > -1 && currentIdx < surah.verses.length - 1) {
      startPlayback(surah, `${surah.number}:${surah.verses[currentIdx + 1].number.inSurah}`, isContinuous);
    } else {
      handlePlayerClose();
    }
  };

  const handlePrev = () => {
    const { activeVerseKey, surah, isContinuous } = playerStateRef.current;
    if (!activeVerseKey || !surah) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIdx = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey);
    if (currentIdx > 0) {
      startPlayback(surah, `${surah.number}:${surah.verses[currentIdx - 1].number.inSurah}`, isContinuous);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (value: number) => {
    if (audioRef.current) {
      isSeekingRef.current = true;
      audioRef.current.currentTime = value;
      setPlayerState(s => ({ ...s, progress: value }));
      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  };

  useEffect(() => () => cleanupAudio(), [cleanupAudio]);

  const value = useMemo(() => ({
    playerState,
    isReciterModalOpen,
    setReciterModalOpen,
    pendingActionRef,
    playVerse,
    playSurah,
    handlePlayPause,
    handleNext,
    handlePrev,
    handleSeek,
    handlePlayerClose,
    getVerseByKey,
  }), [playerState, isReciterModalOpen, playVerse, playSurah, handlePlayPause, handleNext, handlePrev, handleSeek, handlePlayerClose, getVerseByKey]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === null) throw new Error('useAudioPlayer must be used within a AudioPlayerProvider');
  return context;
};
