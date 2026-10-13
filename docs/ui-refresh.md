# Aniro UX/UI refresh

The Aniro name and existing navy/amber palette remain. The refresh establishes a
shared page header, Latin/Arabic UI typography, spacious reading layouts, calmer
surfaces, and semantic accessible controls across the six main destinations.

- Home emphasizes the next prayer and the daily timeline, offers a reading entry
  before a bookmark exists, and gives wisdom a quieter editorial treatment.
- Quran uses a flat surah index and more breathing room around verses.
- Azkar categories are actual keyboard-operable buttons; reading progress remains.
- Tasbeeh's large circular counter is the primary tap target and retains saved counts.
- Qibla uses the working native compass with a calmer instrument layout.
- Settings have direct section links and larger native-action controls.
- The audio dock keeps navigation available during recitation.
- Onboarding and loading use the same Aniro wordmark and surfaces.
- Browser zoom, visible focus, current-page navigation, and reduced motion are supported.
- Azan/challenge test buttons and the native test endpoint are removed. The overlay
  permission action remains part of wake-up challenge settings.

Self-hosted fonts and their OFL licenses are in public/fonts. The existing icon,
Quran datasets, native azan/challenge behavior, and saved preferences are retained.
This is an interface rebrand; it does not rename the Android application package.

Validation: production build/static export, release checks, TypeScript and lint
passed. The 14 browser cases passed; two new navigation cases passed after fixing
a mistaken test expectation about a category opening directly into reading.
Arabic layouts at widths 320/390/768 had no horizontal overflow. Screenshots are
under .codex-run/rebrand. Automated geometry checks do not replace human review
of every screen; review the installed build for typography and spacing preferences.
