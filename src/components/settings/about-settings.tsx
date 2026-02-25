'use client';

import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Button } from '@/components/ui/button';
import { useSettings } from '../providers/settings-provider';
import { checkForUpdate, APP_VERSION } from '@/lib/app-update';
import { RefreshCw, Download, Check, AlertCircle } from 'lucide-react';

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
      }
    } catch (e) {
      setError(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleDownload = () => {
    window.open('https://aniro.vercel.app/', '_blank');
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <h2 className="text-base font-semibold">{isArabic ? 'حول التطبيق' : 'About'}</h2>
      </GlassCardHeader>
      <GlassCardContent>
        <div className="divide-y divide-border">
          {/* Version */}
          <div className="flex items-center justify-between py-3 first:pt-0">
            <span className="text-sm text-muted-foreground">{isArabic ? 'الإصدار' : 'Version'}</span>
            <span className="text-sm font-medium">v{APP_VERSION.versionName}</span>
          </div>

          {/* Check for updates */}
          <div className="flex items-center justify-between py-3 last:pb-0">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm">{isArabic ? 'التحقق من التحديثات' : 'Check for updates'}</span>
              {updateAvailable && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {isArabic ? 'تحديث جديد متاح!' : 'New update available!'}
                </p>
              )}
              {error && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {isArabic ? 'فشل الاتصال' : 'Connection failed'}
                </p>
              )}
            </div>
            {updateAvailable ? (
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs rounded-lg"
                onClick={handleDownload}
              >
                <Download className="w-3 h-3 mr-1" />
                {isArabic ? 'تحديث' : 'Update'}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs rounded-lg"
                onClick={handleCheckUpdate}
                disabled={isChecking}
              >
                {isChecking ? (
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {isChecking 
                  ? (isArabic ? 'جاري...' : 'Checking...') 
                  : (isArabic ? 'تحقق' : 'Check')}
              </Button>
            )}
          </div>
        </div>
      </GlassCardContent>
    </GlassCard>
  );
}