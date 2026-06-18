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
