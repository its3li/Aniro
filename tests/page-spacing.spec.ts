import { expect, test } from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{
    localStorage.setItem('app-settings',JSON.stringify({language:'ar',fontSize:16,azanMode:'silent',includeIshraq:true}));
    localStorage.setItem('aniro_onboarding_v2_completed','1');
    localStorage.setItem('aniro_location',JSON.stringify({latitude:30.0444,longitude:31.2357,countryCode:'EG',source:'device',names:{ar:{city:'الجيزة',country:'مصر'}}}));
  });
});

for(const width of [320,384,432]) {
test('headers and prayer panel use space efficiently at '+width+'px', async ({page})=>{
  await page.setViewportSize({width,height:850});
  await page.goto('/');
  await expect(page.locator('.prayer-timeline')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  const panel=await page.locator('.prayer-panel').boundingBox();
  expect(panel!.height).toBeLessThan(350);
  const targets=await page.locator('.prayer-timeline button').evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().height));
  expect(targets.every(height=>height>=44)).toBe(true);
  await page.goto('/quran');
  await expect(page.locator('.surah-row').first()).toBeVisible();
  const row=await page.locator('.surah-row').first().boundingBox();
  expect(row!.y).toBeLessThan(420);
  await page.goto('/settings');
  const first=page.locator('.settings-page section').first();
  await expect(first).toBeVisible();
  expect((await first.boundingBox())!.y).toBeLessThan(320);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
});
}

test('Qibla fits short screens without an empty scroll tail and navigation resets old scroll', async ({page})=>{
  await page.setViewportSize({width:320,height:640});
  await page.goto('/qibla');
  await expect(page.locator('.qibla-dial')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>{
    const event=new Event('deviceorientationabsolute');
    Object.defineProperties(event,{alpha:{value:225},absolute:{value:true}});
    window.dispatchEvent(event);
  });
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollHeight)).toBeLessThanOrEqual(640);
  const layout=await page.locator('.qibla-content').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,dock:document.querySelector('.bottom-navigation')!.getBoundingClientRect().top}));
  expect(layout.bottom).toBeLessThan(layout.dock);
  await page.goto('/settings');
  await expect(page.locator('.settings-page')).toBeVisible();
  await page.evaluate(()=>window.scrollTo(0,250));
  await page.getByRole('navigation',{name:'التنقل الرئيسي'}).getByRole('link',{name:'القبلة',exact:true}).click();
  await expect(page.locator('.qibla-dial')).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  expect((await page.locator('.page-heading').boundingBox())!.y).toBeGreaterThanOrEqual(0);
});
