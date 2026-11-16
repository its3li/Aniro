'use client';

import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { CopySimpleIcon as CopySimple } from '@/components/icons/interface-icons';
import { ShareNetworkIcon as ShareNetwork } from '@/components/icons/interface-icons';
import { XIcon as X } from '@/components/icons/interface-icons';
import { PlusIcon as Plus } from '@/components/icons/interface-icons';
import { useShareImage } from '@/components/share/share-image-dialog';

interface SelectionActionBarProps {
  count: number;
  /** e.g. "٣ آيات" / "3 ayat" */
  label: string;
  isArabic: boolean;
  onCopy: () => void;
  onShare: () => void;
  onClear: () => void;
  /** "Add to my azkar" (shown when provided). */
  onAdd?: () => void;
}

/** Bottom bar shown while a multi-selection (ayat / azkar) is active. */
export function SelectionActionBar({ count, label, isArabic, onCopy, onShare, onClear, onAdd }: SelectionActionBarProps) {
  const { isOpen: shareOpen } = useShareImage();
  if (count === 0 || shareOpen || typeof document === 'undefined') return null;
  return createPortal(
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      role="toolbar"
      aria-label={isArabic ? 'إجراءات التحديد' : 'Selection actions'}
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-border bg-background/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-sm animate-in slide-in-from-bottom-4 duration-200"
      onClick={e => e.stopPropagation()}
    >
      <div className="mx-auto flex max-w-[54rem] items-center gap-2">
        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" onClick={onClear} aria-label={isArabic ? 'إلغاء التحديد' : 'Clear selection'}>
          <X className="h-5 w-5" />
        </Button>
        <span className="flex-1 truncate text-sm font-semibold tabular-nums">{label}</span>
        {onAdd && (
          <Button variant="secondary" size="icon" className="h-11 w-11 shrink-0" onClick={onAdd} aria-label={isArabic ? 'إضافة إلى أذكاري' : 'Add to my azkar'} title={isArabic ? 'إضافة إلى أذكاري' : 'Add to my azkar'}>
            <Plus className="h-5 w-5" />
          </Button>
        )}
        <Button variant="secondary" className="h-11 gap-2" onClick={onCopy}>
          <CopySimple className="h-5 w-5" />
          {isArabic ? 'نسخ' : 'Copy'}
        </Button>
        <Button className="h-11 gap-2" onClick={onShare}>
          <ShareNetwork className="h-5 w-5" />
          {isArabic ? 'مشاركة' : 'Share'}
        </Button>
      </div>
    </div>,
    document.body,
  );
}

/** Arabic-aware ayah count label. */
export function ayatCountLabel(n: number, isArabic: boolean): string {
  if (!isArabic) return n === 1 ? '1 ayah selected' : `${n} ayat selected`;
  const d = String(n).replace(/\d/g, x => '٠١٢٣٤٥٦٧٨٩'[Number(x)]);
  if (n === 1) return 'آية واحدة';
  if (n === 2) return 'آيتان';
  if (n <= 10) return `${d} آيات`;
  return `${d} آية`;
}
