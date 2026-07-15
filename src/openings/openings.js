import openingsTsv from './openings.tsv?raw'
import { buildOpeningIndex } from './openingBook'

let indexPromise = null

// Lazy one-time build of the 3,800-line index (see openingBook.js).
// ponytail: book depth comes from the bundled named-lines TSV only — the lichess
// explorer API went 401/auth-gated (verified 2026-07-15). True masters-DB novelty
// needs a lichess API token or a proxy; wire that in if named-theory depth disappoints.
export const loadOpeningIndex = () => {
  if (!indexPromise) {
    indexPromise = Promise.resolve().then(() => buildOpeningIndex(openingsTsv))
  }
  return indexPromise
}
