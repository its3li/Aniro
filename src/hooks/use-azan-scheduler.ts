import { useCallback, useEffect, useRef } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useSettings } from '@/components/providers/settings-provider';
import { useToast } from '@/hooks/use-toast';
import { NativeAzan } from '@/lib/native-azan';
const EXACT_ALARM_PROMPT_SESSION_KEY = 'aniro_azan_exact_alarm_prompted';
const BATTERY_PROMPT_SESSION_KEY = 'aniro_azan_battery_prompted';
const DND_PROMPT_SESSION_KEY = 'aniro_azan_dnd_prompted';

async function checkNotificationPermission(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
        return true;
    }

    try {
        let permissionStatus = await LocalNotifications.checkPermissions();

        if (permissionStatus.display !== 'granted') {
            permissionStatus = await LocalNotifications.requestPermissions();
        }

        return permissionStatus.display === 'granted';
    } catch (error) {
        console.error('[AzanScheduler] Notification permission check failed:', error);
        return false;
    }
}

function shouldPromptOnce(sessionKey: string): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        if (sessionStorage.getItem(sessionKey) === '1') {
            return false;
        }
        sessionStorage.setItem(sessionKey, '1');
        return true;
    } catch {
        return true;
    }
}

export async function checkAndRequestPermissions(): Promise<{
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

    const notifications = await checkNotificationPermission();
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
    const { toast } = useToast();
    const isSchedulingRef = useRef(false);
    const isArabic = settings.language === 'ar';

    const scheduleAzanAlarms = useCallback(async () => {
        if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('Azan')) {
            return;
        }

        if (isSchedulingRef.current) {
            return;
        }

        isSchedulingRef.current = true;
        try {
            const notifications = await checkNotificationPermission();
            const status = await NativeAzan.checkStatus();

            if (!notifications || !status.notifications) {
                toast({
                    title: isArabic
                        ? '\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0627\u0644\u0623\u0630\u0627\u0646 \u0645\u062a\u0648\u0642\u0641\u0629'
                        : 'Azan notifications are off',
                    description: isArabic
                        ? '\u0641\u0639\u0651\u0644 \u0625\u0634\u0639\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u062d\u062a\u0649 \u064a\u0638\u0647\u0631 \u0627\u0644\u0623\u0630\u0627\u0646 \u0648\u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0641\u064a \u0648\u0642\u062a\u0647\u0627.'
                        : 'Enable app notifications so azan alerts can appear on time.',
                });
            }

            if (!status.exactAlarm && shouldPromptOnce(EXACT_ALARM_PROMPT_SESSION_KEY)) {
                toast({
                    title: isArabic
                        ? '\u0641\u0639\u0651\u0644 \u0645\u0646\u0628\u0647\u0627\u062a \u0627\u0644\u0623\u0630\u0627\u0646 \u0627\u0644\u062f\u0642\u064a\u0642\u0629'
                        : 'Enable exact azan alarms',
                    description: isArabic
                        ? '\u0627\u0641\u062a\u062d \u0625\u0639\u062f\u0627\u062f Alarms & reminders \u0648\u0627\u0633\u0645\u062d \u0644\u0644\u062a\u0637\u0628\u064a\u0642 \u062d\u062a\u0649 \u064a\u0639\u0645\u0644 \u0627\u0644\u0623\u0630\u0627\u0646 \u0641\u064a \u0645\u064a\u0639\u0627\u062f\u0647.'
                        : 'Allow Alarms & reminders so Android can fire azan at the exact prayer time.',
                });
                await NativeAzan.requestExactAlarmPermission();
            }

            if (!status.ignoringBatteryOptimizations && shouldPromptOnce(BATTERY_PROMPT_SESSION_KEY)) {
                toast({
                    title: isArabic
                        ? '\u0627\u0633\u0645\u062d \u0644\u0644\u0623\u0630\u0627\u0646 \u0628\u0627\u0644\u0639\u0645\u0644 \u0641\u064a \u0627\u0644\u062e\u0644\u0641\u064a\u0629'
                        : 'Let azan run in the background',
                    description: isArabic
                        ? '\u0623\u0648\u0642\u0641 \u062a\u062d\u0633\u064a\u0646 \u0627\u0644\u0628\u0637\u0627\u0631\u064a\u0629 \u0644\u0644\u062a\u0637\u0628\u064a\u0642 \u0644\u062a\u0642\u0644\u064a\u0644 \u062a\u0623\u062e\u0631 \u0627\u0644\u0623\u0630\u0627\u0646 \u0639\u0644\u0649 \u0628\u0639\u0636 \u0627\u0644\u0623\u062c\u0647\u0632\u0629.'
                        : 'Disable battery optimization for this app to reduce missed or delayed azan playback.',
                });
            }

            if (!status.notificationPolicyAccess && shouldPromptOnce(DND_PROMPT_SESSION_KEY)) {
                toast({
                    title: isArabic
                        ? '\u0625\u0630\u0646 \u0639\u062f\u0645 \u0627\u0644\u0625\u0632\u0639\u0627\u062c \u0627\u062e\u062a\u064a\u0627\u0631\u064a'
                        : 'Do Not Disturb access is optional',
                    description: isArabic
                        ? '\u0628\u062f\u0648\u0646\u0647 \u0642\u062f \u064a\u0645\u0646\u0639 \u0648\u0636\u0639 \u0639\u062f\u0645 \u0627\u0644\u0625\u0632\u0639\u0627\u062c \u0635\u0648\u062a \u0627\u0644\u0623\u0630\u0627\u0646.'
                        : 'Without it, Android Do Not Disturb may silence azan audio.',
                });
            }

            await NativeAzan.refreshSchedule();
        } catch (error) {
            console.error('[AzanScheduler] Failed to refresh azan schedule:', error);
        } finally {
            isSchedulingRef.current = false;
        }
    }, [isArabic, toast]);

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
        checkAndRequestPermissions,
        stopAzan: () => NativeAzan.stop(),
    };
}
