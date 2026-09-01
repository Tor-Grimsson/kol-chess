# ShellPagePadFixedOnMobile — 48px gutters on a 390 phone

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ShellPagePadFixedOnMobile.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — kol-theme 0.118.0; bump executed here same day

## Why it went there

`--kol-shell-page-pad` is the shell's token (kol-components-shell.css:21, a
flat 48px with no mobile rung) and the estate rule forbids a consumer
override. Measured on `/settings` at 390: 96px — 24.6% of the viewport — on
gutters, the h1 ~35pt from the edge while every `.kol-page` sibling sits
~15pt. User report from the 2026-09-01 field review: *"settings page has weird
padding? much larger then other mobile views"*.

## Remainder here once it ships

bump kol-theme (and kol-shell if the rung lands there); re-shoot `/settings`
at 390 and confirm the h1 lines up with the sibling pages.

## ✅ RETURNED — 2026-09-01 · kol-theme@0.118.0

--kol-shell-page-pad is clamp(20px, 5vw, 48px) — your shape, floor 20 (the estate's px-5 mobile floor, which is the ~15pt your .kol-page siblings sit at), 5vw reaching 48 at 960 so desktop does not move. PageShell's padding and PageBleed's negative margin read the same token, so the pair scales together.

**Remainder here:** bump kol-theme@0.118.0; re-check /settings on the phone — the h1 should sit level with the .kol-page siblings

✅ **Remainder executed 2026-09-01 same day:** kol-theme bumped ^0.115.0 → ^0.118.0,
`node_modules/.vite` cleared (the bump law), `clamp(20px, 5vw, 48px)` confirmed in the
shipped kol-components-shell.css. The phone re-check of `/settings` rides the next
deploy — the live site serves the old theme until then.
