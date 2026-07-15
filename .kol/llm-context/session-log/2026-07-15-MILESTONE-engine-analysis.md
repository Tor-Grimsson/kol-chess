# 🏁 Milestone: Engine analysis + paste-and-analyse

**Date:** 2026-07-15
**Agent:** Grim (Claude Fable 5)
**Arc:** From "let's talk about adding an engine" to a single home view carrying Stockfish analysis, paste-a-game, opening/novelty awareness, and theme toggle — planned, built, forked, un-forked, and folded into the DS layout via seams shipped upstream the same day.
**Delivered:** One view (`ChessAnalysisLayout` 0.3.0) with an engine panel in its `panel` slot: eval bar, MultiPV-3 SAN lines, blunder/mistake/inaccuracy badges, opening strip (3,803 CC0 named lines + "left named theory at move N"), paste flow (PGN or own chess.com URL → CDN archive lookup) and ThemeToggle in the archive overlay. Engine = Stockfish 18 lite-single WASM worker, no COOP/COEP. 10/10 unit checks, prod build green.

## What closed

- **Plan P1 (/analyse route)** → done, then deliberately deleted — superseded by the panel-slot mount on home
- **Plan P2a (engine) + P2b (openings)** → done, modules live in `src/engine/` + `src/openings/`, view-independent
- **Plan P3 (optional items)** → assessed, all deferred with verdicts in `llm-plan/02-engine-analysis.md` (proxy · upstream slot — since shipped anyway · multithread · masters-novelty token)
- **View fork** → deleted; seams requested via `docs/DESIGN-SYSTEM-AUDIT-2.0.md`, shipped upstream in kol-chess 0.3.0 / kol-component 0.11.0 / kol-icons 0.7.0 / kol-theme 0.8.0, verified in source
- **DS defect addendum (4 items)** → layering, dropdown classes, icon prebundle, table-load activation — all fixed (2 upstream, 2 consumer)
- **ThemeToggle** → was never missing; ships in `kol-framework@0.5.0`, now mounted
- **Masters-DB novelty** → parked at `llm-plan/02` Phase 3 (lichess explorer went 401-gated)
- **Statistics dashboard** → parked at `llm-plan/02` "Later" — scope now that this arc is closed
- **App shell / nav** → parked at `llm-plan/01-parking-lot.md` (kol-framework provides the parts)

## The arc (brief)

- Bumped 0.1.0→0.2.0 stack, planned three phases in `llm-plan/02-engine-analysis.md`
- Built P1–P3 in one goal-loop run ([engine analysis + paste-and-analyse](2026-07-15-engine-analysis-paste-analyse.md)), browser-verified per phase
- User testing surfaced four defects + the fork mistake → `DESIGN-SYSTEM-AUDIT-2.0.md` brief to the kol-ds agent
- Upstream shipped all seams same evening; consumer switch re-mounted everything on the one view and deleted the fork
- Live journal: `playbook/2026-07-15-engine-analysis.md` (13 entries, 2 milestones)
