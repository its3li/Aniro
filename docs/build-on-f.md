# Building Aniro with storage on F:

Keep the repository on F:. From its root in PowerShell, run:

```powershell
# Build the web app; outputs stay in this repository.
./scripts/build-on-f.ps1 -Action Build

# Install dependencies using the npm cache on F:.
./scripts/build-on-f.ps1 -Action Install

# Configure this shell for other development commands.
./scripts/build-on-f.ps1
npm run dev
```

The script directs npm and Gradle caches, temporary files (including Java),
Android user/emulator data, and Playwright browsers to `F:/AniroBuild`.
Settings apply to the current PowerShell process and its child commands.
Run it again in each new shell. Existing caches on C: remain in place.
Node and Java can remain installed on C:; their build data uses F:.
Windows itself can still use C: for system files and paging.

For APK builds, install an Android SDK on F: containing Android platform 36
and the required build-tools, then run:

```powershell
./scripts/build-on-f.ps1 -Action Debug -AndroidSdk F:/AniroBuild/android-sdk
./scripts/build-on-f.ps1 -Action Release -AndroidSdk F:/AniroBuild/android-sdk
```

APK commands update the ignored `android/local.properties` SDK path to F:
before building. Release signing uses the existing signing configuration.
APKs are written under `android/app/build/outputs/apk/`.
Use `-StorageRoot F:/another-folder` to choose another cache folder on F:.
