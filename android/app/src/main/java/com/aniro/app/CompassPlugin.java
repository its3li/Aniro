package com.aniro.app;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.hardware.GeomagneticField;
import android.view.Surface;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "Compass")
public class CompassPlugin extends Plugin implements SensorEventListener {
    private SensorManager manager;
    private float declination;
    private long lastUpdate;

    @PluginMethod
    public void start(PluginCall call) {
        stopSensors();
        manager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        Sensor sensor = manager != null ? manager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR) : null;
        if (sensor == null || !manager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)) {
            call.reject("No magnetic compass sensor available");
            return;
        }
        float latitude = call.getFloat("latitude", 0f);
        float longitude = call.getFloat("longitude", 0f);
        declination = new GeomagneticField(latitude, longitude, 0f, System.currentTimeMillis()).getDeclination();
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) { stopSensors(); call.resolve(); }

    private void stopSensors() { if (manager != null) manager.unregisterListener(this); }
    @Override protected void handleOnDestroy() { stopSensors(); }

    @Override public void onSensorChanged(SensorEvent event) {
        if (System.currentTimeMillis() - lastUpdate < 80) return;
        lastUpdate = System.currentTimeMillis();
        float[] matrix = new float[9];
        float[] adjusted = new float[9];
        float[] orientation = new float[3];
        SensorManager.getRotationMatrixFromVector(matrix, event.values);
        int rotation = getActivity().getWindowManager().getDefaultDisplay().getRotation();
        int x = SensorManager.AXIS_X, y = SensorManager.AXIS_Y;
        if (rotation == Surface.ROTATION_90) { x = SensorManager.AXIS_Y; y = SensorManager.AXIS_MINUS_X; }
        else if (rotation == Surface.ROTATION_180) { x = SensorManager.AXIS_MINUS_X; y = SensorManager.AXIS_MINUS_Y; }
        else if (rotation == Surface.ROTATION_270) { x = SensorManager.AXIS_MINUS_Y; y = SensorManager.AXIS_X; }
        SensorManager.remapCoordinateSystem(matrix, x, y, adjusted);
        SensorManager.getOrientation(adjusted, orientation);
        double heading = (Math.toDegrees(orientation[0]) + declination + 360) % 360;
        JSObject result = new JSObject();
        result.put("heading", heading);
        result.put("accuracy", event.accuracy);
        notifyListeners("heading", result);
    }
    @Override public void onAccuracyChanged(Sensor sensor, int accuracy) { }
}
