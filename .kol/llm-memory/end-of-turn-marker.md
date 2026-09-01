---
name: end-of-turn-marker
description: "End every reply with \"-- end of turn\" so the user knows I've actually stopped"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: efa7f527-6b2b-4767-b119-7a660fef3fe5
  modified: 2026-08-31T20:58:29.195Z
---

End every reply with `-- end of turn` on its own line, including short answers.

**Why:** His client shows a constantly-changing activity state ("Pondering…", "1 running task", "working"), and a persistent background task (e.g. the [[lobby-watch-is-session-noise]] receipt watcher) makes it read as busy even when I'm idle. He cannot tell when a reply is finished and it is his turn to answer — especially when I've asked a question. He raised this twice: first as "its hard to know when to answer questions because you have a running task and a state of working", then as the explicit instruction.

**How to apply:** Last line of every response, no exceptions, no decoration. It is a terminator, not a sign-off — it does not replace signing as Grim where that fits.
