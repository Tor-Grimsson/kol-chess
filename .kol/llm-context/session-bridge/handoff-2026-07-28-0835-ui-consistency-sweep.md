# Handoff — 2026-07-28 08:35

## Goal of the current arc
Close the UI-consistency gaps the user flagged reviewing the day's build (landing · shell · restructure · rail tabs · /database · PageHeader system). Four fixes approved **in outline only — none executed**. Findings journaled in `playbook/2026-07-28-ui-consistency-sweep.md`.

## Last actions taken (causal trail, newest first)
- Playbook created with the four findings; handoff written; context clearing.
- PageHeader system shipped: one component (`src/PageHeader.jsx`) on all four pages, titles land at identical y; analysis tabs (Controls·Engine·Review) moved from the rail into the header, rail = pure panes (`board/Rail.jsx` takes `tab` prop via Stage `railTab`).
- Query console upgraded (DuckDB-UI model): Columns insert-menu, CodeMirror + ⌘⏎ (`Prec.highest`), column profiles, saved/history. Learn tab (8 lessons) added. Database page = Query|Browse|Learn, 1800 fence + inner 7xl.
- Earlier today (all pushed): board height fence, theme system-follow law (explicit>system>light), `.kol-btn-nav` + icon-only-square, elements-not-groups restructure (repo owns layout), Games overlay on the board, landing links row.

## Current state / open decision points — THE 4 APPROVED FIXES (not started)
1. **Landing row, one button:** ALL entries same variant + add missing **Database** button. Row: Open the board · Database · Statistics · Blog post · Chess set in the DS · GitHub — identical variant. (`src/LandingPage.jsx`) — user law: never mix variants for same-purpose elements; sweep, don't spot-fix.
2. **Tab indent, at source:** `TabsRow` hardcodes `px-3` → first tab indents vs the h1 (PageHeader). Patch upstream kol-component → **0.12.1** (padding belongs to consumers), publish, ping push, bump here. (kol-ds-ui `packages/component/src/molecules/TabsRow.jsx`)
3. **Stage justify-between:** drop `lg:mx-auto` + stage self-cap in `board/Stage.jsx`; board anchors LEFT (locks to title edge), rail anchors RIGHT (locks to the Games action edge), rail width leeway `clamp(440px→~560px)` (rail absolute right-0; stage pr must match the clamp).
4. **Engine/Review = direct intent:** selecting the tab activates it (kill the inner "Engine" toggle button in `engine/AnalysisPanel.jsx` EngineTab); recompose the rail app-side so engine/review output swaps into the **material→notation zone** under a constant SETUP+palette+playback frame; mirror icon-buttons in the SETUP row; ONE padding system across the swap region (review pane has rogue margins). **Check first:** which sub-blocks `@kolkrabbi/kol-chess` exports individually — NotationPanel/PlaybackControls/VariationTree yes; the SETUP POSITION block may be internal to `AlternativeControlsMock` → if so, a small upstream export ask (kol-chess 0.5.2).

## Next intended action
- Execute fixes 1→4 in order (1 pure consumer, 2 upstream small, 3 consumer, 4 biggest). Verify each with playwright on a task-scoped dev server (port 5198 pattern, kill PID after). Log completions to the playbook.

## Task 5 — DOCS: big update to the user's vault (approved 2026-07-28, not started)
`docs/` is STALE — only the resolved July-15 DS audit briefs + empty INDEXes. Nothing on today's build. The user could not find what he needs. Write (kol-docs framework conventions, wired into the INDEXes; audience = HIM, not agent context):
1. **Architecture overview** — post-restructure shape: elements-not-groups, four pages, Shell + PageHeader system, routes.
2. **Data pipeline** — kol-scrape → monthly JSON shards on the B2 CDN → the `/data` adapter → consumers (board/database/stats).
3. **Database page** — DuckDB-WASM setup (self-hosted bundle), `games` table schema, Query/Browse/Learn incl. HOW-TO: add canned queries + Learn lessons.
4. **Theme law** — explicit > system > light, the `data-theme` veto stamp, `--chess-stage-reserve` knob.
Check `docs/` for a framework dir first (`_framework`/docs-framework conventions — frontmatter, tags, wikilinks, NN- filenames); conform if present.

## Working memory not yet in AGENT-CONTEXT
- User laws hardened today: corrections are RULES to sweep app-wide, not one-offs · ghost = chrome only, content actions must look pressable · one anatomy per purpose (tabs, headers, buttons) · fences: page = 1800 (site standard), content measures inside · answer questions BEFORE acting, outline before editing.
- Registry state: theme 0.11.7 · framework 0.5.4 · component 0.12.0 · chess 0.5.1 · icons 0.7.0 · dashboards 0.2.0 — all bumped + installed here, all kol-ds-ui pushes done.
- New deps today: @duckdb/duckdb-wasm, @uiw/react-codemirror, @codemirror/lang-sql, @codemirror/view, @codemirror/state.
- The stats grid 5th column at wide viewports is parked (needs a DS dashboards-grid change; user hasn't asked again).
- User validates visually on his own dev server (localhost:5175); HMR carries edits — don't start servers for him.
