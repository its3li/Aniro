import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface ApkDownloadProgress {
    downloadedBytes: number;
    totalBytes: number;
    progress: number;
}

export interface ApkDownloadRequest {
    url: string;
    versionCode: number;
    fileName?: string;
    sha256?: string;
}

export interface ApkDownloadResult {
    fileName: string;
    bytes: number;
    sha256: string;
    canInstall: boolean;
}

export interface ApkInstallResult {
    canInstall: boolean;
}

export interface ApkUpdatePlugin {
    canInstallPackages(): Promise<{ canInstall: boolean }>;
    openInstallPermissionSettings(): Promise<void>;
    downloadUpdate(request: ApkDownloadRequest): Promise<ApkDownloadResult>;
    installDownloadedUpdate(request: { fileName: string }): Promise<ApkInstallResult>;
    clearDownloadedUpdate(request: { fileName: string }): Promise<{ deleted: boolean }>;
    addListener(
        eventName: 'downloadProgress',
        listenerFunc: (progress: ApkDownloadProgress) => void
    ): Promise<PluginListenerHandle>;
}

export const NativeApkUpdate = registerPlugin<ApkUpdatePlugin>('ApkUpdate');

export function canUseNativeApkUpdater() {
    return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('ApkUpdate');
}
