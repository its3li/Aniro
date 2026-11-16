'use client';

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/**
 * Backup / restore of everything the user saved on this device:
 * localStorage (settings, reading position, azkar progress, tasbeeh, share design…)
 * and Capacitor Preferences (custom azkar sets).
 */
export interface AniroBackup {
  app: 'aniro';
  format: 1;
  createdAt: string;
  localStorage: Record<string, string>;
  preferences: Record<string, string>;
}

// Caches that are rebuilt automatically and would only bloat the file.
const SKIP_LOCAL = [/^CapacitorStorage\./, /^quran_cache/i, /^surah_data_/i, /search[-_]?index/i];

export async function createBackup(): Promise<AniroBackup> {
  const local: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SKIP_LOCAL.some(rx => rx.test(key))) continue;
    const value = localStorage.getItem(key);
    if (value !== null) local[key] = value;
  }
  const preferences: Record<string, string> = {};
  const { keys } = await Preferences.keys();
  for (const key of keys) {
    const { value } = await Preferences.get({ key });
    if (value !== null) preferences[key] = value;
  }
  return { app: 'aniro', format: 1, createdAt: new Date().toISOString(), localStorage: local, preferences };
}

function backupFileName() {
  return `aniro-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

/** Saves the backup file: share sheet on Android (save to Files/Drive/WhatsApp…), download on web. */
export async function exportBackup(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const json = JSON.stringify(await createBackup());
  const name = backupFileName();
  if (Capacitor.isNativePlatform()) {
    const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ]);
    const { uri } = await Filesystem.writeFile({ path: `backup/${name}`, data: json, directory: Directory.Cache, encoding: Encoding.UTF8, recursive: true });
    try {
      await Share.share({ files: [uri], dialogTitle: 'Aniro backup' });
      return 'shared';
    } catch (error) {
      if (/cancel/i.test(String(error))) return 'cancelled';
      throw error;
    }
  }
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export function parseBackup(text: string): AniroBackup {
  const data = JSON.parse(text) as Partial<AniroBackup>;
  if (data?.app !== 'aniro' || data.format !== 1 || typeof data.localStorage !== 'object' || typeof data.preferences !== 'object') {
    throw new Error('Not an Aniro backup file');
  }
  return data as AniroBackup;
}

/** Writes a backup back. Existing keys are overwritten; others are kept. Reload afterwards. */
export async function restoreBackup(backup: AniroBackup): Promise<number> {
  let count = 0;
  for (const [key, value] of Object.entries(backup.localStorage)) {
    if (typeof value !== 'string') continue;
    localStorage.setItem(key, value);
    count++;
  }
  for (const [key, value] of Object.entries(backup.preferences)) {
    if (typeof value !== 'string') continue;
    await Preferences.set({ key, value });
    count++;
  }
  return count;
}
