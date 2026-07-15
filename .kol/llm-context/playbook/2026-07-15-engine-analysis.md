# Playbook — engine analysis + paste-and-analyse

> **Live work journal.** Append-only, newest at the bottom, real timestamps. One idea per line, no prose.
> Milestone logs: `session-log/`.

**Goal:** Add Stockfish-WASM analysis (eval bar, lines, move classification, opening/novelty strip) and an `/analyse` route that accepts pasted PGN or own-game chess.com URLs.

**Standing rules (non-negotiable):**
- Chess UI defects → upstream kol-ds repo, never forked here (ARCHITECTURE §2)
- Bespoke chess widgets built app-side first, lobbied upstream once proven
- Engine runs client-side (Web Worker); no server infra

---
## Entries

[18:07 GMT · 2026-07-15] · setup · playbook created
  what → initialised the live playbook   why → engine/analysis arc starting, multi-phase

[18:07 GMT · 2026-07-15] · deps · package.json
  what → bumped all 4 KOL pkgs (kol-chess 0.2.0 · kol-component 0.10.0 · kol-icons 0.6.0 · kol-theme 0.7.5)
  verify → build ✓ · CDN data endpoints 200 ✓
  note → pnpm outdated false-negative: default minimumReleaseAge hides same-day publishes — check registry direct

[18:07 GMT · 2026-07-15] · plan · engine-analysis plan drafted (3 phases)
  what → P1 /analyse route (PGN paste + own-URL lookup) · P2 stockfish worker + eval/lines/classification + opening strip (lichess chess-openings TSV + explorer API) · P3 optional URL proxy + upstream eval-bar slot
  why → display layer ~70% exists (0.2.0 exports + kol-component atoms); net-new = engine plumbing + 3 bespoke widgets
  note → plan file in llm-plan/ pending — was mid-write when playbook invoked

[18:09 GMT · 2026-07-15] · plan · llm-plan/02-engine-analysis.md
  what → plan file written (3 phases + constraints)   why → resolves pending note above
  note → "Later — statistics dashboard" section added per user — scope when engine arc closes

[18:17 GMT · 2026-07-15] · P1 · src/lib/resolveGame.js + src/pages/Analyse.jsx + main.jsx route
  what → /analyse route live: PGN paste + own-URL→archive lookup (loadFullDataset match on url tail → getGamePgnByIdAsync)
  verify → node --test 4/4 ✓ · browser: pasted PGN renders board+notation ✓ · URL 1960894102 loads real archive game ✓ · 0 console errors
  note → chess.js@1.4.0 now a direct dep · SectionLabel takes text= prop not children · dev server was SIGTERMed, restarted on 5175 (PID 40768)

[18:28 GMT · 2026-07-15] · P2a · src/engine/{uci,useEngine}.js + Analyse.jsx recomposed + public/engine/
  what → stockfish-18-lite-single WASM worker · eval bar · MultiPV-3 SAN lines · eval-swing classification badge
  verify → node --test 4/4 ✓ · browser: d18 evals stream ✓ · lines track position ✓ · "Nf6 blunder" #1 Qxf7# on scholar's mate ✓ · 0 console errors
  note → Analyse now composes own ChessControlsProvider (board+rail from exports) — ChessBoardWithControls wraps its own provider, engine panel couldn't reach it
  note → engine files copied node_modules/stockfish/bin → public/engine (7.3MB wasm) — re-copy on stockfish bump · icon "not found" warnings persist in kol-icons 0.6.0 → still upstream's to migrate

[18:33 GMT · 2026-07-15] · P2b · src/openings/{openingBook,openings}.js + openings.tsv + OpeningStrip in Analyse.jsx
  what → 3,803 lichess named lines (CC0) bundled · name/ECO by deepest EPD hit · book flag "left named theory at move N"
  verify → node --test 2/2 ✓ · browser: "B01 Scandinavian Defense · novelty land — left named theory at move 2" + "c5 inaccuracy" badge ✓ · 0 console errors
  note → ⚠ explorer.lichess.ovh went 401/auth-gated (curl-verified) — masters-DB novelty rescoped to TSV book-depth; token/proxy path parked in plan Phase 3 · plan file updated same turn

