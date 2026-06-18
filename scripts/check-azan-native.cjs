const assert = require('assert');
const fs = require('fs');

const manifest = fs.readFileSync('android/app/src/main/AndroidManifest.xml', 'utf8');
const plugin = fs.readFileSync('android/app/src/main/java/com/aniro/app/AzanPlugin.java', 'utf8');
const receiver = fs.readFileSync('android/app/src/main/java/com/aniro/app/AzanAlarmReceiver.java', 'utf8');
const scheduler = fs.readFileSync('android/app/src/main/java/com/aniro/app/AzanSchedulerHelper.java', 'utf8');
const service = fs.readFileSync('android/app/src/main/java/com/aniro/app/AzanPlaybackService.java', 'utf8');

for (const permission of [
  'android.permission.SCHEDULE_EXACT_ALARM',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.WAKE_LOCK',
  'android.permission.RECEIVE_BOOT_COMPLETED',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.ACCESS_NOTIFICATION_POLICY',
  'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
]) {
  assert.ok(manifest.includes(permission), `AndroidManifest is missing ${permission}`);
}

for (const action of [
  'android.intent.action.BOOT_COMPLETED',
  'android.intent.action.MY_PACKAGE_REPLACED',
  'android.intent.action.TIME_SET',
  'android.intent.action.TIMEZONE_CHANGED',
  'android.intent.action.DATE_CHANGED',
  'android.app.action.SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED',
]) {
  assert.ok(manifest.includes(action), `BootReceiver is missing ${action}`);
}

for (const field of [
  '"exactAlarm"',
  '"notifications"',
  '"notificationPolicyAccess"',
  '"ignoringBatteryOptimizations"',
]) {
  assert.ok(plugin.includes(field), `AzanPlugin status is missing ${field}`);
}

assert.ok(plugin.includes('ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS'), 'AzanPlugin must expose battery optimization settings');
assert.ok(plugin.includes('ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS'), 'AzanPlugin must expose DND policy settings');
assert.ok(receiver.includes('ContextCompat.startForegroundService'), 'Azan receiver must try foreground playback');
assert.ok(!receiver.includes('!AzanSchedulerHelper.canScheduleExactAlarms(context)) {\n            showAzanNotification'), 'Exact alarm denial must not disable playback after a receiver fires');
assert.ok(scheduler.includes('setExactAndAllowWhileIdle'), 'Azan scheduler must use exact idle alarms when allowed');
assert.ok(scheduler.includes('setAndAllowWhileIdle'), 'Azan scheduler must fall back when exact alarms are denied');
assert.ok(service.includes('setWakeMode'), 'Azan playback must hold a media wake mode');
assert.ok(service.includes('setFullScreenIntent'), 'Azan playback notification must be able to open over lock screen');

console.log('Native azan checks passed.');
