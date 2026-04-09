'use client';

import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useSettings } from './settings-provider';
import { getPrayerTimes, getTotalOffset } from '@/lib/prayer';
import { useLocation } from '@/hooks/use-location';
import { FajrQuizModal } from '@/components/prayer/fajr-quiz-modal';

export function AzanPlayer() {
    const { settings } = useSettings();
    const { coordinates } = useLocation();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastPlayedPrayerRef = useRef<string | null>(null);
    const [showFajrQuiz, setShowFajrQuiz] = useState(false);

    // On native, we don't render the web azan player at all — but we DO render
    // the quiz modal since it's a React component
    const isNative = Capacitor.isNativePlatform();

    useEffect(() => {
        if (isNative) return;

        // Initialize audio element
        if (!audioRef.current) {
            audioRef.current = new Audio('/azan.mp3');
        }

        const checkPrayerTime = () => {
            const now = new Date();
            const lat = coordinates?.latitude;
            const lng = coordinates?.longitude;

            const totalOffset = getTotalOffset(settings.prayerOffset, settings.dstMode);
            const prayers = getPrayerTimes(now, lat, lng, totalOffset, settings.calculationMethod);

            const currentPrayer = prayers.find(p => {
                const prayerTime = p.date;
                const diff = Math.abs(now.getTime() - prayerTime.getTime());
                return diff < 60000;
            });

            if (currentPrayer && lastPlayedPrayerRef.current !== currentPrayer.name) {
                lastPlayedPrayerRef.current = currentPrayer.name;

                // If this is Fajr AND quiz is enabled — show quiz (audio keeps playing)
                if (currentPrayer.name === 'fajr' && settings.fajrQuizEnabled) {
                    if (audioRef.current) {
                        audioRef.current.loop = true;
                        audioRef.current.play().catch(e => console.error("Error playing Azan:", e));
                    }
                    setShowFajrQuiz(true);
                } else {
                    // Non-Fajr prayer or quiz disabled — just play once
                    if (audioRef.current) {
                        audioRef.current.loop = false;
                        audioRef.current.play().catch(e => console.error("Error playing Azan:", e));
                    }
                }
            }
        };

        const intervalId = setInterval(checkPrayerTime, 10000);

        return () => {
            clearInterval(intervalId);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [settings.prayerOffset, settings.dstMode, coordinates, settings.calculationMethod, settings.fajrQuizEnabled, isNative]);

    const handleQuizSolved = () => {
        // Stop the adhan
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.loop = false;
        }
        setShowFajrQuiz(false);
    };

    return (
        <FajrQuizModal open={showFajrQuiz} onSolved={handleQuizSolved} />
    );
}
