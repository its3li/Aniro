
'use client';

import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import type { Surah, Verse } from '@/lib/quran';
import { useSettings } from './settings-provider';

export type PlayerState = {
  showPlayer: boolean;
  isPlaying: boolean;
  isContinuous: boolean;
  activeVerseKey: string | null;
  progress: number;
  duration: number;
  surah: Surah | null;
  audioDownload: {
    isDownloading: boolean;
    downloaded: number;
    total: number;
    isOfflineReady: boolean;
  };
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

const AUDIO_API_CACHE = 'quran-audio-api-cache';
const AUDIO_FILE_CACHE = 'quran-audio-file-cache';
const AUDIO_DOWNLOAD_CONCURRENCY = 3;

function getInitialAudioDownloadState(): PlayerState['audioDownload'] {
  return {
    isDownloading: false,
    downloaded: 0,
    total: 0,
    isOfflineReady: false,
  };
}

function getAudioApiUrl(surahNumber: number, verseNumber: number, reciter: string) {
  return `https://api.alquran.cloud/v1/ayah/${surahNumber}:${verseNumber}/${reciter}`;
}

function getAudioFileRequest(surahNumber: number, verseNumber: number, reciter: string) {
  return new Request(`https://aniro.local/quran-audio/${reciter}/${surahNumber}/${verseNumber}.mp3`);
}

async function openCache(name: string): Promise<Cache | null> {
  if (!('caches' in globalThis)) return null;
  return globalThis.caches.open(name).catch(() => null);
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const [playerState, setPlayerState] = useState<PlayerState>({
    showPlayer: false,
    isPlaying: false,
    isContinuous: false,
    activeVerseKey: null,
    progress: 0,
    duration: 0,
    surah: null,
    audioDownload: getInitialAudioDownloadState(),
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
  const hasMountedReciterRef = useRef(false);
  const audioObjectUrlsRef = useRef<Set<string>>(new Set());
  const activeDownloadKeyRef = useRef<string | null>(null);

  // Ref to track latest reciter value (avoids stale closures)
  const reciterRef = useRef(quranReciter);
  const playNextInQueueRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  // Keep reciterRef in sync with latest reciter
  useEffect(() => {
    reciterRef.current = quranReciter;
  }, [quranReciter]);

  const getVerseByKey = useCallback((key: string | null): Verse | undefined => {
    if (!key || !playerStateRef.current.surah) return undefined;
    const verseNum = parseInt(key.split(':')[1], 10);
    return playerStateRef.current.surah.verses.find(v => v.number.inSurah === verseNum);
  }, []);

  const cleanupAudio = useCallback(() => {
    activeDownloadKeyRef.current = null;
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
    audioObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    audioObjectUrlsRef.current.clear();
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
      audioDownload: getInitialAudioDownloadState(),
    });
  }, [cleanupAudio]);

  const createObjectUrlFromCachedAudio = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    reciter: string
  ): Promise<string | null> => {
    const fileCache = await openCache(AUDIO_FILE_CACHE);
    if (!fileCache) return null;

    const cachedAudio = await fileCache.match(getAudioFileRequest(surahNumber, verseNumber, reciter));
    if (!cachedAudio) return null;

    const objectUrl = URL.createObjectURL(await cachedAudio.blob());
    audioObjectUrlsRef.current.add(objectUrl);
    return objectUrl;
  }, []);

  const getRemoteAudioUrl = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    reciter: string
  ): Promise<string | null> => {
    const apiUrl = getAudioApiUrl(surahNumber, verseNumber, reciter);
    const apiCache = await openCache(AUDIO_API_CACHE);

    try {
      const cachedResponse = await apiCache?.match(apiUrl);
      if (cachedResponse) {
        const cachedData = await cachedResponse.clone().json();
        if (cachedData?.data?.audio) return cachedData.data.audio;
      }
    } catch {
      // Ignore damaged metadata and refresh it from the network below.
    }

    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) return null;

    const data = await apiResponse.clone().json();
    if (data.code !== 200 || !data.data?.audio) return null;

    await apiCache?.put(apiUrl, apiResponse);
    return data.data.audio;
  }, []);

  const ensureAudioFileCached = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    reciter: string
  ): Promise<boolean> => {
    const fileCache = await openCache(AUDIO_FILE_CACHE);
    if (!fileCache) return false;

    const fileRequest = getAudioFileRequest(surahNumber, verseNumber, reciter);
    if (await fileCache.match(fileRequest)) return true;

    const remoteAudioUrl = await getRemoteAudioUrl(surahNumber, verseNumber, reciter);
    if (!remoteAudioUrl) return false;

    const audioResponse = await fetch(remoteAudioUrl);
    if (!audioResponse.ok) return false;

    await fileCache.put(fileRequest, audioResponse.clone());
    return true;
  }, [getRemoteAudioUrl]);

  const getPlayableAudioUrl = useCallback(async (
    surahNumber: number,
    verseNumber: number,
    reciter: string
  ): Promise<string | null> => {
    const cachedObjectUrl = await createObjectUrlFromCachedAudio(surahNumber, verseNumber, reciter);
    if (cachedObjectUrl) return cachedObjectUrl;

    try {
      const didCache = await ensureAudioFileCached(surahNumber, verseNumber, reciter);
      if (didCache) {
        return createObjectUrlFromCachedAudio(surahNumber, verseNumber, reciter);
      }

      return getRemoteAudioUrl(surahNumber, verseNumber, reciter);
    } catch {
      return null;
    }
  }, [createObjectUrlFromCachedAudio, ensureAudioFileCached, getRemoteAudioUrl]);

  const downloadSurahAudio = useCallback(async (surah: Surah, reciter: string) => {
    const downloadKey = `${reciter}:${surah.number}:${surah.verses.length}`;
    if (activeDownloadKeyRef.current === downloadKey) return;

    activeDownloadKeyRef.current = downloadKey;
    setPlayerState(s => ({
      ...s,
      audioDownload: {
        isDownloading: true,
        downloaded: 0,
        total: surah.verses.length,
        isOfflineReady: false,
      },
    }));

    let processed = 0;
    let failed = 0;
    const verses = [...surah.verses];

    const worker = async () => {
      while (verses.length > 0 && activeDownloadKeyRef.current === downloadKey) {
        const verse = verses.shift();
        if (!verse) return;

        try {
          const ok = await ensureAudioFileCached(surah.number, verse.number.inSurah, reciter);
          if (!ok) failed += 1;
        } catch {
          failed += 1;
        } finally {
          processed += 1;
          setPlayerState(s => ({
            ...s,
            audioDownload: {
              isDownloading: processed < surah.verses.length,
              downloaded: processed,
              total: surah.verses.length,
              isOfflineReady: processed >= surah.verses.length && failed === 0,
            },
          }));
        }
      }
    };

    await Promise.all(Array.from({ length: AUDIO_DOWNLOAD_CONCURRENCY }, worker));

    if (activeDownloadKeyRef.current === downloadKey) {
      activeDownloadKeyRef.current = null;
      setPlayerState(s => ({
        ...s,
        audioDownload: {
          isDownloading: false,
          downloaded: processed,
          total: surah.verses.length,
          isOfflineReady: failed === 0 && processed === surah.verses.length,
        },
      }));
    }
  }, [ensureAudioFileCached]);

  const fillAudioQueue = useCallback(async (surah: Surah, startVerseIndex: number) => {
    if (startVerseIndex >= surah.verses.length) return;

    const versesToQueue = surah.verses.slice(startVerseIndex, startVerseIndex + 5);
    const currentReciter = reciterRef.current;

    const promises = versesToQueue.map(async (verse) => {
      try {
        const verseRef = `${surah.number}:${verse.number.inSurah}`;
        const audioUrl = await getPlayableAudioUrl(surah.number, verse.number.inSurah, currentReciter);
        if (!audioUrl) return null;

        return { verseKey: verseRef, url: audioUrl };
      } catch {
        return null;
      }
    });

    const results = (await Promise.all(promises)).filter((r): r is { verseKey: string; url: string } => r !== null);

    const existingKeys = new Set(audioQueueRef.current.map(item => item.verseKey));
    const newItems = results.filter(item => !existingKeys.has(item.verseKey));

    audioQueueRef.current.push(...newItems);

  }, [getPlayableAudioUrl]);

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
        void playNextInQueueRef.current();
      } else {
        setPlayerState(s => ({ ...s, isPlaying: false, progress: s.duration }));
      }
    };

    currentAudio.onerror = () => {
      console.error(`Error playing audio for ${verseKey}`);
      isPlayingAudioRef.current = false;
      if (playerStateRef.current.isContinuous) void playNextInQueueRef.current(); // Silently skip to next
      else handlePlayerClose();
    };

    try {
      await currentAudio.play();
    } catch {
      // This can happen if another play request interrupts.
      // The error handler will take care of moving on.
    }
  }, [handlePlayerClose, fillAudioQueue]);

  useEffect(() => {
    playNextInQueueRef.current = playNextInQueue;
  }, [playNextInQueue]);

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
      isPlaying: true,
      audioDownload: {
        isDownloading: true,
        downloaded: 0,
        total: surah.verses.length,
        isOfflineReady: false,
      },
    }));

    await fillAudioQueue(surah, verseIndex);
    playNextInQueue();
    void downloadSurahAudio(surah, reciterRef.current);
  }, [cleanupAudio, downloadSurahAudio, fillAudioQueue, playNextInQueue]);

  useEffect(() => {
    reciterRef.current = quranReciter;

    if (!hasMountedReciterRef.current) {
      hasMountedReciterRef.current = true;
      return;
    }

    const { showPlayer, activeVerseKey, surah, isContinuous } = playerStateRef.current;
    if (showPlayer && activeVerseKey && surah) {
      void startPlayback(surah, activeVerseKey, isContinuous);
    }
  }, [quranReciter, startPlayback]);

  const ensureReciterIsSet = useCallback((callback: () => void) => {
    const hasSetReciter = localStorage.getItem('hasSetReciter') === 'true';
    if (hasSetReciter) {
      callback();
    } else {
      pendingActionRef.current = callback;
      setReciterModalOpen(true);
    }
  }, []);

  const playVerse = useCallback((surah: Surah, verse: Verse) => {
    ensureReciterIsSet(() => {
      const verseKey = `${surah.number}:${verse.number.inSurah}`;
      startPlayback(surah, verseKey, false);
    });
  }, [ensureReciterIsSet, startPlayback]);

  const playSurah = useCallback((surah: Surah, startVerse?: Verse) => {
    ensureReciterIsSet(() => {
      const startVerseKey = startVerse ? `${surah.number}:${startVerse.number.inSurah}` : `${surah.number}:${surah.verses[0].number.inSurah}`;
      startPlayback(surah, startVerseKey, true);
    });
  }, [ensureReciterIsSet, startPlayback]);

  const handlePlayPause = useCallback(() => {
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
  }, [startPlayback]);

  const handleNext = useCallback(() => {
    const { isContinuous, activeVerseKey, surah } = playerStateRef.current;
    if (!activeVerseKey || !surah) return;
    isPlayingAudioRef.current = false; // Force stop current playback logic
    if (isContinuous) {
      playNextInQueue();
    } else {
      const currentIdx = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey);
      if (currentIdx > -1 && currentIdx < surah.verses.length - 1) {
        playVerse(surah, surah.verses[currentIdx + 1]);
      } else {
        handlePlayerClose();
      }
    }
  }, [handlePlayerClose, playNextInQueue, playVerse]);

  const handlePrev = useCallback(() => {
    const { activeVerseKey, surah, isContinuous } = playerStateRef.current;
    if (!activeVerseKey || !surah) return;

    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }

    const currentIdx = surah.verses.findIndex(v => `${surah.number}:${v.number.inSurah}` === activeVerseKey);
    if (currentIdx > 0) {
      startPlayback(surah, `${surah.number}:${surah.verses[currentIdx - 1].number.inSurah}`, isContinuous);
    }
  }, [startPlayback]);

  const handleSeek = useCallback((value: number) => {
    if (audioRef.current) {
      isSeekingRef.current = true;
      audioRef.current.currentTime = value;
      setPlayerState(s => ({ ...s, progress: value }));
      setTimeout(() => { isSeekingRef.current = false; }, 100);
    }
  }, []);

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
