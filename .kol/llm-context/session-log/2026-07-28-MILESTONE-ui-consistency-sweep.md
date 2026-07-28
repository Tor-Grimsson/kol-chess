# 🏁 Milestone: UI consistency sweep (post-restructure)

**Date:** 2026-07-28
**Agent:** Grim (Claude Fable 5)
**Arc:** Close the consistency gaps flagged reviewing the day's build — one button system, one alignment grid, tab-selection = intent, elements-not-groups all the way down.
**Delivered:** All five approved fixes shipped and browser-verified on published packages (component 0.12.2 · chess 0.5.2): uniform landing row, flush tabs, justify-between stage, app-composed rail with direct-intent engine/review, and a four-doc vault update.

## What closed

- Landing row mixed variants + missing Database → done: six `kol-btn-primary` entries (Button default = `primary`, not `secondary`), Database with `terminal` icon.
- TabsRow hardcoded `px-3` → done at source: stripped upstream, **kol-component 0.12.2** published; first tab flush with the h1. store/ProductDetailLayout had the same defect — no compensation added.
- Stage centered/floating → done: board anchors LEFT (title edge, `calc(100dvh−reserve)` cap), rail RIGHT (Games edge), width `clamp(440px,30vw,560px)`, stage `pr` = clamp+32.
- Rail = upstream monolith → done: `AlternativeControlsMock` decomposed upstream into exported `SetupPanel` · `PiecePalette` · `GamePicker` · `MaterialSummary` · `useChessKeyboardShortcuts` (**kol-chess 0.5.2**); `Rail.jsx` composes the constant SETUP+palette+picker+playback frame with a material→notation ⟷ engine ⟷ review swap zone (panes stay mounted; swap pane `overflow-hidden` against height squeeze).
- Engine double opt-in → done: toggle killed, Engine tab = intent (auto-on, stays on so the readout survives switches).
- Review behind a Run button → done: button killed, Review tab auto-runs the d14 pass (game switch re-arms; `error` ≠ retry loop); rogue `max-h-56` + pane padding dropped — one p-3/gap-4 spine.
- Stale vault → done: `docs/documentation/` 01-architecture · 02-data-pipeline · 03-database (+ both HOW-TOs) · 04-theme, INDEXes wired, 00-overview corrected.

## The arc (brief)

- Flagged in the 2026-07-28 morning review of the restructure day; findings journaled in `playbook/2026-07-28-ui-consistency-sweep.md`, carried by `session-bridge/handoff-2026-07-28-0835-ui-consistency-sweep.md` (now consumed).
- Order flipped from the handoff's 1→4: upstream extractions first (one publish+push round), then consumer fixes, then the rail recompose against the new exports.
- Verified per fix with playwright on a task-scoped server (5198, killed): four pages, three rail panes, zero console errors.
- Spans: this log + the playbook; prior state in [2026-07-20 theme fixes](2026-07-20-theme-toggle-body-bg-fixes.md).
