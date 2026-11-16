'use client';

import { Capacitor } from '@capacitor/core';
import type { CustomAzkarSet } from '@/lib/custom-azkar';

/** Daily reminder for a custom set. `days` uses JS weekdays (0 = Sunday); empty = every day. */
export interface CustomSetReminder {
  enabled: boolean;
  times: string[]; // "HH:MM", at most MAX_REMINDER_TIMES
  days: number[];
}

export const MAX_REMINDER_TIMES = 3;
export const DEFAULT_REMINDER: CustomSetReminder = { enabled: false, times: ['08:00'], days: [] };

// Own id block so cancelling never touches prayer / Kahf notifications.
const BASE_ID = 70_000_000;
const SLOT_SIZE = 32; // 3 times × 8 day slots
const SLOTS = 100_000;

function slotOf(setId: string) {
  let hash = 0;
  for (let i = 0; i < setId.length; i++) hash = (hash * 31 + setId.charCodeAt(i)) >>> 0;
  return hash % SLOTS;
}

export function parseTime(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour < 24 && minute < 60 ? { hour, minute } : null;
}

export function sanitizeReminder(raw: unknown): CustomSetReminder | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const r = raw as Partial<CustomSetReminder>;
  const times = Array.isArray(r.times) ? r.times.filter(t => typeof t === 'string' && parseTime(t)).slice(0, MAX_REMINDER_TIMES) : [];
  const days = Array.isArray(r.days) ? [...new Set(r.days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort() : [];
  return { enabled: !!r.enabled && times.length > 0, times: times.length ? times : DEFAULT_REMINDER.times, days: days.length === 7 ? [] : days };
}

/** Asks for notification permission; returns whether reminders can be shown. */
export async function ensureReminderPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') return true;
  const requested = await LocalNotifications.requestPermissions();
  return requested.display === 'granted';
}

/** Replaces all scheduled custom-set reminders with the ones in `sets`. Native only. */
export async function syncCustomSetReminders(sets: CustomAzkarSet[], language: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { LocalNotifications } = await import('@capacitor/local-notifications');

  const pending = await LocalNotifications.getPending().catch(() => ({ notifications: [] }));
  const ours = pending.notifications.filter(n => n.id >= BASE_ID && n.id < BASE_ID + SLOTS * SLOT_SIZE);
  if (ours.length) await LocalNotifications.cancel({ notifications: ours.map(n => ({ id: n.id })) }).catch(() => undefined);

  const ar = language === 'ar';
  const notifications = sets.flatMap(set => {
    const reminder = set.reminder;
    if (!reminder?.enabled) return [];
    const base = BASE_ID + slotOf(set.id) * SLOT_SIZE;
    return reminder.times.slice(0, MAX_REMINDER_TIMES).flatMap((time, timeIndex) => {
      const parsed = parseTime(time);
      if (!parsed) return [];
      // Capacitor weekdays: 1 = Sunday … 7 = Saturday.
      const days: (number | null)[] = reminder.days.length ? reminder.days : [null];
      return days.map(day => ({
        id: base + timeIndex * 8 + (day === null ? 7 : day),
        title: set.name,
        body: ar ? `حان وقت أذكارك: ${set.name}` : `Time for your azkar: ${set.name}`,
        schedule: {
          on: day === null ? { ...parsed } : { weekday: day + 1, ...parsed },
          allowWhileIdle: true,
        },
        extra: { route: `/azkar?category=custom:${set.id}` },
      }));
    });
  });

  if (notifications.length) await LocalNotifications.schedule({ notifications });
}
