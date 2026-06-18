const TASHKEEL_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;

const ARABIC_NORMALIZATION_MAP: Record<string, string> = {
    آ: 'ا',
    أ: 'ا',
    إ: 'ا',
    ٱ: 'ا',
    ؤ: 'و',
    ئ: 'ي',
    ة: 'ه',
    ى: 'ي',
};

const TAJWEED_OPEN_TAG_REGEX = /\[[a-zA-Z](?::\d+)?\[/g;

export function stripTashkeel(text: string): string {
    return text.replace(TASHKEEL_REGEX, '');
}

export function normalizeArabic(text: string): string {
    if (!text) return '';

    let normalized = stripTashkeel(text);
    for (const [from, to] of Object.entries(ARABIC_NORMALIZATION_MAP)) {
        normalized = normalized.replace(new RegExp(from, 'g'), to);
    }

    return normalized.replace(/\s+/g, ' ').trim();
}

export function stripTajweedTags(text: string): string {
    if (!text) return '';

    return text
        .replace(/\uFEFF/g, '')
        .replace(TAJWEED_OPEN_TAG_REGEX, '')
        .replace(/\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function cleanSurahName(name: string): string {
    return stripTashkeel(name)
        .replace(/^سورة\s*/u, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function toArabicDigits(value: string): string {
    const digits = '٠١٢٣٤٥٦٧٨٩';
    return value.replace(/\d/g, digit => digits[Number(digit)] ?? digit);
}
