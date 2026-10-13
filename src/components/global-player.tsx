
'use client';
import { useEffect, useRef } from 'react';
import { useAudioPlayback } from './providers/audio-player-provider';
import { QuranAudioPlayer } from './quran/quran-audio-player';
import { BottomNav } from './bottom-nav';
import { ReciterSelectModal } from './quran/reciter-select-modal';
import { useSettings } from './providers/settings-provider';

export function GlobalPlayer() {
    const dockRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const dock = dockRef.current;
        if (!dock) return;
        const updateHeight = () => document.documentElement.style.setProperty('--bottom-dock-height', dock.getBoundingClientRect().height + 'px');
        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(dock);
        return () => { observer.disconnect(); document.documentElement.style.removeProperty('--bottom-dock-height'); };
    }, []);
    const { playerState, isReciterModalOpen, setReciterModalOpen, pendingActionRef } = useAudioPlayback();
    const { setQuranReciter } = useSettings();

    const handleReciterSelect = (identifier: string) => {
        setQuranReciter(identifier);
        localStorage.setItem('hasSetReciter', 'true');
        setReciterModalOpen(false);

        // Delay execution to allow state to update first
        if (pendingActionRef.current) {
            const action = pendingActionRef.current;
            pendingActionRef.current = null;
            setTimeout(() => {
                action();
            }, 100);
        }
    }

    return (
        <>
            <div ref={dockRef} className="fixed bottom-0 left-0 right-0 z-50">
                {playerState.showPlayer && <QuranAudioPlayer />}
                <BottomNav />
            </div>
            <ReciterSelectModal
                isOpen={isReciterModalOpen}
                onClose={() => {
                    setReciterModalOpen(false);
                    pendingActionRef.current = null;
                }}
                onSelect={handleReciterSelect}
            />
        </>
    )
}
