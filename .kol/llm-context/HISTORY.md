---
_template:
  version: 1
  path: .kol/llm-context/HISTORY.md
  sync: skip
---

# kol-chess — history & decisions

Knowledge base tracking the conversation that produced this project, the alternatives considered, and the reasoning behind core decisions. Reference for humans or future AI sessions that need the *why* rather than the *what*.

For decisions as enforced rules, see `llm-context/ARCHITECTURE.md`. For current operational state, see `llm-context/AGENT-CONTEXT.md`.

---

## origin

kol-chess is a chess analysis and game-database web app. Scaffolded 2026-07-15 on the base (no design system) dev stack — Vite + React + Tailwind — as a clean starting point before any app logic. This file records the *why* as decisions accrue.

---

## alternatives surveyed and rejected

<!-- List the options considered before landing on the current approach. Structure:
### [Alternative name]
- [Why it was considered]
- **Rejected:** [specific reason(s)]
-->

### [Alternative 1]

- [Brief description]
- **Rejected:** [reason]

---

## core principles

[Principles that emerged through iteration. These may not have been stated up front but surfaced as the project took shape.]

- **[Principle 1]** — [description]
- ...

---

## architectural decisions

<!-- Narrative form of the decisions in ARCHITECTURE.md, with context. Structure:
### Why [decision]
[Paragraph explaining the reasoning and what it rules out.]
-->

### Why [major decision]

[Explanation.]

---

## API / interface evolution

[If the public surface changed through iteration, record how. Useful for understanding why current shapes look the way they do.]

---

## discussion outside the build

[Context that didn't become code but shaped thinking. Conversations about distribution, scope, non-goals, related tools.]

---

## references

[Links to external resources that informed decisions — docs, articles, tools considered.]

---

## what's *not* in this document

- Installation instructions → `../README.md`
- Load-bearing decisions stated as rules → `llm-context/ARCHITECTURE.md`
- Current state, roadmap, gotchas, contracts → `llm-context/AGENT-CONTEXT.md`
- Session-by-session dev log → `llm-context/session-log/`
- Speculative future work → `../llm-plan/`

This file is purely the decision history. Update it when a core decision is revisited or reversed, not for routine changes.
