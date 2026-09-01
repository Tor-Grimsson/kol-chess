---
name: check-estate-before-ds-findings
description: Before calling anything a DS-level defect (touch targets, table scroll, mobile chrome), check kol-ds-ui's lobby ledger and kol-website's audits — the estate has rulings and precedent; never invent a consumer-side patch for DS chrome
metadata:
  type: feedback
---

kol-chess is one of many KOL consumers. Mobile/DS questions have almost always been asked and ruled already: kol-website ran a full mobile audit (2026-08-25, `~/dev/projects/kol-website/.kol/llm-context/plans/2026-08-25-mobile-audit-web-brand.md`) and filed its DS findings to `~/dev/projects/kol-ds-ui/lobby/` — the ledger (`lobby/INDEX.md`) holds the rulings. Known: **touch floor is 24px, not 44** (`MobileTouchFloor`, ruled 2026-08-26, kol-theme 0.51.0 — the 26/32/40 button scale already clears it; no type floor); `.kol-table-wrapper` scrolls by design, cut columns are the affordance (`TableMobileScroll`).

**Why:** 2026-08-26 I "found" 26px buttons as a defect, proposed a DS tap-zone hack, then a consumer CSS override. He: "you think you are the first repo to do a mobile version, how about looking at literally any other repo or asking kol-ds-ui" and "website is a good reference".

**How to apply:** Anything that smells DS-level → grep kol-ds-ui `lobby/INDEX.md` and kol-website's plans/session logs first. A real package defect goes to kol-ds-ui's lobby as a ticket (entry + ledger row + history line there, receipt in this repo's `lobby/outbox/`) — never a CSS override here. Related: [[fix-dont-hand-back]].
