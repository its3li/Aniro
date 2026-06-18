require('./lib/load-ts.cjs');

const assert = require('assert');
const {
  parseTajweed,
  parseTajweedMarkup,
  stripTajweed,
} = require('../src/lib/tajweed.ts');

function findRange(parsed, type) {
  return parsed.ranges.find(range => range.type === type);
}

{
  const meem = '\u0645\u0651\u0650';
  const parsed = parseTajweedMarkup(`[g[${meem}]]`, 'ar');
  const range = findRange(parsed, 'ghunnah');

  assert.strictEqual(parsed.text, meem);
  assert.ok(range, 'ghunnah range should exist');
  assert.strictEqual(range.start, 0);
  assert.strictEqual(range.end, meem.length);
}

{
  const noonYa = '\u0646\u0652 \u064a\u064e';
  const parsed = parseTajweedMarkup(`[a[${noonYa}]]`, 'ar');
  const range = findRange(parsed, 'idgham-with-ghunnah');

  assert.strictEqual(parsed.text, noonYa);
  assert.ok(range, 'idgham range should exist');
  assert.strictEqual(parsed.text.slice(range.start, range.end), '\u064a\u064e');
}

{
  const qaf = '\u0642\u0652';
  const html = parseTajweed(`[q[${qaf}]]`, 'ar');

  assert.ok(html.includes('class="tajweed qlq"'), 'fallback HTML should include qlq span');
  assert.ok(html.includes(qaf), 'fallback HTML should keep the Arabic cluster together');
}

{
  const text = '[h[\u0671]][s[\u0644]]\u0631\u0651\u064e\u062d\u0645\u0646';
  assert.strictEqual(stripTajweed(text), '\u0671\u0644\u0631\u0651\u064e\u062d\u0645\u0646');
}

console.log('Tajweed checks passed.');
