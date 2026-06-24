import { useCallback, useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useSettings } from '@/components/providers/settings-provider';
import { scheduleFridayKahfReminder } from '@/lib/friday-kahf-reminder';
import { NativeAzan } from '@/lib/native-azan';

async function checkNotificationPermissionStatus(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        return true;
    }

    try {
        const permissionStatus = await LocalNotifications.checkPermissions();
        return permissionStatus.display === 'granted';
    } catch (error) {
        console.error('[AzanScheduler] Notification permission check failed:', error);
        return false;
    }
}

export async function checkAzanPermissionStatus(): Promise<{
    notifications: boolean;
    exactAlarm: boolean;
    notificationPolicyAccess: boolean;
    ignoringBatteryOptimizations: boolean;
}> {
    if (!Capacitor.isNativePlatform()) {
        return {
            notifications: true,
            exactAlarm: true,
            notificationPolicyAccess: true,
            ignoringBatteryOptimizations: true,
        };
    }

    const notifications = await checkNotificationPermissionStatus();
    const status = Capacitor.isPluginAvailable('Azan')
        ? await NativeAzan.checkStatus()
        : {
            exactAlarm: true,
            notifications: true,
            notificationPolicyAccess: true,
            ignoringBatteryOptimizations: true,
        };

    return {
        notifications: notifications && status.notifications,
        exactAlarm: status.exactAlarm,
        notificationPolicyAccess: status.notificationPolicyAccess,
        ignoringBatteryOptimizations: status.ignoringBatteryOptimizations,
    };
}

export function useAzanScheduler() {
    const { settings } = useSettings();
    const isSchedulingRef = useRef(false);

    const scheduleAzanAlarms = useCallback(async () => {
        if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Azan')) {
            return;
        }

        if (isSchedulingRef.current) {
            return;
        }

        isSchedulingRef.current = true;
        try {
            await NativeAzan.refreshSchedule();
            await scheduleFridayKahfReminder(settings);
        } catch (error) {
            console.error('[AzanScheduler] Failed to refresh azan schedule:', error);
        } finally {
            isSchedulingRef.current = false;
        }
    }, [settings]);

    useEffect(() => {
        scheduleAzanAlarms();

        let didUnmount = false;
        let removeListener: (() => void) | undefined;
        void App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                void scheduleAzanAlarms();
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
    }, [scheduleAzanAlarms]);

    return {
        scheduleAzanAlarms,
        checkAzanPermissionStatus,
        stopAzan: () => NativeAzan.stop(),
    };
}
