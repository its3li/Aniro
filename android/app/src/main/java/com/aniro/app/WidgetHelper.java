package com.aniro.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;

import com.batoulapps.adhan.CalculationParameters;
import com.batoulapps.adhan.Coordinates;
import com.batoulapps.adhan.PrayerTimes;
import com.batoulapps.adhan.data.DateComponents;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

final class WidgetHelper {
    static final String PREFS_NAME = "WidgetData";
    static final String ACTION_UPDATE_WIDGETS = "com.aniro.app.UPDATE_PRAYER_WIDGET";
    static final String ACTION_SCHEDULED_UPDATE = "com.aniro.app.SCHEDULED_UPDATE";

    private static final long MINUTE_MS = 60 * 1000L;
    private static final long HOUR_MS = 60 * MINUTE_MS;
    private static final long DAY_MS = 24 * HOUR_MS;
    private static final int DEFAULT_FILL_COLOR = 0xFF24252B;
    private static final int DEFAULT_ACCENT_COLOR = 0xFFD4AF37;

    private WidgetHelper() {
    }

    static WidgetSettings readSettings(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        WidgetSettings settings = new WidgetSettings();
        settings.latitude = prefs.getFloat("latitude", 21.4225f);
        settings.longitude = prefs.getFloat("longitude", 39.8262f);
        settings.calculationMethod = prefs.getString("calculationMethod", "muslim_world_league");
        settings.prayerOffset = getTotalOffset(
                prefs.getInt("prayerOffset", 0),
                prefs.getString("dstMode", "auto")
        );
        settings.widgetBackgroundColor = prefs.getString("widgetBackgroundColor", "#24252B");
        settings.useSystemWidgetColor = prefs.getBoolean("useSystemWidgetColor", false);
        settings.language = prefs.getString("language", "ar");
        settings.includeIshraq = prefs.getBoolean("includeIshraq", true);
        settings.timeFormat = prefs.getString("timeFormat", "12h");
        return settings;
    }

    static PrayerPlan getPrayerPlan(WidgetSettings settings, Date now) {
        List<PrayerEntry> today = getPrayerEntries(settings, now);
        List<PrayerEntry> tomorrow = getPrayerEntries(settings, new Date(now.getTime() + DAY_MS));

        PrayerEntry next = null;
        for (PrayerEntry entry : today) {
            if (entry.time.after(now)) {
                next = entry;
                break;
            }
        }
        if (next == null && !tomorrow.isEmpty()) {
            next = tomorrow.get(0);
        }

        PrayerPlan plan = new PrayerPlan();
        plan.today = today;
        plan.next = next;
        return plan;
    }

    private static List<PrayerEntry> getPrayerEntries(WidgetSettings settings, Date date) {
        Coordinates coordinates = new Coordinates(settings.latitude, settings.longitude);
        CalculationParameters params = PrayerCalculationHelper.getCalculationParameters(settings.calculationMethod);
        PrayerTimes prayerTimes = new PrayerTimes(coordinates, DateComponents.from(date), params);

        List<PrayerEntry> entries = new ArrayList<>();
        entries.add(new PrayerEntry("fajr", adjusted(prayerTimes.fajr, settings.prayerOffset)));
        if (settings.includeIshraq) {
            entries.add(new PrayerEntry("ishraq", adjusted(new Date(prayerTimes.sunrise.getTime() + 20 * MINUTE_MS), settings.prayerOffset)));
        }
        entries.add(new PrayerEntry("dhuhr", adjusted(prayerTimes.dhuhr, settings.prayerOffset)));
        entries.add(new PrayerEntry("asr", adjusted(prayerTimes.asr, settings.prayerOffset)));
        entries.add(new PrayerEntry("maghrib", adjusted(prayerTimes.maghrib, settings.prayerOffset)));
        entries.add(new PrayerEntry("isha", adjusted(prayerTimes.isha, settings.prayerOffset)));
        return entries;
    }

    private static Date adjusted(Date date, int offsetHours) {
        if (date == null || offsetHours == 0) return date;
        return new Date(date.getTime() + offsetHours * HOUR_MS);
    }

    static WidgetColors resolveColors(Context context, WidgetSettings settings) {
        int fillColor = DEFAULT_FILL_COLOR;
        int borderColor;

        if (settings.useSystemWidgetColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            fillColor = context.getColor(android.R.color.system_accent1_100);
            borderColor = context.getColor(android.R.color.system_accent1_600);
        } else {
            try {
                fillColor = Color.parseColor(settings.widgetBackgroundColor);
            } catch (Exception ignored) {
                fillColor = DEFAULT_FILL_COLOR;
            }
            borderColor = adjustColorBrightness(fillColor);
        }

        boolean light = isColorLight(fillColor);
        WidgetColors colors = new WidgetColors();
        colors.fill = fillColor;
        colors.border = borderColor;
        colors.text = light ? 0xFF20242C : 0xFFFFFFFF;
        colors.label = light ? 0xFF60646C : 0xFFB8BBC2;
        colors.accent = light ? 0xFFA36F00 : DEFAULT_ACCENT_COLOR;
        colors.inactiveFill = light ? 0xFFE9EDF3 : 0xFF2A2E38;
        colors.inactiveBorder = light ? 0xFFD2D8E2 : 0xFF454B57;
        colors.inactiveText = light ? 0xFF68707D : 0xFFADB2BC;
        return colors;
    }

