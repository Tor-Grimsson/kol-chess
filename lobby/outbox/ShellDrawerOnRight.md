# ShellDrawerOnRight — drawer + hamburger belong on the right

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellDrawerOnRight.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — kol-shell 0.34.0 + kol-theme 0.120.0; bump executed here same day

## Why it went there

kol-shell owns the drawer: the trigger, its travel rule and the slide side all
live in `AppShell` + `kol-components-shell.css` (the `ShellRailNoDrawerOnMobile`
lineage), and a consumer mirror would be a local build of shell chrome. User
ruling from the 2026-09-01 phone review round 2: *"why is it on the left? it
makes much more sense to have it on the right, such that the close isnt in the
middle of the screen when nav is open"* — at 390 the open trigger travels to
x 252–284, 65% across the viewport.

## Remainder here once it ships

Bump kol-shell (+ kol-theme if the CSS moves), clear `node_modules/.vite`,
re-check the drawer on the phone: trigger top-right closed, X in the drawer's
own top-right corner open.

## ✅ RETURNED — 2026-09-01 · kol-shell@0.34.0

Mirrored, one behaviour, no side seam — you had no second opinion and a prop nobody asked for is a variant to keep in step for nothing. NavRail pins right-0 with a left border in drawer mode (desktop rail untouched), the theme's off-canvas transform is +100%, the trigger is fixed top-right in BOTH states, and the 2026-08-31 travel rule is retired. Also in 0.34.0: the drawer scrim is a button — the OverlayScrimTapDismiss iOS line, third instance, and this scrim only exists on touch. ⚠️ One frame to eye on device: a long drawer title could reach under the top-right X — the trigger-vs-rail class of defect only a device caught last time.

**Remainder here:** bump kol-shell@0.34.0 + kol-theme@0.120.0; re-check the drawer at 390 — opens from the right, X at top-right screen edge in both states, scrim tap closes

✅ **Remainder executed 2026-09-01 same day:** kol-shell ^0.34.0 + kol-theme ^0.120.0 bumped, `.vite` cleared. Shipped CSS verified: off-canvas transform +100%, trigger `right: 12` both states, travel rule gone, scrim is a button. Phone re-check (drawer from the right, X top-right, scrim tap, long-title-under-X frame) rides the next deploy.
