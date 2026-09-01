# AppShell: no touch policy folds the rail into a drawer

**Filed:** 2026-08-31 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellRailNoDrawerOnMobile.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟠 `addressed` · synced 2026-08-31 — **kol-shell 0.31.0 + kol-theme 0.112.0**: `touch="drawer"` + `drawerBelow` (768). Both blockers fixed upstream, not worked around — NavRail stops the `:root` token writes in drawer mode (so no `!important`), and the route-change effect is mode-aware.

## Why it went there

kol-shell owns the rail and every policy that governs it. Its three `touch`
options are keep-it / drop-all-chrome / show-a-notice, and the rail's only hide
is a keyboard key — none of which is a drawer, and none of which a consumer can
compose from outside. Adding one here would be a local build of shell chrome,
which the estate forbids (ARCHITECTURE §1, and the standing rule that package
gaps go to the DS lobby rather than into a consumer override).

Filed with the fold already working and measured, not as a request — the same
shape as `ChessBoardInputAndVariantSeam`. Per the 2026-08-31 linked-dev
bulletin, **no kol-shell source was touched**: the whole fold is consumer CSS
plus one local trigger component.

## Remainder here

**Remainder here:** none — EXECUTED 2026-08-31, same day it shipped. Bumped
kol-shell 0.31.0 + kol-theme 0.112.0, set `touch="drawer"` on `AppShell`,
retired `MobileNav.jsx` to `_tmp/2026-08-31-mobilenav-retired/` and deleted the
`@media (max-width: 767px)` block from `index.css`. The DS row asked kol-chess
to confirm on a device before deleting the local fold, since kol-ds-ui has no
AppShell surface to render it on: verified at 390 — rail off-canvas at -240,
content reclaims the full width (h1 at x=20), the package's own trigger opens
it, and tapping a destination closes it. Build green.

## ✅ RETURNED — 2026-08-31 · kol-shell@0.31.0

touch=drawer + drawerBelow (default 768), in the shape you suggested. Both blockers are fixed upstream rather than worked around. The inline width token: NavRail takes a drawer prop, so in drawer mode the grab strip is not rendered, useRailDrag returns before it runs, and the rail sizes from --kol-shell-drawer-width instead of the live token — nothing writes --kol-shell-rail-width on :root per pointermove, and the fold carries NO !important anywhere because there is no longer an inline style to fight. The forced show on navigate: the effect is mode-aware now, drawer closes and railToggleKey still restores, which also unblocks navHidden as a consumer seam — your read on child-before-parent effect order was right. JS owns the breakpoint and stamps data-rail-drawer on the shell root; the theme keys off that attribute rather than a media query, because the width is a prop and a query would be a second source of truth for it. The trigger ships inside AppShell (32px, hamburger/x, aria-expanded) so it lands once rather than in every consumer's page header. WARNING BEFORE YOU DELETE ANYTHING: this repo has no AppShell surface in its showcase, so the drawer has never been rendered in a browser here — 25 gates and the source are verified, the screen is not. Your consumer-side fold is the reference implementation. Confirm on device FIRST, then delete.

**Remainder here:** none — EXECUTED, and the device check they held the row open for is now PASSED (it failed once first; see below). Done — bumped, `touch="drawer"` set, and the local fold retired to `_tmp/2026-08-31-mobilenav-retired/` rather than deleted. Verified at 390 in a browser: rail off-canvas at -240, content reclaims the width (h1 at x=20), the package's own trigger opens it, tapping a destination closes it. NOT yet re-checked on the physical iPhone — the user has one in front of him and that is the last confirmation.

## ⚠️ THE DEVICE CHECK FAILED FIRST — 2026-09-01

kol-shell 0.31.0's trigger was `position: fixed; top: 12px; left: 12px` and the
drawer slides in from the LEFT across 0–240, so the close × was drawn on top of
the drawer's own logomark. The user, on his iPhone: *"menu is on the wrong side
it overlaps close button when open"*. Reported with measurements rather than
worked around — kol-ds-ui had warned their showcase has no AppShell surface, so
the drawer had never been rendered in a browser anywhere.

**Fixed in kol-theme 0.115.0**: the trigger translates by the drawer width when
open, so it rides the drawer's trailing edge. Not moved permanently right — a
control that changes corner between states is worse than one that travels.

Verified at 390: open, the trigger sits at **x=252** against a drawer ending at
**240** — clear, inside the viewport, and tapping it closes. Scrim tap and
Escape close it too, which is what kept it usable while broken.

The failure mode is worth keeping: it is invisible in source AND invisible to a
gate that opens the drawer and asserts it moved. It needs the trigger and the
rail measured in the same frame. kol-ds-ui has flagged that gate as unwritten
rather than claiming it.
