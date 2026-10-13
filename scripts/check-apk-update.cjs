const assert = require('assert');
const fs = require('fs');

const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const filePaths = fs.readFileSync('android/app/src/main/res/xml/file_paths.xml', 'utf8');
const mainActivity = fs.readFileSync('android/app/src/main/java/com/aniro/app/MainActivity.java', 'utf8');
const plugin = fs.readFileSync('android/app/src/main/java/com/aniro/app/ApkUpdatePlugin.java', 'utf8');
const dialog = fs.readFileSync('src/components/update-dialog.tsx', 'utf8');
const appUpdate = fs.readFileSync('src/lib/app-update.ts', 'utf8');
const nativeBridge = fs.readFileSync('src/lib/native-apk-update.ts', 'utf8');

assert.ok(manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES'), 'Manifest must allow package install requests');
assert.ok(manifest.includes('androidx.core.content.FileProvider'), 'Manifest must expose FileProvider');
assert.ok(filePaths.includes('<cache-path'), 'FileProvider must expose cache path for downloaded APKs');
assert.ok(mainActivity.includes('registerPlugin(ApkUpdatePlugin.class)'), 'MainActivity must register ApkUpdatePlugin');

for (const snippet of [
  '@CapacitorPlugin(name = "ApkUpdate")',
  'downloadUpdate',
  'installDownloadedUpdate',
  'openInstallPermissionSettings',
  'MessageDigest.getInstance("SHA-256")',
  'application/vnd.android.package-archive',
  'ACTION_MANAGE_UNKNOWN_APP_SOURCES',
  'notifyListeners("downloadProgress"',
]) {
  assert.ok(plugin.includes(snippet), `ApkUpdatePlugin is missing ${snippet}`);
}

for (const snippet of [
  'NativeApkUpdate.downloadUpdate',
  'NativeApkUpdate.installDownloadedUpdate',
  'NativeApkUpdate.openInstallPermissionSettings',
  'downloadProgress',
  '<Progress',
]) {
  assert.ok(dialog.includes(snippet), `UpdateDialog is missing ${snippet}`);
}

assert.ok(appUpdate.includes('apkUrl?: string'), 'Update metadata must include apkUrl');
assert.ok(appUpdate.includes('sha256?: string'), 'Update metadata must include sha256');
assert.ok(nativeBridge.includes("registerPlugin<ApkUpdatePlugin>('ApkUpdate')"), 'Native APK update bridge must register plugin once');

console.log('APK update checks passed.');

require('./lib/load-ts.cjs');
const updateModule = require('../src/lib/app-update.ts');
const gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
assert.equal(Number(gradle.match(/versionCode (\d+)/)[1]), updateModule.APP_VERSION.versionCode);
assert.equal(gradle.match(/versionName "([^"]+)"/)[1], updateModule.APP_VERSION.versionName);
assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).version, updateModule.APP_VERSION.versionName + '.0');

async function checkUpdateFallbacks() {
  const originalFetch = global.fetch;
  const newer = { versionCode:updateModule.APP_VERSION.versionCode+1,versionName:'test-next',rollout:100,apkUrl:'https://github.com/its3li/Aniro/releases/download/test/aniro.apk' };
  try {
    let calls=[];
    global.fetch=async (url,options) => { calls.push(url); assert.equal(options.cache,'no-store'); return {ok:true,json:async()=>newer}; };
    assert.deepEqual(await updateModule.checkForUpdate(),newer);
    assert.ok(calls[0].startsWith('https://raw.githubusercontent.com/'));
    calls=[];
    global.fetch=async url => { calls.push(url); return calls.length===1 ? {ok:false} : {ok:true,json:async()=>newer}; };
    assert.deepEqual(await updateModule.checkForUpdate(),newer);
    assert.equal(calls.length,2);
    assert.ok(calls[1].startsWith('https://api.github.com/'));
    calls=[];
    global.fetch=async url => { calls.push(url); return {ok:true,json:async()=> calls.length===1 ? {versionCode:'broken'} : newer}; };
    assert.deepEqual(await updateModule.checkForUpdate(),newer);
    global.fetch=async()=>({ok:true,json:async()=>({...newer,versionCode:updateModule.APP_VERSION.versionCode})});
    assert.equal(await updateModule.checkForUpdate(),null);
    global.fetch=async()=>({ok:false,status:403});
    assert.equal(await updateModule.checkForUpdate(),null);
    console.log('Update version parity and fallback behavior passed.');
  } finally { global.fetch=originalFetch; }
}
checkUpdateFallbacks().catch(error=>{console.error(error);process.exitCode=1;});
