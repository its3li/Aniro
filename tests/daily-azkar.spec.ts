import { expect, test } from '@playwright/test';
import { localDayKey, readAzkarProgress } from '../src/lib/azkar-progress';

test('only a valid same-day Azkar record retains progress', () => {
  const day = localDayKey(new Date(2026, 9, 13, 23, 59));
  expect(day).toBe('2026-10-13');
  for (const raw of [null, '0', 'broken', 'null', '[]', JSON.stringify({day:'2026-10-12',remaining:0}), JSON.stringify({day,remaining:-1}), JSON.stringify({day,remaining:4}), JSON.stringify({day,remaining:1.5})]) {
    expect(readAzkarProgress(raw, day, 3)).toBe(3);
  }
  expect(readAzkarProgress(JSON.stringify({day,remaining:0}), day, 3)).toBe(0);
  expect(readAzkarProgress(JSON.stringify({day,remaining:2}), day, 3)).toBe(2);
});

test.beforeEach(async ({page}) => {
  await page.clock.install({time:new Date('2026-10-13T12:00:00')});
  await page.addInitScript(() => {
    localStorage.setItem('app-settings', JSON.stringify({language:'ar',azanMode:'silent'}));
    localStorage.setItem('aniro_onboarding_v2_completed','1');
    localStorage.setItem('aniro_location', JSON.stringify({latitude:30.0444,longitude:31.2357,countryCode:'EG',source:'device'}));
  });
});

test('completion survives reload, stays separate from evening, and resets at local midnight', async ({page}) => {
  await page.goto('/azkar?category=morning-azkar');
  const card = page.locator('.zikr-reading-card').first();
  await expect(card).toHaveAttribute('data-remaining','1');
  await expect.poll(() => card.evaluate(el => el.getAttribute('data-completed'))).toBe('false');
  // Wait for storage hydration before tapping.
  await expect.poll(async () => {
    await card.locator('p.font-quran').click();
    return card.getAttribute('data-remaining');
  }).toBe('0');
  await page.reload();
  await expect(card).toHaveAttribute('data-completed','true');
  await page.goto('/azkar?category=evening-azkar');
  await expect(card).toHaveAttribute('data-remaining','1');
  await page.goto('/azkar?category=morning-azkar');
  await expect(card).toHaveAttribute('data-completed','true');
  await page.clock.fastForward(12*60*60*1000 + 100);
  await expect(card).toHaveAttribute('data-remaining','1');
  await expect(card).toHaveAttribute('data-completed','false');
  await card.locator('p.font-quran').click();
  await expect(card).toHaveAttribute('data-remaining','0');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('azkar_progress_morning-azkar_0')!));
  expect(saved).toEqual({day:'2026-10-14',remaining:0});
});

test('old completion and undated values reset; resume checks a changed local date', async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('azkar_progress_morning-azkar_0',JSON.stringify({day:'2026-10-12',remaining:0}));
    localStorage.setItem('azkar_progress_morning-azkar_1','0');
  });
  await page.goto('/azkar?category=morning-azkar');
  const cards = page.locator('.zikr-reading-card');
  await expect(cards.nth(0)).toHaveAttribute('data-remaining','1');
  await expect(cards.nth(1)).toHaveAttribute('data-remaining','3');
  await expect.poll(async () => {
    await cards.nth(0).locator('p.font-quran').click();
    return cards.nth(0).getAttribute('data-remaining');
  }).toBe('0');
  await page.clock.setSystemTime(new Date('2026-10-15T09:00:00'));
  await page.evaluate(() => { window.dispatchEvent(new Event('focus')); });
  await expect(cards.nth(0)).toHaveAttribute('data-remaining','1');
});
