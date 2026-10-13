# Backend reliability review

Aniro is a static Next.js/Capacitor app. Its backend behavior lives in client
data services, persistent storage, and Android plugins rather than a hosted API.

## Changes

- Wait for saved settings before synchronizing Android widget/alarm data or
  reading the pending Fajr challenge. Preserve saved prayer calculation methods
  instead of replacing them on every location hook mount.
- Validate persisted settings, coordinate ranges, and null coordinates.
- Share location changes between hook instances. GPS permission denial allows
  IP fallback; reverse-geocoding failure preserves valid device coordinates.
- Serialize native schedule replacements. Schedule/widget refresh errors no
  longer prevent an already-fired alarm from starting playback.
- Treat Ishraq as a reminder. Browser playback starts at/after prayer time,
  and records a prayer as played only after playback succeeds.
- Mark a native Fajr challenge pending only after playback starts. Clear it
  on stop/error/destruction and expire it after ten minutes. Bound looping
  playback to that window. Delayed alarms older than ten minutes show reminders.
- Prevent overlapping wrong-answer timers, clear timers when a challenge closes,
  and allow completion retry if the native stop call fails. Avoid one-word
  questions with no verse context and use Fisher-Yates choice shuffling.
- Handle revoked DND access without breaking service teardown. Stop the existing
  service directly rather than starting a new service to stop audio.
- Expose alarm-stream volume in native status and check whether notifications
  are enabled at app level as well as runtime permission.
- Let bundled Quran loading continue when IndexedDB is unavailable. Always
  clear retry timeout handles. Use cached audio after API failure and tolerate
  metadata-cache quota failures.
- Remove the unused silent Quran downloader/provider: all 114 Arabic surahs are
  bundled, and the downloader wrote raw responses into keys the reader did not
  consume. Its retry cancellation could also leave unresolved waits.
- Keep today's Friday reminders eligible after noon: actual Dhuhr varies by
  location, and individual reminder times already filter expired notifications.

## Validation

The release check now includes behavioral regressions for corrupted settings,
2,000 generated quiz questions, concurrent Quran request deduplication, and
bundled Arabic/translation/list loading with IndexedDB unavailable.
Browser smoke coverage includes saved-method preservation and bundled Quran
reading with storage unavailable and the remote Quran API blocked.

Verified: all release checks and TypeScript pass; lint passes for changed runtime
files; all 12 desktop/mobile browser smoke tests pass. Production compilation,
type/lint checks, and static export also pass.

## Android verification still required

The configured Android SDK path on this machine is missing. Native source
checks are static; they do not establish that an APK compiles or plays audio.
Install platform 36/build-tools on F: and use scripts/build-on-f.ps1 for APK builds.
Before release, test real devices with screen locked, app dismissed, reboot,
timezone changes, exact-alarm permission allowed/denied, notification permission
denied, alarm volume zero, DND, and manufacturer battery restrictions. Confirm
Fajr starts, solving stops audio, disabling the challenge clears pending state,
and timeout/error cleanup restores DND and releases playback resources.

Exact-alarm denial can delay alarms; zero alarm volume and device restrictions
can still suppress audible playback. Browser timers require an active page and
browser audio permission. These conditions cannot be guaranteed away by code.

The prayer offset remains in hours, matching the existing UI and native code.
Automatic DST uses device timezone rules; explicit DST On adds an hour. A change
to minute adjustments or location-specific timezone behavior needs coordinated
settings migration and separate coverage.
