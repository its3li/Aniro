require('./lib/load-ts.cjs');

const assert = require('assert');
const fs = require('fs');

const { normalizeArabic, stripTajweedTags } = require('../src/lib/arabic.ts');

const docs = JSON.parse(fs.readFileSync('public/data/quran/search/all-ayat.json', 'utf8'));
assert.ok(Array.isArray(docs) && docs.length > 6000, 'Search data should contain Quran ayat');

for (const doc of docs.slice(0, 1000)) {
  const stripped = stripTajweedTags(doc.t);
  assert.ok(!/[[\]]/.test(stripped), `Tajweed tags should strip cleanly for ${doc.id}`);
}

const query = normalizeArabic('الحمد');
const matches = docs
  .map(doc => ({ doc, text: normalizeArabic(stripTajweedTags(doc.t)) }))
  .filter(({ text }) => text.includes(query));

assert.ok(matches.length > 0, 'Search normalization should find الحمد');
assert.ok(
  matches.some(({ doc }) => doc.s === 1),
  'Search normalization should find الحمد in Al-Fatiha'
);

const alefForms = normalizeArabic('أإآٱ');
assert.strictEqual(alefForms, 'اااا', 'Arabic alef forms should normalize consistently');

console.log('Search checks passed.');
