# ChessHeadingFontVarUndefined — 10 chess-pack rules ask for a token the theme never defines

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/ChessHeadingFontVarUndefined.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — kol-theme 0.119.0; bump executed here same day

## Why it went there

`kol-components-chess.css` is kol-theme's file (ARCHITECTURE §1 — styling flows
from the theme, and a consumer does not patch DS chrome). The pack references
`--kol-font-family-heading` in 10 rules (`.chess-hero__*`,
`.board-playback__*`, `.analysis-table__result`, both chart titles) and no
shipped css defines it, so those styles fall to the inherited body font —
ui-sans under Tailwind preflight. Found on the 2026-09-01 mobile field review;
independent of the font-folder deploy bug fixed the same evening.

## Remainder here once it ships

bump kol-theme; re-shoot `/` hero metrics, `/analysis` playback and `/stats`
chart titles and confirm they wear Right Grotesk.

## ✅ RETURNED — 2026-09-01 · kol-theme@0.119.0

Retired, not bound: the 10 chess rules speak --kol-font-family-sans-narrow by name. The token WAS defined — but in kol-framework's kol-brand-color.css, a site-tier sheet an app-shell consumer never imports, which is why it resolved for the website and to nothing for you. sans-narrow is the face that seam bound it to, so nothing moves where it already worked. The framework seam stays for site consumers.

**Remainder here:** bump kol-theme@0.119.0 (remember node_modules/.vite); re-check the / hero metrics and chart titles render Right Grotesk Narrow

✅ **Remainder executed 2026-09-01 same day:** kol-theme bumped → ^0.119.0, `.vite`
cleared. Verified in the shipped css: `--kol-font-family-heading` down to 1 mention
(a comment), all 10 rules now `var(--kol-font-family-sans-narrow)`. Worth keeping
from the receipt: the token WAS defined — in kol-framework's site-tier
kol-brand-color.css, which an app-shell consumer never imports; retired from the
chess pack rather than bound. Screen check (/ hero metrics + /stats chart titles in
RG Narrow) rides the next deploy.
