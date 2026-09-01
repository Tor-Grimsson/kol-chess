---
name: git-syntax-only
description: "Git is entirely the user's — Claude may ask permission for read-only git, but writes are always handed over as syntax for him to run"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a2431bbb-0110-4aac-963a-67b985c073ff
  modified: 2026-09-01T16:50:10.186Z
---

Claude cannot run git write commands, ever — not even when offering ("say the word and I'll run it" was corrected 2026-09-01). Read-only git (ls-files, log) is allowed only by asking permission first.

**Why:** He owns his repo end to end; even an offered git write oversteps. This tightens the global "never run git unless explicitly asked" — there is no "explicitly asked" path for writes.

**How to apply:** For any git-requiring fix, hand him the exact command sequence (numbered, copy-pasteable) and do the non-git verification yourself afterwards. Related: [[no-dev-servers-for-user]].
