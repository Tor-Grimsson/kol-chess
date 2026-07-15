# Session: Design system usage audit

**Date:** 2026-07-15
**Agent:** Grim (Claude Opus 4.8)
**Summary:** Audited kol-chess's KOL DS usage (/claude-kol-ds), confirmed the inconsistencies, and wrote the audit up in the vault.

## Changes Made

### Files Modified
- `docs/DESIGN-SYSTEM-AUDIT.md` — new; the audit report (directly in `docs/`, not nested)

### Features Added/Removed
- None — read-only audit + one doc. No code touched.

## Current State

### Working
- App unchanged from prior session (DS chess renders, fonts/favicon/shell in place)

### Known Issues (all UPSTREAM in the DS packages, not our code)
- Buttons: all `size="sm"`, primary/outline mixed for same action, icon chrome loud primary, no `danger` variant
- No theme toggle component ships in the DS (light/dark works via `data-theme`)
- Links have no color (no `--kol-link*`; `.kol-table a` beats `.analysis-table__link`; accent==ink)
- Table borders are `--kol-fg-08` (92% transparent) → overlapping seams
- `kol-mono-12` overloaded across 3 roles; sibling titles 16 vs 12
- Single tall column forces page scroll (`ChessAnalysisLayout` + `scrollTo` hack)
- 1 raw `<a>` + ~4 `<div onClick>` in the chess pkg; **our consumer code = 0 inline**

## Next Steps
1. Fixes land in the **`kol-ds` repo** (one repo), previewed live in its `showcase` — NOT here, no fork
2. One changeset publish → bump kol-chess's package versions
3. Next session: check the new pnpm packages after the DS fixes ship
4. Consumer-side: mount a `<ThemeToggle/>` once the DS ships one
