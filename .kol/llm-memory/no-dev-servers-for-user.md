---
name: no-dev-servers-for-user
description: "Never start or restart a dev server for the user — even when he says \"run it\"; he runs his own, and he kills Claude-started servers on sight"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e03c50ec-927e-4914-b3e8-da20656bc998
---

The user kills Claude-started dev servers on sight and is angry when they get restarted. During the kol-chess engine session (2026-07-15) he said "run it, I'll check" — Claude took that as an override of the standing no-servers rule, left a server up "for his checking", and then restarted it twice after he SIGTERM'd it. He had to shout the rule again.

**Why:** An orphaned/restarted Claude server is a mess he has to hunt down; the standing rule ("he runs his own; hand him the exact command") has no exceptions for user-facing use — apparent overrides like "run it" still mean *hand him the command*.

**How to apply:** Never leave a server running for the user, never restart one that died — if it got SIGTERM'd, he killed it, so acknowledge and move on. For Claude's own browser verification: start → verify → kill the exact PID within the same task. When he should see something running, give him the command (`pnpm dev`) instead.
