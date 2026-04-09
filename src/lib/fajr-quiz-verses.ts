/**
 * Curated short Quranic verses for the Fajr alarm quiz.
 * Each verse is short (3-8 words) and well-known, making it
 * challenging but fair for someone who just woke up.
 */

export interface QuizVerse {
  /** Surah number */
  surah: number;
  /** Ayah number in surah */
  ayah: number;
  /** Surah name in Arabic */
  surahName: string;
  /** Clean Arabic text (no tajweed tags) */
  text: string;
  /** Words split by whitespace */
  words: string[];
  /** Indices of words that are safe to remove for the quiz */
  removableIndices: number[];
}

/**
 * Pool of short, well-known Quranic verses.
 * Selected from Juz Amma and commonly memorized surahs.
 */
export const quizVerses: QuizVerse[] = [
  // === Al-Fatiha (1) ===
  {
    surah: 1, ayah: 2, surahName: 'الفاتحة',
    text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ',
    words: ['ٱلْحَمْدُ', 'لِلَّهِ', 'رَبِّ', 'ٱلْعَٰلَمِينَ'],
    removableIndices: [0, 2, 3],
  },
  {
    surah: 1, ayah: 3, surahName: 'الفاتحة',
    text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
    words: ['ٱلرَّحْمَٰنِ', 'ٱلرَّحِيمِ'],
    removableIndices: [0, 1],
  },
  {
    surah: 1, ayah: 4, surahName: 'الفاتحة',
    text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
    words: ['مَٰلِكِ', 'يَوْمِ', 'ٱلدِّينِ'],
    removableIndices: [0, 1, 2],
  },
  {
    surah: 1, ayah: 5, surahName: 'الفاتحة',
    text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    words: ['إِيَّاكَ', 'نَعْبُدُ', 'وَإِيَّاكَ', 'نَسْتَعِينُ'],
    removableIndices: [1, 3],
  },

  // === Al-Ikhlas (112) ===
  {
    surah: 112, ayah: 1, surahName: 'الإخلاص',
    text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
    words: ['قُلْ', 'هُوَ', 'ٱللَّهُ', 'أَحَدٌ'],
    removableIndices: [0, 3],
  },
  {
    surah: 112, ayah: 2, surahName: 'الإخلاص',
    text: 'ٱللَّهُ ٱلصَّمَدُ',
    words: ['ٱللَّهُ', 'ٱلصَّمَدُ'],
    removableIndices: [1],
  },
  {
    surah: 112, ayah: 3, surahName: 'الإخلاص',
    text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
    words: ['لَمْ', 'يَلِدْ', 'وَلَمْ', 'يُولَدْ'],
    removableIndices: [1, 3],
  },

  // === Al-Falaq (113) ===
  {
    surah: 113, ayah: 1, surahName: 'الفلق',
    text: 'قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ',
    words: ['قُلْ', 'أَعُوذُ', 'بِرَبِّ', 'ٱلْفَلَقِ'],
    removableIndices: [1, 3],
  },
  {
    surah: 113, ayah: 3, surahName: 'الفلق',
    text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ',
    words: ['وَمِن', 'شَرِّ', 'غَاسِقٍ', 'إِذَا', 'وَقَبَ'],
    removableIndices: [2, 4],
  },

  // === An-Nas (114) ===
  {
    surah: 114, ayah: 1, surahName: 'الناس',
    text: 'قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ',
    words: ['قُلْ', 'أَعُوذُ', 'بِرَبِّ', 'ٱلنَّاسِ'],
    removableIndices: [1, 3],
  },
  {
    surah: 114, ayah: 2, surahName: 'الناس',
    text: 'مَلِكِ ٱلنَّاسِ',
    words: ['مَلِكِ', 'ٱلنَّاسِ'],
    removableIndices: [0],
  },
  {
    surah: 114, ayah: 3, surahName: 'الناس',
    text: 'إِلَٰهِ ٱلنَّاسِ',
    words: ['إِلَٰهِ', 'ٱلنَّاسِ'],
    removableIndices: [0],
  },

  // === Al-Kawthar (108) ===
  {
    surah: 108, ayah: 1, surahName: 'الكوثر',
    text: 'إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ',
    words: ['إِنَّآ', 'أَعْطَيْنَٰكَ', 'ٱلْكَوْثَرَ'],
    removableIndices: [1, 2],
  },
  {
    surah: 108, ayah: 2, surahName: 'الكوثر',
    text: 'فَصَلِّ لِرَبِّكَ وَٱنْحَرْ',
    words: ['فَصَلِّ', 'لِرَبِّكَ', 'وَٱنْحَرْ'],
    removableIndices: [0, 2],
  },

  // === Al-Asr (103) ===
  {
    surah: 103, ayah: 1, surahName: 'العصر',
    text: 'وَٱلْعَصْرِ',
    words: ['وَٱلْعَصْرِ'],
    removableIndices: [0],
  },
  {
    surah: 103, ayah: 2, surahName: 'العصر',
    text: 'إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ',
    words: ['إِنَّ', 'ٱلْإِنسَٰنَ', 'لَفِى', 'خُسْرٍ'],
    removableIndices: [1, 3],
  },

  // === Al-Masad (111) ===
  {
    surah: 111, ayah: 1, surahName: 'المسد',
    text: 'تَبَّتْ يَدَآ أَبِى لَهَبٍ وَتَبَّ',
    words: ['تَبَّتْ', 'يَدَآ', 'أَبِى', 'لَهَبٍ', 'وَتَبَّ'],
    removableIndices: [0, 3, 4],
  },

  // === An-Nasr (110) ===
  {
    surah: 110, ayah: 1, surahName: 'النصر',
    text: 'إِذَا جَآءَ نَصْرُ ٱللَّهِ وَٱلْفَتْحُ',
    words: ['إِذَا', 'جَآءَ', 'نَصْرُ', 'ٱللَّهِ', 'وَٱلْفَتْحُ'],
    removableIndices: [2, 4],
  },

  // === Al-Kafiroon (109) ===
  {
    surah: 109, ayah: 1, surahName: 'الكافرون',
    text: 'قُلْ يَٰٓأَيُّهَا ٱلْكَٰفِرُونَ',
    words: ['قُلْ', 'يَٰٓأَيُّهَا', 'ٱلْكَٰفِرُونَ'],
    removableIndices: [2],
  },
  {
    surah: 109, ayah: 6, surahName: 'الكافرون',
    text: 'لَكُمْ دِينُكُمْ وَلِىَ دِينِ',
    words: ['لَكُمْ', 'دِينُكُمْ', 'وَلِىَ', 'دِينِ'],
    removableIndices: [1, 3],
  },

  // === Al-Fil (105) ===
  {
    surah: 105, ayah: 1, surahName: 'الفيل',
    text: 'أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَٰبِ ٱلْفِيلِ',
    words: ['أَلَمْ', 'تَرَ', 'كَيْفَ', 'فَعَلَ', 'رَبُّكَ', 'بِأَصْحَٰبِ', 'ٱلْفِيلِ'],
    removableIndices: [4, 6],
  },

  // === Quraysh (106) ===
  {
    surah: 106, ayah: 1, surahName: 'قريش',
    text: 'لِإِيلَٰفِ قُرَيْشٍ',
    words: ['لِإِيلَٰفِ', 'قُرَيْشٍ'],
    removableIndices: [1],
  },

  // === Al-Maun (107) ===
  {
    surah: 107, ayah: 1, surahName: 'الماعون',
    text: 'أَرَءَيْتَ ٱلَّذِى يُكَذِّبُ بِٱلدِّينِ',
    words: ['أَرَءَيْتَ', 'ٱلَّذِى', 'يُكَذِّبُ', 'بِٱلدِّينِ'],
    removableIndices: [2, 3],
  },

  // === At-Takathur (102) ===
  {
    surah: 102, ayah: 1, surahName: 'التكاثر',
    text: 'أَلْهَىٰكُمُ ٱلتَّكَاثُرُ',
    words: ['أَلْهَىٰكُمُ', 'ٱلتَّكَاثُرُ'],
    removableIndices: [1],
  },

  // === Al-Qariah (101) ===
  {
    surah: 101, ayah: 1, surahName: 'القارعة',
    text: 'ٱلْقَارِعَةُ',
    words: ['ٱلْقَارِعَةُ'],
    removableIndices: [0],
  },
  {
    surah: 101, ayah: 2, surahName: 'القارعة',
    text: 'مَا ٱلْقَارِعَةُ',
    words: ['مَا', 'ٱلْقَارِعَةُ'],
    removableIndices: [1],
  },

  // === Az-Zalzalah (99) ===
  {
    surah: 99, ayah: 1, surahName: 'الزلزلة',
    text: 'إِذَا زُلْزِلَتِ ٱلْأَرْضُ زِلْزَالَهَا',
    words: ['إِذَا', 'زُلْزِلَتِ', 'ٱلْأَرْضُ', 'زِلْزَالَهَا'],
    removableIndices: [2, 3],
  },

  // === Ad-Duha (93) ===
  {
    surah: 93, ayah: 1, surahName: 'الضحى',
    text: 'وَٱلضُّحَىٰ',
    words: ['وَٱلضُّحَىٰ'],
    removableIndices: [0],
  },
  {
    surah: 93, ayah: 3, surahName: 'الضحى',
    text: 'مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ',
    words: ['مَا', 'وَدَّعَكَ', 'رَبُّكَ', 'وَمَا', 'قَلَىٰ'],
    removableIndices: [1, 4],
  },
];

