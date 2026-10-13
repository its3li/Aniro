package com.aniro.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.View;

public class PrayerWidgetProvider extends AppWidgetProvider {
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
        int width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250);
        int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 60);
        RemoteViews views = new RemoteViews(context.getPackageName(),
                width < 220 || height >= 120 ? R.layout.prayer_widget_compact : R.layout.prayer_widget);
        views.setTextViewTextSize(R.id.widget_time_remaining, TypedValue.COMPLEX_UNIT_SP, width < 140 ? 20 : height >= 160 ? 34 : 26);
        views.setViewVisibility(R.id.widget_icon, width < 220 && height < 110 ? View.GONE : View.VISIBLE);
        views.setViewVisibility(R.id.widget_label, width < 220 && height < 110 ? View.GONE : View.VISIBLE);
        WidgetHelper.applyBackground(views, colors);

        boolean isArabic = settings.isArabic();
        String prayerName = plan.next == null ? "" : WidgetHelper.prayerName(plan.next.key, isArabic);

        views.setTextViewText(R.id.widget_label, WidgetHelper.nextPrayerLabel(isArabic));
        views.setTextViewText(R.id.widget_prayer_name, prayerName);

        views.setTextColor(R.id.widget_label, colors.label);
        views.setTextColor(R.id.widget_prayer_name, colors.text);
        views.setTextColor(R.id.widget_time_remaining, colors.accent);
        views.setInt(R.id.widget_icon, "setColorFilter", colors.text);

        WidgetHelper.startCountdown(
            views,
            R.id.widget_time_remaining,
            plan.next == null ? null : plan.next.time
        );

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
}
