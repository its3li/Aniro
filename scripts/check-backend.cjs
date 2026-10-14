require('./lib/load-ts.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const { normalizeSettings } = require('../src/lib/settings-validation.ts');
const { generateQuizQuestion } = require('../src/lib/fajr-quiz-verses.ts');
const { localizeWisdomReference } = require('../src/lib/wisdom.ts');
assert.equal(localizeWisdomReference('Surah At-Talaq, 65:3'), 'سورة الطلاق، الآية ٣');

const defaults = { prayerOffset: 0, fontSize: 16, azanMode: 'full', fajrQuizEnabled: true, calculationMethod: 'egyptian' };
for (const input of [null, [], 'invalid', { prayerOffset: null, azanMode: 'broken', fajrQuizEnabled: 'false' }]) {
  assert.deepEqual(normalizeSettings(defaults, input), defaults);
}
assert.equal(normalizeSettings(defaults, { prayerOffset: Infinity }).prayerOffset, 0);
assert.equal(normalizeSettings(defaults, { prayerOffset: 99 }).prayerOffset, 0);
assert.equal(normalizeSettings(defaults, { fontSize: 24 }).fontSize, 24);
assert.equal(normalizeSettings(defaults, { fontSize: 25 }).fontSize, 16);
assert.equal(normalizeSettings(defaults, { fajrQuizEnabled: false }).fajrQuizEnabled, false);
for (let index = 0; index < 2000; index++) {
  const question = generateQuizQuestion();
  assert.ok(question.displayWords.some(word => word !== '______'), 'Challenge must include verse context');
  assert.equal(question.choices.length, 4);
  assert.equal(new Set(question.choices).size, 4);
  assert.equal(question.choices.filter(word => word === question.correctWord).length, 1);
  assert.equal(question.verse.words[question.missingIndex], question.correctWord);
}

async function checkQuranStorageFailure() {
  const originalLoad = Module._load;
  const originalFetch = global.fetch;
  Module._load = function (name, ...args) {
    if (name === 'idb-keyval') return {
      get: () => { throw new Error('IndexedDB unavailable'); },
      set: () => { throw new Error('Storage quota exceeded'); },
    };
    return originalLoad.call(this, name, ...args);
  };
  let networkRequests = 0;
  global.fetch = async url => {
    assert.ok(url.startsWith('/data/quran/'), 'Bundled Quran must work without network');
    networkRequests++;
    return { ok: true, json: async () => JSON.parse(fs.readFileSync('public' + url, 'utf8')) };
  };
  try {
    const quran = require('../src/lib/quran.ts');
    const [first, second] = await Promise.all([quran.getSurah(1), quran.getSurah(1)]);
    assert.equal(first.verses.length, 7);
    assert.equal(first, second);
    assert.equal(networkRequests, 1, 'Concurrent requests must deduplicate');
    const translated = await quran.getSurahWithTranslation(1);
    assert.ok(translated.verses.every(verse => verse.text && verse.translation));
    assert.equal((await quran.getSurahList()).length, 114);
    assert.equal(await quran.isSurahCached(114), false);
  } finally {
    Module._load = originalLoad;
    global.fetch = originalFetch;
  }
}
checkQuranStorageFailure().then(() => console.log('Backend regression checks passed.')).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
