/**
 * Curated short Quranic verses for the Fajr wake-up challenge.
 */

export interface QuizVerse {
  surah: number;
  ayah: number;
  surahName: string;
  text: string;
  words: string[];
  removableIndices: number[];
}

function verse(
  surah: number,
  ayah: number,
  surahName: string,
  words: string[],
  removableIndices: number[]
): QuizVerse {
  return {
    surah,
    ayah,
    surahName,
    text: words.join(' '),
    words,
    removableIndices,
  };
}

const surah = {
  fatiha: '\u0627\u0644\u0641\u0627\u062a\u062d\u0629',
  ikhlas: '\u0627\u0644\u0625\u062e\u0644\u0627\u0635',
  falaq: '\u0627\u0644\u0641\u0644\u0642',
  nas: '\u0627\u0644\u0646\u0627\u0633',
  kawthar: '\u0627\u0644\u0643\u0648\u062b\u0631',
  asr: '\u0627\u0644\u0639\u0635\u0631',
  nasr: '\u0627\u0644\u0646\u0635\u0631',
  duha: '\u0627\u0644\u0636\u062d\u0649',
};

const word = {
  alhamdu: '\u0627\u0644\u0652\u062d\u064e\u0645\u0652\u062f\u064f',
  lillahi: '\u0644\u0650\u0644\u0651\u064e\u0647\u0650',
  rabbi: '\u0631\u064e\u0628\u0651\u0650',
  alalamin: '\u0627\u0644\u0652\u0639\u064e\u0627\u0644\u064e\u0645\u0650\u064a\u0646\u064e',
  arrahman: '\u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650',
  arrahim: '\u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650',
  maliki: '\u0645\u064e\u0627\u0644\u0650\u0643\u0650',
  yawmi: '\u064a\u064e\u0648\u0652\u0645\u0650',
  addin: '\u0627\u0644\u062f\u0651\u0650\u064a\u0646\u0650',
  iyyaka: '\u0625\u0650\u064a\u0651\u064e\u0627\u0643\u064e',
  nabudu: '\u0646\u064e\u0639\u0652\u0628\u064f\u062f\u064f',
  waiyyaka: '\u0648\u064e\u0625\u0650\u064a\u0651\u064e\u0627\u0643\u064e',
  nastaeen: '\u0646\u064e\u0633\u0652\u062a\u064e\u0639\u0650\u064a\u0646\u064f',
  qul: '\u0642\u064f\u0644\u0652',
  huwa: '\u0647\u064f\u0648\u064e',
  allahu: '\u0627\u0644\u0644\u0651\u064e\u0647\u064f',
  allahi: '\u0627\u0644\u0644\u0651\u064e\u0647\u0650',
  ahad: '\u0623\u064e\u062d\u064e\u062f\u064c',
  assamad: '\u0627\u0644\u0635\u0651\u064e\u0645\u064e\u062f\u064f',
  lam: '\u0644\u064e\u0645\u0652',
  yalid: '\u064a\u064e\u0644\u0650\u062f\u0652',
  walam: '\u0648\u064e\u0644\u064e\u0645\u0652',
  yulad: '\u064a\u064f\u0648\u0644\u064e\u062f\u0652',
  yakun: '\u064a\u064e\u0643\u064f\u0646',
  lahu: '\u0644\u0651\u064e\u0647\u064f',
  kufuwan: '\u0643\u064f\u0641\u064f\u0648\u064b\u0627',
  aoodhu: '\u0623\u064e\u0639\u064f\u0648\u0630\u064f',
  birabbi: '\u0628\u0650\u0631\u064e\u0628\u0651\u0650',
  alfalaq: '\u0627\u0644\u0652\u0641\u064e\u0644\u064e\u0642\u0650',
  min: '\u0645\u0650\u0646',
  sharri: '\u0634\u064e\u0631\u0651\u0650',
  ma: '\u0645\u064e\u0627',
  khalaq: '\u062e\u064e\u0644\u064e\u0642\u064e',
  wamin: '\u0648\u064e\u0645\u0650\u0646',
  ghasiq: '\u063a\u064e\u0627\u0633\u0650\u0642\u064d',
  idha: '\u0625\u0650\u0630\u064e\u0627',
  waqab: '\u0648\u064e\u0642\u064e\u0628\u064e',
  annas: '\u0627\u0644\u0646\u0651\u064e\u0627\u0633\u0650',
  malik: '\u0645\u064e\u0644\u0650\u0643\u0650',
  ilahi: '\u0625\u0650\u0644\u064e\u0670\u0647\u0650',
  alwaswas: '\u0627\u0644\u0652\u0648\u064e\u0633\u0652\u0648\u064e\u0627\u0633\u0650',
  alkhannas: '\u0627\u0644\u0652\u062e\u064e\u0646\u0651\u064e\u0627\u0633\u0650',
  inna: '\u0625\u0650\u0646\u0651\u064e\u0627',
  innaShort: '\u0625\u0650\u0646\u0651\u064e',
  aatayna: '\u0623\u064e\u0639\u0652\u0637\u064e\u064a\u0652\u0646\u064e\u0627\u0643\u064e',
  alkawthar: '\u0627\u0644\u0652\u0643\u064e\u0648\u0652\u062b\u064e\u0631\u064e',
  fasalli: '\u0641\u064e\u0635\u064e\u0644\u0651\u0650',
  lirabbika: '\u0644\u0650\u0631\u064e\u0628\u0651\u0650\u0643\u064e',
  wanhar: '\u0648\u064e\u0627\u0646\u0652\u062d\u064e\u0631\u0652',
  walasr: '\u0648\u064e\u0627\u0644\u0652\u0639\u064e\u0635\u0652\u0631\u0650',
  alinsana: '\u0627\u0644\u0652\u0625\u0650\u0646\u0633\u064e\u0627\u0646\u064e',
  lafi: '\u0644\u064e\u0641\u0650\u064a',
  khusr: '\u062e\u064f\u0633\u0652\u0631\u064d',
  jaa: '\u062c\u064e\u0627\u0621\u064e',
  nasru: '\u0646\u064e\u0635\u0652\u0631\u064f',
  walfath: '\u0648\u064e\u0627\u0644\u0652\u0641\u064e\u062a\u0652\u062d\u064f',
  wadduha: '\u0648\u064e\u0627\u0644\u0636\u0651\u064f\u062d\u064e\u0649',
  wallayli: '\u0648\u064e\u0627\u0644\u0644\u0651\u064e\u064a\u0652\u0644\u0650',
  saja: '\u0633\u064e\u062c\u064e\u0649',
};

