---
title: Database page
type: guide
status: active
updated: 2026-08-26
audience: internal
description: The /database page — DuckDB-WASM setup, the games table schema, the Query / Browse / Learn tabs, and how to add canned queries and Learn lessons.
aliases:
  - database
tags:
  - project/kol-chess
  - domain/data
  - domain/sql
sources:
  - src/database/duck.js
  - src/database/QueryConsole.jsx
  - src/database/LearnTab.jsx
  - src/database/DatabasePage.jsx
related:
  - "[[../02-data-pipeline/INDEX|data pipeline]]"
---

# Database page

`/database` puts a real SQL engine over the full 27.2k-game archive — **in the browser**. DuckDB-WASM, fully self-hosted: wasm + workers come from the installed package via Vite `?url` imports, no CDN dependency beyond the B2 game data itself (`src/database/duck.js`).

## Setup

One shared init promise per session (`getDb()`): select bundle → spawn worker → `loadFullDataset()` → register the JSON as a file → `CREATE TABLE games AS SELECT … FROM read_json_auto('games.json')`. Re-visits reuse the connection; the ingest happens once.

## The `games` table

One table, flattened from the adapter's nested game-meta at ingest — a single-level schema queries better than structs.

| Column | Type |
|---|---|
| `played_at` | TIMESTAMP |
| `month` | VARCHAR |
| `rated` | BOOLEAN |
| `time_class` | VARCHAR |
| `time_control` | VARCHAR |
| `color` | VARCHAR |
| `result` | VARCHAR |
| `player_rating` | BIGINT |
| `opponent` | VARCHAR |
| `opponent_rating` | BIGINT |
| `eco` | VARCHAR |
| `url` | VARCHAR |

## The three tabs

Tabs stay mounted — table scope and query results survive switches.

- **Query** — the SQL console (`QueryConsole.jsx`): CodeMirror with SQL highlighting, **⌘⏎ runs**, a Columns insert-menu, per-column result profiles (type / distinct / min–max), canned queries, and saved queries + run history in `localStorage` (`kol-chess-sql-saved` / `kol-chess-sql-history`).
- **Browse** — the archive table (`GameArchiveTable` from kol-chess); **Load here** hands the game to the board via `queueGame` → `/analysis` consumes it on mount.
- **Learn** — 8 lessons from "Tables, rows, columns" to window functions, then a **Find games** block of 8 question-shaped filter recipes (F1–F8, each naming the one value to swap) (`LearnTab.jsx`); a card's example lands in the Query console pre-filled.

## HOW-TO: add a canned query

Edit `CANNED` at the top of `src/database/QueryConsole.jsx` — `{ label, sql }`. It appears in the canned row above the editor. Current set: Win rate by color · Most-played opponents · Games per year · Blitz rating march.

## HOW-TO: add a Learn lesson

Edit `LESSONS` (curriculum) or `RECIPES` (Find games) in `src/database/LearnTab.jsx` — `{ n, title, body, sql }`. Keep the sequence didactic: each lesson leans on the previous one's concept, and every `sql` must run against the `games` schema above.
