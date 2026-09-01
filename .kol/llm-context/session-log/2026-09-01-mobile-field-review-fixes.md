# Session: Mobile field review — two root causes, eight findings, all shipped

**Date:** 2026-09-01
**Agent:** Grim (Claude Opus 5)
**Summary:** iPhone review of the live site → a review artifact with 11 photos, two root causes pinned by measurement (a case-tracked font folder; a favicon `<style>` leaking document-global through the rail's inliner), seven consumer fixes, a first-person voice ruling, three kol-ds-ui tickets filed and all three closed the same evening.

## Changes Made

### The two root causes
- **Right Grotesk was UI sans on live** — git tracked `public/fonts/Right-Grotesk/` capitalised (the 26/08 bulletin's exact trap); Vercel's SPA rewrite masked every lowercase miss as a 200 `text/html`. Fixed by the user in `chess-0006` (two-step `git mv`, syntax supplied); all 98 woff2 verified `font/woff2` live after redeploy. **Lesson logged the hard way:** commands were sent before the grant window was used to read — the diagnosis was right, but the post-fix `ls-files` was misread as refuting it.
- **"Theme toggle doesn't flip" was the favicon** — `Logomark` (kol-shell) fetch-and-inlines `svgUrl`, and the favicon's `<style> svg{color} </style>` is document-global once inlined: every icon pinned to OS-keyed ink, `data-theme` ignored. Measured live (glyph `rgb(14,14,17)` in both stamped themes) before filing.

### Files Modified
- `src/main.jsx` — `ModalProvider` mounted at the root
- `src/Shell.jsx` — `LOGOMARK` → styleless twin → **back to the favicon** once kol-shell 0.32.0 shipped `sanitizeSvg`; twin retired to `_tmp/2026-09-01-logomark-twin-retired/`
- `src/play/NewGameDialog.jsx` — `size="lg"` on both Dropdowns (Dropdown defaults `sm`; the CTA is `lg`)
- `src/play/PlayPage.jsx` — `useModal` confirms on Resign/Takeback; `ClockRow` → `PlayerBar` (initials tile · name · clock chip, no chip in unlimited; captured-material row deliberately skipped)
- `src/play/opponents.js` / `PlayLobby.jsx` — `initialsOf` hoisted to opponents.js (lobby + player bars share it; single word → first two letters)
- `src/SettingsPage.jsx` — shortcut descriptions `kol-helper-12` → `kol-mono-12` (wrapping text never wears helper)
- `src/play/BotPage.jsx` — voice sweep to **first person** (user ruling: first person everywhere; /insights already spoke it, repo-wide grep clean after)
- `.gitignore` — `.playwright-mcp/`
- `package.json` — kol-theme ^0.115 → **^0.119.0**, kol-shell ^0.31 → **^0.32.0** (`.vite` cleared each bump)

### Lobby — three filed, three closed same day (receipts in `lobby/outbox/`, all 🟢)
- `ChessHeadingFontVarUndefined` → theme 0.119.0 — the 10 chess-pack rules speak `sans-narrow` by name (the phantom var lived in kol-framework's site-tier sheet this app never imports)
- `ShellPagePadFixedOnMobile` → theme 0.118.0 — `--kol-shell-page-pad: clamp(20px, 5vw, 48px)`
- `LogomarkInlineStyleLeak` → shell 0.32.0 — `sanitizeSvg` strips `<style>`/`<script>`/`on*` from fetched marks

### Artifact
- **Field review:** https://claude.ai/code/artifact/8d22f5fe-27f9-4abb-8f65-0cc07505f3de — 8 findings with the 11 phone photos, evidence, routing, plan; kept current through to all-closed.

## Current State

### Working
- 107/107 tests, lint clean (src). All 8 findings shipped; nothing waiting on the DS.
- Live site serves all 98 Right Grotesk cuts correctly (verified by content-type, not status code — the SPA rewrite makes 200 meaningless).

### Known Issues
- **Everything after `chess-0006` is unpushed** — the consumer fixes, bumps and voice sweep land visibly on the next deploy.
- Screen checks owed after that push: `/` hero metrics + `/stats` titles in RG Narrow, `/settings` gutter at 390, icons following the toggle, dialog fields, confirms, player bars, `/bot` voice.
- Player bars carry no captured-material row — add when the bar earns it (chess.com reference shows one).

## Next Steps
1. User pushes; run the 390 sweep of all 8 routes live, both themes (plan step 6).
2. Strength dial in the new-game sheet (carried from 2026-09-01 model session — unchanged).
3. Consider graduating `PlayerBar` upstream once it settles (open AGENT-CONTEXT decision).
