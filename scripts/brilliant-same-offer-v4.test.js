import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Chess } from 'chess.js'
import { auditWinningSameOffer, classifySameOfferBrilliant } from './brilliant-same-offer-v4.js'

const input = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url)))
const cache = await input('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-04.json')
const supplemental = (await input('agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json')).searches
const sample = cache.entries[54]
const classify = entry => classifySameOfferBrilliant(entry, 'Ottima', cache.entries[52], cache.entries[53], supplemental)

test('same-position winning alternatives exclude Rac1 without mutating evidence', () => {
  const saved = JSON.stringify(sample), result = classify(sample)
  assert.equal(result.brilliant, false)
  assert.equal(result.reason, 'winning-alternative-with-same-offer')
  assert.deepEqual(result.comparison.matches.map(m => m.san), ['Rab1', 'Rfc1', 'Rfb1'])
  assert.equal(JSON.stringify(sample), saved)
})
test('different depths cannot veto on the matched comparison', () => {
  const entry = structuredClone(sample)
  for (const l of entry.engine.lines) if (l.pv[0] !== entry.uci) l.depth = 18
  assert.equal(classify(entry).brilliant, true)
  assert.equal(auditWinningSameOffer(entry).matches.length, 0)
})
test('bound alternatives are not usable evidence', () => {
  const entry = structuredClone(sample)
  for (const l of entry.engine.lines) if (l.pv[0] !== entry.uci) l.bound = true
  assert.equal(classify(entry).brilliant, true)
})
test('absent or duplicate played root cannot be treated as comparable', () => {
  const entry = structuredClone(sample)
  entry.engine.lines.push(structuredClone(entry.engine.lines.find(l => l.pv[0] === entry.uci)))
  assert.equal(auditWinningSameOffer(entry).matches.length, 0)
  entry.engine.lines = entry.engine.lines.filter(l => l.pv[0] !== entry.uci)
  assert.equal(auditWinningSameOffer(entry).matches.length, 0)
})
test('duplicate alternative roots cannot manufacture an extra comparable score', () => {
  const entry = structuredClone(sample), played = entry.engine.lines.find(l => l.pv[0] === entry.uci)
  const alternative = entry.engine.lines[0]
  entry.engine.lines = [played, alternative, structuredClone(alternative)]
  assert.equal(auditWinningSameOffer(entry).matches.length, 0)
})
test('alternatives below the existing winning threshold do not trigger veto', () => {
  const entry = structuredClone(sample)
  for (const l of entry.engine.lines) if (l.pv[0] !== entry.uci) { l.mate = null; l.evalCp = 0 }
  assert.equal(classify(entry).brilliant, true)
})
test('true moved-piece sacrifice remains recognized for the White player', async () => {
  const data = await input('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-06.json')
  const entry = data.entries[10]
  assert.equal(classifySameOfferBrilliant(entry, 'Migliore', data.entries[8], data.entries[9], supplemental).brilliant, true)
  assert.equal(auditWinningSameOffer(entry).matches.length, 0)
})
test('Black root scores are already from the mover perspective', async () => {
  const data = await input('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-02.json')
  const entry = structuredClone(data.entries[13])
  for (const l of entry.engine.lines) { l.evalCp = -1000; l.mate = null; l.depth = 12; delete l.raw; l.bound = false }
  assert.equal(auditWinningSameOffer(entry).matches.length, 0)
})

test('offering the moved bishop on another square does not prove the same stationary offer', () => {
  // Artificial engine scores isolate piece identity; they are not new engine evidence.
  const entry = structuredClone(sample)
  const played = entry.engine.lines.find(l => l.pv[0] === entry.uci)
  entry.engine.lines = [played, { multipv: 2, depth: played.depth, mate: 5, pv: ['e4c6'] }]
  const evidence = auditWinningSameOffer(entry)
  assert.equal(evidence.alternatives[0].sameOffers.length, 0)
  assert.equal(evidence.matches.length, 0)
})

test('mirrored Black position excludes the same incidental offer consistently', () => {
  // Rank mirror with colors exchanged creates a legal synthetic Black regression.
  const square = s => s[0] + (9 - Number(s[1]))
  const uci = u => square(u.slice(0, 2)) + square(u.slice(2, 4)) + (u[4] ?? '')
  const fen = f => {
    const parts = f.split(' ')
    parts[0] = parts[0].split('/').reverse().join('/').replace(/[a-z]/gi, c => c === c.toLowerCase() ? c.toUpperCase() : c.toLowerCase())
    parts[1] = parts[1] === 'w' ? 'b' : 'w'
    if (parts[2] !== '-' || parts[3] !== '-') throw Error('Synthetic mirror requires no castling/en-passant rights')
    return parts.join(' ')
  }
  const entry = structuredClone(sample)
  entry.fenBefore = fen(entry.fenBefore); entry.uci = uci(entry.uci)
  const after = new Chess(entry.fenBefore)
  after.move({ from: entry.uci.slice(0, 2), to: entry.uci.slice(2, 4) })
  entry.fenAfter = after.fen()
  for (const engine of [entry.engine, entry.playedEngine]) for (const l of engine.lines) l.pv = l.pv.map(uci)
  const evidence = auditWinningSameOffer(entry)
  assert.equal(evidence.matches.length, 3)
  assert.ok(evidence.matches.every(m => m.sameOffers.some(s => s.color === 'b' && s.square === 'e5' && s.type === 'b')))
})
