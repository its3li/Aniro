'use client';

import { useSyncExternalStore } from 'react';
import { Preferences } from '@capacitor/preferences';
import type { AzkarCategory, AzkarItem } from '@/lib/azkar';
import { sanitizeReminder, syncCustomSetReminders, type CustomSetReminder } from '@/lib/custom-azkar-reminders';

/** A user-made azkar set. `icon` is a category icon key, `color` a hex accent. */
export interface CustomAzkarSet {
  id: string;
  name: string;
  icon: string;
  color: string;
  items: AzkarItem[];
  reminder?: CustomSetReminder;
  createdAt: number;
  updatedAt: number;
}

export const CUSTOM_SET_PREFIX = 'custom:';
export const CUSTOM_SET_ICONS = ['Star', 'Sun', 'MoonStar', 'BookOpenText', 'PalmsUp', 'Flower2', 'ShieldCheck', 'Home', 'BedDouble', 'Car', 'Utensils', 'Droplets'];
export const CUSTOM_SET_COLORS = ['#f2a93b', '#e0745a', '#d9b25e', '#4fb39a', '#5b9bd5', '#9b7fd1', '#d46a9a', '#8c96a8'];

const STORAGE_KEY = 'aniro_custom_azkar_sets';

let sets: CustomAzkarSet[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const EMPTY: CustomAzkarSet[] = [];

function emit() {
  listeners.forEach(listener => listener());
}

function sanitize(raw: unknown): CustomAzkarSet[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((s): CustomAzkarSet[] => {
    if (!s || typeof s !== 'object' || typeof s.id !== 'string' || typeof s.name !== 'string') return [];
    const items = Array.isArray(s.items)
      ? s.items.filter((i: unknown): i is AzkarItem => !!i && typeof (i as AzkarItem).arabic === 'string')
        .map((i: AzkarItem) => ({
          arabic: i.arabic,
          translation: typeof i.translation === 'string' ? i.translation : '',
          repetitions: Number.isFinite(i.repetitions) && (i.repetitions ?? 0) > 0 ? Math.min(1000, Math.floor(i.repetitions!)) : 1,
          ...(typeof i.note === 'string' && i.note ? { note: i.note } : {}),
          ...(typeof i.source === 'string' && i.source ? { source: i.source } : {}),
        }))
      : [];
    return [{
      id: s.id,
      name: s.name,
      icon: CUSTOM_SET_ICONS.includes(s.icon) ? s.icon : 'Star',
      color: typeof s.color === 'string' && /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : CUSTOM_SET_COLORS[0],
      items,
      reminder: sanitizeReminder(s.reminder),
      createdAt: Number(s.createdAt) || Date.now(),
      updatedAt: Number(s.updatedAt) || Date.now(),
    }];
  });
}

export function loadCustomSets(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= Preferences.get({ key: STORAGE_KEY })
    .then(({ value }) => { sets = value ? sanitize(JSON.parse(value)) : []; })
    .catch(() => { sets = []; })
    .finally(() => {
      loaded = true;
      emit();
      // Re-apply reminders on start (e.g. after an app update cleared them).
      if (sets.some(set => set.reminder?.enabled)) syncReminders();
    });
  return loading;
}

function appLanguage(): string {
  try { return JSON.parse(localStorage.getItem('app-settings') ?? '{}').language ?? 'ar'; } catch { return 'ar'; }
}

function syncReminders() {
  void syncCustomSetReminders(sets, appLanguage()).catch(error => console.warn('[custom-azkar] reminders', error));
}

async function persist(next: CustomAzkarSet[]) {
  sets = next;
  emit();
  await Preferences.set({ key: STORAGE_KEY, value: JSON.stringify(next) });
  syncReminders();
}

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export async function saveCustomSet(set: Omit<CustomAzkarSet, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<CustomAzkarSet> {
  await loadCustomSets();
  const now = Date.now();
  const existing = set.id ? sets.find(s => s.id === set.id) : undefined;
  const saved: CustomAzkarSet = {
    ...set,
    id: existing?.id ?? newId(),
    name: set.name.trim(),
    items: set.items.filter(i => i.arabic.trim()),
    reminder: sanitizeReminder(set.reminder),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await persist(existing ? sets.map(s => (s.id === saved.id ? saved : s)) : [...sets, saved]);
  return saved;
}

export async function deleteCustomSet(id: string) {
  await loadCustomSets();
  await persist(sets.filter(s => s.id !== id));
}

export async function addItemsToCustomSet(id: string, items: AzkarItem[]) {
  await loadCustomSets();
  const set = sets.find(s => s.id === id);
  if (!set) throw new Error('Set not found');
  await saveCustomSet({ ...set, items: [...set.items, ...items] });
}

/** Live list of custom sets (empty until loaded). */
export function useCustomAzkarSets(): { sets: CustomAzkarSet[]; loaded: boolean } {
  const current = useSyncExternalStore(
    listener => {
      listeners.add(listener);
      void loadCustomSets();
      return () => listeners.delete(listener);
    },
    () => sets,
    () => EMPTY,
  );
  return { sets: current, loaded };
}

/** Lets custom sets reuse the regular azkar category screens. */
export function customSetToCategory(set: CustomAzkarSet): AzkarCategory {
  return { id: CUSTOM_SET_PREFIX + set.id, name: set.name, nameAr: set.name, icon: set.icon, color: set.color, items: set.items };
}
