# DashDetailWrapsWithoutLeading — card subtitles wrap with no leading

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/DashDetailWrapsWithoutLeading.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — kol-theme 0.120.1 + kol-dashboards 0.4.1; bump executed here same day

## Why it went there

`.dash-detail` (`line-height: 1`) and `CardHeader`'s use of it for the
subtitle are both kol-dashboards/kol-theme internals — `/insights` passes
plain strings to `DashTableCard` and cannot reach the class. The type
protocol's fault line: wrapping text never wears a leading-less helper style.
User report from the 2026-09-01 phone review round 2: *"im also seeing helper
mono used where kol mono should in the description above the table in the
cards"* — three-line subtitles at 390 with no leading.

## Remainder here once it ships

Bump kol-dashboards/kol-theme, re-check `/insights` card subtitles on the
phone — readable leading, footer labels unchanged.

## ✅ RETURNED — 2026-09-01 · kol-theme@0.120.0

Split as asked: .dash-subtitle minted — dash-detail's ramp and container step (10 → 12), line-height 1.5 — and CardHeader's subtitle moved onto it (kol-dashboards 0.4.0). Footers, labels, legends, statuses keep .dash-detail; swept the pack's other 19 dash-detail call sites and all are single-line chrome.

**Remainder here:** bump kol-theme@0.120.1 + kol-dashboards@0.4.1; re-check /insights card subtitles at 390 — three lines WITH leading

⚠️ **First bump (0.120.0 / 0.4.0) queried, superseded same day:** kol-theme ^0.120.0 + kol-dashboards ^0.4.0 bumped, but the shipped `.dash-subtitle` is 16px→22px · weight 500 · line-height 125% — not the receipt's "dash-detail ramp (10→12), line-height 1.5" — which out-sizes `.dash-title` (16→20) at wide containers. Queried back to kol-ds-ui same day; `/insights` re-check waits on their answer.

✅ **Resolved 2026-09-01 · kol-theme@0.120.1 + kol-dashboards@0.4.1.** The query was right but inverted: `.dash-subtitle` already existed as the 16→22 medium sub-heading and 0.120.0 minted a duplicate over it. Renamed — the wrapping lede is `.dash-lede` (mono 400, 10→12 at the 768 container step, **line-height 1.5**), `CardHeader` points at it, the original `.dash-subtitle` is untouched. 0.120.0 / 0.4.0 deprecated on the registry. Bumped here, `.vite` cleared, shipped CSS verified line by line; 107/107 tests, lint clean. `/insights` phone re-check at 390 rides the next deploy.
