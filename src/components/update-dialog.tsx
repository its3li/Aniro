'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Download, ExternalLink, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { UPDATE_DIALOG_EVENT, checkForUpdate, getUpdateUrl, type UpdateInfo } from '@/lib/app-update';
import {
  canUseNativeApkUpdater,
  NativeApkUpdate,
  type ApkDownloadProgress,
} from '@/lib/native-apk-update';
import { useSettings } from './providers/settings-provider';

type UpdateStatus = 'idle' | 'permission' | 'downloading' | 'installing' | 'error';
type UpdateError = 'generic' | 'packageConflict' | null;

const en = {
  title: 'New update available',
  updateNow: 'Update now',
  later: 'Later',
  openDownload: 'Open download',
  installing: 'Opening installer...',
  downloading: 'Downloading update',
  permissionTitle: 'Allow in-app updates',
  permissionBody: 'Enable install permission for Aniro. When you return, the update will continue automatically.',
  permissionButton: 'Open permission',
  readyBody: 'Aniro will download the update here, verify it, then Android will ask you to confirm installation.',
  fallbackBody: 'This build can still open the download page for the latest APK.',
  error: 'Update failed. Please try again.',
  packageConflict: 'Android rejected this update because the installed app does not match the update signature. Install the official release build once, then future updates will work in-app.',
  verified: 'APK verification enabled',
  unverified: 'APK checksum is missing',
};

