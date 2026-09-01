# Session: The personality model — a trained net replaces the 3-move book

**Date:** 2026-09-01
**Agent:** Grim (Claude Opus 5)
**Summary:** chess.js → chessops, then the finding that the "bot" was an opening book covering three moves — answered by training an actual policy network on 974,566 positions, wired into the browser, with `/play` rebuilt as a lobby and `/bot` rewritten to dissect the Python.

## Changes Made

### The rules engine — chess.js → chessops
- `src/lib/rules.js` (new) — chessops behind chess.js's surface, so 14 call sites migrated by changing one import. chess.js is now a **devDependency**, kept only for the differential test that proves parity.
- Castling is normalised in the adapter: chessops encodes every castle king-onto-rook; consumers expect the landing square. Where the two collide (common in 960) the rook square wins, because from/to alone cannot otherwise disambiguate.
- The book rebuilt **byte-identical across all 15,283 entries**. Only `meta.games` moved, 27,150 → 27,200: fifty **Chess960 games chess.js could not parse and silently skipped**. Their positions prune out at `minSeen 2`, which is why no entry changed.

### The model — `train/`, seven Python files
- `encoding.py` — 18 perspective-flipped planes, the 1858-move vocabulary
- `prepare.py` — **974,566 samples** from whole games. No ply cap, no minimum-seen; the old book read 30 plies and kept 5.9% of what it observed.
- `model.py` — 2.36M-param residual tower, **rating as an input plane** so one model covers 1100–1900
- `finetune.py` — game-level split, move-match metric, per-epoch checkpoints
- `export.py` — ONNX, and **fails if it disagrees with PyTorch**. Also measures rating conditioning and the model's own repertoire, so both ship as numbers rather than claims.
- `verify.py` / `check_shipped.py` — round-trip and artifact-coherence checks

### The app
- `src/play/personality.js` (new) — browser inference, legal-move masked. 1.2s first load, **5ms per move**.
- `src/play/PlayLobby.jsx` (new) — `/play` before a game exists
- `src/play/PlayPage.jsx` — `inGame` gate, book fetch moved off mount, model plays out of book, think-time delay
- `src/play/BotPage.jsx` — rewritten; code blocks imported from the real `.py` files with Vite `?raw`, so the page **cannot drift from source**
- `src/play/timeControls.js` — `thinkTimeMs`, and the preset grid replaces the dropdown
- `src/play/NewGameDialog.jsx` — `ShellDrawer` → `FullscreenOverlay`
- `src/Shell.jsx` · `src/index.css` — `touch="drawer"`; the one-day local fold retired to `_tmp/`

## Current State

### Working
- **The model plays.** Training ran to completion, 4 epochs on CPU (~2h). Final: **42.93% move-match** on held-out whole games against a 2.44% baseline — **17.6×**. Top-3 **68.23%**. Every epoch improved it: 32.27 → 38.06 → 42.93.
- **It got more like him as it trained.** From the start position **e4 100%**; after 1.e4 e5 it plays **f4 76%** — the King's Gambit — where epoch 1 preferred Nf3. It reached his repertoire having only ever seen board planes and his moves, never the book.
- **Rating conditioning strengthened too** — asking at 1100 vs 1900 changes the top move on **30.5%** of positions (epoch 1: 28.7%). Nothing in training forces the net to use that plane, so it is measured and the number ships in `personality.json`.
- **Think-time from his real clocks.** `[%clk]` was in the corpus and the pipeline was discarding it — now on 29,723 of 29,988 book moves. e4 in 0.3s; a move played once in 3.8s.
- **`/play` is a lobby** — no board until a game exists, and no 3.8 MB book on arrival.
- **Chess960 unblocked** — the board takes `dests` from our adapter (kol-chess 0.10.0).
- 107/107 tests · build green · 8 routes clean at 390 and 1440.

### Known Issues
- **The masters have no model** — no archive to train on, so they are still book + engine.
- **No value head.** It predicts the move he would play, not the move that wins; it cannot tell you it is losing.
- **Trained on CPU.** This iMac's Radeon is unusable by PyTorch (CUDA is NVIDIA, MPS is Apple-Silicon). The 2.36M size is chosen to finish here.
- **Years are lopsided** — 2017 contributes 8,984 games, 2022 contributes 382.
- **A kol-theme bump needs `rm -rf node_modules/.vite`** or the browser serves the old CSS and a new class silently does not exist while its inline variable already does. Cost an hour; nearly filed as a DS defect.

### Bugs caught before shipping
Four, all of the kind that degrade silently rather than erroring: a **4288-entry move vocabulary** (all 64×64 pairs, over half impossible); **queen promotions encoding to −1**; **en passant** — python-chess and chessops disagree on **8.04% of positions**, so the model would have trained on a plane the browser cannot reproduce; and `onnxruntime-web` **500ing** because a `?import` module request cannot be answered from `public/`.

## Next Steps
1. **Strength dial** — the model supports it (rating changes its top move on 25% of positions) but nothing exposes it. Put the band in the new-game sheet so the header can say `Biskupstunga 1900` and mean it.
2. **Book→engine→model seam** — the book still answers three moves. Worth asking whether it earns its place now the net covers everything.
3. **A 5th+ epoch or a GPU run.** Loss was still falling at epoch 4 (1.47) and move-match had not plateaued — this stopped because 4 epochs was the budget, not because it converged. A wider tower on real hardware is the other half.
