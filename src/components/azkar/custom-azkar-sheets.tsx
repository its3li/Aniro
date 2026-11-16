'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSettings } from '@/components/providers/settings-provider';
import { iconMap } from '@/components/azkar/category-grid';
import type { AzkarItem } from '@/lib/azkar';
import {
  CUSTOM_SET_COLORS, CUSTOM_SET_ICONS, addItemsToCustomSet, deleteCustomSet, saveCustomSet, useCustomAzkarSets,
  type CustomAzkarSet,
} from '@/lib/custom-azkar';
import { DEFAULT_REMINDER, MAX_REMINDER_TIMES, ensureReminderPermission, type CustomSetReminder } from '@/lib/custom-azkar-reminders';
import { PlusIcon as Plus } from '@/components/icons/interface-icons';
import { StarIcon as Star } from '@/components/icons/interface-icons';
import { TrashIcon as Trash } from '@/components/icons/interface-icons';

type Draft = { id?: string; name: string; icon: string; color: string; items: AzkarItem[]; reminder: CustomSetReminder };

interface CustomAzkarContextValue {
  /** Create a set, optionally pre-filled with azkar. */
  openNewSet: (items?: AzkarItem[]) => void;
  openEditSet: (set: CustomAzkarSet) => void;
  /** "Add to my azkar": pick an existing set or start a new one. */
  openAddToAzkar: (items: AzkarItem[]) => void;
}

const CustomAzkarContext = createContext<CustomAzkarContextValue | null>(null);

export function useCustomAzkar(): CustomAzkarContextValue {
  const ctx = useContext(CustomAzkarContext);
  if (!ctx) throw new Error('useCustomAzkar must be used inside <CustomAzkarProvider>');
  return ctx;
}

function SetIcon({ icon, color, className }: { icon: string; color: string; className?: string }) {
  const Icon = iconMap[icon] ?? Star;
  return (
    <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border', className)}
      style={{ color, borderColor: color + '55', background: color + '14' }}>
      <Icon className="h-6 w-6" />
    </span>
  );
}

const DAY_LABELS = { ar: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'], en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'] };
const DAY_NAMES = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

