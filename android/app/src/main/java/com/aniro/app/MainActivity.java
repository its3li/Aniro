package com.aniro.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AzanPlugin.class);
        registerPlugin(ApkUpdatePlugin.class);
        registerPlugin(WidgetDataPlugin.class);
        super.onCreate(savedInstanceState);
        createNotificationChannels();
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        if (notificationManager == null) {
            return;
        }

        Uri soundUri = Uri.parse("android.resource://" + getPackageName() + "/raw/azan");
        AudioAttributes azanAudioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();

        NotificationChannel azanChannel = new NotificationChannel(
                AzanSchedulerHelper.AZAN_NOTIFICATION_CHANNEL_ID,
                "Azan Prayer Notifications",
                NotificationManager.IMPORTANCE_HIGH
        );
        azanChannel.setDescription("Notifications for prayer times with Azan sound");
        azanChannel.setSound(soundUri, azanAudioAttributes);
        azanChannel.enableVibration(true);
        azanChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
        azanChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        if (notificationManager.isNotificationPolicyAccessGranted()) {
            azanChannel.setBypassDnd(true);
        }
        notificationManager.createNotificationChannel(azanChannel);

        NotificationChannel reminderChannel = new NotificationChannel(
                AzanSchedulerHelper.REMINDER_CHANNEL_ID,
                "Prayer reminders",
                NotificationManager.IMPORTANCE_HIGH
        );
        reminderChannel.setDescription("Prayer reminders when full Azan playback is disabled");
        reminderChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        if (notificationManager.isNotificationPolicyAccessGranted()) {
            reminderChannel.setBypassDnd(true);
        }
        notificationManager.createNotificationChannel(reminderChannel);
    }
}
