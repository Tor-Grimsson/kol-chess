---
name: fix-dont-hand-back
description: "A scan/audit task includes fixing what it finds — never present findings as \"your call\" or list what wasn't done; do the work, he flags what's wrong"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e1100cbc-d132-4a7c-a5a6-8fc86b42054e
  modified: 2026-08-26T18:13:58.717Z
---

When given a scan, audit, or review task, the deliverable is the fixed state, not a findings list handed back for a decision. Fix everything fixable in this repo; only genuinely upstream (DS / kol-chess) items get a one-line note. Never show a "Not done" / "Open — your call" block.

**Why:** 2026-08-26 — after the mobile scan I tabled five findings as "your call, nothing started" and a "Not done" list. He said: "I dont give this task to you so you can throw it back to me. DO NOT show me stuff you didnt do, just do the work and if something is wrong I will highlight it."

**How to apply:** Findings → fixes in the same pass. Report what changed. If something is out of scope for this repo (ARCHITECTURE §2 upstream rule), say where it belongs in one line, no menu. Related: [[no-dev-servers-for-user]].
