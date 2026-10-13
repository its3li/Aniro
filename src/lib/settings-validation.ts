import { calculationMethods } from './prayer';

/** Recover invalid persisted values without allowing corrupt settings into native scheduling. */
export function normalizeSettings<T extends object>(defaults: T, value: unknown): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...defaults };
  const stored = value as Record<string, unknown>;
  const result = { ...defaults } as Record<string, unknown>;
  for (const [key, fallback] of Object.entries(defaults)) {
    const candidate = stored[key];
    if (typeof candidate === typeof fallback) result[key] = candidate;
  }
  const allowed: Record<string, readonly string[]> = {
    language: ['ar', 'en', 'ur', 'fa'],
    calculationMethod: Object.keys(calculationMethods),
    dstMode: ['auto', 'on', 'off'],
    azanMode: ['full', 'silent'],
    timeFormat: ['12h', '24h'],
    quranEdition: ['uthmani', 'warsh'],
    quranViewMode: ['list', 'page'],
    widgetTheme: ['default', 'system', 'custom'],
    appTheme: ['system', 'light', 'dark'],
  };
  for (const [key, options] of Object.entries(allowed)) {
    if (key in result && !options.includes(String(result[key]))) {
      result[key] = (defaults as Record<string, unknown>)[key];
    }
  }
  for (const [key, min, max] of [['fontSize', 12, 20], ['prayerOffset', -12, 12]] as const) {
    if (!(key in result)) continue;
    const number = result[key];
    if (typeof number !== 'number' || !Number.isFinite(number) || number < min || number > max) {
      result[key] = (defaults as Record<string, unknown>)[key];
    }
  }
  if ('widgetBackgroundColor' in result && !/^#[0-9a-f]{6}$/i.test(String(result.widgetBackgroundColor))) {
    result.widgetBackgroundColor = (defaults as Record<string, unknown>).widgetBackgroundColor;
  }
  return result as T;
}
