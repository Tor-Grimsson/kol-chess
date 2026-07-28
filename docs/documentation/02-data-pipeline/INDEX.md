---
title: Data pipeline
type: reference
status: active
updated: 2026-07-28
description: How 27,200 chess.com games get from the API to the browser — kol-scrape → monthly JSON shards on the B2 CDN → the /data adapter → board, database, and stats consumers.
aliases:
  - data-pipeline
tags:
  - project/kol-chess
  - domain/data
  - provider/backblaze-b2
sources:
  - src/database/duck.js
  - src/stats/aggregate.js
related:
  - "[[../01-architecture/INDEX|architecture]]"
  - "[[../03-database/INDEX|database page]]"
---

# Data pipeline

Every game ever played on the chess.com account, served to the browser with **no server and no backend** — static JSON on a CDN, loaded on demand.

## The four stages

| Stage | What happens | Where |
|---|---|---|
| **Scrape** | [kol-scrape](https://github.com/Tor-Grimsson/kol-ds/tree/main/packages/scrape) pulls the chess.com API month by month — every archive since 2017 | upstream package |
| **Store** | Games land as **monthly JSON shards** on the Backblaze-B2 CDN | CDN bucket |
| **Serve** | `@kolkrabbi/kol-chess/data` — the adapter the app imports; bundles a demo set + manifest, fetches shards on demand | npm package |
| **Consume** | Board, database, and stats each pull what they need | this repo |

## The adapter API

`import * as chessData from '@kolkrabbi/kol-chess/data'`

- `getManifest()` — bundled; totals, months tracked, date range. Renders synchronously (the landing page's numbers).
- `loadMonthGames(month)` — one shard on demand (the board's progressive month load).
- `loadFullDataset()` — all shards; the 27.2k-row set (database ingest, stats).
- `getGamePgnByIdAsync(id, month)` — a single game's PGN for replay.

## Consumers

- **Board** (`/analysis`) — Games overlay loads all-games or month scope, fetch on button press only; a picked game replays on the board.
- **Database** (`/database`) — `loadFullDataset()` → one-time DuckDB-WASM ingest into the `games` table. See [[../03-database/INDEX|database page]].
- **Stats** (`/stats`) — all metrics computed client-side from the full set in `src/stats/aggregate.js`; nothing precomputed.
