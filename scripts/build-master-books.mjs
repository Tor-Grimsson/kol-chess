#!/usr/bin/env node
/**
 * build-master-books — the same book pipeline, pointed at nine old masters.
 *
 * Nothing here re-implements the builder. It downloads each player's game
 * collection, works out how the PGN spells their name, and shells out to
 * `build-style-book.mjs` once per player. The books that come out are the same
 * shape as mine, which is the whole reason the /play opponent picker is a
 * dropdown rather than a second engine.
 *
 * ON THE SOURCE: pgnmentor.com publishes per-player collections of historical
 * game scores. We download them, derive move statistics, and ship the
 * statistics — the PGN itself stays in `_tmp/` and is not redistributed. Game
 * scores are records of events that happened in public tournaments.
 *
 * Elo is mostly absent in these collections (755 of Fischer's 827 games carry
 * none), so the rating-band and opponent-band overlays are largely empty for
 * masters and the builder drops the empty marginals. A master book is
 * therefore a STYLE book only: what they played, and how it scored. The era
 * overlay still works — their careers span decades.
 *
 *   node scripts/build-master-books.mjs            # all nine
 *   node scripts/build-master-books.mjs Tal Keres  # just these
 */

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..')
const WORK = path.join(REPO, '_tmp/masters')
const OUT_DIR = path.join(REPO, 'public/books')
const BASE = 'https://www.pgnmentor.com/players'

/* `file` is pgnmentor's archive name; `surname` is what the PGN header starts
 * with, which is how the exact player string is discovered per collection. */
const MASTERS = [
  { key: 'fischer', file: 'Fischer', surname: 'Fischer', label: 'Bobby Fischer' },
  { key: 'tal', file: 'Tal', surname: 'Tal', label: 'Mikhail Tal' },
  { key: 'capablanca', file: 'Capablanca', surname: 'Capablanca', label: 'José Raúl Capablanca' },
  { key: 'alekhine', file: 'Alekhine', surname: 'Alekhine', label: 'Alexander Alekhine' },
  { key: 'petrosian', file: 'Petrosian', surname: 'Petrosian', label: 'Tigran Petrosian' },
  { key: 'botvinnik', file: 'Botvinnik', surname: 'Botvinnik', label: 'Mikhail Botvinnik' },
  { key: 'keres', file: 'Keres', surname: 'Keres', label: 'Paul Keres' },
  { key: 'larsen', file: 'Larsen', surname: 'Larsen', label: 'Bent Larsen' },
  { key: 'olafsson', file: 'Olafsson', surname: 'Olafsson', label: 'Friðrik Ólafsson' }
]

const sh = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...opts })

/* The collections spell a name several ways ("Petrosian, Tigran V" and
 * "Petrosian, Tigran L" are different players). Take the spelling that appears
 * most often — for a player's own collection that is unambiguously them. */
const canonicalName = (pgnText, surname) => {
  const counts = new Map()
  const re = /^\[(?:White|Black) "([^"]+)"\]/gm
  let m
  while ((m = re.exec(pgnText))) {
    const name = m[1]
    if (!name.toLowerCase().startsWith(surname.toLowerCase())) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
  return ranked[0] ?? null
}

const wanted = process.argv.slice(2).map((s) => s.toLowerCase())
const list = wanted.length ? MASTERS.filter((m) => wanted.includes(m.key)) : MASTERS

fs.mkdirSync(WORK, { recursive: true })
fs.mkdirSync(OUT_DIR, { recursive: true })

const manifest = []

for (const m of list) {
  const zip = path.join(WORK, `${m.file}.zip`)
  const pgn = path.join(WORK, `${m.file}.pgn`)

  if (!fs.existsSync(pgn)) {
    console.log(`[masters] fetching ${m.file}…`)
    try {
      sh('curl', ['-sL', '--max-time', '90', `${BASE}/${m.file}.zip`, '-o', zip])
      sh('unzip', ['-o', '-q', zip, '-d', WORK])
    } catch (err) {
      console.error(`[masters] ${m.key}: download failed — ${err.message.slice(0, 80)}`)
      continue
    }
  }
  if (!fs.existsSync(pgn)) {
    console.error(`[masters] ${m.key}: no ${m.file}.pgn after unzip — skipped`)
    continue
  }

  const text = fs.readFileSync(pgn, 'utf8')
  const found = canonicalName(text, m.surname)
  if (!found) {
    console.error(`[masters] ${m.key}: no header matching "${m.surname}" — skipped`)
    continue
  }
  const [player, appearances] = found

  const out = path.join('public/books', `${m.key}.json`)
  /* min-seen 1: a master's collection is hundreds of games, not tens of
     thousands, and a line played once is still a deliberate choice by someone
     who prepared it. My own book prunes singletons because 27,150 games make
     a once-off a coincidence; here it is a data point. */
  const log = sh('node', [
    'scripts/build-style-book.mjs',
    '--pgn', pgn,
    '--player', player,
    '--out', out,
    '--min-seen', '1'
  ], { cwd: REPO })

  const games = Number(log.match(/games (\d+) \(/)?.[1] ?? 0)
  const positions = Number(log.match(/→ (\d+) after prune/)?.[1] ?? 0)
  const bytes = fs.existsSync(path.join(REPO, out)) ? fs.statSync(path.join(REPO, out)).size : 0
  console.log(
    `[masters] ${m.key.padEnd(11)} "${player}" (${appearances} headers) → ${games} games · ${positions} positions · ${(bytes / 1024 / 1024).toFixed(2)} MB`
  )
  manifest.push({ key: m.key, label: m.label, player, games, positions })
}

/* One manifest so the page can list opponents without importing nine books. */
const manifestPath = path.join(OUT_DIR, 'index.json')
fs.writeFileSync(manifestPath, JSON.stringify({ masters: manifest }, null, 1))
console.log(`[masters] wrote ${path.relative(REPO, manifestPath)} · ${manifest.length} players`)
