export const tajweedRulesMap = {
  h: {
    className: "ham_wasl",
    type: "hamza-wasl",
    description: "Hamzat ul Wasl",
    descriptionAr: "همزة وصل",
  },
  s: {
    className: "slnt",
    type: "silent",
    description: "Silent",
    descriptionAr: "حروف صامتة",
  },
  l: {
    className: "slnt",
    type: "laam-shamsiyah",
    description: "Lam Shamsiyyah",
    descriptionAr: "لام شمسية",
  },
  n: {
    className: "madda_normal",
    type: "madda-normal",
    description: "Normal Prolongation: 2 Vowels",
    descriptionAr: "مد طبيعي (حركتان)",
  },
  p: {
    className: "madda_permissible",
    type: "madda-permissible",
    description: "Permissible Prolongation: 2, 4, 6 Vowels",
    descriptionAr: "مد جائز (2، 4، 6 حركات)",
  },
  m: {
    className: "madda_necessary",
    type: "madda-necessary",
    description: "Necessary Prolongation: 6 Vowels",
    descriptionAr: "مد لازم (6 حركات)",
  },
  q: {
    className: "qlq",
    type: "qalaqah",
    description: "Qalaqah",
    descriptionAr: "قلقلة",
  },
  o: {
    className: "madda_obligatory",
    type: "madda-obligatory",
    description: "Obligatory Prolongation: 4-5 Vowels",
    descriptionAr: "مد واجب (4-5 حركات)",
  },
  c: {
    className: "ikhf_shfw",
    type: "ikhafa-shafawi",
    description: "Ikhafa' Shafawi - With Meem",
    descriptionAr: "إخفاء شفوي",
  },
  f: {
    className: "ikhf",
    type: "ikhafa",
    description: "Ikhafa'",
    descriptionAr: "إخفاء",
  },
  w: {
    className: "idghm_shfw",
    type: "idgham-shafawi",
    description: "Idgham Shafawi - With Meem",
    descriptionAr: "إدغام شفوي",
  },
  i: {
    className: "iqlb",
    type: "iqlab",
    description: "Iqlab",
    descriptionAr: "إقلاب",
  },
  a: {
    className: "idgh_ghn",
    type: "idgham-with-ghunnah",
    description: "Idgham - With Ghunnah",
    descriptionAr: "إدغام بغنة",
  },
  u: {
    className: "idgh_w_ghn",
    type: "idgham-without-ghunnah",
    description: "Idgham - Without Ghunnah",
    descriptionAr: "إدغام بغير غنة",
  },
  d: {
    className: "idgh_mus",
    type: "idgham-mutajanisayn",
    description: "Idgham - Mutajanisayn",
    descriptionAr: "إدغام متجانسين",
  },
  b: {
    className: "idgh_mut",
    type: "idgham-mutaqaribayn",
    description: "Idgham - Mutaqaribayn",
    descriptionAr: "إدغام متقاربين",
  },
  g: {
    className: "ghn",
    type: "ghunnah",
    description: "Ghunnah: 2 Vowels",
    descriptionAr: "غنة (حركتان)",
  },
};

// Memoization cache for parsed tajweed — avoids re-running regex on same text
const tajweedCache = new Map<string, string>();
const TAJWEED_CACHE_MAX = 500;
const TAJWEED_RENDER_CACHE_VERSION = "tajweed-render-v4";
const ARABIC_MARKS_REGEX = /[\u064B-\u065F\u0670\u06D6-\u06ED]/;
const ARABIC_BASE_REGEX = /[\u0621-\u064A\u066E-\u06D3\u06FA-\u06FF]/;
const TARGET_SIDE_RULE_KEYS = new Set<keyof typeof tajweedRulesMap>(["a", "b", "d", "u", "w"]);
const SOURCE_SIDE_RULE_KEYS = new Set<keyof typeof tajweedRulesMap>(["c", "f", "i"]);

export interface TajweedRange {
  start: number;
  end: number;
  className: string;
  type: string;
  description: string;
  ruleKey: keyof typeof tajweedRulesMap;
  id?: string;
}

