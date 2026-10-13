# Glass surfaces and widget formats

Preserved current navigation and content order; restored subtle navy depth, edge
reflections and restrained translucent surfaces. Expensive backdrop blur is
limited to the fixed navigation and verse actions. Long reading lists remain flat.
Arabic mode uses أنيرو in headers and Arabic Quran references in daily wisdom.
The verse action popup is 184px with four 44px actions and no surplus horizontal
padding. Native widget icons now use Phosphor geometry, matching the interface.

The widget picker has six entries: existing next prayer/daily prayers, compact
countdown (2x2), wide countdown (4x1), agenda (2x4), and large day (4x4). These are
launcher target sizes, not guarantees: OEM grids differ. Widgets resize in both
directions, up to 600dp; countdowns support 90x60dp minimums, daily widgets use
180x100dp minimums. Countdown layouts stack for narrow/tall sizes; daily widgets
use agenda rows at tall sizes and hide the header at short sizes. Settings/color
sync and prayer-boundary refresh cover all six providers. Existing custom colors
and system colors remain supported. Slight transparency, rounded borders and
consistent amber are used; Android RemoteViews cannot reliably blur wallpaper.

Add a new widget from the Android home-screen widget picker. Existing widgets
retain their identity. Re-add an existing widget if the launcher caches its old
resize bounds or preview. Native layouts compile but require launcher testing
for OEM sizing and clipping. Phone was disconnected during verification.
