'use client';

import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Button } from '@/components/ui/button';
import { useSettings } from '../providers/settings-provider';
import { APP_VERSION, checkForUpdate, showUpdateDialog } from '@/lib/app-update';
import { AlertCircle, Check, Download, RefreshCw } from 'lucide-react';

export function AboutSettings() {
  const { settings } = useSettings();
  const isArabic = settings.language === 'ar';
  const [isChecking, setIsChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [error, setError] = useState(false);

  const handleCheckUpdate = async () => {
    setIsChecking(true);
    setError(false);
    setUpdateAvailable(false);

    try {
      const update = await checkForUpdate();
      if (update) {
        setUpdateAvailable(true);
        showUpdateDialog(update);
      }
    } catch {
      setError(true);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <h2 className="text-base font-semibold">{isArabic ? 'حول التطبيق' : 'About'}</h2>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between py-3 first:pt-0">
            <span className="text-sm text-muted-foreground">{isArabic ? 'الإصدار' : 'Version'}</span>
            <span className="text-sm font-medium">v{APP_VERSION.versionName}</span>
          </div>

          <div className="flex items-center justify-between py-3 last:pb-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">{isArabic ? 'التحقق من التحديثات' : 'Check for updates'}</span>
              {updateAvailable && (
                <p className="flex items-center gap-1 text-xs text-primary">
                  <Download className="h-3 w-3" />
                  {isArabic ? 'تحديث جديد متاح' : 'New update available'}
                </p>
              )}
              {error && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {isArabic ? 'فشل الاتصال' : 'Connection failed'}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={handleCheckUpdate}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="me-1 h-3 w-3 animate-spin" />
              ) : (
                <Check className="me-1 h-3 w-3" />
              )}
              {isChecking
                ? isArabic ? 'جاري...' : 'Checking...'
                : isArabic ? 'تحقق' : 'Check'}
            </Button>
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}
