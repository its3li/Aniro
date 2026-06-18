package com.aniro.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

public final class AzanSchedulerHelper {
    public static final String PREFS_NAME = "WidgetData";
    public static final String AZAN_NOTIFICATION_CHANNEL_ID = "azan_channel";
    public static final String REMINDER_CHANNEL_ID = "azan_reminder_channel";
    public static final String PLAYBACK_CHANNEL_ID = "azan_alarm_channel";
    public static final String EXTRA_NOTIFICATION_ID = "notificationId";
    public static final String EXTRA_PRAYER_KEY = "prayerKey";
    public static final String EXTRA_PRAYER_NAME = "prayerName";
    public static final String EXTRA_PRAYER_TIME = "prayerTime";
    public static final String EXTRA_AZAN_MODE = "azanMode";
    public static final String EXTRA_REQUIRE_CHALLENGE = "requireChallenge";

    private static final String TAG = "AzanScheduler";
    private static final String PREF_PENDING_FAJR_CHALLENGE = "pendingFajrChallenge";
    private static final String PREF_PENDING_FAJR_CHALLENGE_NAME = "pendingFajrChallengeName";
    private static final String PREF_PENDING_FAJR_CHALLENGE_TIME = "pendingFajrChallengeTime";
    private static final int REQUEST_CODE_BASE = 3000;
    private static final int MAX_SCHEDULED_ALARMS = 64;
    private static final int DAYS_TO_SCHEDULE = 10;
    private static final double DEFAULT_LAT = 21.4225;
    private static final double DEFAULT_LNG = 39.8262;
    private static final long HOUR_MS = 60L * 60L * 1000L;
    private static final long MINUTE_MS = 60L * 1000L;

    private AzanSchedulerHelper() {
    }

    public static int rescheduleAll(Context context) {
        cancelAll(context);
        return scheduleAll(context);
    }

    public static void cancelAll(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return;
        }

        for (int i = 0; i < MAX_SCHEDULED_ALARMS; i++) {
            int requestCode = REQUEST_CODE_BASE + i;
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    new Intent(context, AzanAlarmReceiver.class),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
    }

    public static int scheduleAll(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) {
            return 0;
        }

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        double latitude = prefs.getFloat("latitude", (float) DEFAULT_LAT);
        double longitude = prefs.getFloat("longitude", (float) DEFAULT_LNG);
        String calculationMethod = prefs.getString("calculationMethod", "muslim_world_league");
        int prayerOffset = getTotalOffset(
                prefs.getInt("prayerOffset", 0),
                prefs.getString("dstMode", "auto")
        );
        String language = prefs.getString("language", "ar");
        String azanMode = prefs.getString("azanMode", "full");
        boolean includeIshraq = prefs.getBoolean("includeIshraq", true);
        boolean fajrQuizEnabled = prefs.getBoolean("fajrQuizEnabled", true);

        Coordinates coordinates = new Coordinates(latitude, longitude);
        CalculationParameters params = PrayerCalculationHelper.getCalculationParameters(calculationMethod);
        long now = System.currentTimeMillis();

        List<PrayerEntry> entries = new ArrayList<>();
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(now);

        for (int day = 0; day < DAYS_TO_SCHEDULE; day++) {
            Date date = calendar.getTime();
            PrayerTimes prayerTimes = new PrayerTimes(coordinates, DateComponents.from(date), params);

            entries.add(new PrayerEntry("fajr", localizePrayerName("fajr", language), applyOffset(prayerTimes.fajr, prayerOffset)));
            if (includeIshraq) {
                Date ishraq = new Date(prayerTimes.sunrise.getTime() + 20L * MINUTE_MS);
                entries.add(new PrayerEntry("ishraq", localizePrayerName("ishraq", language), applyOffset(ishraq, prayerOffset)));
            }
            entries.add(new PrayerEntry("dhuhr", localizePrayerName("dhuhr", language), applyOffset(prayerTimes.dhuhr, prayerOffset)));
            entries.add(new PrayerEntry("asr", localizePrayerName("asr", language), applyOffset(prayerTimes.asr, prayerOffset)));
            entries.add(new PrayerEntry("maghrib", localizePrayerName("maghrib", language), applyOffset(prayerTimes.maghrib, prayerOffset)));
            entries.add(new PrayerEntry("isha", localizePrayerName("isha", language), applyOffset(prayerTimes.isha, prayerOffset)));

            calendar.add(Calendar.DATE, 1);
        }

