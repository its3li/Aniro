# Quran layout and motion update

The navy/amber palette and Aniro logo remain. The Quran index now uses real
buttons with separated, rounded tonal surfaces. It no longer inherits glass-card
backgrounds through conflicting selectors or overlaps rows with negative margins.

Mushaf mode uses the application's one top inset. The toolbar has 44px controls,
local Naskh surah typography, and an attached Tajweed strip. A ResizeObserver
measures the navigation/audio dock so the reading area remains above it at
different system insets and font sizes.

Only pages 1 and 2 use a centered opening composition with balanced verse widths,
a larger Bismillah, restrained title rules, and a page numeral. The text remains
live, selectable Arabic with Tajweed, recitation, copy, bookmark, and Tafseer
actions. Page 3 onward retains inline text. Oversized text/small viewports scroll
instead of clipping. Vertical scrolling is distinguished from horizontal turns.

All interface icons use Phosphor geometry. The custom Tasbeeh beads were redrawn
to match. Android widget symbols use the same family. Generated icon components
contain only the used weights; the full icon library is a development dependency.
Regenerate with node scripts/generate-interface-icons.mjs. The MIT license is
included beside the assets. Application branding and the compass sensor logic
are unchanged.

Motion is limited to page entrances, horizontal page turns, active navigation,
verse actions, audio-dock entrance, and Tasbeeh taps. These use transform/opacity;
Azkar progress uses scaleX instead of width animation. There are no scroll-triggered
effects or infinite verse glow animations. Reduced motion disables these effects.

Performance changes:

- Home no longer initializes the full Quran search index. Search initializes when
  the search field is used, yielding between small batches. One index is shared
  across editions, with edition filtering applied before result limits.
- Removed synchronous full-index JSON serialization/cache loading, which caused
  large main-thread work. Bundled search documents remain available offline.
- Stale searches are discarded when queries change or clear.
- The audio context separates playback behavior from frequent progress/download
  updates so reader and navigation subscribers do not rerender on every tick.
- The countdown's per-second updates are isolated from the prayer card/timeline.
- Verse deep links use the already loaded verse page metadata; Baqarah 250 loads
  page 41 plus its two neighbors instead of scanning the preceding pages.
- Page turns update immediately; removed the artificial 200ms wait and cleaned
  transition timers and unused icons.
- Removed an unused 15.8MB serialized search index from packaged assets. The
  runtime uses all-ayat.json; its generator no longer emits the redundant index.

Validation: release checks and 26 Playwright desktop/mobile cases passed against
the final production export, including
opening pages, page 3, direct late-verse navigation, delayed search initialization,
114 separated surah rows at 320px, swipe direction, and reduced motion. Layout captures at 320/390px
showed no horizontal overflow. These checks do not establish a device FPS target;
regular-use responsiveness should be evaluated on the installed phone build.

Signed release APK: 31,976,084 bytes (32.0 MB), compared with 34,709,997 bytes
for the previously installed build. The unused serialized index is absent from
the APK; offline search and Quran reading checks pass. Build caches and outputs
remain on F:. Version stays 6.13/19 for this local testing update.
