# Session: NavRail migration, KOL bump ×5, and the lobby brought to standard

**Date:** 2026-08-30
**Agent:** Grim (Claude Fable 5)
**Summary:** Three arcs — two rounds of KOL bumps (the DS published ~10 times mid-session), the lobby rebuilt from an orphan `outbox/` into a registered six-section ledger, and the shell migrated off kol-framework's 264px SideNav onto kol-shell's 48px `NavRail`, which gave the board back 216px.

## Changes Made

### Files Modified — the shell migration
- `src/Shell.jsx` — rewritten onto **kol-shell**'s `AppShell` + `NavRail` (the *app* tier) from kol-framework's `AppShell` (the *site* tier). Router-agnostic: `currentPath` from `useLocation`, `onNavigate` from `useNavigate`. Four `items`, Settings as a `bottomItems` rung, `logomark` on the favicon SVG, `settingsPath`/`settingsKey=','`, `navKeys`. `?embed=1` still short-circuits to a bare `<Outlet />`, with every hook called before the branch
- `src/SettingsPage.jsx` — **new.** The DS `SettingsScaffold` (two tabs: Settings · About) with `ThemeToggle` passed into its `themeToggle` node slot, `SettingsRow align="fill"` shortcut rows, `SettingsLinks` + `SettingsColophon` on About
- `src/main.jsx` — `/settings` route
- `vite.config.js` — `@kolkrabbi/kol-shell` added to `optimizeDeps.exclude` (the standing source-only law)
- `src/index.css` — `@source` for kol-shell's src
- `package.json` — `+ @kolkrabbi/kol-shell ^0.30.0`, `+ gsap ^3.15.0` (NavRail's peer, already in the store via kol-component)

### Files Modified — bumps
- `package.json` / `pnpm-lock.yaml` — two rounds. First: component 0.79→0.136, framework 0.25→0.36, icons 0.22→0.25, theme 0.72→0.111, chess 0.7.1→0.8.0. The registry moved *during* installs (theme 0.97→0.100→0.103→0.111, component 0.133→0.136→0.143), so each round was re-checked against `npm view` until it stopped moving

### Files Modified — the lobby
- `lobby/INDEX.md` — **new.** The six mandatory sections (States · Queue · Closed · Archived · Filed elsewhere · History) with this repo's own bar for 🟢: in the tree, build green, browser-verified with zero console errors, cited by file and package version; DS defects never closed by a consumer override
- `lobby/inbox/` · `done/` · `archive/` · `_assets/` — created (bare, matching kol-r2b2's shape)
- `~/.dotfiles/files/folders.md` — registered `~/dev/projects/kol-chess/lobby`
- `lobby/outbox/NotationPanelMoveDecorations.md` · `ChessBoardFluidCoordinates.md` — `**Remainder here:**` rewritten from the filing-time *prediction* to the executed *fact* (`none — …`), which is what the convention requires on return and what the CLI's `owed` column reads
- `lobby/outbox/lobby-watch-exit-when-idle.md` + `~/.dotfiles/lobby/inbox/lobby-watch-exit-when-idle.md` + both ledgers — a ticket filed to dotfiles
- `.gitignore` — `.kol/llm-context/.active-goal-*.md` (the /kol-goal loop state)

### Features Added/Removed
- **Added:** `/settings` — theme toggle, keyboard reference, about/links. The rail deliberately carries no toggle upstream (dropped in kol-shell 0.16.0), so the page is where it now lives.
- **Removed:** the hamburger drawer below md, and the theme toggle inside the nav rail — both were kol-framework `AppShell`'s. Nav is now a permanent 48px column at every width.

## Current State

### Working
- Build green, oxlint clean in `src/` (one pre-existing fast-refresh warning in `EngineContext.jsx`).
- **Five routes verified at 1280 and 390, zero console errors, zero horizontal overflow:** `/`, `/analysis`, `/database` (query run → kol `Table`), `/stats` (full 27,200 set), `/settings` (both tabs).
- **The board reclaimed its width:** 448px → **664px** at 1280×1100. At 1280×720 it reads 470px because it is now bound by `100dvh − --chess-stage-reserve` rather than by the rail — the constraint flipped, which retires the standing "board is width-bound, rail pane clips at the playback frame" issue.
- Theme toggle flips, persists to `localStorage['kol-theme']`, repaints the canvas, and restores. `,` toggles `/settings` ⇄ where you were. ⌥-digit nav works. `?embed=1` renders no rail and no `.kol-app-shell`.
- At 390: rail 48px with all five rows reachable, board 302px, touch targets 32px (above the 24px DS floor), 15 `.chess-coord--fluid` labels.
- `lobby --lint` passes; `lobby --counts` reads `kol-chess 0 0 0 3 0`.

### Known Issues
- **⌥1 and ⌥2 are the same destination.** `navKeys` counts the logomark as row 1 (upstream's `AppShellNavKeysHomeFirst`) and our mark and first rung both point at `/`. Documented as-is on the settings page rather than publishing a tidier mapping than the one that runs.
- **Mobile loses 48px of board** (350 → 302) — the cost of a permanent rail over a hidden drawer. Bought: nav reachable everywhere without opening anything. `touch="bare"` and `touch="overlay"` were both rejected; each discards the working mobile layout the 2026-08-26 scan built.
- **`lobby --watch` never exits** even when nothing is pending, contradicting its own help and docblock — filed to dotfiles (🔵), and until it ships every armed watch holds a process.

## Next Steps
1. Consider whether `PageHeader.jsx` and `.kol-page` should move onto kol-shell's `PageShell`/`PageHeader` now that the app tier is in — independent of the rail, not urgent.
2. Watch for the dotfiles `lobby-watch-exit-when-idle` return (receipt in `lobby/outbox/`); nothing is owed here when it lands.
