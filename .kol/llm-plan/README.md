---
_template:
  version: 1
  path: .kol/llm-plan/README.md
  sync: notify-only
---

# llm-plan — speculative plans

Forward-looking, not-yet-committed work, peer to `llm-context/`. Kept out of `llm-context/` (which is *current* state) so plans don't bloat what loads every session.

## Convention

- **One plan per file**, `NN-slug.md` — two-digit prefix, kebab slug. Not dated (that's `session-log/`).
- `01-parking-lot.md` is the catch-all backlog for small speculative ideas; graduate an item into its **own** `NN-` file when it becomes real, standalone work.
- Nothing here is committed. When a plan becomes active work, fold it into `llm-context/AGENT-CONTEXT.md` and mark/remove it here.
- No speculative work yet? Delete `01-parking-lot.md` (or this whole folder) and add it back later.
