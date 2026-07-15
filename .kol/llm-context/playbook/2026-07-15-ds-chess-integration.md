# Playbook — kol-chess ⇄ KOL design system

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** consume the DS chess system in kol-chess, then drive DS-usage fixes back into the kol-ds repo.

**Standing rules (non-negotiable):**
- Chess UI is consumed, not built — DS defects fixed in `kol-ds`, never forked here.
- Consumer code stays clean: 0 raw `<button>/<input>/<select>/<a>`.

---
## Entries

[17:40 GMT · 2026-07-15] · setup · playbook created
  what → initialised the live playbook   why → arc spans two repos (kol-chess consumer ⇄ kol-ds source)

[17:40 GMT · 2026-07-15] · integrate · src/App.jsx, index.css, vite.config.js
  what → wired `@kolkrabbi/kol-chess` + DS peers; theme CSS + Tailwind `@source` + optimizeDeps.exclude
  verify → dev boots ✓ · board+archive render ✓ · 0 console errors ✓

[17:40 GMT · 2026-07-15] · assets · public/fonts, index.html
  what → added missing `Right-Grotesk-Text/` family; favicon → `/favicon/favicon-kol-ds.svg`
  verify → all theme @font-face srcs 200 ✓ · favicon 200 ✓ · font-decode warnings gone ✓

[17:40 GMT · 2026-07-15] · layout · src/App.jsx:6
  what → centered/padded shell `mx-auto max-w-[1232px] px-4 py-8 md:px-6 md:py-12`
  why → DS root is `lg:max-w-[1232px]` with no mx-auto/padding → bled to edges
  verify → centered + inset ✓

[17:40 GMT · 2026-07-15] · audit · docs/DESIGN-SYSTEM-AUDIT.md
  what → /claude-kol-ds audit; 7 findings + bonus, all UPSTREAM in kol-chess + kol-theme
  note → decision: fixes land in kol-ds (showcase preview), publish once, bump here. No fork.

[17:40 GMT · 2026-07-15] · next · —
  what → clearing context; next up = check the new pnpm packages after DS fixes ship
