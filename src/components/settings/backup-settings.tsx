'use client';

import { useRef, useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader } from '../glass-card';
import { Button } from '@/components/ui/button';
import { useSettings } from '../providers/settings-provider';
import { toast } from '@/hooks/use-toast';
import { exportBackup, parseBackup, restoreBackup } from '@/lib/backup';
import { DownloadSimpleIcon as Download } from '@/components/icons/interface-icons';
import { ArrowsClockwiseIcon as Restore } from '@/components/icons/interface-icons';

export function BackupSettings() {
  const { settings } = useSettings();
  const ar = settings.language === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<null | 'export' | 'import'>(null);

  const onExport = async () => {
    setBusy('export');
    try {
      const outcome = await exportBackup();
      if (outcome !== 'cancelled') toast({ title: L('تم إنشاء النسخة الاحتياطية ✓', 'Backup created ✓'), description: L('احفظ الملف في مكان آمن مثل Drive أو الملفات.', 'Keep the file somewhere safe, like Drive or Files.') });
    } catch (error) {
      toast({ variant: 'destructive', title: L('تعذّر إنشاء النسخة', 'Could not create backup'), description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy('import');
    try {
      const backup = parseBackup(await file.text());
      await restoreBackup(backup);
      toast({ title: L('تمت الاستعادة ✓', 'Restored ✓'), description: L('سيُعاد تشغيل التطبيق الآن.', 'The app will restart now.') });
      window.setTimeout(() => window.location.replace('/'), 1200);
    } catch (error) {
      toast({ variant: 'destructive', title: L('ملف غير صالح', 'Invalid file'), description: error instanceof Error ? error.message : undefined });
      setBusy(null);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <GlassCard>
      <GlassCardHeader>
        <h2 className="text-base font-semibold">{L('النسخ الاحتياطي', 'Backup')}</h2>
      </GlassCardHeader>
      <GlassCardContent>
        <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
          {L('احفظ إعداداتك وموضع القراءة وتقدّم الأذكار وأذكارك الخاصة في ملف، واستعدها بعد إعادة تثبيت التطبيق أو على هاتف آخر.',
            'Save your settings, reading position, azkar progress and your own azkar sets to a file, and restore them after reinstalling or on another phone.')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" className="h-11 gap-2" disabled={!!busy} onClick={onExport}>
            <Download className="h-5 w-5" />
            {L('حفظ نسخة', 'Back up')}
          </Button>
          <Button variant="outline" className="h-11 gap-2" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            <Restore className="h-5 w-5" />
            {L('استعادة', 'Restore')}
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => void onFile(e.target.files?.[0])} />
      </GlassCardContent>
    </GlassCard>
  );
}
