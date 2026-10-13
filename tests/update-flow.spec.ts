import { expect, test } from '@playwright/test';

const update = {versionCode:21,versionName:'test-next',rollout:100,forceUpdate:false,apkUrl:'https://github.com/its3li/Aniro/releases/download/test-next/aniro.apk',sha256:'a'.repeat(64)};

test.beforeEach(async ({page}) => {
  await page.addInitScript(() => {
    localStorage.setItem('app-settings',JSON.stringify({language:'ar',azanMode:'silent'}));
    localStorage.setItem('aniro_onboarding_v2_completed','1');
    localStorage.setItem('aniro_location',JSON.stringify({latitude:30.0444,longitude:31.2357,source:'device',countryCode:'EG',names:{ar:{city:'القاهرة',country:'مصر'}}}));
  });
});

test('update discovery falls back when the primary feed is unavailable',async ({page}) => {
  let fallbackRequests=0;
  await page.route('https://raw.githubusercontent.com/**/version.json',route=>route.fulfill({status:503,body:'Unavailable'}));
  await page.route('https://api.github.com/**/version.json',route=>{fallbackRequests++;return route.fulfill({json:update});});
  await page.goto('/');
  const dialog=page.getByRole('alertdialog');
  await expect(dialog).toContainText('test-next');
  await expect(dialog.getByRole('button',{name:'فتح التحميل'})).toBeVisible();
  expect(fallbackRequests).toBe(1);
});

test('current release has no update prompt and reports the actual version',async ({page}) => {
  await page.route('https://raw.githubusercontent.com/**/version.json',route=>route.fulfill({json:{...update,versionCode:20,versionName:'6.14'}}));
  await page.goto('/settings');
  await expect(page.getByText('v6.14',{exact:true})).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
});

test('returning from Android install permission preserves the update and resumes once',async ({page}) => {
  await page.addInitScript(() => {
    type Call={pluginId:string;methodName:string;options:Record<string,unknown>};
    const state={permission:false,downloads:0,installs:0,permissionOpens:0};
    const win=window as typeof window & {Capacitor:Record<string,unknown>;androidBridge:object;__updateState:typeof state};
    win.__updateState=state;
    win.androidBridge={};
    win.Capacitor={PluginHeaders:[{name:'ApkUpdate',methods:['canInstallPackages','openInstallPermissionSettings','downloadUpdate','installDownloadedUpdate','addListener','removeListener'].map(name=>({name,rtype:'promise'}))}],
      nativeCallback:(call:Call)=>Promise.resolve('test-listener'),
      nativePromise:async (pluginId:string,methodName:string,options:Record<string,unknown>)=>{
        if(pluginId!=='ApkUpdate') throw new Error('Unexpected plugin '+pluginId);
        switch(methodName){
          case 'canInstallPackages':return {canInstall:state.permission};
          case 'openInstallPermissionSettings':state.permissionOpens++;return {};
          case 'downloadUpdate':state.downloads++;return {fileName:options.fileName,bytes:1024,sha256:options.sha256,canInstall:true};
          case 'installDownloadedUpdate':state.installs++;return {canInstall:true};
          default:return {};
        }
      },
    };
  });
  let checks=0;
  await page.route('https://raw.githubusercontent.com/**/version.json',route=>{checks++;return route.fulfill({json:update});});
  await page.goto('/');
  const dialog=page.getByRole('alertdialog');
  await expect(dialog.getByRole('button',{name:'تحديث الآن'})).toBeVisible();
  await dialog.getByRole('button',{name:'تحديث الآن'}).click();
  await expect(dialog.getByRole('button',{name:'فتح الإذن'})).toBeVisible();
  await page.evaluate(()=>{
    const win=window as typeof window & {__updateState:{permission:boolean}};
    win.__updateState.permission=true;
    document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('focus'));
  });
  await expect.poll(()=>page.evaluate(()=> (window as typeof window & {__updateState:{installs:number}}).__updateState.installs)).toBe(1);
  expect(await page.evaluate(()=> (window as typeof window & {__updateState:{downloads:number}}).__updateState.downloads)).toBe(1);
  expect(checks).toBe(1);
  await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
  await expect(dialog.getByRole('button',{name:'تحديث الآن'})).toBeEnabled();
});
