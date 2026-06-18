package com.aniro.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "ApkUpdate")
public class ApkUpdatePlugin extends Plugin {
    private static final String UPDATE_DIR = "updates";
    private static final String DEFAULT_FILE_NAME = "aniro-update.apk";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void canInstallPackages(PluginCall call) {
        JSObject result = new JSObject();
        result.put("canInstall", canInstallPackages());
        call.resolve(result);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            Intent intent;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                intent = new Intent(
                        Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName())
                );
            } else {
                intent = new Intent(Settings.ACTION_SECURITY_SETTINGS);
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception exception) {
            call.reject("Unable to open install permission settings", exception);
        }
    }

    @PluginMethod
    public void downloadUpdate(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("Missing APK URL");
            return;
        }

        int versionCode = call.getInt("versionCode", 0);
        String expectedSha256 = call.getString("sha256", "");
        String fileName = sanitizeFileName(call.getString("fileName", defaultFileName(versionCode)));

        executor.execute(() -> downloadApk(call, url, expectedSha256, fileName));
    }

    @PluginMethod
    public void installDownloadedUpdate(PluginCall call) {
        String fileName = sanitizeFileName(call.getString("fileName", DEFAULT_FILE_NAME));
        File apkFile = new File(getUpdatesDir(), fileName);

        if (!apkFile.exists() || apkFile.length() <= 0) {
            call.reject("Downloaded APK not found");
            return;
        }

        if (!canInstallPackages()) {
            JSObject result = new JSObject();
            result.put("canInstall", false);
            call.resolve(result);
            return;
        }

        try {
            Uri apkUri = FileProvider.getUriForFile(
                    getContext(),
                    getContext().getPackageName() + ".fileprovider",
                    apkFile
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getContext().startActivity(intent);

            JSObject result = new JSObject();
            result.put("canInstall", true);
            call.resolve(result);
        } catch (Exception exception) {
            call.reject("Unable to open Android installer", exception);
        }
    }

    @PluginMethod
    public void clearDownloadedUpdate(PluginCall call) {
        String fileName = sanitizeFileName(call.getString("fileName", DEFAULT_FILE_NAME));
        File apkFile = new File(getUpdatesDir(), fileName);
        JSObject result = new JSObject();
        result.put("deleted", !apkFile.exists() || apkFile.delete());
        call.resolve(result);
    }

    private void downloadApk(PluginCall call, String url, String expectedSha256, String fileName) {
        File apkFile = new File(getUpdatesDir(), fileName);
        File tempFile = new File(getUpdatesDir(), fileName + ".download");

        HttpURLConnection connection = null;
        try {
            URL apkUrl = new URL(url);
            connection = (HttpURLConnection) apkUrl.openConnection();
            connection.setConnectTimeout(15_000);
            connection.setReadTimeout(30_000);
            connection.setInstanceFollowRedirects(true);
            connection.connect();

            int status = connection.getResponseCode();
            if (status < 200 || status >= 300) {
                call.reject("APK download failed with HTTP " + status);
                return;
            }

            long totalBytes = connection.getContentLengthLong();
            long downloadedBytes = 0;
            long lastProgressAt = 0;

            try (
                    InputStream inputStream = connection.getInputStream();
                    FileOutputStream outputStream = new FileOutputStream(tempFile)
            ) {
                byte[] buffer = new byte[64 * 1024];
                int read;
                while ((read = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, read);
                    downloadedBytes += read;

                    long now = System.currentTimeMillis();
                    if (now - lastProgressAt > 250 || downloadedBytes == totalBytes) {
                        notifyDownloadProgress(downloadedBytes, totalBytes);
                        lastProgressAt = now;
                    }
                }
            }

            String actualSha256 = sha256(tempFile);
            if (expectedSha256 != null && !expectedSha256.trim().isEmpty()
                    && !actualSha256.equalsIgnoreCase(expectedSha256.trim())) {
                tempFile.delete();
                call.reject("APK checksum mismatch");
                return;
            }

            if (apkFile.exists() && !apkFile.delete()) {
                call.reject("Could not replace old downloaded APK");
                return;
            }

            if (!tempFile.renameTo(apkFile)) {
                call.reject("Could not finalize APK download");
                return;
            }

            notifyDownloadProgress(downloadedBytes, totalBytes);

            JSObject result = new JSObject();
            result.put("fileName", fileName);
            result.put("bytes", apkFile.length());
            result.put("sha256", actualSha256);
            result.put("canInstall", canInstallPackages());
            call.resolve(result);
        } catch (Exception exception) {
            tempFile.delete();
            call.reject("APK download failed", exception);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private void notifyDownloadProgress(long downloadedBytes, long totalBytes) {
        JSObject progress = new JSObject();
        progress.put("downloadedBytes", downloadedBytes);
        progress.put("totalBytes", totalBytes);
        progress.put("progress", totalBytes > 0 ? Math.min(100, Math.round(downloadedBytes * 100f / totalBytes)) : 0);
        notifyListeners("downloadProgress", progress);
    }

    private boolean canInstallPackages() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return true;
        }

        Context context = getContext();
        return context.getPackageManager().canRequestPackageInstalls()
                || context.checkSelfPermission(Manifest.permission.REQUEST_INSTALL_PACKAGES) == PackageManager.PERMISSION_GRANTED;
    }

    private File getUpdatesDir() {
        File dir = new File(getContext().getCacheDir(), UPDATE_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        return dir;
    }

    private String defaultFileName(int versionCode) {
        if (versionCode > 0) {
            return "aniro-" + versionCode + ".apk";
        }
        return DEFAULT_FILE_NAME;
    }

    private String sanitizeFileName(String fileName) {
        String safeName = fileName == null ? DEFAULT_FILE_NAME : fileName;
        safeName = safeName.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (!safeName.toLowerCase(Locale.US).endsWith(".apk")) {
            safeName += ".apk";
        }
        return safeName;
    }

    private String sha256(File file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (FileInputStream inputStream = new FileInputStream(file)) {
            byte[] buffer = new byte[64 * 1024];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
        }

        StringBuilder builder = new StringBuilder();
        for (byte b : digest.digest()) {
            builder.append(String.format(Locale.US, "%02x", b));
        }
        return builder.toString();
    }
}
