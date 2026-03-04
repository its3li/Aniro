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

export function parseTajweed(text: string, lang: "ar" | "en" = "en"): string {
  if (!text) return "";

  const cacheKey = `${text}_${lang}`;
  const cached = tajweedCache.get(cacheKey);
  if (cached) return cached;

  // Regex to find patterns like [h:1[ٱ]] or [l[ل]].
  const regex = /\[([a-z])(?::(\d+))?\[(.*?)\]/g;

  const result = text.replace(regex, (match, identifier, id, content) => {
    const rule = tajweedRulesMap[identifier as keyof typeof tajweedRulesMap];
    if (rule) {
      const idAttribute = id ? ` data-tajweed=":${id}"` : "";
      const description = lang === "ar" ? rule.descriptionAr : rule.description;
      // Use ZWJ (Zero Width Joiner) to help maintain Arabic ligatures across tags
      // \u200D is the ZWJ character
      return `<tajweed class="${rule.className}" data-type="${rule.type}" data-description="${description}"${idAttribute}>\u200D${content}\u200D</tajweed>`;
    }
    return match;
  });

  // LRU eviction
  if (tajweedCache.size >= TAJWEED_CACHE_MAX) {
    const oldest = tajweedCache.keys().next().value;
    if (oldest) tajweedCache.delete(oldest);
  }
  tajweedCache.set(cacheKey, result);

  return result;
}

export function stripTajweed(text: string): string {
  if (!text) return "";
  // This regex matches the tajweed tags and we replace the match with the content inside.
  // e.g., [h:1[ٱ]] becomes ٱ
  const regex = /\[([a-z])(?::(\d+))?\[(.*?)\]/g;
  return text.replace(regex, "$3");
}
