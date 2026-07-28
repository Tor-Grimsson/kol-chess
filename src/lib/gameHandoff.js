/* One-shot handoff: /games queues a picked game, /analysis consumes it on
 * mount. A module var is enough — the read always happens after a navigation
 * remounts the board page. ponytail: upgrade to context if games ever need to
 * sync into an already-mounted board. */
let queued = null
export const queueGame = (game) => { queued = game }
export const takeQueuedGame = () => { const g = queued; queued = null; return g }
