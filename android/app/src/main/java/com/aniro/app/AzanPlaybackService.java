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
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.provider.Settings;
import android.view.WindowManager;
import android.view.Gravity;
import android.graphics.PixelFormat;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.graphics.drawable.GradientDrawable;
import android.graphics.Typeface;
import android.view.View;

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
    private LinearLayout challengeOverlay;

    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    private GradientDrawable surface(int fill, int border, int radius) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setColor(fill);
        drawable.setCornerRadius(dp(radius));
        drawable.setStroke(dp(1), border);
        return drawable;
    }

    private TextView challengeText(String text, int size, int color) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextSize(size);
        view.setTextColor(color);
        view.setGravity(Gravity.CENTER);
        view.setFontFeatureSettings("kern");
        return view;
    }

    private void showChallengeOverlay() {
        if (!Settings.canDrawOverlays(this) || challengeOverlay != null) return;
        challengeOverlay = new LinearLayout(this);
        challengeOverlay.setOrientation(LinearLayout.VERTICAL);
        challengeOverlay.setGravity(Gravity.CENTER);
        challengeOverlay.setPadding(dp(24), dp(32), dp(24), dp(32));
        challengeOverlay.setBackgroundColor(0xff000000);
        LinearLayout content = new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER);
        int width = Math.min(getResources().getDisplayMetrics().widthPixels - dp(48), dp(400));
        challengeOverlay.addView(content, new LinearLayout.LayoutParams(width, -2));
        TextView moon = challengeText("☾", 28, 0xfffcd34d);
        moon.setBackground(surface(0x1afbbf24, 0x66fcd34d, 28));
        LinearLayout.LayoutParams moonParams = new LinearLayout.LayoutParams(dp(56), dp(56));
        moonParams.bottomMargin = dp(16);
        content.addView(moon, moonParams);
        TextView title = challengeText("أكمل الآية لإيقاف أذان الفجر", 20, 0xfffcd34d);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        content.addView(title);
        TextView subtitle = challengeText("اختر الكلمة الناقصة", 14, 0x8cffffff);
        LinearLayout.LayoutParams subtitleParams = new LinearLayout.LayoutParams(-1, -2);
        subtitleParams.topMargin = dp(12);
        subtitleParams.bottomMargin = dp(32);
        content.addView(subtitle, subtitleParams);
        LinearLayout verseCard = new LinearLayout(this);
        verseCard.setOrientation(LinearLayout.VERTICAL);
        verseCard.setPadding(dp(24), dp(24), dp(24), dp(24));
        verseCard.setBackground(surface(0x0dffffff, 0x1affffff, 16));
        TextView question = challengeText("قُلْ هُوَ اللَّهُ  ؟؟؟", 28, 0xffffffff);
        question.setTextDirection(View.TEXT_DIRECTION_RTL);
        question.setLineSpacing(dp(12), 1.2f);
        verseCard.addView(question);
        TextView reference = challengeText("سورة الإخلاص - الآية ١", 12, 0x59ffffff);
        LinearLayout.LayoutParams referenceParams = new LinearLayout.LayoutParams(-1, -2);
        referenceParams.topMargin = dp(16);
        verseCard.addView(reference, referenceParams);
        LinearLayout.LayoutParams verseParams = new LinearLayout.LayoutParams(-1, -2);
        verseParams.bottomMargin = dp(32);
        content.addView(verseCard, verseParams);
        java.util.List<String> choices = new java.util.ArrayList<>(java.util.Arrays.asList("أَحَدٌ", "الصَّمَدُ", "الْفَلَقِ", "النَّاسِ"));
        java.util.Collections.shuffle(choices);
        java.util.List<TextView> buttons = new java.util.ArrayList<>();
        TextView feedback = challengeText("", 16, 0xfffde68a);
        for (int rowIndex = 0; rowIndex < 2; rowIndex++) {
            LinearLayout row = new LinearLayout(this);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(-1, -2);
            rowParams.bottomMargin = dp(12);
            content.addView(row, rowParams);
            for (int column = 0; column < 2; column++) {
            String choice = choices.get(rowIndex * 2 + column);
            TextView button = challengeText(choice, 22, 0xffffffff);
            button.setPadding(dp(16), dp(16), dp(16), dp(16));
            button.setBackground(surface(0x0dffffff, 0x1affffff, 12));
            button.setClickable(true);
            buttons.add(button);
            button.setOnClickListener(view -> {
                for (TextView item : buttons) item.setEnabled(false);
                if ("أَحَدٌ".equals(choice)) {
                    button.setBackground(surface(0x26fbbf24, 0xfffcd34d, 12));
                    button.setTextColor(0xfffde68a);
                    question.setText("قُلْ هُوَ اللَّهُ أَحَدٌ");
                    verseCard.setBackground(surface(0x1afbbf24, 0x99fbbf24, 16));
                    feedback.setText("أحسنت! إجابة صحيحة\nجاري إيقاف الأذان...");
                    handler.postDelayed(() -> {
                        AzanSchedulerHelper.clearPendingFajrChallenge(this);
                        removeChallengeOverlay();
                        stopPlayback();
                        stopSelf();
                    }, 900);
                } else {
                    button.setBackground(surface(0x33ef4444, 0xffef4444, 12));
                    button.animate().translationX(dp(8)).setDuration(80).withEndAction(() ->
                        button.animate().translationX(0).setDuration(100).start()).start();
                    handler.postDelayed(() -> {
                        button.setBackground(surface(0x0dffffff, 0x1affffff, 12));
                        for (TextView item : buttons) item.setEnabled(true);
                    }, 650);
                }
            });
            LinearLayout.LayoutParams buttonParams = new LinearLayout.LayoutParams(0, -2, 1);
            if (column == 0) buttonParams.rightMargin = dp(12);
            row.addView(button, buttonParams);
            }
        }
        content.addView(feedback);
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(-1, -1,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        try {
            ((WindowManager) getSystemService(WINDOW_SERVICE)).addView(challengeOverlay, params);
        } catch (RuntimeException exception) {
            challengeOverlay = null;
            Log.w(TAG, "Unable to show challenge overlay", exception);
        }
    }

    private void removeChallengeOverlay() {
        if (challengeOverlay == null) return;
        try { ((WindowManager) getSystemService(WINDOW_SERVICE)).removeView(challengeOverlay); }
        catch (RuntimeException ignored) { }
        challengeOverlay = null;
    }
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable playbackTimeout = () -> {
        stopPlayback();
        // Keep the notification and overlay until the pending question is solved.
    };
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
        if (requireChallenge && mediaPlayer != null && mediaPlayer.isPlaying()) {
            long prayerTime = intent.getLongExtra(AzanSchedulerHelper.EXTRA_PRAYER_TIME, System.currentTimeMillis());
            AzanSchedulerHelper.markPendingFajrChallenge(this, prayerName, prayerTime);
            // Bound audio duration while retaining the unanswered question.
            handler.postDelayed(playbackTimeout, 10L * 60L * 1000L);
            showChallengeOverlay();
        }
        return START_NOT_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        removeChallengeOverlay();
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
        handler.removeCallbacks(playbackTimeout);
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
        try {
            notificationManager.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL);
        } catch (SecurityException exception) {
            previousInterruptionFilter = NotificationManager.INTERRUPTION_FILTER_UNKNOWN;
            Log.w(TAG, "DND access was revoked", exception);
        }
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
            try {
                notificationManager.setInterruptionFilter(previousInterruptionFilter);
            } catch (SecurityException exception) {
                Log.w(TAG, "Unable to restore DND after access was revoked", exception);
            }
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
