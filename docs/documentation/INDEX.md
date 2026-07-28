---
title: Documentation
type: index
status: active
updated: 2026-07-28
description: The kol-chess subject, in numbered sections. The written mirror of what the app does.
aliases:
  - documentation
tags:
  - project/kol-chess
---

# Documentation

The subject layer — numbered, contiguous sections. Add sections as the app grows.

| Section | Docs |
|---|---|
| [[00-overview/INDEX\|00 — Overview]] | What kol-chess is. |
| [[01-architecture/INDEX\|01 — Architecture]] | Four pages, Shell + PageHeader, elements-not-groups, routes. |
| [[02-data-pipeline/INDEX\|02 — Data pipeline]] | kol-scrape → CDN shards → the /data adapter → consumers. |
| [[03-database/INDEX\|03 — Database page]] | DuckDB-WASM, the games table, Query/Browse/Learn + HOW-TOs. |
| [[04-theme/INDEX\|04 — Theme]] | The theme law, the veto stamp, the canvas rule, the stage knob. |

Machinery (build, CI, deploy) is **not** a numbered section here — it lives in the sibling [[../operations/INDEX\|operations/]].
