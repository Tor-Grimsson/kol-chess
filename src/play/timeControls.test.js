// Run: node --test src/play/timeControls.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classify, PRESETS, findControl, formatClock, engineMovetime, UNLIMITED, thinkTimeMs, MIN_THINK_MS, MAX_THINK_MS } from './timeControls.js'

test('classification follows base + 40x increment, not base alone', () => {
  // 3+0 is blitz; 3+2 estimates 180 + 80 = 260, still blitz
  assert.equal(classify(180, 0), 'blitz')
  assert.equal(classify(180, 2), 'blitz')
  // 2+1 estimates 120 + 40 = 160 — bullet, though the base alone is over 2 min
  assert.equal(classify(120, 1), 'bullet')
  // 10+0 rapid, 15+10 estimates 900 + 400 = 1300 — still rapid
  assert.equal(classify(600, 0), 'rapid')
  assert.equal(classify(900, 10), 'rapid')
  // 30+20 estimates 1800 + 800 = 2600 — classical
  assert.equal(classify(1800, 20), 'classical')
  assert.equal(classify(15, 0), 'ultrabullet')
})

test('every preset carries a class and a parseable id', () => {
  for (const p of PRESETS) {
    assert.ok(p.klass, `${p.id} has no class`)
    assert.equal(p.id, `${p.base / 60}+${p.inc}`.replace(/^0\./, '.'), `${p.id} id/base mismatch`)
  }
})

test('an unknown control falls back to unlimited rather than throwing', () => {
  assert.equal(findControl('nonsense'), UNLIMITED)
  assert.equal(findControl(undefined).base, null)
  assert.equal(findControl('5+3').base, 300)
})

test('the clock shows tenths only under ten seconds', () => {
  assert.equal(formatClock(65000), '1:05')
  assert.equal(formatClock(600000), '10:00')
  assert.equal(formatClock(9900), '0:09.9')
  assert.equal(formatClock(0), '0:00.0')
})

test('a null clock is unlimited, and time never renders negative', () => {
  assert.equal(formatClock(null), '∞')
  assert.equal(formatClock(-5000), '0:00.0')
})

test('engine think-time scales with the control and stays inside human bounds', () => {
  const bullet = engineMovetime(findControl('1+0'))
  const rapid = engineMovetime(findControl('10+0'))
  const classical = engineMovetime(findControl('30+0'))
  assert.ok(bullet < rapid, 'bullet must think less than rapid')
  assert.ok(rapid <= classical)
  assert.ok(bullet >= 120, 'never so fast it is not a move')
  assert.ok(classical <= 2000, 'never so slow the page feels hung')
  assert.equal(engineMovetime(UNLIMITED), 500)
})

test('thinkTimeMs scales the recorded share to the chosen clock', () => {
  const blitz = findControl('3+0')      // 180s base
  const classical = findControl('30+0') // 1800s base

  /* d=141 is the real value on 1.c4 — 1.41% of the clock. */
  assert.equal(thinkTimeMs(141, blitz), 2538)
  /* Same move, ten times the clock, ten times the pause — until the cap. */
  assert.equal(thinkTimeMs(141, classical), MAX_THINK_MS)

  /* d=14 is 1.e4: he never thinks about it — a quarter second, not a stall. */
  assert.equal(thinkTimeMs(14, blitz), 252)
  /* Only a genuinely tiny share hits the floor, so a pause is never fake lag. */
  assert.equal(thinkTimeMs(1, blitz), MIN_THINK_MS)
})

test('thinkTimeMs is null where there is no record, and never unbounded', () => {
  const blitz = findControl('3+0')
  assert.equal(thinkTimeMs(undefined, blitz), null, 'a master book has no d')
  assert.equal(thinkTimeMs(0, blitz), null)
  assert.equal(thinkTimeMs(99999, blitz), MAX_THINK_MS, 'clamped, not a 45s stare')
})

test('Unlimited still pauses — it borrows a nominal clock', () => {
  const unlimited = findControl('Unlimited')
  assert.equal(unlimited.base, null)
  const ms = thinkTimeMs(141, unlimited)
  assert.ok(ms >= MIN_THINK_MS && ms <= MAX_THINK_MS)
  assert.equal(ms, thinkTimeMs(141, findControl('3+0')), 'nominal base is 3 minutes')
})
