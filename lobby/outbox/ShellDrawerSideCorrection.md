# ShellDrawerSideCorrection — 0.34.0 mirrored the panel; only the trigger was ever the ask

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellDrawerSideCorrection.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — kol-shell 0.35.0 + kol-theme 0.121.0; bump executed here same day

## Why it went there

Correction to this repo's own `ShellDrawerOnRight`. That ticket quoted the user
as *"hamburger menu location, why is it on the left?…"* and filed it as a ruling
on the drawer's SIDE. The subject of the sentence was the **button**. kol-shell
0.34.0 duly mirrored the whole of drawer mode — panel to `right-0`, left border,
off-canvas `+100%` — and the user on device: *"I was just talking about the
HAMBURGER MENU ICON AND CLOSE ICON — not the location of the sidenav."*

Ask: panel back to the LEFT, trigger fixed top-RIGHT in both states, travel rule
stays retired. Scrim-as-button keeps.

Evidence: `~/dev/projects/kol-ds-ui/lobby/_assets/drawer-mirrored-whole-panel-390.png`.

## Remainder here once it ships

Bump kol-shell (+ kol-theme if the CSS moves), clear `node_modules/.vite`,
re-check at 390: hamburger top-right closed, panel slides from the LEFT, X still
top-right at the screen edge.

## ✅ RETURNED — 2026-09-01 · kol-shell@0.35.0

Reverted the panel, kept the trigger. NavRail pins left-0 with a right border in BOTH modes now — one className, the conditional is gone — and the theme's off-canvas transform is -100% again (kol-theme 0.121.0), so drawer mode slides in from the left exactly as it did through 0.33.0. What stays from 0.34.0 is the part that actually fixes the reported defect: the trigger is fixed top: 12 / right: 12 in both states with no translate. That travel was the whole bug — it rode the panel's trailing edge to x 252-284 on a 390 screen — and at the far corner it cannot meet a left-hand panel, so the 2026-08-31 travel rule stays retired. The scrim-as-button stays too. You are right about the lineage and it is worth naming: the ticket named the side, I read the side, and the resolution's 'you had no second opinion' line was answering a question nobody had asked. Verified in the published tarballs, not just source: theme 0.121.0 ships translateX(-100%) with the trigger still at top/right 12, shell 0.35.0 ships the flat left-0 border-r className. No consumer change.

**Remainder here:** bump kol-shell@0.35.0 + kol-theme@0.121.0 — then the on-device check: hamburger top-right, panel in from the left, X still top-right under the thumb

## ✅ RETURNED — 2026-09-01 · kol-shell@0.35.0 + kol-theme@0.121.0

Panel reverted, trigger kept. NavRail pins `left-0` with a right border in BOTH
modes (the conditional is gone), off-canvas transform is `-100%` again, and the
trigger holds `top: 12 / right: 12` in both states with no translate. Travel rule
stays retired — at the far corner it cannot meet a left-hand panel. Scrim-as-button
stays. kol-ds-ui named the lineage: the ticket named the side, so they read the side.

**Remainder here:** bump kol-shell@0.35.0 + kol-theme@0.121.0; on-device check at 390 —
hamburger top-right, panel in from the left, X still top-right under the thumb.

✅ **Remainder executed 2026-09-01 same day:** `package.json` shell ^0.34.0 → **^0.35.0**,
theme ^0.120.1 → **^0.121.0**, installed, `node_modules/.vite` cleared. Installed CSS
verified line by line — `kol-components-shell.css:105` `translateX(-100%)`,
`:122` trigger `top: 12 / right: 12` with no `[data-rail-drawer="open"]` translate,
`NavRail.jsx:293` flat `left-0 … border-r`. On-device check rides the next deploy.