        int index = 0;
        for (PrayerEntry entry : entries) {
            if (entry.triggerAt.getTime() <= now) {
                continue;
            }
            if (index >= MAX_SCHEDULED_ALARMS) {
                break;
            }

            int requestCode = REQUEST_CODE_BASE + index;
            Intent intent = new Intent(context, AzanAlarmReceiver.class);
            intent.putExtra(EXTRA_NOTIFICATION_ID, requestCode);
            intent.putExtra(EXTRA_PRAYER_KEY, entry.prayerKey);
            intent.putExtra(EXTRA_PRAYER_NAME, entry.displayName);
            intent.putExtra(EXTRA_PRAYER_TIME, entry.triggerAt.getTime());
            intent.putExtra(EXTRA_AZAN_MODE, azanMode);
            intent.putExtra(EXTRA_REQUIRE_CHALLENGE, fajrQuizEnabled && "fajr".equals(entry.prayerKey));

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    context,
                    requestCode,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            scheduleAlarm(alarmManager, entry.triggerAt.getTime(), pendingIntent);
            index++;
        }

        Log.d(TAG, "Scheduled " + index + " azan alarms");
        return index;
    }

    public static void markPendingFajrChallenge(Context context, String prayerName, long prayerTime) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putBoolean(PREF_PENDING_FAJR_CHALLENGE, true)
                .putString(PREF_PENDING_FAJR_CHALLENGE_NAME, prayerName)
                .putLong(PREF_PENDING_FAJR_CHALLENGE_TIME, prayerTime)
                .commit();
    }

    public static PendingFajrChallenge getPendingFajrChallenge(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        if (!prefs.getBoolean(PREF_PENDING_FAJR_CHALLENGE, false)) {
            return null;
        }

        long prayerTime = prefs.getLong(PREF_PENDING_FAJR_CHALLENGE_TIME, 0L);
        if (prayerTime <= 0L || System.currentTimeMillis() - prayerTime > 3L * HOUR_MS) {
            clearPendingFajrChallenge(context);
            return null;
        }

        String prayerName = prefs.getString(PREF_PENDING_FAJR_CHALLENGE_NAME, localizePrayerName("fajr", prefs.getString("language", "ar")));
        return new PendingFajrChallenge(prayerName, prayerTime);
    }

    public static void clearPendingFajrChallenge(Context context) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .remove(PREF_PENDING_FAJR_CHALLENGE)
                .remove(PREF_PENDING_FAJR_CHALLENGE_NAME)
                .remove(PREF_PENDING_FAJR_CHALLENGE_TIME)
                .commit();
    }

    public static boolean canScheduleExactAlarms(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return alarmManager != null && canScheduleExactAlarms(alarmManager);
    }

    private static void scheduleAlarm(AlarmManager alarmManager, long triggerAtMillis, PendingIntent pendingIntent) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (canScheduleExactAlarms(alarmManager)) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                } else {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
                }
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        } catch (SecurityException securityException) {
            Log.w(TAG, "Exact alarm denied; using inexact fallback", securityException);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtMillis, pendingIntent);
            }
        }
    }

    private static boolean canScheduleExactAlarms(AlarmManager alarmManager) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms();
    }

    private static Date applyOffset(Date date, int prayerOffsetHours) {
        return new Date(date.getTime() + prayerOffsetHours * HOUR_MS);
    }

    private static int getTotalOffset(int baseOffset, String dstMode) {
        return "on".equals(dstMode) ? baseOffset + 1 : baseOffset;
    }

    private static String localizePrayerName(String prayerKey, String language) {
        boolean isArabic = "ar".equals(language);
        switch (prayerKey) {
            case "fajr":
                return isArabic ? "\u0627\u0644\u0641\u062c\u0631" : "Fajr";
            case "ishraq":
                return isArabic ? "\u0627\u0644\u0636\u062d\u0649" : "Ishraq";
            case "dhuhr":
                return isArabic ? "\u0627\u0644\u0638\u0647\u0631" : "Dhuhr";
            case "asr":
                return isArabic ? "\u0627\u0644\u0639\u0635\u0631" : "Asr";
            case "maghrib":
                return isArabic ? "\u0627\u0644\u0645\u063a\u0631\u0628" : "Maghrib";
            case "isha":
                return isArabic ? "\u0627\u0644\u0639\u0634\u0627\u0621" : "Isha";
            default:
                return prayerKey;
        }
    }

    private static class PrayerEntry {
        final String prayerKey;
        final String displayName;
        final Date triggerAt;

        PrayerEntry(String prayerKey, String displayName, Date triggerAt) {
            this.prayerKey = prayerKey;
            this.displayName = displayName;
            this.triggerAt = triggerAt;
        }
    }

    public static class PendingFajrChallenge {
        public final String prayerName;
        public final long prayerTime;

        PendingFajrChallenge(String prayerName, long prayerTime) {
            this.prayerName = prayerName;
            this.prayerTime = prayerTime;
        }
    }
}
