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
    const { settings } = useSettings();
    const { coordinates } = useLocation();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastPlayedPrayerRef = useRef<string | null>(null);
    const [showFajrQuiz, setShowFajrQuiz] = useState(false);
    const isNative = Capacitor.isNativePlatform();

    const refreshNativeChallenge = useCallback(async () => {
        if (!isNative || !Capacitor.isPluginAvailable('Azan')) {
            return;
        }

        try {
            const challenge = await NativeAzan.getPendingFajrChallenge();
            if (!challenge.pending) {
                setShowFajrQuiz(false);
                return;
            }

            if (!settings.fajrQuizEnabled) {
                await NativeAzan.completeFajrChallenge();
                setShowFajrQuiz(false);
                return;
            }

            setShowFajrQuiz(true);
        } catch (error) {
            console.error('Failed to load Fajr wake-up challenge:', error);
        }
    }, [isNative, settings.fajrQuizEnabled]);

    useEffect(() => {
        if (!isNative) {
            return;
        }

        const initialRefreshId = window.setTimeout(() => {
            void refreshNativeChallenge();
        }, 0);
        const intervalId = window.setInterval(() => {
            void refreshNativeChallenge();
        }, 10000);

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
        if (isNative || settings.azanMode !== 'full') {
            return;
        }

        if (!audioRef.current) {
            audioRef.current = new Audio('/azan.mp3');
        }

        const checkPrayerTime = () => {
            const now = new Date();
            const lat = coordinates?.latitude;
            const lng = coordinates?.longitude;
            const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
            const prayers = getPrayerTimes(now, lat, lng, totalOffset, settings.calculationMethod, settings.includeIshraq);

            const currentPrayer = prayers.find(prayer => {
                const diff = Math.abs(now.getTime() - prayer.date.getTime());
                return diff < 60000;
            });

            if (!currentPrayer) {
                return;
            }

            const playKey = `${currentPrayer.name}-${currentPrayer.date.toDateString()}`;
            if (lastPlayedPrayerRef.current === playKey) {
                return;
            }

            lastPlayedPrayerRef.current = playKey;

            if (!audioRef.current) {
                return;
            }

            if (currentPrayer.name === 'fajr' && settings.fajrQuizEnabled) {
                audioRef.current.loop = true;
                void audioRef.current.play().catch(error => console.error('Error playing Azan:', error));
                setShowFajrQuiz(true);
                return;
            }

            audioRef.current.loop = false;
            void audioRef.current.play().catch(error => console.error('Error playing Azan:', error));
        };

        checkPrayerTime();
        const intervalId = window.setInterval(checkPrayerTime, 10000);

        return () => {
            window.clearInterval(intervalId);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [
        isNative,
        coordinates,
        settings.azanMode,
        settings.calculationMethod,
        settings.dstMode,
        settings.fajrQuizEnabled,
        settings.includeIshraq,
        settings.prayerOffset,
    ]);

    const handleQuizSolved = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.loop = false;
        }

        if (isNative && Capacitor.isPluginAvailable('Azan')) {
            void NativeAzan.completeFajrChallenge().catch(error => {
                console.error('Failed to complete Fajr wake-up challenge:', error);
            });
        }

        setShowFajrQuiz(false);
    }, [isNative]);

    return <FajrQuizModal open={showFajrQuiz} onSolved={handleQuizSolved} />;
}
