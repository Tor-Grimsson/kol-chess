# Session: DS-compliance pass — every local twin of a DS part replaced

**Date:** 2026-08-27
**Agent:** Grim (Claude Haiku 4.5)
**Summary:** The user spotted the local header + rule, then the hand-typed widths, then the local top bar; the audit behind those found twelve local builds with a DS twin. All twelve are now the DS part. One leftover (the review pane's move rows) is filed upstream.

## Changes Made

### Files Modified
- `src/index.css` — `@import "@kolkrabbi/kol-framework/kol-framework.css" layer(components)` + `@source` for framework src; the `body { background }` workaround deleted (framework sets `html, body`)
- `src/Shell.jsx` — rewritten: `AppShell` from kol-framework with a four-node `navTree` (Overview · Board · Database · Statistics); `?embed=1` renders the bare `<Outlet />`. The local top bar, hamburger popover and `--chess-stage-reserve` wrapper are gone (App sets its own reserve)
- `src/PageHeader.jsx` — title tier is `SectionText headlineAs="h1" headlineSize="heading-05"`; the tabs/action strip (and its rule) renders only when there is something to put on it
- `src/App.jsx` · `src/LandingPage.jsx` · `src/database/DatabasePage.jsx` · `src/stats/StatsPage.jsx` — page frame `mx-auto max-w-[1800px] px-4 py-8 md:px-6 md:py-12` → `kol-page`
- `src/LandingPage.jsx` — hero → `SectionText` (headlineClass keeps `kol-display-section`); pipeline → `SectionCardItem` ×4 (step number as the visual, a linked card is the link); external links → `Button href`; BUILT WITH → `SectionText label + body`; caps → `--kol-content-canvas` / `--kol-content-measure`
- `src/database/LearnTab.jsx` — card = `ContentText variant="article" form="row"` + `CodeBlock language="sql" size="sm"` + Button; "Find games" heading → `SectionText`; seam `border-oq-08`; cap → canvas
- `src/database/QueryConsole.jsx` — result table → kol-component `Table width="column"` (the DuckDB column profile rides `column.header` as a node); history chips → `Tag`
- `docs/documentation/01-architecture/INDEX.md` — shell, header, frame and stack sections rewritten to the real anatomy
- `lobby/outbox/NotationPanelMoveDecorations.md` — new receipt; entry + ledger row + history line written in kol-ds-ui's lobby

### Features Added/Removed
- Nothing user-facing added or removed; the same four pages on the DS's shell, frame, header, cards, code surface, table and chips.

## Current State

### Working
- Build green; Playwright at 390 + 1280 over `/`, `/analysis`, `/database` (Query with a run query, Learn), `/stats`: zero console errors, zero horizontal overflow.
- `.kol-page` pads 48px at 1280 / 20px at 390 via the framework ramp; the SideNav rail is 256px at desktop, an off-canvas drawer at 390.
- Grep for leftovers (`max-w-[1800px]`, `max-w-Nxl`, `px-4 py-8`, raw `<table>`/`<button>`) returns only `ReviewPanel.jsx` — the filed item.

### Known Issues
- `ReviewPanel.jsx` `MoveCell` still hand-rolls the move rows — waiting on `NotationPanelMoveDecorations` (kol-ds-ui lobby, 🔵 filed). When it ships: bump kol-chess, swap to `<NotationPanel decorate={…} />`, delete `MoveCell`.
- At 1280 with the 256px rail the analysis board is width-bound (~456px) and the rail's material pane clips at the playback frame — the pre-existing "rail pinned to board height" geometry, now visible one breakpoint earlier. Collapsing the rail (the grab edge) restores the old width.

## Next Steps
1. Consume `NotationPanelMoveDecorations` when it returns (receipt in `lobby/outbox/`).
2. Decide whether the analysis page should open with the SideNav collapsed (`:root[data-sidenav="collapsed"]` is the framework contract) — a design call, not a build.
