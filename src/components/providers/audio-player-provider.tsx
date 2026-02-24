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
  const isSeekingRef = useRef(false);
  const playerStateRef = useRef(playerState);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const currentReciterRef = useRef(quranReciter);

  // Keep refs in sync
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  useEffect(() => {
    currentReciterRef.current = quranReciter;
  }, [quranReciter]);

  // Get verse by key helper
  const getVerseByKey = useCallback((key: string | null): Verse | undefined => {
    if (!key || !playerStateRef.current.surah) return undefined;
    const verseNum = parseInt(key.split(':')[1]);
    return playerStateRef.current.surah.verses.find(v => v.number.inSurah === verseNum);
  }, []);

  // Cleanup audio element
  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.onended = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      audioRef.current.onerror = null;
    }
  }, []);

  // Close player
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

  // Fetch audio URL for a verse
  const fetchAudioUrl = useCallback(async (surahNum: number, verseNum: number, reciter: string): Promise<string | null> => {
    try {
      const verseRef = `${surahNum}:${verseNum}`;
      const apiUrl = `https://api.alquran.cloud/v1/ayah/${verseRef}/${reciter}`;
      
      // Try cache first
      const cache = await caches.open('quran-audio-cache').catch(() => null);
      if (cache) {
        const cached = await cache.match(apiUrl);
        if (cached) {
          const data = await cached.json();
          if (data.data?.audio) return data.data.audio;
        }
      }
      
      // Fetch from API
      const res = await fetch(apiUrl);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== 200 || !data.data?.audio) return null;
      
      // Cache the result
      if (cache) {
        await cache.put(apiUrl, new Response(JSON.stringify(data)));
      }
      
      return data.data.audio;
    } catch (err) {
      console.error('Error fetching audio:', err);
      return null;
    }
  }, []);

  // Core play function
  const playAudio = useCallback(async (url: string, verseKey: string, surah: Surah, isContinuous: boolean) => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
    // Reset previous handlers
    audio.onended = null;
    audio.ontimeupdate = null;
    audio.onloadedmetadata = null;
    audio.onerror = null;
    
    // Update state
    setPlayerState(s => ({
      ...s,
      surah,
      isContinuous,
      activeVerseKey: verseKey,
      showPlayer: true,
      isPlaying: true,
      progress: 0,
      duration: 0,
    }));
    
    // Set up new handlers
    audio.onloadedmetadata = () => {
      setPlayerState(s => s.activeVerseKey === verseKey 
        ? { ...s, duration: audio.duration } 
        : s
      );
    };
    
    audio.ontimeupdate = () => {
      if (!isSeekingRef.current) {
        setPlayerState(s => s.activeVerseKey === verseKey 
          ? { ...s, progress: audio.currentTime } 
          : s
        );
      }
    };
    
    audio.onended = () => {
      if (isContinuous) {
        // Auto-play next verse in continuous mode
        handleNextInternal(surah, verseKey, true);
      } else {
        setPlayerState(s => ({ ...s, isPlaying: false, progress: s.duration }));
      }
    };
    
    audio.onerror = () => {
      console.error(`Audio error for ${verseKey}`);
      if (isContinuous) {
        handleNextInternal(surah, verseKey, true); // Skip to next on error
      }
    };
    
    // Load and play
    audio.src = url;
    try {
      await audio.play();
    } catch (err) {
      console.error('Play error:', err);
      setPlayerState(s => ({ ...s, isPlaying: false }));
    }
  }, []);

  // Internal next handler (can be called from onended)
  const handleNextInternal = useCallback(async (currentSurah: Surah, currentVerseKey: string, skipCurrent: boolean = false) => {
    const verseNum = parseInt(currentVerseKey.split(':')[1]);
    const nextVerseIndex = currentSurah.verses.findIndex(v => v.number.inSurah === verseNum) + 1;
    
    if (nextVerseIndex < currentSurah.verses.length) {
      const nextVerse = currentSurah.verses[nextVerseIndex];
      const nextKey = `${currentSurah.number}:${nextVerse.number.inSurah}`;
      const reciter = currentReciterRef.current;
      
      const url = await fetchAudioUrl(currentSurah.number, nextVerse.number.inSurah, reciter);
      if (url) {
        await playAudio(url, nextKey, currentSurah, true);
      } else if (!skipCurrent) {
        // If fetch failed and we're not skipping, just update state
        setPlayerState(s => ({ ...s, isPlaying: false }));
      }
    } else {
      // End of surah
      if (!skipCurrent) {
        setPlayerState(s => ({ ...s, isPlaying: false, progress: s.duration }));
      }
    }
  }, [fetchAudioUrl, playAudio]);

  // Check reciter is set
  const ensureReciterIsSet = useCallback((callback: () => void) => {
    const hasSetReciter = localStorage.getItem('hasSetReciter') === 'true';
    if (hasSetReciter) {
      callback();
    } else {
      pendingActionRef.current = callback;
      setReciterModalOpen(true);
    }
  }, []);

  // Public: Play single verse
  const playVerse = useCallback((surah: Surah, verse: Verse) => {
    ensureReciterIsSet(async () => {
      const verseKey = `${surah.number}:${verse.number.inSurah}`;
      const reciter = currentReciterRef.current;
      
      cleanupAudio();
      const url = await fetchAudioUrl(surah.number, verse.number.inSurah, reciter);
      
      if (url) {
        await playAudio(url, verseKey, surah, false);
      }
    });
  }, [ensureReciterIsSet, cleanupAudio, fetchAudioUrl, playAudio]);

  // Public: Play surah continuously
  const playSurah = useCallback((surah: Surah, startVerse?: Verse) => {
    ensureReciterIsSet(async () => {
      const startVerseNum = startVerse ? startVerse.number.inSurah : 1;
      const verseKey = `${surah.number}:${startVerseNum}`;
      const reciter = currentReciterRef.current;
      
      cleanupAudio();
      const url = await fetchAudioUrl(surah.number, startVerseNum, reciter);
      
      if (url) {
        await playAudio(url, verseKey, surah, true);
      }
    });
  }, [ensureReciterIsSet, cleanupAudio, fetchAudioUrl, playAudio]);

  // Public: Play/Pause toggle
  const handlePlayPause = useCallback(() => {
    const { isPlaying, activeVerseKey, surah, isContinuous } = playerStateRef.current;
    
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setPlayerState(s => ({ ...s, isPlaying: false }));
    } else if (audioRef.current.src) {
      audioRef.current.play().catch(() => {});
      setPlayerState(s => ({ ...s, isPlaying: true }));
    } else if (activeVerseKey && surah) {
      // Re-load current verse
      playSurah(surah, surah.verses.find(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey));
    }
  }, [playSurah]);

  // Public: Next verse (button)
  const handleNext = useCallback(() => {
    const { isContinuous, activeVerseKey, surah } = playerStateRef.current;
    if (!activeVerseKey || !surah) return;

    if (isContinuous) {
      // In continuous mode, just trigger next
      handleNextInternal(surah, activeVerseKey);
    } else {
      // In single mode, play next verse
      const currentIdx = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey);
      if (currentIdx > -1 && currentIdx < surah.verses.length - 1) {
        playVerse(surah, surah.verses[currentIdx + 1]);
      } else {
        handlePlayerClose();
      }
    }
  }, [handleNextInternal, playVerse, handlePlayerClose]);

  // Public: Previous verse (button)
  const handlePrev = useCallback(() => {
    const { activeVerseKey, surah } = playerStateRef.current;
    if (!activeVerseKey || !surah) return;

    const audio = audioRef.current;
    
    // If more than 3 seconds in, restart current verse
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setPlayerState(s => ({ ...s, progress: 0 }));
      return;
    }

    // Otherwise go to previous verse
    const currentIdx = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey);
    if (currentIdx > 0) {
      playVerse(surah, surah.verses[currentIdx - 1]);
    }
  }, [playVerse]);

  // Public: Seek
  const handleSeek = useCallback((value: number) => {
    if (audioRef.current) {
      isSeekingRef.current = true;
      audioRef.current.currentTime = value;
      setPlayerState(s => ({ ...s, progress: value }));
      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  // Context value
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
  }), [
    playerState, 
    isReciterModalOpen, 
    playVerse, 
    playSurah, 
    handlePlayPause, 
    handleNext, 
    handlePrev, 
    handleSeek, 
    handlePlayerClose, 
    getVerseByKey
  ]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === null) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return context;
};
