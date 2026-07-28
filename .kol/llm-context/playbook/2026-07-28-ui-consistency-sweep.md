# Playbook — UI consistency sweep (post-restructure review)

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** close the consistency gaps the user flagged reviewing the day's pile — one button system, one alignment grid, tab-selection = intent.

**Standing rules (non-negotiable):**
- ONE button treatment per row — never mix variants for same-purpose elements
- corrections are RULES, not one-offs — sweep every page when one page gets flagged
- alignment: edges align to the fence; no compounding indents (tab padding + centered stage = floats)

---
## Entries

[08:18 GMT · 2026-07-28] · setup · playbook created
  what → initialised the sweep playbook   why → user review of the day's UI produced a findings batch; journaling before fixing

[08:18 GMT · 2026-07-28] · landing · src/LandingPage.jsx
  what → CTA row mixes primary/ghost — user already ruled "same button for links" and it wasn't applied here
  fix → ALL row buttons same variant · add missing Database entry (row must cover board/database/stats, site has 3 surfaces)

[08:18 GMT · 2026-07-28] · header system · PageHeader.jsx + upstream TabsRow
  what → TabsRow hardcodes px-3 → first tab indents vs the h1 above it (misalignment)
  what → stage is lg:mx-auto centered → indent COMPOUNDS: board/rail float against left-aligned header, Games button orphans
  fix → tabs flush left with title · stage justify-between: board LEFT, rail RIGHT (rail gets max-width leeway) · edges lock to the fence

[08:18 GMT · 2026-07-28] · analysis rail · Rail.jsx / EngineTab / GameReview
  what → Engine tab asks user to press "Engine" — double opt-in; selecting the tab IS the intent
  what → engine/review output should occupy the controls pane's material→notation zone, not a whole separate pane
  what → review pane has rogue margins (inconsistent with siblings)
  fix → tab selection activates engine/review directly · rail recomposed so the swap region is material→notation · mirror buttons in the SETUP row · one padding system across panes

[09:21 GMT · 2026-07-28] · landing · DONE — src/LandingPage.jsx
  did → all six row entries kol-btn-primary (Button default = variant='primary', NOT secondary — anchors matched wrong class first try) · Database button added (terminal icon, matches Shell nav)
  verified → playwright 1600px: six identical pills, zero console errors

[09:21 GMT · 2026-07-28] · stage · DONE — src/board/Stage.jsx
  did → dropped lg:mx-auto + stage self-cap · board LEFT capped [calc(100dvh−reserve)] · rail RIGHT w-[clamp(440px,30vw,560px)] · stage pr = clamp+32
  verified → playwright 1600px: board locks to title edge, rail to Games edge, rail 480px

[09:21 GMT · 2026-07-28] · upstream · STAGED (publish blocked by permission — user runs it)
  did → TabsRow px-3 stripped (component→0.12.2) · Mock decomposed: SetupPanel/PiecePalette/GamePicker/MaterialSummary/useChessKeyboardShortcuts extracted + exported, Mock now composes them (chess→0.5.2) · versions bumped in both package.json
  note → store/ProductDetailLayout also consumes TabsRow — indent was same defect there, no compensation added

[09:21 GMT · 2026-07-28] · docs · DONE — vault update
  did → documentation/01-architecture · 02-data-pipeline · 03-database · 04-theme (single-doc section folders, INDEX-is-the-doc) · documentation/INDEX table wired · 00-overview stale "no design system" line fixed

[09:52 GMT · 2026-07-28] · packages · PUBLISHED + BUMPED
  did → kol-component 0.12.2 + kol-chess 0.5.2 published (registry-verified) · bumped + installed here · .vite cleared · user pushed kol-ds-ui
  verified → first tab now flush with the h1 (px-3 gone)

[09:52 GMT · 2026-07-28] · rail · DONE — src/board/Rail.jsx + engine/AnalysisPanel.jsx + engine/ReviewPanel.jsx
  did → Rail composes 0.5.2 elements (SetupPanel · PiecePalette · GamePicker · MaterialSummary · NotationPanel · PlaybackControls · useChessKeyboardShortcuts); AlternativeControlsMock retired from this repo
  did → swap zone = material→notation ⟷ engine ⟷ review under constant SETUP+palette+picker+playback frame · panes stay mounted
  did → Engine toggle KILLED (tab = intent, engine stays on for readout survival) · Review auto-runs on tab select (idle+active+game → start; error ≠ retry loop) · Run button killed · rogue max-h-56 + px-3/py-2 dropped — one padding system (column p-3/gap-4 spine)
  fix → swap pane got overflow-hidden (height squeeze painted notation over playback at short viewports)
  verified → playwright 1600×1000: all three panes correct, engine live d18, review White 88.3 · Black 69.5, zero console errors · server killed, artifacts removed
