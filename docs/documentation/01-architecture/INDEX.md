---
title: Architecture
type: reference
status: active
updated: 2026-08-27
description: The app's shape — four pages in the framework AppShell, the SectionText page opening, the .kol-page frame + content-width tokens, elements-not-groups, routes. A single-doc section folder (INDEX is the doc).
aliases:
  - architecture
tags:
  - project/kol-chess
  - domain/architecture
sources:
  - src/main.jsx
  - src/Shell.jsx
  - src/PageHeader.jsx
  - src/board/Stage.jsx
related:
  - "[[../02-data-pipeline/INDEX|data pipeline]]"
  - "[[../03-database/INDEX|database page]]"
---

# Architecture

The app is four pages inside the framework's `AppShell`, composed from KOL design-system **elements** — the repo owns every layout, the DS owns every part (2026-08-27 compliance pass: every local twin of a DS component was replaced).

## Routes

| Route | Page | File |
|---|---|---|
| `/` | Landing — the pipeline story + entry buttons | `src/LandingPage.jsx` |
| `/analysis` | The board — analysis, engine, game review | `src/App.jsx` |
| `/database` | Query / Browse / Learn over the full game set | `src/database/DatabasePage.jsx` |
| `/stats` | Statistics dashboard | `src/stats/StatsPage.jsx` |
| `/games` | Redirect → `/database` | `src/main.jsx` |

All routes render inside `<Shell />` (`src/Shell.jsx`), which is kol-framework's **`AppShell`**: the `SideNav` rail (Overview · Board · Database · Statistics, theme toggle inside it), the hamburger drawer below `md`, the `.kol-brand-layout` grid. `?embed=1` renders the `<Outlet />` alone — chrome dropped by absence.

## The PageHeader system

One opening anatomy for every page (`src/PageHeader.jsx`), built from DS parts:

- **Title tier** — `SectionText` with `headlineAs="h1"` (type by role) + optional inline meta.
- **The strip** — only when the page has tabs or an action: `TabsRow` left, contextual action right, on the border the active tab's underline lands on. A page with neither ends at the title — no orphan rule.

Titles land at an identical y on all four pages. The board page's Controls · Engine · Review tabs live **in the header**, not the rail — the rail (`src/board/Rail.jsx`) is pure panes, fed a `tab` prop through Stage's `railTab`.

## Elements, not groups

The law (2026-07-28): the design system ships **elements**; this repo owns **composition**. No pre-composed "layout" component from a package decides where things sit.

- `src/board/Stage.jsx` composes board + rail. Married heights: at `lg+` the board defines the row, the rail pins to its box. The board anchors **left** (locks to the title edge, square-capped off viewport height via `--chess-stage-reserve`); the rail anchors **right** (locks to the page-action edge) with width leeway `clamp(440px, 30vw, 560px)`.
- Page frame = **`.kol-page`** (kol-framework: `--kol-container-max` + the `--kol-pad-section-x` padding ramp) — never a hand-typed `max-w-[Npx]` or Tailwind padding steps. Inside it, caps come from the width scale: `--kol-content-canvas` for page bodies (landing, database, learn), `--kol-content-measure` for running text, `Table width="column"` for query results, no cap for the chess stage (full-bleed law).

## Stack

React 19 · Vite 8 · Tailwind CSS v4 · pnpm · KOL DS (`kol-theme`, `kol-component`, `kol-icons`, `kol-framework`, `kol-chess`, `kol-dashboards`) · `chess.js` · `stockfish` · DuckDB-WASM.

All `@kolkrabbi/*` packages ship raw source: they stay in `optimizeDeps.exclude` (`vite.config.js`) and their `src` dirs in `@source` lines (`src/index.css`) — drop either and classes or icons vanish. `src/index.css` imports **both** `@kolkrabbi/kol-theme` and `@kolkrabbi/kol-framework/kol-framework.css` (page scaffold, padding ramp, shell grid, html/body canvas).
