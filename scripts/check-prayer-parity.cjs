require('./lib/load-ts.cjs');

const assert = require('assert');
const fs = require('fs');

const { calculationMethods, getNextPrayer, getPrayerTimes } = require('../src/lib/prayer.ts');

const methodKeys = Object.keys(calculationMethods);
const helper = fs.readFileSync('android/app/src/main/java/com/aniro/app/PrayerCalculationHelper.java', 'utf8');
const azanScheduler = fs.readFileSync('android/app/src/main/java/com/aniro/app/AzanSchedulerHelper.java', 'utf8');
const widgetHelper = fs.readFileSync('android/app/src/main/java/com/aniro/app/WidgetHelper.java', 'utf8');

for (const key of methodKeys) {
  if (key === 'muslim_world_league') continue;
  assert.ok(helper.includes(`case "${key}"`), `Native prayer helper is missing ${key}`);
}

assert.ok(helper.includes('MOON_SIGHTING_COMMITTEE'), 'Native helper must use Moon Sighting Committee');
assert.ok(helper.includes('new CalculationParameters(18.0, 17.0'), 'Turkey angles must be mirrored manually');
assert.ok(helper.includes('new PrayerAdjustments(0, -7, 5, 4, 7, 0)'), 'Turkey adjustments must match JS adhan');
assert.ok(helper.includes('new CalculationParameters(17.7, 14.0'), 'Tehran angles must be mirrored manually');
assert.ok(
  azanScheduler.includes('PrayerCalculationHelper.getCalculationParameters') &&
  widgetHelper.includes('PrayerCalculationHelper.getCalculationParameters'),
  'Azan and widgets must use the shared native prayer helper'
);
assert.ok(widgetHelper.includes('getTotalOffset'), 'Widgets must apply DST mode like the app and azan scheduler');

const date = new Date('2026-06-18T08:00:00+03:00');
const prayersWithIshraq = getPrayerTimes(date, 30.0444, 31.2357, 0, 'egyptian', true);
const prayersWithoutIshraq = getPrayerTimes(date, 30.0444, 31.2357, 0, 'egyptian', false);
assert.ok(prayersWithIshraq.some(prayer => prayer.name === 'ishraq'), 'Ishraq should be included when enabled');
assert.ok(!prayersWithoutIshraq.some(prayer => prayer.name === 'ishraq'), 'Ishraq should be omitted when disabled');

const beforeIshraq = new Date(prayersWithIshraq.find(prayer => prayer.name === 'ishraq').date.getTime() - 60_000);
const nextPrayer = getNextPrayer(30.0444, 31.2357, 0, 'egyptian', true, beforeIshraq);
assert.strictEqual(nextPrayer?.name, 'ishraq', 'Next prayer should respect includeIshraq');

console.log('Prayer parity checks passed.');
