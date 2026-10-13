'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useSettings } from './settings-provider';
import { getPrayerTimes, getTotalOffset } from '@/lib/prayer';
import { useLocation } from '@/hooks/use-location';
import { FajrQuizModal } from '@/components/prayer/fajr-quiz-modal';
import { NativeAzan } from '@/lib/native-azan';

export function AzanPlayer() {
    const { settings, hasLoadedSettings } = useSettings();
    const { coordinates } = useLocation();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastPlayedPrayerRef = useRef<string | null>(null);
    const challengeRevisionRef = useRef(0);
    const [showFajrQuiz, setShowFajrQuiz] = useState(false);
    const [challengeId, setChallengeId] = useState<number | undefined>();
    const isNative = Capacitor.isNativePlatform();

    const refreshNativeChallenge = useCallback(async () => {
        if (!hasLoadedSettings || !isNative || !Capacitor.isPluginAvailable('Azan')) {
            return;
        }

        try {
            const revision = challengeRevisionRef.current;
            const challenge = await NativeAzan.getPendingFajrChallenge();
            if (revision !== challengeRevisionRef.current) return;
            if (!challenge.pending) {
                setShowFajrQuiz(false);
                return;
            }

            setChallengeId(challenge.prayerTime);
            setShowFajrQuiz(true);
        } catch (error) {
            console.error('Failed to load Fajr wake-up challenge:', error);
        }
    }, [hasLoadedSettings, isNative]);

    useEffect(() => {
        if (!isNative) {
            return;
        }

        const initialRefreshId = window.setTimeout(() => {
            void refreshNativeChallenge();
        }, 0);
        const intervalId = window.setInterval(() => {
            void refreshNativeChallenge();
        }, 1000);

        let didUnmount = false;
        let removeListener: (() => void) | undefined;
        void App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                void refreshNativeChallenge();
            }
        }).then(listener => {
            if (didUnmount) {
                void listener.remove();
                return;
            }
            removeListener = () => {
                void listener.remove();
            };
        });

        return () => {
            didUnmount = true;
            window.clearTimeout(initialRefreshId);
            window.clearInterval(intervalId);
            removeListener?.();
        };
    }, [isNative, refreshNativeChallenge]);

    useEffect(() => {
        if (!hasLoadedSettings || isNative || settings.azanMode !== 'full') {
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio('/azan.mp3');
        }
        let challengeTimeout: ReturnType<typeof setTimeout> | undefined;

        const checkPrayerTime = () => {
            const now = new Date();
            const lat = coordinates?.latitude;
            const lng = coordinates?.longitude;
            const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
            const prayers = getPrayerTimes(now, lat, lng, totalOffset, settings.calculationMethod, settings.includeIshraq);

            const currentPrayer = prayers.find(prayer => {
                const diff = now.getTime() - prayer.date.getTime();
                return prayer.name !== 'ishraq' && diff >= 0 && diff < 60000;
            });

            if (!currentPrayer) {
                return;
            }

            const playKey = `${currentPrayer.name}-${currentPrayer.date.toDateString()}`;
            if (lastPlayedPrayerRef.current === playKey) {
                return;
            }

            if (!audioRef.current) {
                return;
            }

            if (currentPrayer.name === 'fajr' && settings.fajrQuizEnabled) {
                audioRef.current.loop = true;
                void audioRef.current.play().then(() => {
                    lastPlayedPrayerRef.current = playKey;
                    setShowFajrQuiz(true);
                    challengeTimeout = setTimeout(() => {
                        audioRef.current?.pause();
                        if (audioRef.current) audioRef.current.loop = false;
                        setShowFajrQuiz(false);
                    }, 10 * 60_000);
                }).catch(error => console.error('Error playing Azan:', error));
                return;
            }

            audioRef.current.loop = false;
            void audioRef.current.play().then(() => {
                lastPlayedPrayerRef.current = playKey;
            }).catch(error => console.error('Error playing Azan:', error));
        };

        checkPrayerTime();
        const intervalId = window.setInterval(checkPrayerTime, 10000);

        return () => {
            window.clearInterval(intervalId);
            clearTimeout(challengeTimeout);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [
        isNative,
        hasLoadedSettings,
        coordinates,
        settings.azanMode,
        settings.calculationMethod,
        settings.dstMode,
        settings.fajrQuizEnabled,
        settings.includeIshraq,
        settings.prayerOffset,
    ]);

    const handleQuizSolved = useCallback(async () => {
        challengeRevisionRef.current++;
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.loop = false;
        }

        if (isNative && Capacitor.isPluginAvailable('Azan')) {
            try {
                await NativeAzan.completeFajrChallenge();
            } catch (error) {
                console.error('Failed to complete Fajr wake-up challenge:', error);
                throw error;
            }
        }

        setShowFajrQuiz(false);
    }, [isNative]);

    return <FajrQuizModal open={showFajrQuiz} onSolved={handleQuizSolved} challengeId={challengeId} nativeChallenge={isNative} />;
}
