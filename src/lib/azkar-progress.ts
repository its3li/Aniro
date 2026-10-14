export function localDayKey(date = new Date()): string {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

export function readAzkarProgress(raw: string | null, day: string, repetitions: number): number {
  const total = Math.max(0, Math.trunc(repetitions));
  if (!raw) return total;
  try {
    const value: unknown = JSON.parse(raw);
    // Old undated counts cannot be attributed to today's reading.
    if (!value || typeof value !== 'object' || !('day' in value) || !('remaining' in value)) return total;
    const entry = value as { day: unknown; remaining: unknown };
    if (entry.day !== day || typeof entry.remaining !== 'number' || !Number.isInteger(entry.remaining)) return total;
    return entry.remaining >= 0 && entry.remaining <= total ? entry.remaining : total;
  } catch {
    return total;
  }
}
