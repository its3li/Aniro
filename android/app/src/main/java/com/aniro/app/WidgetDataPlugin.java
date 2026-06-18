package com.aniro.app;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetData")
public class WidgetDataPlugin extends Plugin {

    private static final String PREFS_NAME = "WidgetData";

    @PluginMethod
    public void updateData(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            // Save all data passed from JS
            if (call.hasOption("latitude")) {
                editor.putFloat("latitude", call.getFloat("latitude"));
            }
            if (call.hasOption("longitude")) {
                editor.putFloat("longitude", call.getFloat("longitude"));
            }
            if (call.hasOption("calculationMethod")) {
                editor.putString("calculationMethod", call.getString("calculationMethod"));
            }
            if (call.hasOption("asrMethod")) {
                editor.putString("asrMethod", call.getString("asrMethod"));
            }
            if (call.hasOption("prayerOffset")) {
                editor.putInt("prayerOffset", call.getInt("prayerOffset"));
            }
            if (call.hasOption("dstMode")) {
                editor.putString("dstMode", call.getString("dstMode"));
            }
            if (call.hasOption("widgetBackgroundColor")) {
                editor.putString("widgetBackgroundColor", call.getString("widgetBackgroundColor"));
            }
            if (call.hasOption("useSystemWidgetColor")) {
                editor.putBoolean("useSystemWidgetColor", call.getBoolean("useSystemWidgetColor"));
            }
            if (call.hasOption("language")) {
                editor.putString("language", call.getString("language"));
            }
            if (call.hasOption("azanMode")) {
                editor.putString("azanMode", call.getString("azanMode"));
            }
            if (call.hasOption("includeIshraq")) {
                editor.putBoolean("includeIshraq", call.getBoolean("includeIshraq"));
            }
            if (call.hasOption("fajrQuizEnabled")) {
                editor.putBoolean("fajrQuizEnabled", call.getBoolean("fajrQuizEnabled"));
            }
            if (call.hasOption("timeFormat")) {
                editor.putString("timeFormat", call.getString("timeFormat"));
            }

            if (!editor.commit()) {
                call.reject("Failed to save widget data");
                return;
            }

            AzanSchedulerHelper.rescheduleAll(context);
            WidgetHelper.updateAllWidgets(context);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update widget data", e);
        }
    }
}