export interface TajweedParseResult {
  text: string;
  ranges: TajweedRange[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function readTagStart(text: string, index: number) {
  if (text[index] !== "[") return null;

  const ruleKey = text[index + 1] as keyof typeof tajweedRulesMap;
  if (!/^[a-z]$/.test(ruleKey)) return null;

  let cursor = index + 2;
  let id: string | undefined;

  if (text[cursor] === ":") {
    const idStart = ++cursor;
    while (cursor < text.length && /\d/.test(text[cursor])) cursor++;
    if (cursor === idStart) return null;
    id = text.slice(idStart, cursor);
  }

  if (text[cursor] !== "[") return null;

  return {
    ruleKey,
    id,
    contentStart: cursor + 1,
  };
}

function parseTajweedChunk(
  text: string,
  lang: "ar" | "en",
  startIndex: number,
  stopAtClose: boolean
): { text: string; ranges: TajweedRange[]; index: number; closed: boolean } {
  let index = startIndex;
  let plainText = "";
  const ranges: TajweedRange[] = [];

  while (index < text.length) {
    const char = text[index];

    if (stopAtClose && char === "]") {
      return { text: plainText, ranges, index: index + 1, closed: true };
    }

    if (char === "[") {
      const tag = readTagStart(text, index);
      const rule = tag ? tajweedRulesMap[tag.ruleKey] : null;

      if (tag && rule) {
        const rangeStart = plainText.length;
        const inner = parseTajweedChunk(text, lang, tag.contentStart, true);

        if (inner.closed) {
          plainText += inner.text;
          ranges.push(
            ...inner.ranges.map((range) => ({
              ...range,
              start: range.start + rangeStart,
              end: range.end + rangeStart,
            }))
          );

          const colorSlice = getRuleColorSlice(tag.ruleKey, inner.text);

          if (colorSlice.start < colorSlice.end) {
            ranges.push({
              start: rangeStart + colorSlice.start,
              end: rangeStart + colorSlice.end,
              className: rule.className,
              type: rule.type,
              description: lang === "ar" ? rule.descriptionAr : rule.description,
              ruleKey: tag.ruleKey,
              id: tag.id,
            });
          }

          index = inner.index;
          if (text[index] === "]") {
            index++;
          }
          continue;
        }
      }
    }

    plainText += char;
    index++;
  }

  return { text: plainText, ranges, index, closed: !stopAtClose };
}

function isArabicMark(char: string) {
  return ARABIC_MARKS_REGEX.test(char);
}

function isArabicBase(char: string) {
  return ARABIC_BASE_REGEX.test(char) && !isArabicMark(char) && char !== "\u0640";
}

function getLastArabicClusterSlice(value: string) {
  return getArabicClusters(value).at(-1) ?? { start: 0, end: value.length };
}

function getArabicClusters(value: string) {
  const clusters: Array<{ start: number; end: number }> = [];
  let index = 0;

  while (index < value.length) {
    if (!isArabicBase(value[index])) {
      index++;
      continue;
    }

    let end = index + 1;
    while (end < value.length && isArabicMark(value[end])) {
      end++;
    }

    clusters.push({ start: index, end });
    index = end;
  }

  return clusters;
}

function getSourceSideRuleSlice(value: string) {
  const whitespaceIndex = value.search(/\s/);
  const sourceEnd = whitespaceIndex === -1 ? value.length : whitespaceIndex;
  const sourceClusters = getArabicClusters(value).filter((cluster) => cluster.start < sourceEnd);

  if (sourceClusters.length > 0) {
    return whitespaceIndex === -1 ? sourceClusters[0] : sourceClusters.at(-1)!;
  }

  return sourceEnd > 0 ? { start: 0, end: sourceEnd } : { start: 0, end: 0 };
}

function getRuleColorSlice(ruleKey: keyof typeof tajweedRulesMap, value: string) {
  if (TARGET_SIDE_RULE_KEYS.has(ruleKey)) {
    return getLastArabicClusterSlice(value);
  }

  if (SOURCE_SIDE_RULE_KEYS.has(ruleKey)) {
    return getSourceSideRuleSlice(value);
  }

  return { start: 0, end: value.length };
}

export function parseTajweedMarkup(
  text: string,
  lang: "ar" | "en" = "en"
): TajweedParseResult {
  if (!text) return { text: "", ranges: [] };

  const parsed = parseTajweedChunk(text, lang, 0, false);

  return {
    text: parsed.text,
    ranges: parsed.ranges.sort((a, b) => a.start - b.start || b.end - a.end),
  };
}

function renderTajweedHtml(text: string, lang: "ar" | "en"): string {
  const parsed = parseTajweedMarkup(text, lang);
  const rangesByOffset = new Array<TajweedRange | null>(parsed.text.length).fill(null);

  for (const range of parsed.ranges) {
    for (let offset = range.start; offset < range.end; offset++) {
      rangesByOffset[offset] = range;
    }
  }

  let html = "";
  let offset = 0;

  while (offset < parsed.text.length) {
    const range = rangesByOffset[offset];
    let end = offset + 1;

    while (end < parsed.text.length && rangesByOffset[end] === range) {
      end++;
    }

    const content = escapeHtml(parsed.text.slice(offset, end));

    if (range) {
      const idAttribute = range.id ? ` data-tajweed=":${escapeHtml(range.id)}"` : "";
      html += `<span class="tajweed ${range.className}" lang="ar" data-type="${range.type}" data-description="${escapeHtml(range.description)}"${idAttribute}>${content}</span>`;
    } else {
      html += content;
    }

    offset = end;
  }

  return html;
}

export function parseTajweed(text: string, lang: "ar" | "en" = "en"): string {
  if (!text) return "";

  const cacheKey = `${TAJWEED_RENDER_CACHE_VERSION}_${lang}_${text}`;
  const cached = tajweedCache.get(cacheKey);
  if (cached) return cached;

  const renderedResult = renderTajweedHtml(text, lang);

  if (tajweedCache.size >= TAJWEED_CACHE_MAX) {
    const oldest = tajweedCache.keys().next().value;
    if (typeof oldest === "string") tajweedCache.delete(String(oldest));
  }
  tajweedCache.set(cacheKey, renderedResult);

  return renderedResult;
}

export function stripTajweed(text: string): string {
  if (!text) return "";
  return parseTajweedMarkup(text).text;
}
