'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();

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

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let didUnmount = false;
        let removeListener: (() => void) | undefined;
        void LocalNotifications.addListener('localNotificationActionPerformed', ({ notification }) => {
            const route = notification.extra?.route;
            if (typeof route === 'string' && route.startsWith('/')) {
                router.push(route);
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
            removeListener?.();
        };
    }, [router]);

    if (isColdStart) {
        return <LoadingScreen />;
    }

    return <>{children}</>;
}
