import type { AzkarItem } from '@/lib/azkar';

const arDigits = (n: number) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);

export function repeatText(n: number | undefined, ar: boolean): string {
  if (!n || n <= 1) return '';
  if (!ar) return `(${n} times)`;
  if (n === 2) return '(مرّتان)';
  return n <= 10 ? `(${arDigits(n)} مرات)` : `(${arDigits(n)} مرة)`;
}

const SEPARATOR = '━━━━━━━━━━';

/**
 * Plain text for a list of azkar: title, then each zikr with its repeat count,
 * note and (for non-Arabic UI) translation, separated by a line.
 */
export function azkarShareText(items: AzkarItem[], title: string, ar: boolean): string {
  const blocks = items.map((item, i) => {
    const lines = [
      items.length > 1 ? `${ar ? arDigits(i + 1) : i + 1}.` : '',
      item.arabic.trim(),
      repeatText(item.repetitions, ar),
      item.source ?? '',
      item.note ? `⚠ ${item.note}` : '',
      !ar && item.translation ? item.translation.trim() : '',
    ];
    return lines.filter(Boolean).join('\n');
  });
  return [`〔 ${title} 〕`, blocks.join(`\n\n${SEPARATOR}\n\n`), ar ? '— من تطبيق أنيرو' : '— from the Aniro app']
    .join('\n\n');
}
