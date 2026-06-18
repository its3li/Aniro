# Aniro Release Notes

This file is kept only as a local reminder for Android release packaging.

## Signing
- Do not store signing passwords in tracked files.
- Provide signing values through Gradle properties or environment variables:
  - `ANIRO_UPLOAD_STORE_FILE`
  - `ANIRO_UPLOAD_STORE_PASSWORD`
  - `ANIRO_UPLOAD_KEY_ALIAS`
  - `ANIRO_UPLOAD_KEY_PASSWORD`

## Release checklist
1. Build the Android release artifact locally.
2. Verify `versionCode` and `versionName` before publishing.
3. Keep the keystore backed up outside the repository.
4. Upload the generated artifact to your release channel.
