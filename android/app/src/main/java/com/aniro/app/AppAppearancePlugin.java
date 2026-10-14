package com.aniro.app;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Build;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppAppearance")
public class AppAppearancePlugin extends Plugin {
    private boolean dark = true;
    private int background = Color.rgb(14, 19, 27);

    @PluginMethod
    public void setTheme(PluginCall call) {
        dark = call.getBoolean("dark", true);
        try {
            background = Color.parseColor(call.getString("background", "#0e131b"));
        } catch (IllegalArgumentException error) {
            call.reject("Invalid background color");
            return;
        }
        getActivity().runOnUiThread(() -> {
            applyAppearance();
            call.resolve();
        });
    }

    @SuppressWarnings("deprecation")
    private void applyAppearance() {
        Window window = getActivity().getWindow();
        window.setBackgroundDrawable(new ColorDrawable(background));
        // Android 15+ draws the CSS safe-area surface beneath a transparent bar.
        window.setStatusBarColor(Build.VERSION.SDK_INT >= 35 ? Color.TRANSPARENT : background);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(!dark);
        controller.setAppearanceLightNavigationBars(!dark);
    }

    @Override
    protected void handleOnResume() {
        getActivity().runOnUiThread(this::applyAppearance);
    }
}