    static void applyBackground(RemoteViews views, WidgetColors colors) {
        views.setInt(R.id.widget_background_fill, "setColorFilter", colors.fill);
        views.setInt(R.id.widget_background_border, "setColorFilter", colors.border);
    }

    static void startCountdown(RemoteViews views, int chronometerId, Date targetTime) {
        if (targetTime == null) {
            views.setTextViewText(chronometerId, "--:--");
            return;
        }

        long remainingMs = Math.max(0, targetTime.getTime() - System.currentTimeMillis());
        views.setChronometer(chronometerId, SystemClock.elapsedRealtime() + remainingMs, null, true);
        views.setChronometerCountDown(chronometerId, true);
    }

    static String formatTime(Date time, WidgetSettings settings) {
        if (time == null) return "--:--";
        boolean is24h = "24h".equals(settings.timeFormat);
        Locale locale = settings.isArabic() ? new Locale("ar") : Locale.ENGLISH;
        String pattern = is24h ? "HH:mm" : "h:mm a";
        return new SimpleDateFormat(pattern, locale).format(time);
    }

    static String formatAtTime(Date time, WidgetSettings settings) {
        String formatted = formatTime(time, settings);
        return settings.isArabic() ? "\u0641\u064a " + formatted : "at " + formatted;
    }

    static String prayerName(String key, boolean isArabic) {
        if (!isArabic) {
            switch (key) {
                case "fajr": return "Fajr";
                case "ishraq": return "Ishraq";
                case "dhuhr": return "Dhuhr";
                case "asr": return "Asr";
                case "maghrib": return "Maghrib";
                case "isha": return "Isha";
                default: return "";
            }
        }

        switch (key) {
            case "fajr": return "\u0627\u0644\u0641\u062c\u0631";
            case "ishraq": return "\u0627\u0644\u0636\u062d\u0649";
            case "dhuhr": return "\u0627\u0644\u0638\u0647\u0631";
            case "asr": return "\u0627\u0644\u0639\u0635\u0631";
            case "maghrib": return "\u0627\u0644\u0645\u063a\u0631\u0628";
            case "isha": return "\u0627\u0644\u0639\u0634\u0627\u0621";
            default: return "";
        }
    }

    static String nextPrayerLabel(boolean isArabic) {
        return isArabic ? "\u0627\u0644\u0635\u0644\u0627\u0629 \u0627\u0644\u0642\u0627\u062f\u0645\u0629" : "Next Prayer";
    }

    static String nextAfterLabel(boolean isArabic) {
        return isArabic ? "\u0627\u0644\u0635\u0644\u0627\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629 \u0628\u0639\u062f" : "Next prayer after";
    }

    static PendingIntent launchAppIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        return PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void scheduleNextUpdate(Context context, Class<?> receiverClass, int requestCode, Date nextPrayerTime) {
        if (nextPrayerTime == null) return;

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        Intent intent = new Intent(context, receiverClass);
        intent.setAction(ACTION_SCHEDULED_UPDATE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        long triggerTime = nextPrayerTime.getTime() + 1000;

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
            }
        } catch (SecurityException ignored) {
            alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
        }
    }

    static void updateAllWidgets(Context context) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

        ComponentName nextPrayerWidget = new ComponentName(context, PrayerWidgetProvider.class);
        int[] nextPrayerWidgetIds = appWidgetManager.getAppWidgetIds(nextPrayerWidget);
        for (int appWidgetId : nextPrayerWidgetIds) {
            PrayerWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId);
        }

        ComponentName dailyWidget = new ComponentName(context, DailyPrayersWidgetProvider.class);
        int[] dailyWidgetIds = appWidgetManager.getAppWidgetIds(dailyWidget);
        for (int appWidgetId : dailyWidgetIds) {
            DailyPrayersWidgetProvider.updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private static int adjustColorBrightness(int color) {
        float[] hsv = new float[3];
        Color.colorToHSV(color, hsv);
        if (hsv[2] > 0.7f) {
            hsv[2] *= 0.68f;
        } else {
            hsv[2] = Math.min(1.0f, Math.max(0.2f, hsv[2] * 1.35f));
        }
        return Color.HSVToColor(hsv);
    }

    private static boolean isColorLight(int color) {
        double darkness = 1 - (0.299 * Color.red(color) + 0.587 * Color.green(color) + 0.114 * Color.blue(color)) / 255;
        return darkness < 0.5;
    }

    private static int getTotalOffset(int baseOffset, String dstMode) {
        return "on".equals(dstMode) ? baseOffset + 1 : baseOffset;
    }

    static final class WidgetSettings {
        double latitude;
        double longitude;
        String calculationMethod;
        int prayerOffset;
        String widgetBackgroundColor;
        boolean useSystemWidgetColor;
        String language;
        boolean includeIshraq;
        String timeFormat;

        boolean isArabic() {
            return "ar".equals(language);
        }
    }

    static final class WidgetColors {
        int fill;
        int border;
        int text;
        int label;
        int accent;
        int inactiveFill;
        int inactiveBorder;
        int inactiveText;
    }

    static final class PrayerEntry {
        final String key;
        final Date time;

        PrayerEntry(String key, Date time) {
            this.key = key;
            this.time = time;
        }
    }

    static final class PrayerPlan {
        List<PrayerEntry> today;
        PrayerEntry next;
    }
}