[18:35 GMT · 2026-07-15] · P3 · assessment only — all four optional items deferred (verdicts in plan file)
  what → proxy (out-of-repo infra) · upstream eval-bar slot (kol-ds, lobby later) · multithread (d18 ~2-3s, no need) · masters novelty (needs user's lichess token)
  note → pnpm v11 verify-deps made the ignored stockfish postinstall a HARD build error — allowBuilds: stockfish: false in pnpm-workspace.yaml (script only symlinks; we copy builds ourselves)
  verify → node --test 10/10 ✓ · pnpm build ✓

──────────── MILESTONE: engine-analysis P1+P2 shipped, P3 assessed ──────────── [18:35]
  changed: ~15 files (4 new modules · 3 tests · route · TSV · engine assets · deps) · build ✓ · tests 10/10 ✓
  log: session-log/2026-07-15-engine-analysis-paste-analyse.md

[18:44 GMT · 2026-07-15] · fix · vite.config.js
  what → icons missing in dev = kol-icons' import.meta.glob iconData killed by esbuild prebundle → added @kolkrabbi/kol-icons to optimizeDeps.exclude
  why → "legacy names, upstream" story was a misdiagnosis — v1 set had the names all along; maps were empty only in dev (prod build fine)
  verify → 0 "not found" warnings ✓ · screenshot: playback/toolbar/piece icons all render ✓ · AGENT-CONTEXT + session log corrected
  note → dev servers keep getting SIGTERMed externally — now on 5177

[18:52 GMT · 2026-07-15] · fix+audit · src/index.css + docs/DESIGN-SYSTEM-AUDIT.md addendum
  what → dropdown panel unstyled = kol-component src utilities never generated → @source added for kol-component (CSS 188→206kB, classes verified in dist)
  what → 2 upstream defects logged: unlayered .kol-btn CSS defeats lg:hidden (Board-settings gear on desktop) · table-load never activates loaded game (provider keeps prev selection)
  note → SIGTERMs were the USER killing my servers — rule reaffirmed + memory saved: never run/restart dev servers for him, verification servers die in-task
  verify → build ✓ · static class check ✓ (browser check is user's, on his own server)

[20:03 GMT · 2026-07-15] · deps · brief-2.0 publish sniffed + bumped (chess 0.3.0 · component 0.11.0 · icons 0.7.0 · theme 0.8.0)
  what → 6/7 brief asks landed: panel slot ✓ · controlled externalGame ✓ · table-load activates ✓ · theme layer(components) ✓ · kol-dd-list classes ✓ · arrow-downright in v1 ✓ — ThemeToggle still missing ✗
  verify → tests 10/10 ✓ · build ✓
  note → consumer switch (panel+paste on home, delete /analyse) unblocked, awaiting go

[20:06 GMT · 2026-07-15] · correction · ThemeToggle is NOT missing — ships in @kolkrabbi/kol-framework@0.5.0 (app-shell tier)
  what → brief 2.0 §3.4 corrected: consumer adds kol-framework + mounts toggle in overlayActions, no DS work needed
  note → user-caught; audit 1.0's "no theme toggle" claim only checked kol-component

[20:37 GMT · 2026-07-15] · switch · App.jsx rebuilt on layout seams · src/engine/AnalysisPanel.jsx extracted · /analyse + src/pages DELETED
  what → panel slot hosts AnalysisPanel · paste = popover in overlayActions (reuses resolveGameInput verbatim) · ThemeToggle (kol-framework@0.5.0, new dep) · engine/openings/resolver modules untouched
  verify → tests 10/10 ✓ · build ✓ · visual check = user's
  note → index.css @source for kol-component kept (dropdown moved to theme classes upstream, but other utilities may remain in its src)

──────────── MILESTONE: engine-analysis arc COMPLETE ──────────── [20:37]
  changed: consumer switch 4 files + 1 deletion · one view · build ✓ · tests 10/10 ✓
  log: session-log/2026-07-15-engine-analysis-paste-analyse.md (+ /log-work-milestone when user closes the arc)

[20:45 GMT · 2026-07-15] · post-milestone fix · vite.config.js + .vite cache purge
  what → icons vanished 3rd time — prebundled IMPORTERS of kol-icons (kol-component, kol-framework) carry broken glob copies on dep-graph changes → excluded the whole KOL family from optimizeDeps
  verify → build ✓ · user restarts his dev to confirm
  note → rule in AGENT-CONTEXT: new KOL dep → exclude it same breath · escape hatch: rm -rf node_modules/.vite

[21:01 GMT · 2026-07-15] · investigate+fix · engine toggle added · edit/variation confirmed dead upstream
  what → engine now opt-in: Button in AnalysisPanel, worker exists only while on (useEngine enabled option) — default OFF per user
  what → investigation: ChessBoard has ZERO pointer handlers (display-only) → pieces can't move by construction · VariationTree = unused import, variations stored but rendered nowhere → both filed in brief 2.0 Addendum 2
  what → Game Review doesn't exist yet — parked as "Later — game review" in llm-plan/02 (app-side batch pass, no upstream dep)
  verify → tests ✓ · build ✓

[21:05 GMT · 2026-07-15] · correction · dead-features ask moved out of the already-sent 2.0 → NEW docs/DESIGN-SYSTEM-AUDIT-3.0.md
  what → 2.0 restored to as-sent state (addendum removed) · 3.0 = board-input layer + inline sidelines + edit-mode gating, with acceptance list
  note → user-caught: never append asks to a brief that already shipped — new tranche, new numbered brief

[21:06 GMT · 2026-07-15] · log · session-log/2026-07-15-engine-toggle-dead-features-brief-3.md written · AGENT-CONTEXT updated (chain trimmed to 5)
  note → post-milestone tail logged: icons round 2 · engine toggle · dead-features investigation · brief 3.0