export const quizVerses: QuizVerse[] = [
  verse(1, 2, surah.fatiha, [word.alhamdu, word.lillahi, word.rabbi, word.alalamin], [0, 2, 3]),
  verse(1, 3, surah.fatiha, [word.arrahman, word.arrahim], [0, 1]),
  verse(1, 4, surah.fatiha, [word.maliki, word.yawmi, word.addin], [0, 1, 2]),
  verse(1, 5, surah.fatiha, [word.iyyaka, word.nabudu, word.waiyyaka, word.nastaeen], [1, 3]),
  verse(112, 1, surah.ikhlas, [word.qul, word.huwa, word.allahu, word.ahad], [0, 2, 3]),
  verse(112, 2, surah.ikhlas, [word.allahu, word.assamad], [0, 1]),
  verse(112, 3, surah.ikhlas, [word.lam, word.yalid, word.walam, word.yulad], [1, 3]),
  verse(112, 4, surah.ikhlas, [word.walam, word.yakun, word.lahu, word.kufuwan, word.ahad], [1, 3, 4]),
  verse(113, 1, surah.falaq, [word.qul, word.aoodhu, word.birabbi, word.alfalaq], [1, 3]),
  verse(113, 2, surah.falaq, [word.min, word.sharri, word.ma, word.khalaq], [1, 3]),
  verse(113, 3, surah.falaq, [word.wamin, word.sharri, word.ghasiq, word.idha, word.waqab], [2, 4]),
  verse(114, 1, surah.nas, [word.qul, word.aoodhu, word.birabbi, word.annas], [1, 3]),
  verse(114, 2, surah.nas, [word.malik, word.annas], [0]),
  verse(114, 3, surah.nas, [word.ilahi, word.annas], [0]),
  verse(114, 4, surah.nas, [word.min, word.sharri, word.alwaswas, word.alkhannas], [2, 3]),
  verse(108, 1, surah.kawthar, [word.inna, word.aatayna, word.alkawthar], [1, 2]),
  verse(108, 2, surah.kawthar, [word.fasalli, word.lirabbika, word.wanhar], [0, 2]),
  verse(103, 1, surah.asr, [word.walasr], [0]),
  verse(103, 2, surah.asr, [word.innaShort, word.alinsana, word.lafi, word.khusr], [1, 3]),
  verse(110, 1, surah.nasr, [word.idha, word.jaa, word.nasru, word.allahi, word.walfath], [1, 2, 4]),
  verse(93, 1, surah.duha, [word.wadduha], [0]),
  verse(93, 2, surah.duha, [word.wallayli, word.idha, word.saja], [0, 2]),
];

const allWords = Array.from(new Set(quizVerses.flatMap(v => v.words)));

export function generateQuizQuestion(): {
  verse: QuizVerse;
  missingIndex: number;
  correctWord: string;
  choices: string[];
  displayWords: string[];
} {
  const verseItem = quizVerses[Math.floor(Math.random() * quizVerses.length)];
  const missingIndex = verseItem.removableIndices[
    Math.floor(Math.random() * verseItem.removableIndices.length)
  ];
  const correctWord = verseItem.words[missingIndex];
  const displayWords = verseItem.words.map((item, index) => (index === missingIndex ? '______' : item));

  const wrongWords = allWords
    .filter(item => item !== correctWord)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const choices = [correctWord, ...wrongWords].sort(() => Math.random() - 0.5);

  return { verse: verseItem, missingIndex, correctWord, choices, displayWords };
}
