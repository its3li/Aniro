import { registerPlugin } from '@capacitor/core';

export type AzanStatus = {
    exactAlarm: boolean;
    notifications: boolean;
    notificationPolicyAccess: boolean;
    ignoringBatteryOptimizations: boolean;
    scheduledCount?: number;
};

export interface PendingFajrChallenge {
    pending: boolean;
    prayerName?: string;
    prayerTime?: number;
}

export interface NativeAzanPlugin {
    checkStatus(): Promise<AzanStatus>;
    requestExactAlarmPermission(): Promise<void>;
    openBatteryOptimizationSettings(): Promise<void>;
    openDoNotDisturbSettings(): Promise<void>;
    openNotificationSettings(): Promise<void>;
    refreshSchedule(): Promise<AzanStatus>;
    getPendingFajrChallenge(): Promise<PendingFajrChallenge>;
    completeFajrChallenge(): Promise<void>;
    stop(): Promise<void>;
}

export const NativeAzan = registerPlugin<NativeAzanPlugin>('Azan');
