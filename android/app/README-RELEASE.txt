# Aniro-V3 Release Package

## Files Included:
1. **app-release.apk** - Release APK (ready for Google Play)
2. **aniro-release.keystore** - SIGNING KEYSTORE (KEEP SAFE!)
3. **app-debug.apk** - Debug APK (for testing)
4. **fixes.patch** - Code changes summary

## 🔐 **CRITICAL: Keystore Security**
- **Store Password:** aniro2024
- **Key Alias:** aniro
- **Key Password:** aniro2024

⚠️ **SAVE THIS KEYSTORE SAFELY!** If you lose it:
- Can't update app on Play Store
- Must create new app with new package name
- Lose all reviews/ratings

## 📱 How to Install:
1. **For testing:** Install `app-debug.apk` (no signing needed)
2. **For release:** Use `app-release.apk` for Play Store

## 🚀 Google Play Store Submission:
1. Go to Google Play Console
2. Create new app: `com.aniro.app`
3. Upload `app-release.apk`
4. Fill app details:
   - Screenshots (at least 2 sizes)
   - Description (Arabic/English)
   - Privacy Policy URL
   - App icon (512x512)

## 🔄 Future Updates:
- Keep this keystore file
- Use same signing config in `build.gradle`
- Increase `versionCode` for each update

## 📋 App Info:
- Package: `com.aniro.app`
- Version: 1.0
- Version Code: 1
- Fixed Issues:
  ✓ Double Bismillah in page view
  ✓ Audio navigation in page view
  ✓ Bismillah in ayah mode
  ✓ Bookmark saving in ayah mode

## 📞 Support:
If you need help with Play Store submission, just ask!