const ar = {
  title: 'تحديث جديد متاح',
  updateNow: 'تحديث الآن',
  later: 'لاحقا',
  openDownload: 'فتح التحميل',
  installing: 'جاري فتح شاشة التثبيت...',
  downloading: 'جاري تحميل التحديث',
  permissionTitle: 'السماح بالتحديث من داخل التطبيق',
  permissionBody: 'فعّل إذن تثبيت التطبيقات من Aniro، وبعد الرجوع للتطبيق سيكمل التحديث تلقائيا.',
  permissionButton: 'فتح الإذن',
  readyBody: 'سيتم تحميل التحديث داخل التطبيق، ثم يطلب أندرويد تأكيد التثبيت.',
  fallbackBody: 'يمكن فتح صفحة تحميل آخر إصدار.',
  error: 'فشل التحديث. حاول مرة أخرى.',
  packageConflict: 'أندرويد رفض التحديث لأن النسخة المثبتة لا تطابق توقيع ملف التحديث. ثبّت نسخة الإصدار الرسمية مرة واحدة، وبعدها ستعمل التحديثات من داخل التطبيق.',
  verified: 'تم تفعيل التحقق من ملف APK',
  unverified: 'بصمة APK غير موجودة',
};

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '';
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function UpdateDialog() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [progress, setProgress] = useState<ApkDownloadProgress | null>(null);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<UpdateError>(null);
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const copy = isArabic ? ar : en;
  const nativeUpdaterAvailable = canUseNativeApkUpdater();
  const canDownloadInApp = nativeUpdaterAvailable && Boolean(updateInfo?.apkUrl);
  const isBusy = status === 'downloading' || status === 'installing';

  const openUpdate = useCallback((update: UpdateInfo) => {
    setUpdateInfo(update);
    setStatus('idle');
    setProgress(null);
    setDownloadedFileName(null);
    setUpdateError(null);
  }, []);

  const runCheck = useCallback(async () => {
    try {
      const update = await checkForUpdate();
      if (update) openUpdate(update);
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }, [openUpdate]);

  useEffect(() => {
    const handleRequestedUpdate = (event: Event) => {
      const update = (event as CustomEvent<UpdateInfo>).detail;
      if (update) openUpdate(update);
    };

    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        void runCheck();
      }
    };

    const timeoutId = window.setTimeout(() => {
      void runCheck();
    }, 0);
    window.addEventListener('online', runCheck);
    window.addEventListener(UPDATE_DIALOG_EVENT, handleRequestedUpdate);
    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('online', runCheck);
      window.removeEventListener(UPDATE_DIALOG_EVENT, handleRequestedUpdate);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, [openUpdate, runCheck]);

  useEffect(() => {
    if (!nativeUpdaterAvailable) return;

    let isMounted = true;
    let removeListener: (() => void) | undefined;

    void NativeApkUpdate.addListener('downloadProgress', event => {
      if (isMounted) setProgress(event);
    }).then(listener => {
      removeListener = () => {
        void listener.remove();
      };
    });

    return () => {
      isMounted = false;
      removeListener?.();
    };
  }, [nativeUpdaterAvailable]);

  const progressLabel = useMemo(() => {
    if (!progress) return '';
    const downloaded = formatBytes(progress.downloadedBytes);
    const total = formatBytes(progress.totalBytes);
    return total ? `${downloaded} / ${total}` : downloaded;
  }, [progress]);

  const handleLater = useCallback(() => {
    if (isBusy || updateInfo?.forceUpdate) return;
    setUpdateInfo(null);
    setStatus('idle');
    setProgress(null);
    setDownloadedFileName(null);
    setUpdateError(null);
  }, [isBusy, updateInfo?.forceUpdate]);

  const handleFallbackDownload = useCallback(() => {
    window.open(getUpdateUrl(), '_blank');
    handleLater();
  }, [handleLater]);

  const handleOpenPermission = async () => {
    try {
      await NativeApkUpdate.openInstallPermissionSettings();
    } catch (error) {
      console.error('Failed to open install permission settings:', error);
      setUpdateError('generic');
      setStatus('error');
    }
  };

  const handleInstall = useCallback(async (fileName: string) => {
    setStatus('installing');
    const result = await NativeApkUpdate.installDownloadedUpdate({ fileName });
    if (!result.canInstall) {
      if (result.installBlockedReason === 'packageNameMismatch' || result.installBlockedReason === 'signatureMismatch') {
        setUpdateError('packageConflict');
        setStatus('error');
      } else {
        setStatus('permission');
      }
    }
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!updateInfo) return;

    if (!canDownloadInApp || !updateInfo.apkUrl) {
      handleFallbackDownload();
      return;
    }

    try {
      setUpdateError(null);
      const permission = await NativeApkUpdate.canInstallPackages();
      if (!permission.canInstall) {
        setStatus('permission');
        await NativeApkUpdate.openInstallPermissionSettings();
        return;
      }

      setStatus('downloading');
      setProgress({ downloadedBytes: 0, totalBytes: 0, progress: 0 });

      const fileName = `aniro-${updateInfo.versionCode}.apk`;
      const result = await NativeApkUpdate.downloadUpdate({
        url: updateInfo.apkUrl,
        versionCode: updateInfo.versionCode,
        fileName,
        sha256: updateInfo.sha256,
      });

      setDownloadedFileName(result.fileName);
      await handleInstall(result.fileName);
    } catch (error) {
      console.error('Update failed:', error);
      setUpdateError('generic');
      setStatus('error');
    }
  }, [canDownloadInApp, handleFallbackDownload, handleInstall, updateInfo]);

  useEffect(() => {
    if (!nativeUpdaterAvailable || status !== 'permission') return;

    const continueAfterPermission = async () => {
      if (document.visibilityState !== 'visible') return;
      const permission = await NativeApkUpdate.canInstallPackages();
      if (!permission.canInstall) return;

      if (downloadedFileName) {
        await handleInstall(downloadedFileName);
      } else {
        setStatus('idle');
        await handleUpdate();
      }
    };

    document.addEventListener('visibilitychange', continueAfterPermission);
    window.addEventListener('focus', continueAfterPermission);

    return () => {
      document.removeEventListener('visibilitychange', continueAfterPermission);
      window.removeEventListener('focus', continueAfterPermission);
    };
  }, [downloadedFileName, handleInstall, handleUpdate, nativeUpdaterAvailable, status]);

  if (!updateInfo) return null;

  const bodyText = canDownloadInApp ? copy.readyBody : copy.fallbackBody;

  return (
    <AlertDialog open={!!updateInfo} onOpenChange={(open) => !open && handleLater()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {status === 'permission' ? copy.permissionTitle : copy.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <span className="mb-2 block text-lg font-semibold text-primary">
              v{updateInfo.versionName}
            </span>
            {updateInfo.releaseNotes && (
              <span className="mt-2 block text-sm text-muted-foreground">
                {updateInfo.releaseNotes}
              </span>
            )}
            <span className="mt-4 block text-sm text-muted-foreground">
              {status === 'permission' ? copy.permissionBody : bodyText}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {canDownloadInApp && (
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>{updateInfo.sha256 ? copy.verified : copy.unverified}</span>
            </div>
            {status === 'downloading' && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{copy.downloading}</span>
                  <span>{progress?.progress ?? 0}%</span>
                </div>
                <Progress value={progress?.progress ?? 0} />
                {progressLabel && (
                  <p className="text-center text-xs text-muted-foreground">{progressLabel}</p>
                )}
              </div>
            )}
            {status === 'installing' && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {copy.installing}
              </div>
            )}
            {status === 'error' && (
              <p className="mt-3 text-center text-sm text-destructive">
                {updateError === 'packageConflict' ? copy.packageConflict : copy.error}
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          {!updateInfo.forceUpdate && (
            <AlertDialogCancel disabled={isBusy} onClick={handleLater} className="w-full sm:w-auto">
              {copy.later}
            </AlertDialogCancel>
          )}

          {status === 'permission' ? (
            <Button onClick={handleOpenPermission} className="w-full gap-2 sm:w-auto">
              <ExternalLink className="h-4 w-4" />
              {copy.permissionButton}
            </Button>
          ) : downloadedFileName && status === 'error' ? (
            <Button onClick={() => void handleInstall(downloadedFileName)} className="w-full gap-2 sm:w-auto">
              <Download className="h-4 w-4" />
              {copy.updateNow}
            </Button>
          ) : (
            <Button disabled={isBusy} onClick={() => void handleUpdate()} className="w-full gap-2 sm:w-auto">
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {canDownloadInApp ? copy.updateNow : copy.openDownload}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
