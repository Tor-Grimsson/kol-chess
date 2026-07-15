---
title: kol-chess — docs home
type: index
status: active
updated: 2026-07-15
description: Front door to kol-chess's docs — documentation/ is the subject, operations/ is machinery, .kol/ is agent state.
aliases:
  - docs
tags:
  - project/kol-chess
---

# kol-chess — docs home

Front door to this repo's docs. Three-layer split:

- **[[documentation/INDEX|documentation/]]** — what kol-chess is about (numbered sections).
- **[[operations/INDEX|operations/]]** — repo machinery (build, CI, deploy) — a sibling, not a numbered section.
- `.kol/llm-context/` — agent state, outside this vault, at the repo root.

`.obsidian/` here is a real local dir; its files are symlinked per-file from the `02-kol-vault-shape` obsidian shape in dotfiles.
