#!/usr/bin/env node
/**
 * link-chess-package — develop @kolkrabbi/kol-chess in place.
 *
 * WHY THIS EXISTS. kol-chess (this repo) is the only external consumer of the
 * package, so every board change was a five-step round trip: edit in
 * kol-ds-ui/packages/chess → changeset → version → publish → bump here. For a
 * package nobody else installs that is a lot of ceremony to see one prop work,
 * and it is why board work kept getting deferred.
 *
 * This swaps `node_modules/@kolkrabbi/kol-chess` for a symlink to the source in
 * the DS monorepo. Edits appear on the next HMR tick, with no publish and no
 * version bump.
 *
 * IT IS A LOCAL, GIT-INVISIBLE CHANGE. `package.json` is untouched — no
 * `link:` protocol, no `overrides` — so a clone and CI still install the
 * published package exactly as before. `pnpm install` will replace the symlink
 * with the real package; re-run this to restore it.
 *
 * WHAT THIS ALONE WOULD BREAK, and the reason vite.config.js has a `dedupe`
 * entry beside it: the DS monorepo carries its OWN react at
 * kol-ds-ui/packages/chess/node_modules/react. Vite resolves a symlink to its
 * real path, so the linked package would import that copy and the app would run
 * two Reacts — which breaks hooks with an error that blames the wrong thing.
 * `resolve.dedupe: ['react', 'react-dom']` forces both to this repo's copy.
 *
 *   node scripts/link-chess-package.mjs          # link to the DS source
 *   node scripts/link-chess-package.mjs --status # what is it right now
 *   node scripts/link-chess-package.mjs --unlink # restore (runs pnpm install)
 */

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const LINK = path.join(REPO, 'node_modules/@kolkrabbi/kol-chess')
const SOURCE = path.resolve(REPO, '../kol-ds-ui/packages/chess')

const status = () => {
  if (!fs.existsSync(LINK)) return { state: 'missing' }
  const st = fs.lstatSync(LINK)
  if (!st.isSymbolicLink()) return { state: 'installed', target: null }
  const target = fs.readlinkSync(LINK)
  const resolved = path.resolve(path.dirname(LINK), target)
  return {
    state: resolved === SOURCE ? 'linked' : 'installed',
    target: resolved
  }
}

const arg = process.argv[2]

if (arg === '--status') {
  const s = status()
  console.log(`[link] @kolkrabbi/kol-chess is ${s.state}`)
  if (s.target) console.log(`[link]   → ${s.target}`)
  process.exit(0)
}

if (arg === '--unlink') {
  console.log('[link] restoring the published package (pnpm install)…')
  execFileSync('pnpm', ['install', '--force'], { cwd: REPO, stdio: 'inherit' })
  console.log('[link] done —', status().state)
  process.exit(0)
}

if (!fs.existsSync(path.join(SOURCE, 'package.json'))) {
  console.error(`[link] no package at ${SOURCE}`)
  console.error('[link] expected the kol-ds-ui checkout beside this repo')
  process.exit(1)
}

/* Replace whatever is there. The published copy lives in the pnpm store, so
   removing this path costs nothing and `--unlink` puts it back. */
if (fs.existsSync(LINK)) fs.rmSync(LINK, { recursive: true, force: true })
fs.mkdirSync(path.dirname(LINK), { recursive: true })
fs.symlinkSync(SOURCE, LINK, 'dir')

const version = JSON.parse(fs.readFileSync(path.join(SOURCE, 'package.json'), 'utf8')).version
console.log(`[link] @kolkrabbi/kol-chess → ${path.relative(REPO, SOURCE)} (source version ${version})`)
console.log('[link] restart the dev server; `rm -rf node_modules/.vite` if icons or styles go missing')
