package com.aniro.app;

import android.Manifest;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Azan")
public class AzanPlugin extends Plugin {

    @PluginMethod
    public void checkStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("exactAlarm", AzanSchedulerHelper.canScheduleExactAlarms(getContext()));
        result.put("notifications", canPostNotifications(getContext()));
        result.put("notificationPolicyAccess", hasNotificationPolicyAccess(getContext()));
        result.put("ignoringBatteryOptimizations", isIgnoringBatteryOptimizations(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void refreshSchedule(PluginCall call) {
        int scheduledCount = AzanSchedulerHelper.rescheduleAll(getContext());
        JSObject result = new JSObject();
        result.put("scheduledCount", scheduledCount);
        result.put("exactAlarm", AzanSchedulerHelper.canScheduleExactAlarms(getContext()));
        result.put("notifications", canPostNotifications(getContext()));
        result.put("notificationPolicyAccess", hasNotificationPolicyAccess(getContext()));
        result.put("ignoringBatteryOptimizations", isIgnoringBatteryOptimizations(getContext()));
        call.resolve(result);
    }

    @PluginMethod
    public void getPendingFajrChallenge(PluginCall call) {
        AzanSchedulerHelper.PendingFajrChallenge challenge = AzanSchedulerHelper.getPendingFajrChallenge(getContext());
        JSObject result = new JSObject();
        result.put("pending", challenge != null);
        if (challenge != null) {
            result.put("prayerName", challenge.prayerName);
            result.put("prayerTime", challenge.prayerTime);
        }
        call.resolve(result);
    }

    @PluginMethod
    public void completeFajrChallenge(PluginCall call) {
        Context context = getContext();
        AzanSchedulerHelper.clearPendingFajrChallenge(context);
        stopAzanPlayback(context);
        call.resolve();
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (AzanSchedulerHelper.canScheduleExactAlarms(getContext())) {
            call.resolve();
            return;
        }

        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                intent = new Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:" + getContext().getPackageName())
                );
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception ignored) {
            openAppSettings(call);
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                        .setData(Uri.parse("package:" + getContext().getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception exception) {
            call.reject("Unable to open notification settings", exception);
        }
    }

    @PluginMethod
    public void openDoNotDisturbSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception exception) {
            call.reject("Unable to open Do Not Disturb settings", exception);
        }
    }

    @PluginMethod
    public void openBatteryOptimizationSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                        .setData(Uri.parse("package:" + getContext().getPackageName()));
            } else {
                intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                        .setData(Uri.parse("package:" + getContext().getPackageName()));
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception exception) {
            try {
                Intent fallbackIntent = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                fallbackIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallbackIntent);
                call.resolve();
            } catch (Exception fallbackException) {
                call.reject("Unable to open battery optimization settings", fallbackException);
            }
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        stopAzanPlayback(getContext());
        call.resolve();
    }

    private void stopAzanPlayback(Context context) {
        Intent intent = new Intent(context, AzanPlaybackService.class);
        intent.setAction(AzanPlaybackService.ACTION_STOP);
        context.startService(intent);
    }

    private void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception exception) {
            call.reject("Unable to open exact alarm settings", exception);
        }
    }

    private boolean canPostNotifications(Context context) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private boolean hasNotificationPolicyAccess(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        return notificationManager != null && notificationManager.isNotificationPolicyAccessGranted();
    }

    private boolean isIgnoringBatteryOptimizations(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return true;
        }

        PowerManager powerManager = context.getSystemService(PowerManager.class);
        return powerManager != null && powerManager.isIgnoringBatteryOptimizations(context.getPackageName());
    }
}
