'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, RefreshCw } from 'lucide-react';
import { checkForUpdate, getUpdateUrl, type UpdateInfo } from '@/lib/app-update';
import { useSettings } from './providers/settings-provider';

export function UpdateDialog() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';

  useEffect(() => {
    // Check for updates on app start
    checkUpdate();
  }, []);

  const checkUpdate = async () => {
    setIsChecking(true);
    try {
      const update = await checkForUpdate();
      if (update) {
        setUpdateInfo(update);
      }
    } catch (error) {
      console.error('Update check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUpdate = () => {
    // Open the landing page
    window.open(getUpdateUrl(), '_blank');
    setUpdateInfo(null);
  };

  const handleLater = () => {
    setUpdateInfo(null);
  };

  if (!updateInfo) return null;

  return (
    <AlertDialog open={!!updateInfo} onOpenChange={(open) => !open && handleLater()}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary" />
            {isArabic ? 'تحديث جديد متاح!' : 'New Update Available!'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            <span className="text-lg font-semibold text-primary block mb-2">
              v{updateInfo.versionName}
            </span>
            {updateInfo.releaseNotes && (
              <p className="text-sm text-muted-foreground mt-2">
                {updateInfo.releaseNotes}
              </p>
            )}
            {isArabic ? (
              <p className="text-sm text-muted-foreground mt-4">
                هل تريد تحميل التحديث الآن؟
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-4">
                Do you want to download the update now?
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={handleLater} className="w-full sm:w-auto">
            {isArabic ? 'لاحقاً' : 'Later'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpdate}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            <Download className="w-4 h-4 mr-2" />
            {isArabic ? 'تحديث الآن' : 'Update Now'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}