# Session: Engine toggle, icons root cause round 2, brief 3.0

**Date:** 2026-07-15
**Agent:** Grim (Claude Fable 5)
**Summary:** Post-milestone follow-ups from live user testing: killed the recurring icon-disappearance class (whole KOL family excluded from prebundling), made the engine opt-in behind a toggle (default off), confirmed edit-mode/variations are dead by construction upstream, and filed brief 3.0 (board interactivity) — after learning not to append to the already-sent 2.0.

## Changes Made

### Files Modified
- `vite.config.js` — `optimizeDeps.exclude` now covers ALL KOL packages (chess/icons/component/framework); prebundled importers of kol-icons carried broken glob copies on every dep-graph change (the "icons keep disappearing, 3rd time" cause) · `.vite` cache purged
- `src/engine/useEngine.js` — `enabled` option; worker exists only while analysis is on
- `src/engine/AnalysisPanel.jsx` — "Engine" toggle button (kol `selected` state), **default off**; opening strip stays always-on (local, free)
- `docs/DESIGN-SYSTEM-AUDIT-3.0.md` — new brief for kol-ds: board-input layer, inline sidelines, edit-mode gating, kill `window.prompt`; acceptance checklist
- `docs/DESIGN-SYSTEM-AUDIT-2.0.md` — restored to as-sent state (my addendum-after-send removed; new asks = new numbered brief)
- `.kol/llm-plan/02-engine-analysis.md` — "Later — game review" added (batch pass + accuracy + summary, app-side only, user-requested)

### Features Added/Removed
- Engine analysis is now opt-in per session via the panel button
- No features removed; edit mode / variations were never functional (see below)

## Current State

### Working
- One-view app: board, archive (loads activate), paste, engine toggle, opening strip, ThemeToggle. Tests 10/10, build ✓.

### Known Issues
- **Board interactivity dead upstream** — `ChessBoard` has zero pointer handlers (pieces can't move, by construction); `VariationTree` is an unused import (variations stored, rendered nowhere). Filed as brief 3.0; consumer can't patch without vendoring.
- Game Review doesn't exist yet — parked in plan 02 "Later" (app-side, no upstream dependency).

## Next Steps
1. kol-ds agent works brief 3.0 → publish → bump here (sniff registry directly, not `pnpm outdated`).
2. Build Game Review (plan 02 "Later") — next app-side feature.
3. Stats dashboard remains parked behind it.
