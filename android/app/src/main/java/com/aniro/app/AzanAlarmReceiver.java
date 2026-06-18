package com.aniro.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

public class AzanAlarmReceiver extends BroadcastReceiver {
    private static final String TAG = "AzanAlarmReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        String prayerName = intent.getStringExtra(AzanSchedulerHelper.EXTRA_PRAYER_NAME);
        String prayerKey = intent.getStringExtra(AzanSchedulerHelper.EXTRA_PRAYER_KEY);
        String azanMode = intent.getStringExtra(AzanSchedulerHelper.EXTRA_AZAN_MODE);
        int notificationId = intent.getIntExtra(AzanSchedulerHelper.EXTRA_NOTIFICATION_ID, 3000);
        long prayerTime = intent.getLongExtra(AzanSchedulerHelper.EXTRA_PRAYER_TIME, System.currentTimeMillis());
        boolean requireChallenge = intent.getBooleanExtra(AzanSchedulerHelper.EXTRA_REQUIRE_CHALLENGE, false)
                && "fajr".equals(prayerKey)
                && !"silent".equals(azanMode);

        AzanSchedulerHelper.rescheduleAll(context);
        WidgetHelper.updateAllWidgets(context);

        if (prayerName == null || prayerName.trim().isEmpty()) {
            prayerName = localizePrayerName(context, prayerKey);
        }

        if ("silent".equals(azanMode)) {
            showReminderNotification(context, prayerName, notificationId);
            return;
        }

        if (requireChallenge) {
            AzanSchedulerHelper.markPendingFajrChallenge(context, prayerName, prayerTime);
        }

        Intent serviceIntent = new Intent(context, AzanPlaybackService.class);
        serviceIntent.setAction(AzanPlaybackService.ACTION_START);
        serviceIntent.putExtra(AzanSchedulerHelper.EXTRA_NOTIFICATION_ID, notificationId);
        serviceIntent.putExtra(AzanSchedulerHelper.EXTRA_PRAYER_NAME, prayerName);
        serviceIntent.putExtra(AzanSchedulerHelper.EXTRA_PRAYER_KEY, prayerKey);
        serviceIntent.putExtra(AzanSchedulerHelper.EXTRA_PRAYER_TIME, prayerTime);
        serviceIntent.putExtra(AzanSchedulerHelper.EXTRA_REQUIRE_CHALLENGE, requireChallenge);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (RuntimeException exception) {
            Log.w(TAG, "Could not start azan playback service; showing sound notification", exception);
            showAzanNotification(context, prayerName, notificationId);
        }
    }

    private void showAzanNotification(Context context, String prayerName, int notificationId) {
        ensureAzanChannel(context);
        if (!canPostNotifications(context)) {
            return;
        }

        NotificationCompat.Builder builder = baseNotificationBuilder(
                context,
                AzanSchedulerHelper.AZAN_NOTIFICATION_CHANNEL_ID,
                notificationId,
                prayerName,
                localizedText(context, "azan_body")
        )
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setSound(azanSoundUri(context), AudioManager.STREAM_ALARM)
                .setDefaults(NotificationCompat.DEFAULT_LIGHTS | NotificationCompat.DEFAULT_VIBRATE);

        NotificationManagerCompat.from(context).notify(notificationId, builder.build());
    }

    private void showReminderNotification(Context context, String prayerName, int notificationId) {
        ensureReminderChannel(context);
        if (!canPostNotifications(context)) {
            return;
        }

        NotificationCompat.Builder builder = baseNotificationBuilder(
                context,
                AzanSchedulerHelper.REMINDER_CHANNEL_ID,
                notificationId,
                prayerName,
                localizedText(context, "reminder_body")
        )
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER);

        NotificationManagerCompat.from(context).notify(notificationId, builder.build());
    }

    private NotificationCompat.Builder baseNotificationBuilder(
            Context context,
            String channelId,
            int notificationId,
            String title,
            String body
    ) {
        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                context,
                notificationId,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(context, channelId)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(body)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(contentIntent);
    }

    private void ensureAzanChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        if (notificationManager == null || notificationManager.getNotificationChannel(AzanSchedulerHelper.AZAN_NOTIFICATION_CHANNEL_ID) != null) {
            return;
        }

        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();

        NotificationChannel channel = new NotificationChannel(
                AzanSchedulerHelper.AZAN_NOTIFICATION_CHANNEL_ID,
                "Azan prayer notifications",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Prayer-time azan notifications");
        channel.setSound(azanSoundUri(context), audioAttributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[]{0, 500, 200, 500});
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        if (notificationManager.isNotificationPolicyAccessGranted()) {
            channel.setBypassDnd(true);
        }
        notificationManager.createNotificationChannel(channel);
    }

    private void ensureReminderChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        if (notificationManager == null || notificationManager.getNotificationChannel(AzanSchedulerHelper.REMINDER_CHANNEL_ID) != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                AzanSchedulerHelper.REMINDER_CHANNEL_ID,
                "Prayer reminders",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Prayer reminders when full Azan playback is disabled");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        notificationManager.createNotificationChannel(channel);
    }

    private boolean canPostNotifications(Context context) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private Uri azanSoundUri(Context context) {
        return Uri.parse("android.resource://" + context.getPackageName() + "/raw/azan");
    }

    private String localizePrayerName(Context context, String prayerKey) {
        boolean isArabic = isArabic(context);
        if ("fajr".equals(prayerKey)) {
            return isArabic ? "\u0627\u0644\u0641\u062c\u0631" : "Fajr";
        }
        if ("ishraq".equals(prayerKey)) {
            return isArabic ? "\u0627\u0644\u0636\u062d\u0649" : "Ishraq";
        }
        if ("dhuhr".equals(prayerKey)) {
            return isArabic ? "\u0627\u0644\u0638\u0647\u0631" : "Dhuhr";
        }
        if ("asr".equals(prayerKey)) {
            return isArabic ? "\u0627\u0644\u0639\u0635\u0631" : "Asr";
        }
        if ("maghrib".equals(prayerKey)) {
            return isArabic ? "\u0627\u0644\u0645\u063a\u0631\u0628" : "Maghrib";
        }
        if ("isha".equals(prayerKey)) {
            return isArabic ? "\u0627\u0644\u0639\u0634\u0627\u0621" : "Isha";
        }
        return isArabic ? "\u0627\u0644\u0635\u0644\u0627\u0629" : "Prayer";
    }

    private String localizedText(Context context, String key) {
        boolean isArabic = isArabic(context);
        if ("azan_body".equals(key)) {
            return isArabic
                    ? "\u062d\u064a \u0639\u0644\u0649 \u0627\u0644\u0635\u0644\u0627\u0629\u060c \u062d\u064a \u0639\u0644\u0649 \u0627\u0644\u0641\u0644\u0627\u062d"
                    : "Come to prayer, come to success";
        }
        return isArabic ? "\u062d\u0627\u0646 \u0648\u0642\u062a \u0627\u0644\u0635\u0644\u0627\u0629" : "Prayer time reminder";
    }

    private boolean isArabic(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(AzanSchedulerHelper.PREFS_NAME, Context.MODE_PRIVATE);
        return "ar".equals(prefs.getString("language", "ar"));
    }
}
