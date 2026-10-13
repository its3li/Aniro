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

test('saved prayer calculation method survives location initialization', async ({ page }) => {
  await page.addInitScript(() => {
    const settings = JSON.parse(localStorage.getItem('app-settings') || '{}');
    settings.calculationMethod = 'karachi';
    localStorage.setItem('app-settings', JSON.stringify(settings));
  });
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('app-settings') || '{}').calculationMethod)).toBe('karachi');
  await page.goto('/settings');
  await expect(page.locator('button').first()).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('app-settings') || '{}').calculationMethod)).toBe('karachi');
});

test('bundled Quran remains readable when IndexedDB is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      configurable: true,
      get() { throw new Error('Storage unavailable'); },
    });
  });
  await page.route('https://api.alquran.cloud/**', route => route.abort());
  await page.goto('/quran?surah=1&ayah=1');
  await expect(page.locator('.font-quran').first()).toBeVisible();
  await expect(page.locator('body')).not.toContainText('Something went wrong');
});

test('tasbeeh dial increments and saves progress after reopening', async ({ page }) => {
  await page.goto('/tasbeeh');
  const dial = page.getByRole('button', { name: 'تسبيح، زيادة العداد' });
  await expect(dial).toBeVisible();
  await dial.click();
  await dial.click();
  await expect(dial).toContainText('٢');
  await page.reload();
  await expect(dial).toContainText('٢');
  await page.getByRole('button', { name: 'تصفير العداد' }).click();
  await expect(dial).toContainText('٠');
});

test('redesigned navigation exposes current page and keyboard-operable azkar', async ({ page }) => {
  await page.goto('/azkar');
  const navigation = page.getByRole('navigation', { name: 'التنقل الرئيسي' });
  await expect(navigation.locator('[aria-current="page"]')).toContainText('الأذكار');
  const category = page.locator('.azkar-category').first();
  await expect(category).toBeVisible();
  await category.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'رجوع', exact: true })).toBeVisible();
  await expect(page.locator('.zikr-reading-card').first()).toBeVisible();
});
