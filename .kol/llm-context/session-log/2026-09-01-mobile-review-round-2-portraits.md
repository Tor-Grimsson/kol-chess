# Session: Mobile review round 2 — eight items, five consumer fixes, three DS tickets filed and shipped

**Date:** 2026-09-01
**Agent:** Grim (Claude Opus 5)
**Summary:** Second phone pass on the live site → eight items dictated one at a time; five fixed here, three routed to kol-ds-ui and all three shipped, bumped and verified the same evening (one of them twice, after this repo caught a duplicate class in the first ship). Master portraits landed on the /play roster.

## Changes Made

### Files Modified
- `src/play/NewGameDialog.jsx` — time presets `outline/sm` → `primary/lg`; `SectionText` headline "Who, which colour, how long" removed (user: filler; the `NEW GAME` eyebrow stays); Cancel `ghost` → `primary`
- `src/play/PlayLobby.jsx` — `OpponentMedia`: portrait when the opponent declares one, `initialsOf` when it does not
- `src/play/opponents.js` — `PORTRAIT(key)` + `portrait:` on all ten book-backed opponents (`engine` has none)
- `src/insights/InsightsPage.jsx` — finding cards `span="2x2"` → `"2x1"`
- `public/masters/*.webp` — eleven 120×120 crops, 1.7–4.8 KB each
- `package.json` — theme ^0.119→**^0.120.1** · shell ^0.32→**^0.34.0** · component ^0.148→**^0.152.0** · dashboards ^0.3→**^0.4.1** (`.vite` cleared on each)

### The dead space on /insights
Reported as "so much space between items in insight… is that a mobile issue?" — it is not the viewport. `.dash-grid` rows are `minmax(240px, auto)`, so a 2-row span is a **496px floor**; the finding cards are three-row tables that stop near 300. The grid's mobile clamp rewrites `grid-column` for oversized spans and never `grid-row`. `2x1` gives the row back to the table. The /stats chart cards keep `2x2` — a chart needs a box.

### Portraits
Nine masters from their Wikimedia Commons lead portraits + Ólafsson; square-cropped, 120×120, webp q82. Capablanca needed a tighter crop (the lead image is full-torso — face was ~12px at thumb size). **`me` is NOT the chess.com avatar** — that endpoint returns a wide snow-scene photo, unreadable at 40px; used the studio portrait from the website's B2 asset library instead (`b2.kolkrabbi.io/website/asset-library/studio/card-about/studio-about-1200.jpg`).

### Lobby — three filed, three closed, one queried back
- `ShellDrawerOnRight` → **kol-shell 0.34.0**: drawer mirrored to the right, trigger `right: 12` in both states, the 2026-08-31 travel rule retired, scrim is now a button. The left-side drawer's open X sat at x 252–284 on a 390 phone — 65% across, which is what "the close isnt in the middle of the screen" meant.
- `FullscreenOverlayCloseIdiom` → **kol-component 0.152.0 + kol-theme 0.120.0**: the overlay X is the drawer's bare `nav` glyph (user's pick between the two idioms), `.kol-overlay-close` `right: 0` so its box sits on the field column's edge.
- `DashDetailWrapsWithoutLeading` → **kol-theme 0.120.1 + kol-dashboards 0.4.1**. First ship (0.120.0/0.4.0) minted a `.dash-subtitle` **duplicate over an existing 16→22 sub-heading**; caught here by reading the shipped CSS against the receipt and queried back same evening. Renamed: the wrapping lede is `.dash-lede` (mono 400, 10→12 at the 768 container step, line-height 1.5). 0.120.0 / 0.4.0 deprecated on the registry.

## Current State

### Working
- 107/107 tests, lint clean (src). All eight review items fixed in the tree; all three DS remainders executed same day.

### Known Issues
- **Nothing has been on the phone since.** Right-side drawer, the sheet X, `/insights` leading, the portraits and everything from the earlier round are all deploy-pending — the live site still serves the pre-`chess-0006` build plus one deploy of consumer fixes.
- One frame the DS flagged to eye on device: a long drawer title reaching under the top-right X.

## Next Steps
1. Deploy, then the 390 sweep of all eight routes in both themes — now covering the mirrored drawer, the sheet, the roster portraits and the insight cards.
2. Strength dial in the new-game sheet (carried, unchanged).
3. `PlayerBar` still draws initials — decide whether it takes portraits too once the roster is seen on device.
