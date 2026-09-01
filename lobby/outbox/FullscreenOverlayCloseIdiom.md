# FullscreenOverlayCloseIdiom — one close X for the estate, aligned to the sheet edge

**Filed:** 2026-09-01 → **kol-ds-ui**
**Entry:** `~/dev/projects/kol-ds-ui/lobby/inbox/FullscreenOverlayCloseIdiom.md`
**Ledger:** `~/dev/projects/kol-ds-ui/lobby/INDEX.md` — **the truth about this ticket**
**Last known:** 🟢 `closed` · synced 2026-09-01 — kol-component 0.152.0 + kol-theme 0.120.0; bump executed here same day

## Why it went there

Both treatments are DS-owned — the drawer trigger renders inside kol-shell's
`AppShell`, the overlay close inside kol-component's `FullscreenOverlay`
(`variant="outline" quiet`), and `.kol-overlay-close`'s 12px corner inset is
kol-theme's. Nothing on the consumer side chooses either. User rulings from
the 2026-09-01 phone review round 2: two different close buttons one tap
apart; he prefers the drawer's bare look; *"if its a button then it should use
primary variant not outline"*; and the overlay X *"doesnt align with the right
edge of the dropdown"*.

## Remainder here once it ships

Bump whichever packages carry it, re-open the new-game sheet on the phone:
the X on the fields' right edge, wearing the ruled treatment, matching the
drawer's.

## ✅ RETURNED — 2026-09-01 · kol-component@0.152.0

One idiom, the user's pick: FullscreenOverlay's X is the drawer trigger's bare nav glyph (variant nav, default square) — outline/quiet/sm dropped. Alignment: .kol-overlay-close right: 0 (kol-theme 0.120.0) — the sheet hugs your panel, so the spacing-3 inset was what floated the X 12px inside the content edge; the button's box now sits on the same vertical as the controls under it.

**Remainder here:** bump kol-component@0.152.0 + kol-theme@0.120.0; re-check the new-game sheet — X matches the drawer's, box edge on the column edge

✅ **Remainder executed 2026-09-01 same day:** kol-component ^0.152.0 + kol-theme ^0.120.0 bumped, `.vite` cleared. Shipped source verified: `variant="nav"` bare glyph, `.kol-overlay-close` `right: 0`. New-game-sheet phone re-check rides the next deploy.
