import { expect, test, type Page } from '@playwright/test';

const fatalConsolePattern = /Maximum update depth|WidgetData.*not implemented|Hydration failed|Unhandled Runtime Error/i;

function watchForFatalClientErrors(page: Page) {
  const errors: string[] = [];

  page.on('console', message => {
    if (message.type() === 'error' && fatalConsolePattern.test(message.text())) {
      errors.push(message.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  return errors;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'app-settings',
      JSON.stringify({
        language: 'ar',
        quranEdition: 'uthmani',
        quranTajweedEnabled: true,
        quranViewMode: 'list',
        timeFormat: '12h',
        dstMode: 'auto',
        azanMode: 'silent',
        includeIshraq: true,
        fajrQuizEnabled: true,
      })
    );
    window.localStorage.setItem(
      'aniro_location',
      JSON.stringify({
        latitude: 30.0444,
        longitude: 31.2357,
        countryCode: 'EG',
        names: {
          ar: { city: 'القاهرة', country: 'مصر' },
          en: { city: 'Cairo', country: 'Egypt' },
        },
        source: 'device',
        updatedAt: Date.now(),
      })
    );
    window.localStorage.setItem('aniro_onboarding_v2_completed', '1');
  });
});

test('home screen renders without known client crashes', async ({ page }) => {
  const fatalErrors = watchForFatalClientErrors(page);

  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Something went wrong');

  const visibleTextLength = await page.locator('body').innerText().then(text => text.trim().length);
  expect(visibleTextLength).toBeGreaterThan(20);
  expect(fatalErrors).toEqual([]);
});

test('quran search finds ayat from the offline index', async ({ page }) => {
  const fatalErrors = watchForFatalClientErrors(page);

  await page.goto('/quran');
  const search = page.locator('input').first();
  await expect(search).toBeVisible();
  await search.fill('الحمد');

  await expect(page.getByText(/الفاتحة|Al-Fatiha|Search Results|نتائج البحث/).first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Something went wrong');
  expect(fatalErrors).toEqual([]);
});

test('quran verse deep link opens a readable Quran view', async ({ page }) => {
  const fatalErrors = watchForFatalClientErrors(page);

  await page.goto('/quran?surah=1&ayah=1');
  await expect(page.locator('.font-quran').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Something went wrong');
  expect(fatalErrors).toEqual([]);
});

test('settings screen is reachable and keeps controls visible', async ({ page }) => {
  const fatalErrors = watchForFatalClientErrors(page);

  await page.goto('/settings');
  await expect(page.locator('body')).not.toContainText('Something went wrong');
  await expect(page.locator('button, [role="switch"], [role="combobox"]').first()).toBeVisible();
  expect(fatalErrors).toEqual([]);
});
