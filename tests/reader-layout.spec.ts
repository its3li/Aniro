import { expect, test } from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('app-settings', JSON.stringify({language:'ar',quranViewMode:'page',quranEdition:'uthmani',quranTajweedEnabled:true,azanMode:'silent'}));
    localStorage.setItem('aniro_onboarding_v2_completed','1');
    localStorage.setItem('aniro_location', JSON.stringify({latitude:30.0444,longitude:31.2357,countryCode:'EG',source:'device',names:{ar:{city:'القاهرة',country:'مصر'}}}));
  });
});

test('opening spread keeps live ayat and changes back to normal text on page three', async ({page}) => {
  await page.setViewportSize({width:320,height:844});
  for (const [surah,verse,expectedPage,expectedCount] of [[1,1,1,7],[2,1,2,5],[2,6,3,11]]) {
    await page.goto('/quran?surah='+surah+'&ayah='+verse);
    const text = page.locator('.mushaf-text');
    await expect(text).toHaveAttribute('data-page',String(expectedPage));
    await expect(text.locator('.mushaf-ayah')).toHaveCount(expectedCount);
    expect((await text.innerText()).length).toBeGreaterThan(80);
    expect(await text.evaluate(element => element.classList.contains('mushaf-opening'))).toBe(expectedPage <= 2);
    const geometry = await page.evaluate(() => {
      const toolbar = document.querySelector('.mushaf-toolbar')!.getBoundingClientRect();
      const scroll = document.querySelector('.mushaf-reading-scroll')!.getBoundingClientRect();
      const dock = document.querySelector('.bottom-navigation')!.getBoundingClientRect();
      return {top:toolbar.top,bottom:scroll.bottom,dock:dock.top,overflow:document.documentElement.scrollWidth>innerWidth};
    });
    expect(geometry.top).toBeLessThan(3);
    expect(geometry.bottom).toBeLessThanOrEqual(geometry.dock+1);
    expect(geometry.overflow).toBe(false);
  }
});

test('late verse deep link goes directly to its page without scanning the surah', async ({page}) => {
  const pageRequests:string[] = [];
  page.on('request', request => {if(request.url().includes('/data/quran/page/')) pageRequests.push(request.url());});
  await page.goto('/quran?surah=2&ayah=250');
  await expect(page.locator('.mushaf-text')).toHaveAttribute('data-page','41');
  await expect(page.locator('.mushaf-ayah-number').filter({hasText:'٢٥٠'})).toBeVisible();
  expect(pageRequests.length).toBeLessThanOrEqual(3);
});

test('vertical reading gestures keep the page while horizontal gestures turn it', async ({page}) => {
  await page.goto('/quran?surah=2');
  await expect(page.locator('.mushaf-text')).toHaveAttribute('data-page','2');
  const swipe = async (x:number,y:number) => page.locator('.mushaf-page-wrapper').evaluate((element, coords) => {
    const dispatch = (type:string, x:number, y:number, end=false) => {
      const touch = new Touch({identifier:1,target:element,clientX:x,clientY:y});
      element.dispatchEvent(new TouchEvent(type,{bubbles:true,touches:end?[]:[touch],changedTouches:[touch]}));
    };
    dispatch('touchstart',100,300); dispatch('touchmove',coords.x,coords.y); dispatch('touchend',coords.x,coords.y,true);
  },{x,y});
  await swipe(160,100);
  await expect(page.locator('.mushaf-text')).toHaveAttribute('data-page','2');
  await swipe(230,300);
  await expect(page.locator('.mushaf-text')).toHaveAttribute('data-page','3');
  await expect(page.locator('.mushaf-opening')).toHaveCount(0);
});

test('Home and Quran index do not build search until the search field is used', async ({page}) => {
  let searchRequests = 0;
  page.on('request', request => {if(request.url().includes('/search/all-ayat.json')) searchRequests++;});
  await page.goto('/');
  await expect(page.locator('.prayer-timeline')).toBeVisible();
  await page.goto('/quran');
  await expect(page.locator('button.surah-row')).toHaveCount(114);
  expect(searchRequests).toBe(0);
  await page.locator('input').first().fill('الحمد');
  await expect(page.getByText(/نتائج البحث/)).toBeVisible();
  expect(searchRequests).toBe(1);
});

test('surah rows stay separated at narrow widths and reduced motion disables the entrance', async ({page}) => {
  await page.setViewportSize({width:320,height:700});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/quran');
  const rows = page.locator('button.surah-row');
  await expect(rows).toHaveCount(114);
  const geometry = await rows.evaluateAll(elements => elements.map(element => {
    const r=element.getBoundingClientRect(); const s=getComputedStyle(element);
    return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,radius:parseFloat(s.borderRadius),height:r.height};
  }));
  for(let i=0;i<geometry.length;i++) {
    expect(geometry[i].left).toBeGreaterThanOrEqual(0);
    expect(geometry[i].right).toBeLessThanOrEqual(320);
    expect(geometry[i].height).toBeGreaterThanOrEqual(80);
    expect(geometry[i].radius).toBeGreaterThan(12);
    if(i) expect(geometry[i].top-geometry[i-1].bottom).toBeGreaterThan(6);
  }
  expect(await page.locator('.app-page').evaluate(element => parseFloat(getComputedStyle(element).animationDuration))).toBeLessThan(.01);
});
