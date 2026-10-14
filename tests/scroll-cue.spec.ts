import { expect, test } from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('app-settings',JSON.stringify({language:'ar',quranViewMode:'page',quranEdition:'uthmani',quranTajweedEnabled:true,fontSize:24,azanMode:'silent'}));
    localStorage.setItem('aniro_onboarding_v2_completed','1');
    localStorage.setItem('aniro_location',JSON.stringify({latitude:30.0444,longitude:31.2357,countryCode:'EG',source:'device'}));
  });
});

test('cue appears only for overflow, hides on first scroll, and returns on the next overflowing page', async ({page}) => {
  await page.setViewportSize({width:700,height:390});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/quran?surah=2&ayah=49');
  const cue = page.locator('.mushaf-scroll-cue');
  const scroll = page.locator('.mushaf-reading-scroll');
  await expect(page.locator('.mushaf-text')).toHaveAttribute('data-page','8');
  await expect(cue).toBeVisible();
  await expect(cue).toHaveAttribute('aria-hidden','false');
  await expect(cue).toContainText('مرّر لمتابعة القراءة');
  const position=await cue.evaluate(el=>({bottom:el.getBoundingClientRect().bottom,dock:document.querySelector('.bottom-navigation')!.getBoundingClientRect().top,events:getComputedStyle(el).pointerEvents}));
  expect(position.bottom).toBeLessThan(position.dock);
  expect(position.events).toBe('none');
  await scroll.evaluate(el=>{el.scrollTop=1;});
  await expect(cue).toBeHidden();
  await expect(cue).toHaveAttribute('aria-hidden','true');
  await scroll.evaluate(el=>{el.scrollTop=0;});
  await page.setViewportSize({width:690,height:390});
  await expect(cue).toBeHidden();
  await page.locator('.mushaf-page-wrapper').evaluate(element=>{
    const send=(type:string,x:number,end=false)=>{
      const touch=new Touch({identifier:1,target:element,clientX:x,clientY:150});
      element.dispatchEvent(new TouchEvent(type,{bubbles:true,touches:end?[]:[touch],changedTouches:[touch]}));
    };
    send('touchstart',100);send('touchmove',240);send('touchend',240,true);
  });
  await expect(page.locator('.mushaf-text')).toHaveAttribute('data-page','9');
  await expect(cue).toBeVisible();
  // Increasing the reading area removes overflow and its cue.
  await page.setViewportSize({width:768,height:1200});
  await expect(scroll).toHaveAttribute('data-layout','fitted');
  await expect(cue).toBeHidden();
});

test('fitting pages stay free of hints and resizing can reveal a localized cue', async ({page}) => {
  await page.addInitScript(()=>{
    const settings=JSON.parse(localStorage.getItem('app-settings')!);
    localStorage.setItem('app-settings',JSON.stringify({...settings,language:'en',fontSize:16}));
  });
  await page.setViewportSize({width:384,height:850});
  await page.goto('/quran?surah=2&ayah=49');
  const cue=page.locator('.mushaf-scroll-cue');
  await expect(page.locator('.mushaf-reading-scroll')).toHaveAttribute('data-layout','fitted');
  await expect(cue).toBeHidden();
  await page.setViewportSize({width:320,height:480});
  await expect(page.locator('.mushaf-reading-scroll')).toHaveAttribute('data-layout','scroll');
  await expect(cue).toBeVisible();
  await expect(cue).toContainText('Scroll to continue');
});
