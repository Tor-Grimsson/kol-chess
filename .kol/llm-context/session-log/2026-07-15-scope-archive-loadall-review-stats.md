# Session: scope archive load-all, game review, statistics dashboard

**Date:** 2026-07-15 (night, post engine-analysis milestone)
**Agent:** Grim (Claude Opus 4.8)
**Summary:** Pure scoping/docs session — no code. Wrote brief 4.0 (archive "load entire set"), scoped the parked game-review feature into plan 02, and scoped a new statistics dashboard into plan 03 built on the published `@kolkrabbi/kol-dashboards` package.

## Changes Made

### Files Modified
- `docs/DESIGN-SYSTEM-AUDIT-4.0.md` (new) — brief to the kol-ds agent: add `<all>` as the first month-dropdown item (opens on it) + a scope-aware action button ("Load entire set" / generic "Load month", **not** "Load Nov 2020"), fetch on click not mount, wired to the existing `loadFullDataset()`. Upstream-only: the dropdown/button live in `GameArchiveTable.jsx`; `ChessAnalysisLayout` exposes no archive-toolbar seam.
- `.kol/llm-plan/02-engine-analysis.md` — "Later — game review" stub replaced with a full scope (Lichess/chess.com win%+accuracy math, cp-loss classification + brilliant/great heuristics, app-side `reviewRunner`/`uci.js`/aggregator/summary build, 3 reference repos ranked). "Later — statistics dashboard" stub → pointer to plan 03.
- `.kol/llm-plan/03-statistics-dashboard.md` (new) — stats site on `@kolkrabbi/kol-dashboards@0.1.0`: compose its cards + SVG chart primitives + `DashboardGrid` directly (NOT its deploy-shaped `MetricsDashboard` apparatus), data from brief-4.0's `loadFullDataset()`, aggregation module is the real work.
- `.kol/llm-context/playbook/2026-07-15-engine-analysis.md` — 3 scoping entries appended.

### Features Added/Removed
- None — scoping only.

## Current State

### Working
- App unchanged from the 0.4.1 state (engine-analysis arc closed, console clean).

### Known Issues
- **kol-dashboards stale deps** (discovered): pins kol-component 0.7.0 / theme 0.7.1 / icons 0.5.0 as `dependencies` (not peerDeps) vs our 0.11.0 / 0.9.1 / 0.7.0 — risk of a nested older copy → token/class drift or double-registered icons. Verify on install; likely needs an upstream dep-bump + move-to-peerDeps before it composes with our theme. Blocks the stats-dashboard build until checked.

## Next Steps
1. **Brief 4.0** — hand to the kol-ds agent (archive load-entire-set); republish + bump here when it lands.
2. **Game review** — build when the user gives the go (scope in plan 02); crib exact classification/accuracy constants from Chesskit's `src/` at build time.
3. **Stats dashboard** — first verify kol-dashboards composes with our newer kol packages (the stale-deps risk); depends on brief 4.0's load-all path.