/**
 * Collect all unique words from the verse pool to use as distractors.
 */
const allWords: string[] = (() => {
  const set = new Set<string>();
  for (const v of quizVerses) {
    for (const w of v.words) {
      set.add(w);
    }
  }
  return Array.from(set);
})();

/**
 * Generate a quiz question: picks a random verse, removes one word,
 * and provides 4 choices (1 correct + 3 wrong).
 */
export function generateQuizQuestion(): {
  verse: QuizVerse;
  missingIndex: number;
  correctWord: string;
  choices: string[];
  displayWords: string[];
} {
  // Pick a random verse
  const verse = quizVerses[Math.floor(Math.random() * quizVerses.length)];
  
  // Pick a random removable word
  const missingIndex = verse.removableIndices[
    Math.floor(Math.random() * verse.removableIndices.length)
  ];
  const correctWord = verse.words[missingIndex];

  // Build display words with blank
  const displayWords = verse.words.map((w, i) => (i === missingIndex ? '______' : w));

  // Pick 3 wrong words (different from correct)
  const wrongWords: string[] = [];
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  for (const w of shuffled) {
    if (w !== correctWord && wrongWords.length < 3) {
      wrongWords.push(w);
    }
  }

  // Combine and shuffle choices
  const choices = [correctWord, ...wrongWords].sort(() => Math.random() - 0.5);

  return { verse, missingIndex, correctWord, choices, displayWords };
}