function ReminderSection({ value, onChange, ar }: { value: CustomSetReminder; onChange: (r: CustomSetReminder) => void; ar: boolean }) {
  const L = (a: string, e: string) => (ar ? a : e);
  const native = Capacitor.isNativePlatform();
  const activeDays = value.days.length ? value.days : [0, 1, 2, 3, 4, 5, 6];

  const toggleEnabled = async (enabled: boolean) => {
    if (enabled && native && !(await ensureReminderPermission())) {
      toast({ variant: 'destructive', title: L('الإشعارات غير مسموحة', 'Notifications are off'), description: L('فعّل الإشعارات لأنيرو من إعدادات الهاتف.', 'Allow notifications for Aniro in your phone settings.') });
      return;
    }
    onChange({ ...value, enabled });
  };
  const toggleDay = (day: number) => {
    const next = activeDays.includes(day) ? activeDays.filter(d => d !== day) : [...activeDays, day].sort();
    if (next.length === 0) return;
    onChange({ ...value, days: next.length === 7 ? [] : next });
  };

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="custom-set-reminder" className="text-sm font-semibold">{L('تذكير يومي', 'Daily reminder')}</Label>
        <Switch id="custom-set-reminder" checked={value.enabled} onCheckedChange={v => void toggleEnabled(v)} />
      </div>
      {!native && <p className="text-xs text-muted-foreground">{L('التذكيرات تعمل في تطبيق أندرويد فقط.', 'Reminders work in the Android app only.')}</p>}
      {value.enabled && (
        <>
          <div className="space-y-2">
            {value.times.map((time, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input type="time" dir="ltr" value={time} aria-label={L('وقت التذكير', 'Reminder time')} className="h-11 w-36"
                  onChange={e => onChange({ ...value, times: value.times.map((t, i) => (i === index ? e.target.value : t)) })} />
                {value.times.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground" aria-label={L('حذف الوقت', 'Remove time')}
                    onClick={() => onChange({ ...value, times: value.times.filter((_, i) => i !== index) })}>
                    <Trash className="h-5 w-5" />
                  </Button>
                )}
              </div>
            ))}
            {value.times.length < MAX_REMINDER_TIMES && (
              <Button type="button" variant="ghost" className="h-10 gap-2 px-2" onClick={() => onChange({ ...value, times: [...value.times, '20:00'] })}>
                <Plus className="h-4 w-4" />
                {L('وقت آخر', 'Another time')}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label={L('الأيام', 'Days')}>
            {DAY_LABELS[ar ? 'ar' : 'en'].map((label, day) => (
              <button key={day} type="button" aria-pressed={activeDays.includes(day)} aria-label={DAY_NAMES[ar ? 'ar' : 'en'][day]}
                onClick={() => toggleDay(day)}
                className={cn('h-10 w-10 rounded-full border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  activeDays.includes(day) ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground')}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{value.days.length ? L('في الأيام المحددة', 'On the selected days') : L('كل يوم', 'Every day')}</p>
        </>
      )}
    </div>
  );
}

function SetEditor({ draft, onChange, onClose }: { draft: Draft | null; onChange: (d: Draft) => void; onClose: () => void }) {
  const { settings } = useSettings();
  const ar = settings.language === 'ar';
  const L = (a: string, e: string) => (ar ? a : e);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!draft) return null;
  const validItems = draft.items.filter(i => i.arabic.trim());
  const canSave = !!draft.name.trim() && validItems.length > 0 && !saving;
  const setItem = (index: number, patch: Partial<AzkarItem>) =>
    onChange({ ...draft, items: draft.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await saveCustomSet(draft);
      toast({ title: L('تم حفظ المجموعة ✓', 'Set saved ✓') });
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: L('تعذّر الحفظ', 'Could not save'), description: error instanceof Error ? error.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!draft.id) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await deleteCustomSet(draft.id);
    toast({ title: L('تم حذف المجموعة', 'Set deleted') });
    onClose();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="custom-set-name">{L('اسم المجموعة', 'Set name')}</Label>
        <Input id="custom-set-name" value={draft.name} maxLength={60} placeholder={L('مثال: أذكار العمل', 'e.g. Work azkar')}
          onChange={e => onChange({ ...draft, name: e.target.value })} className="h-11" />
      </div>

      <div className="space-y-2">
        <Label>{L('الأيقونة', 'Icon')}</Label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={L('الأيقونة', 'Icon')}>
          {CUSTOM_SET_ICONS.map(icon => {
            const Icon = iconMap[icon] ?? Star;
            const active = draft.icon === icon;
            return (
              <button key={icon} type="button" role="radio" aria-checked={active} aria-label={icon}
                onClick={() => onChange({ ...draft, icon })}
                className={cn('grid h-11 w-11 place-items-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'border-transparent' : 'border-border text-muted-foreground')}
                style={active ? { color: draft.color, background: draft.color + '1f', borderColor: draft.color } : undefined}>
                <Icon className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{L('اللون', 'Colour')}</Label>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={L('اللون', 'Colour')}>
          {CUSTOM_SET_COLORS.map(color => (
            <button key={color} type="button" role="radio" aria-checked={draft.color === color} aria-label={color}
              onClick={() => onChange({ ...draft, color })}
              className={cn('grid h-11 w-11 place-items-center rounded-full border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                draft.color === color ? 'border-foreground/70' : 'border-transparent')}>
              <span className="h-7 w-7 rounded-full" style={{ background: color }} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>{L('الأذكار', 'Azkar')}</Label>
        {draft.items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-border p-3">
            <Textarea dir="rtl" lang="ar" rows={3} value={item.arabic} placeholder={L('نص الذكر', 'Zikr text (Arabic)')}
              onChange={e => setItem(index, { arabic: e.target.value })} className="font-quran text-lg leading-loose" />
            {!ar && (
              <Input value={item.translation} placeholder="Translation (optional)"
                onChange={e => setItem(index, { translation: e.target.value })} className="h-10" />
            )}
            <div className="flex items-center gap-2">
              <Label htmlFor={`rep-${index}`} className="text-sm text-muted-foreground">{L('عدد المرات', 'Times')}</Label>
              <Input id={`rep-${index}`} type="number" inputMode="numeric" min={1} max={1000} value={item.repetitions ?? 1}
                onChange={e => setItem(index, { repetitions: Math.max(1, Math.min(1000, Number(e.target.value) || 1)) })}
                className="h-10 w-24" />
              <Button type="button" variant="ghost" size="icon" className="ms-auto h-10 w-10 text-muted-foreground"
                aria-label={L('حذف الذكر', 'Remove zikr')}
                onClick={() => onChange({ ...draft, items: draft.items.filter((_, i) => i !== index) })}>
                <Trash className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" className="h-11 w-full gap-2"
          onClick={() => onChange({ ...draft, items: [...draft.items, { arabic: '', translation: '', repetitions: 1 }] })}>
          <Plus className="h-5 w-5" />
          {L('إضافة ذكر', 'Add zikr')}
        </Button>
      </div>

      <ReminderSection value={draft.reminder} ar={ar} onChange={reminder => onChange({ ...draft, reminder })} />

      <div className="flex gap-3">
        {draft.id && (
          <Button type="button" variant={confirmDelete ? 'destructive' : 'ghost'} className="h-12 gap-2" onClick={remove}>
            <Trash className="h-5 w-5" />
            {confirmDelete ? L('تأكيد الحذف', 'Confirm delete') : L('حذف', 'Delete')}
          </Button>
        )}
        <Button type="button" className="h-12 flex-1 text-base" disabled={!canSave} onClick={save}>
          {L('حفظ', 'Save')}
        </Button>
      </div>
    </div>
  );
}

function AddToAzkarList({ items, onPickNew, onClose }: { items: AzkarItem[]; onPickNew: () => void; onClose: () => void }) {
  const { settings } = useSettings();
  const ar = settings.language === 'ar';
  const { sets } = useCustomAzkarSets();
  const add = async (set: CustomAzkarSet) => {
    try {
      await addItemsToCustomSet(set.id, items);
      toast({ title: ar ? `أُضيف إلى «${set.name}» ✓` : `Added to “${set.name}” ✓` });
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: ar ? 'تعذّرت الإضافة' : 'Could not add', description: error instanceof Error ? error.message : undefined });
    }
  };
  return (
    <div className="flex flex-col gap-2">
      {sets.map(set => (
        <button key={set.id} type="button" onClick={() => add(set)}
          className="flex min-h-14 items-center gap-3 rounded-xl border border-border px-3 py-2 text-start transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <SetIcon icon={set.icon} color={set.color} />
          <span className="flex-1">
            <span className="block font-semibold">{set.name}</span>
            <span className="block text-xs text-muted-foreground">{ar ? `${set.items.length} ذكر` : `${set.items.length} azkar`}</span>
          </span>
        </button>
      ))}
      <Button type="button" variant={sets.length ? 'outline' : 'default'} className="h-12 gap-2" onClick={onPickNew}>
        <Plus className="h-5 w-5" />
        {ar ? 'مجموعة جديدة' : 'New set'}
      </Button>
    </div>
  );
}

export function CustomAzkarProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const ar = settings.language === 'ar';
  const [draft, setDraft] = useState<Draft | null>(null);
  const [addItems, setAddItems] = useState<AzkarItem[] | null>(null);

  const openNewSet = useCallback((items: AzkarItem[] = []) => {
    setAddItems(null);
    setDraft({ name: '', icon: CUSTOM_SET_ICONS[0], color: CUSTOM_SET_COLORS[0], items: items.length ? items : [{ arabic: '', translation: '', repetitions: 1 }], reminder: { ...DEFAULT_REMINDER } });
  }, []);
  const openEditSet = useCallback((set: CustomAzkarSet) => {
    setDraft({ id: set.id, name: set.name, icon: set.icon, color: set.color, items: set.items.map(i => ({ ...i })), reminder: set.reminder ?? { ...DEFAULT_REMINDER } });
  }, []);
  const openAddToAzkar = useCallback((items: AzkarItem[]) => setAddItems(items), []);
  const value = useMemo(() => ({ openNewSet, openEditSet, openAddToAzkar }), [openNewSet, openEditSet, openAddToAzkar]);

  const sheetClass = 'max-h-[92dvh] overflow-y-auto rounded-t-3xl px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5';

  return (
    <CustomAzkarContext.Provider value={value}>
      {children}
      <Sheet open={!!draft} onOpenChange={open => { if (!open) setDraft(null); }}>
        <SheetContent side="bottom" dir={ar ? 'rtl' : 'ltr'} className={sheetClass}>
          <SheetTitle className="mb-4 text-center text-base">
            {draft?.id ? (ar ? 'تعديل المجموعة' : 'Edit set') : (ar ? 'مجموعة أذكار جديدة' : 'New azkar set')}
          </SheetTitle>
          <SheetDescription className="sr-only">{ar ? 'اسم المجموعة وأيقونتها ولونها وأذكارها' : 'Set name, icon, colour and azkar'}</SheetDescription>
          <SetEditor key={draft?.id ?? 'new'} draft={draft} onChange={setDraft} onClose={() => setDraft(null)} />
        </SheetContent>
      </Sheet>
      <Sheet open={!!addItems} onOpenChange={open => { if (!open) setAddItems(null); }}>
        <SheetContent side="bottom" dir={ar ? 'rtl' : 'ltr'} className={sheetClass}>
          <SheetTitle className="mb-4 text-center text-base">{ar ? 'إضافة إلى أذكاري' : 'Add to my azkar'}</SheetTitle>
          <SheetDescription className="sr-only">{ar ? 'اختر مجموعة' : 'Choose a set'}</SheetDescription>
          {addItems && (
            <AddToAzkarList items={addItems} onClose={() => setAddItems(null)} onPickNew={() => openNewSet(addItems)} />
          )}
        </SheetContent>
      </Sheet>
    </CustomAzkarContext.Provider>
  );
}

export { SetIcon };
