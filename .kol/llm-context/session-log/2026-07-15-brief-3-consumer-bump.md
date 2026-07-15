# Session: Brief 3.0 resolved upstream — consumer bump to chess 0.4.0

**Date:** 2026-07-15 (late night)
**Agent:** Grim (Claude Fable 5)
**Summary:** The kol-ds agent shipped brief 3.0 (board input, inline sidelines, edit-mode placement — see the resolution appended to `docs/DESIGN-SYSTEM-AUDIT-3.0.md`); this repo bumped onto the published batch and was verified live. Zero app-code changes needed — the stale framework pin was the only gap.

## Changes Made

### Files Modified
- `package.json` — `@kolkrabbi/kol-chess ^0.4.0` · `kol-theme ^0.9.0` · `kol-framework ^0.3.4 → ^0.5.0` (stale pin; ThemeToggle's 36/20 `variant="icon"` lives in 0.5.0)
- `pnpm-workspace.yaml` — pnpm auto-added the three same-day publishes to `minimumReleaseAgeExclude`
- `docs/DESIGN-SYSTEM-AUDIT-3.0.md` — resolution section appended (asks→delivery table, context API renames, acceptance record; frontmatter stays `active` per the 2.0 precedent)
- `node_modules/.vite` purged on bump (icon-vanish gotcha)

### Features Added/Removed
- Board is now interactive in the app: click-to-move with legal-target marks, off-mainline moves create sidelines inline in the notation, edit-mode palette placement works. All upstream — no app code.

## Current State

### Working
- Live verify on the published versions: b1 selected → a3/c3 marked → 1.Na3 played and rendered as an inline sideline; 0 console errors.
- Consumer-contract notes already satisfied: JetBrains italic woff2s present in `public/fonts/`, ThemeToggle authored clean against 0.5.0.

### Known Issues
- `src/engine/AnalysisPanel.jsx:92` requests icon `"atomic"` — not in any set, renders blank (pre-existing, spotted during the bump). Needs a v1 name or `registerIcons()`.
- Upstream context API renamed: `userVariations`-family keys are gone, replaced by `sidelines`/`playMove`/`goToSidelineMove`/`removeSideline`/`getPgnWithVariations` (+ `activeFen`, `selectPly` exposed). This app touches none of the removed keys (verified).

## Next Steps
1. Fix the `"atomic"` icon miss (one-line swap or registerIcons).
2. Build Game Review (plan 02 "Later") — next app-side feature; stats dashboard parked behind it.
