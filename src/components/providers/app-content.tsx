'use client';

import { useEffect } from 'react';
import { useLoading } from '@/components/providers/loading-provider';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useWidgetSync } from '@/hooks/use-widget-sync';
import { useAzanScheduler } from '@/hooks/use-azan-scheduler';
import { useQuranSearch } from '@/hooks/use-quran-search';
import { getSurahList } from '@/lib/quran';

type IdleWindow = Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
};

export function AppContent({ children }: { children: React.ReactNode }) {
    const { isColdStart } = useLoading();
    const { preload } = useQuranSearch();

    useAzanScheduler();

    // Sync data to native widget
    useWidgetSync();

    useEffect(() => {
        const prewarm = () => {
            void getSurahList();
            void preload();
        };

        const idleWindow = window as IdleWindow;

        if (idleWindow.requestIdleCallback && idleWindow.cancelIdleCallback) {
            const idleId = idleWindow.requestIdleCallback(prewarm, { timeout: 2000 });
            return () => idleWindow.cancelIdleCallback?.(idleId);
        }

        const timeoutId = setTimeout(prewarm, 500);
        return () => clearTimeout(timeoutId);
    }, [preload]);

    if (isColdStart) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
