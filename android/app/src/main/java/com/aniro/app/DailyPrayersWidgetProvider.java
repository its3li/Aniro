package com.aniro.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;
import android.os.Bundle;
import android.util.TypedValue;

public class DailyPrayersWidgetProvider extends AppWidgetProvider {
    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        updateAppWidget(context, manager, id);
    }
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent.getAction();
        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action)
            || WidgetHelper.ACTION_UPDATE_WIDGETS.equals(action)
            || WidgetHelper.ACTION_SCHEDULED_UPDATE.equals(action)) {
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName componentName = new ComponentName(context, getClass());
            onUpdate(context, appWidgetManager, appWidgetManager.getAppWidgetIds(componentName));
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        WidgetHelper.WidgetSettings settings = WidgetHelper.readSettings(context);
        WidgetHelper.PrayerPlan plan = WidgetHelper.getPrayerPlan(settings, new java.util.Date());
        WidgetHelper.WidgetColors colors = WidgetHelper.resolveColors(context, settings);

        Bundle options = appWidgetManager.getAppWidgetOptions(appWidgetId);
        int width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 300);
        int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 150);
        boolean agenda = height >= 250;
        RemoteViews views = new RemoteViews(context.getPackageName(), agenda ? R.layout.daily_prayers_agenda : R.layout.daily_prayers_widget);
        views.setTextViewTextSize(R.id.widget_countdown, TypedValue.COMPLEX_UNIT_SP, height < 120 ? 22 : 30);
        views.setViewVisibility(R.id.top_section, height < 110 ? View.GONE : View.VISIBLE);
        WidgetHelper.applyBackground(views, colors);

        boolean isArabic = settings.isArabic();
        String nextPrayerName = plan.next == null ? "" : WidgetHelper.prayerName(plan.next.key, isArabic);

        views.setTextViewText(R.id.widget_prayer_name, nextPrayerName);
        views.setTextViewText(R.id.widget_next_prayer_label, plan.next == null ? "" : WidgetHelper.formatAtTime(plan.next.time, settings));
        views.setTextViewText(R.id.widget_next_after_label, WidgetHelper.nextAfterLabel(isArabic));

        views.setTextColor(R.id.widget_prayer_name, colors.text);
        views.setTextColor(R.id.widget_next_prayer_label, colors.label);
        views.setTextColor(R.id.widget_next_after_label, colors.label);
        views.setTextColor(R.id.widget_countdown, colors.accent);

        WidgetHelper.startCountdown(
            views,
            R.id.widget_countdown,
            plan.next == null ? null : plan.next.time
        );

        bindPrayerItems(context, views, settings, plan, colors);

        views.setOnClickPendingIntent(R.id.widget_container, WidgetHelper.launchAppIntent(context));
        appWidgetManager.updateAppWidget(appWidgetId, views);

        if (plan.next != null) {
            android.appwidget.AppWidgetProviderInfo info = appWidgetManager.getAppWidgetInfo(appWidgetId);
            if (info != null) {
                try { WidgetHelper.scheduleNextUpdate(context, Class.forName(info.provider.getClassName()), info.provider.hashCode(), plan.next.time); }
                catch (ClassNotFoundException ignored) { }
            }
        }
    }

    private static void bindPrayerItems(
        Context context,
        RemoteViews views,
        WidgetHelper.WidgetSettings settings,
        WidgetHelper.PrayerPlan plan,
        WidgetHelper.WidgetColors colors
    ) {
        bindPrayerItem(
            views,
            settings,
            colors,
            findEntry(plan, "fajr"),
            "fajr".equals(plan.next == null ? "" : plan.next.key),
            R.id.fajr_item,
            R.id.fajr_name,
            R.id.fajr_time,
            R.id.fajr_icon,
            R.id.fajr_icon_fill,
            R.id.fajr_icon_border
        );

        bindPrayerItem(
            views,
            settings,
            colors,
            findEntry(plan, "ishraq"),
            "ishraq".equals(plan.next == null ? "" : plan.next.key),
            R.id.ishraq_item,
            R.id.ishraq_name,
            R.id.ishraq_time,
            R.id.ishraq_icon,
            R.id.ishraq_icon_fill,
            R.id.ishraq_icon_border
        );

        bindPrayerItem(
            views,
            settings,
            colors,
            findEntry(plan, "dhuhr"),
            "dhuhr".equals(plan.next == null ? "" : plan.next.key),
            R.id.dhuhr_item,
            R.id.dhuhr_name,
            R.id.dhuhr_time,
            R.id.dhuhr_icon,
            R.id.dhuhr_icon_fill,
            R.id.dhuhr_icon_border
        );

        bindPrayerItem(
            views,
            settings,
            colors,
            findEntry(plan, "asr"),
            "asr".equals(plan.next == null ? "" : plan.next.key),
            R.id.asr_item,
            R.id.asr_name,
            R.id.asr_time,
            R.id.asr_icon,
            R.id.asr_icon_fill,
            R.id.asr_icon_border
        );

        bindPrayerItem(
            views,
            settings,
            colors,
            findEntry(plan, "maghrib"),
            "maghrib".equals(plan.next == null ? "" : plan.next.key),
            R.id.maghrib_item,
            R.id.maghrib_name,
            R.id.maghrib_time,
            R.id.maghrib_icon,
            R.id.maghrib_icon_fill,
            R.id.maghrib_icon_border
        );

        bindPrayerItem(
            views,
            settings,
            colors,
            findEntry(plan, "isha"),
            "isha".equals(plan.next == null ? "" : plan.next.key),
            R.id.isha_item,
            R.id.isha_name,
            R.id.isha_time,
            R.id.isha_icon,
            R.id.isha_icon_fill,
            R.id.isha_icon_border
        );
    }

    private static WidgetHelper.PrayerEntry findEntry(WidgetHelper.PrayerPlan plan, String key) {
        for (WidgetHelper.PrayerEntry entry : plan.today) {
            if (key.equals(entry.key)) return entry;
        }
        return null;
    }

    private static void bindPrayerItem(
        RemoteViews views,
        WidgetHelper.WidgetSettings settings,
        WidgetHelper.WidgetColors colors,
        WidgetHelper.PrayerEntry entry,
        boolean isActive,
        int itemId,
        int nameId,
        int timeId,
        int iconId,
        int fillId,
        int borderId
    ) {
        if (entry == null) {
            views.setViewVisibility(itemId, View.GONE);
            return;
        }

        views.setViewVisibility(itemId, View.VISIBLE);
        views.setTextViewText(nameId, WidgetHelper.prayerName(entry.key, settings.isArabic()));
        views.setTextViewText(timeId, WidgetHelper.formatTime(entry.time, settings));

        int activeIconColor = 0xFF1B1D22;
        views.setInt(fillId, "setColorFilter", isActive ? colors.accent : colors.inactiveFill);
        views.setInt(borderId, "setColorFilter", isActive ? colors.border : colors.inactiveBorder);
        views.setInt(iconId, "setColorFilter", isActive ? activeIconColor : colors.inactiveText);

        views.setTextColor(nameId, isActive ? colors.accent : colors.inactiveText);
        views.setTextColor(timeId, isActive ? colors.accent : colors.inactiveText);
    }

    private static boolean isColorLight(int color) {
        double darkness = 1 - (0.299 * android.graphics.Color.red(color) + 0.587 * android.graphics.Color.green(color) + 0.114 * android.graphics.Color.blue(color)) / 255;
        return darkness < 0.5;
    }
}
