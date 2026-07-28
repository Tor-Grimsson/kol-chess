---
title: Architecture
type: reference
status: active
updated: 2026-07-28
description: The app's shape after the 2026-07-28 restructure — four pages, Shell + PageHeader system, elements-not-groups, routes. A single-doc section folder (INDEX is the doc).
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

The app is four pages inside one Shell, composed from KOL design-system **elements** — the repo owns every layout.

## Routes

| Route | Page | File |
|---|---|---|
| `/` | Landing — the pipeline story + entry buttons | `src/LandingPage.jsx` |
| `/analysis` | The board — analysis, engine, game review | `src/App.jsx` |
| `/database` | Query / Browse / Learn over the full game set | `src/database/DatabasePage.jsx` |
| `/stats` | Statistics dashboard | `src/stats/StatsPage.jsx` |
| `/games` | Redirect → `/database` | `src/main.jsx` |

All routes render inside `<Shell />` (`src/Shell.jsx`) — the fixed top bar: hamburger nav (Board · Database · Statistics), chess-pawn wordmark.

## The PageHeader system

One opening anatomy for every page (`src/PageHeader.jsx`):

- **Title tier** — `h1` + optional inline meta.
- **The strip** — tabs left, contextual action right, sitting on the border the active tab's underline lands on. Pages without tabs/action keep the bare rule so the rhythm never changes.

Titles land at an identical y on all four pages. The board page's Controls · Engine · Review tabs live **in the header**, not the rail — the rail (`src/board/Rail.jsx`) is pure panes, fed a `tab` prop through Stage's `railTab`.

## Elements, not groups

The law (2026-07-28): the design system ships **elements**; this repo owns **composition**. No pre-composed "layout" component from a package decides where things sit.

- `src/board/Stage.jsx` composes board + rail. Married heights: at `lg+` the board defines the row, the rail pins to its box. The board anchors **left** (locks to the title edge, square-capped off viewport height via `--chess-stage-reserve`); the rail anchors **right** (locks to the page-action edge) with width leeway `clamp(440px, 30vw, 560px)`.
- Page fence = **1800px** (site standard); content takes tighter measures inside (e.g. `/database` uses `7xl` below the header).

## Stack

React 19 · Vite 8 · Tailwind CSS v4 · pnpm · KOL DS (`kol-theme`, `kol-component`, `kol-icons`, `kol-framework`, `kol-chess`, `kol-dashboards`) · `chess.js` · `stockfish` · DuckDB-WASM.

All `@kolkrabbi/*` packages ship raw source: they stay in `optimizeDeps.exclude` (`vite.config.js`) and their `src` dirs in `@source` lines (`src/index.css`) — drop either and classes or icons vanish.
