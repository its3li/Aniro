import { useAzanScheduler } from './use-azan-scheduler';

/**
 * Backward-compatible wrapper for older call sites.
 * Native Android azan scheduling lives in useAzanScheduler.
 */
export function usePrayerNotifications() {
    return useAzanScheduler();
}
