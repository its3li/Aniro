package com.aniro.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class AzanPlaybackService extends Service {
    public static final String ACTION_START = "com.aniro.app.action.START_AZAN";
    public static final String ACTION_STOP = "com.aniro.app.action.STOP_AZAN";

    private static final String TAG = "AzanPlaybackService";
    private static final int FOREGROUND_NOTIFICATION_ID = 7001;

    private MediaPlayer mediaPlayer;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private int previousInterruptionFilter = NotificationManager.INTERRUPTION_FILTER_UNKNOWN;

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopPlayback();
            stopSelf();
            return START_NOT_STICKY;
        }

        String prayerName = intent != null
                ? intent.getStringExtra(AzanSchedulerHelper.EXTRA_PRAYER_NAME)
                : getString(R.string.app_name);
        boolean requireChallenge = intent != null
                && intent.getBooleanExtra(AzanSchedulerHelper.EXTRA_REQUIRE_CHALLENGE, false);

        ensureAlarmChannel();
        try {
            startForegroundCompat(buildForegroundNotification(prayerName, requireChallenge));
        } catch (RuntimeException exception) {
            Log.w(TAG, "Unable to start foreground azan playback", exception);
            stopSelf();
            return START_NOT_STICKY;
        }

        startPlayback(requireChallenge);
        return START_NOT_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }

    private void startForegroundCompat(Notification notification) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                    FOREGROUND_NOTIFICATION_ID,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
            return;
        }

        startForeground(FOREGROUND_NOTIFICATION_ID, notification);
    }

    private void startPlayback(boolean requireChallenge) {
        stopPlayback();
        relaxInterruptionFilterIfAllowed();

        try {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();

            requestAudioFocus(audioAttributes);

            mediaPlayer = new MediaPlayer();
            mediaPlayer.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            mediaPlayer.setAudioAttributes(audioAttributes);

            AssetFileDescriptor afd = getResources().openRawResourceFd(R.raw.azan);
            if (afd == null) {
                stopSelf();
                return;
            }

            mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            mediaPlayer.setLooping(requireChallenge);
            mediaPlayer.setOnCompletionListener(mp -> {
                stopPlayback();
                stopSelf();
            });
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                Log.w(TAG, "Azan playback error: " + what + "/" + extra);
                stopPlayback();
                stopSelf();
                return true;
            });
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception exception) {
            Log.w(TAG, "Could not play azan audio", exception);
            stopPlayback();
            stopSelf();
        }
    }

    private void stopPlayback() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
            } catch (IllegalStateException ignored) {
            }
            mediaPlayer.release();
            mediaPlayer = null;
        }
        abandonAudioFocus();
        restoreInterruptionFilter();
    }

    private void requestAudioFocus(AudioAttributes audioAttributes) {
        audioManager = getSystemService(AudioManager.class);
        if (audioManager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                    .setAudioAttributes(audioAttributes)
                    .setWillPauseWhenDucked(false)
                    .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(
                    null,
                    AudioManager.STREAM_ALARM,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
            );
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) {
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            audioManager.abandonAudioFocus(null);
        }
        audioManager = null;
    }

    private Notification buildForegroundNotification(String prayerName, boolean requireChallenge) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPendingIntent = PendingIntent.getActivity(
                this,
                0,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, AzanSchedulerHelper.PLAYBACK_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(prayerName)
                .setContentText(requireChallenge ? localizedChallengeText() : localizedText())
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setContentIntent(openPendingIntent)
                .setFullScreenIntent(openPendingIntent, true);

        if (requireChallenge) {
            builder.addAction(android.R.drawable.ic_menu_view, localizedOpenChallengeText(), openPendingIntent);
        } else {
            Intent stopIntent = new Intent(this, AzanPlaybackService.class);
            stopIntent.setAction(ACTION_STOP);
            PendingIntent stopPendingIntent = PendingIntent.getService(
                    this,
                    1,
                    stopIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            builder.addAction(android.R.drawable.ic_media_pause, localizedStopText(), stopPendingIntent);
        }

        return builder.build();
    }

    private void ensureAlarmChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        if (notificationManager == null || notificationManager.getNotificationChannel(AzanSchedulerHelper.PLAYBACK_CHANNEL_ID) != null) {
            return;
        }

        NotificationChannel channel = new NotificationChannel(
                AzanSchedulerHelper.PLAYBACK_CHANNEL_ID,
                "Azan alarms",
                NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Foreground Azan playback alarms");
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
        channel.setSound(null, audioAttributes);
        if (notificationManager.isNotificationPolicyAccessGranted()) {
            channel.setBypassDnd(true);
        }
        notificationManager.createNotificationChannel(channel);
    }

    private void relaxInterruptionFilterIfAllowed() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }

        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        if (notificationManager == null || !notificationManager.isNotificationPolicyAccessGranted()) {
            return;
        }

        previousInterruptionFilter = notificationManager.getCurrentInterruptionFilter();
        notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
    }

    private void restoreInterruptionFilter() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            return;
        }

        if (previousInterruptionFilter == NotificationManager.INTERRUPTION_FILTER_UNKNOWN) {
            return;
        }

        NotificationManager notificationManager = getSystemService(NotificationManager.class);
        if (notificationManager != null && notificationManager.isNotificationPolicyAccessGranted()) {
            notificationManager.setInterruptionFilter(previousInterruptionFilter);
        }
        previousInterruptionFilter = NotificationManager.INTERRUPTION_FILTER_UNKNOWN;
    }

    private String localizedText() {
        return isArabic() ? "\u0627\u0644\u0623\u0630\u0627\u0646 \u064a\u0639\u0645\u0644" : "Azan is playing";
    }

    private String localizedChallengeText() {
        return isArabic()
                ? "\u0623\u0643\u0645\u0644 \u0627\u0644\u062a\u062d\u062f\u064a \u0644\u0625\u064a\u0642\u0627\u0641 \u0623\u0630\u0627\u0646 \u0627\u0644\u0641\u062c\u0631"
                : "Complete the challenge to stop Fajr azan";
    }

    private String localizedOpenChallengeText() {
        return isArabic() ? "\u0641\u062a\u062d \u0627\u0644\u062a\u062d\u062f\u064a" : "Open challenge";
    }

    private String localizedStopText() {
        return isArabic() ? "\u0625\u064a\u0642\u0627\u0641" : "Stop";
    }

    private boolean isArabic() {
        SharedPreferences prefs = getSharedPreferences(AzanSchedulerHelper.PREFS_NAME, MODE_PRIVATE);
        return "ar".equals(prefs.getString("language", "ar"));
    }
}
