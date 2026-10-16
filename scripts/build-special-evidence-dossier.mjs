// Development evidence only. Replays stored legal variations; never searches.
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'
import { SPECIAL_POLICY as policy } from '../src/lib/specialPolicy.js'

const area = 'agent-output/special-evidence-dossier-v1'
await mkdir(area)
const sha = b => createHash('sha256').update(b).digest('hex'), sources = new Map()
async function read(path) { const b = await readFile(path); sources.set(path, sha(b)); return b }
async function tree(path) {
  for (const e of await readdir(path, { withFileTypes: true })) {
    if (e.isDirectory()) await tree(`${path}/${e.name}`)
    else if (e.isFile()) await read(`${path}/${e.name}`)
  }
}
const parse = async path => JSON.parse(await read(path))
await tree('src'); await read('scripts/build-special-evidence-dossier.mjs')
await read('PIANO-CLASSIFICAZIONI-SPECIALI.md')
const frozen = await parse('agent-output/specials-frozen-candidate-v1.json')
for (const s of frozen.sources) assert.equal(sha(await read(s.path)), s.sha256, s.path)
const verified = await parse('agent-output/opportunity-sacrifice-batch-v1/verification.json')
for (const s of verified.sources.filter(s => s.path.startsWith('src/'))) {
  assert.equal(sha(await read(s.path)), s.sha256, s.path)
}
const { cases } = await parse('agent-output/opportunity-sacrifice-batch-v1/cohorts.json')
const original = JSON.stringify(cases)
await writeFile(`${area}/protocol.json`, JSON.stringify({ newSearches: 0, developmentOnly: true,
  operation: 'Recompute current labels once; replay best, second and played lines, prior decision and child. Keep unresolved cases unresolved.',
  selection: 'All expected or actual specials, plus all numerical best/excellent after an opponent mistake as negative controls. Never use holdout inputs.',
  sourceHashes: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', great: 'Grande', brilliant: 'Geniale', unclassified: 'Non valutabile' }
const specials = ['Mossa mancata', 'Grande', 'Geniale']
const primary = e => e?.lines?.find(l => l.multipv === 1) ?? e
const probability = l => !l || l.bound || l.lowerbound || l.upperbound || /\b(?:lowerbound|upperbound)\b/.test(l.raw ?? '')
  ? null : Number.isInteger(l.mate) && l.mate !== 0 ? Number(l.mate > 0)
    : l.mate == null && Number.isFinite(l.evalCp) ? calculateWinProbability(l.evalCp) : null
const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const material = (g, side) => g.board().flat().filter(Boolean).reduce((n, p) => n + (p.color === side ? 1 : -1) * values[p.type], 0)
function line(fen, l) {
  if (!l) return null
  const result = { uci: l.pv?.[0], depth: l.depth, cp: l.evalCp, mate: l.mate,
    index: probability(l), legal: false, san: [], events: [], pv: l.pv ?? [] }
  try {
    assert(l.pv?.length && l.pv.length <= 256)
    const board = new Chess(fen), side = board.turn(), initial = material(board, side)
    for (const u of l.pv) {
      assert.match(u, /^[a-h][1-8][a-h][1-8][qrbn]?$/)
      const m = board.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
      result.san.push(m.san)
      result.events.push({ san: m.san, capture: m.captured ?? null,
        materialDelta: material(board, side) - initial, check: board.isCheck() })
    }
    result.legal = true; result.endsInMate = board.isCheckmate()
    result.finalFen = board.fen(); result.finalMaterialDelta = material(board, side) - initial
    result.quietEnd = result.events.length >= 2 && result.events.slice(-2).every(e => !e.capture && !e.check)
  } catch (e) { result.error = e.message }
  return result
}
const projected = [], rows = []
let rowIndex = 0
for (const c of cases) {
  const entries = reclassifyReviewedMoves(c.entries)
  projected.push({ ...c, entries })
  for (const [i, e] of entries.entries()) {
    const checked = verified.rows[rowIndex++]
    assert.equal(checked.cohort, c.cohort); assert.equal(checked.game, c.id)
    assert.equal(checked.ply, e.ply); assert.equal(checked.after, labels[e.classification])
    const prev = entries[i - 1]
    const expected = c.expected[i], actual = labels[e.classification]
    if (!specials.includes(expected) && !specials.includes(actual)
      && !(prev && ['mistake', 'blunder'].includes(prev.numericalClassification)
        && ['best', 'excellent'].includes(e.numericalClassification))) continue
    const raw = e.engine.specialLines ?? e.engine.lines ?? []
    const roots = raw.map(l => line(e.fenBefore, l))
    const first = roots[0], second = roots.find(l => l.uci !== first?.uci), playedRoot = roots.find(l => l.uci === e.playedUci)
    const child = line(e.fenAfter, primary(e.playedEngine)), childIndex = child?.index == null ? null : 1 - child.index
    const before = prev?.bestProbability == null ? null : 1 - prev.bestProbability
    const available = e.bestProbability, played = e.playedProbability
    const difference = played == null || childIndex == null ? null : Math.abs(played - childIndex)
    const legalCount = new Chess(e.fenBefore).moves().length
    const rootCoherent = roots.length >= 2 && roots.every(l => l.legal && l.index != null && l.depth === first.depth)
      && new Set(roots.map(l => l.uci)).size === roots.length
    let cause = 'reference-difference-unexplained'
    if (e.evaluationEvidence?.status === 'conflicting' || difference > policy.consistency) cause = 'conflicting-evidence'
    else if (!rootCoherent || !playedRoot || !child?.legal || e.specialAssessment?.brilliant?.reason === 'missing-acceptance-analysis') cause = 'missing-evidence'
    else if (expected === 'Mossa mancata' && actual !== expected && first?.endsInMate && e.playedMate == null) cause = 'rule-review-needed'
    else if (expected === 'Grande' && actual !== expected && e.specialAssessment?.grande?.reason === 'not-eligible') cause = 'rule-review-needed'
    else if (expected === actual) cause = 'positive-control'
    const m = new Chess(e.fenBefore).move(e.playedMove)
    rows.push({ cohort: c.cohort, game: c.id, ply: e.ply, move: `${Math.ceil(e.ply / 2)}${e.ply % 2 ? '.' : '...'}${e.playedMove}`,
      expected, actual, discrepancy: expected !== actual, cause, fenBefore: e.fenBefore, fenAfter: e.fenAfter,
      playedUci: e.playedUci, capture: m.captured ?? null, numerical: e.numericalClassification,
      evidence: e.evaluationEvidence, opportunityReason: e.missedOpportunityReason,
      greatAssessment: e.specialAssessment?.grande, brilliantAssessment: e.specialAssessment?.brilliant,
      opportunity: e.missedOpportunity,
      sequence: { beforeOpponent: before, offered: prev?.playedProbability == null ? null : 1 - prev.playedProbability,
        available, played, independentlyConfirmed: childIndex, disagreement: difference,
        priorNumerical: prev?.numericalClassification, priorActual: labels[prev?.classification],
        priorBest: prev ? line(prev.fenBefore, primary(prev.engine)) : null,
        priorPlayed: prev ? line(prev.fenAfter, primary(prev.playedEngine)) : null },
      roots: { coherent: rootCoherent, analyzed: roots.length, legal: legalCount,
        allLegal: rootCoherent && roots.length === legalCount,
        gapPct: first?.index != null && second?.index != null ? 100 * (first.index - second.index) : null,
        first, second, played: playedRoot, alternatives: roots }, child })
  }
  console.log(JSON.stringify({projected: c.id, cohort: c.cohort, rows: entries.length}))
}
assert.equal(rowIndex, 1116)
assert.equal(JSON.stringify(cases), original)
for (const [path, hash] of sources) assert.equal(sha(await readFile(path)), hash, path)
await writeFile(`${area}/cohorts.json`, JSON.stringify({cases: projected}, null, 2) + '\n', {flag: 'wx'})
const relevant = rows.filter(r => specials.includes(r.expected) || specials.includes(r.actual))
const summaries = ['initial', 'refined', 'old'].map(cohort => ({cohort,
  categories: specials.map(category => {const rr = relevant.filter(r => r.cohort === cohort); return {category,
    expected: rr.filter(r => r.expected === category).length,
    recognized: rr.filter(r => r.expected === category && r.actual === category).length,
    falseAttributions: rr.filter(r => r.expected !== category && r.actual === category).length}})}))
await writeFile(`${area}/dossier.json`, JSON.stringify({newSearches: 0, independentValidation: false,
  applicationChanged: false, verifiedClassifications: rowIndex, summaries, rows,
  sources: [...sources].map(([path, sha256]) => ({path, sha256}))}, null, 2) + '\n', {flag: 'wx'})
const pct = v => v == null ? '?' : (100 * v).toFixed(1)
const short = l => l ? `${l.san.slice(0, 8).join(' ')} [${l.mate != null ? `M${l.mate}` : `${l.cp}cp`}, d${l.depth}]` : '?'
const md = ['# Dossier delle classificazioni speciali', '',
  'Dati di sviluppo; nessuna nuova ricerca e nessuna modifica al classificatore.',
  'Tutte le 1116 classificazioni ricalcolate coincidono con la verifica v12 precedente.', '',
  'Gli indici sono quelli del modello locale, non percentuali calibrate di vittoria.',
  'Le cause automatiche sono indicazioni per la diagnosi, non dimostrazioni di nuove regole.', '']
for (const r of relevant.filter(r => r.discrepancy)) {
  md.push(`## ${r.cohort}: ${r.game} ${r.move}`, '',
    `Attesa **${r.expected}**, attuale **${r.actual}**. [Posizione](https://lichess.org/analysis/standard/${r.fenBefore.replaceAll(' ', '_')}).`, '',
    `Blocco: ${r.expected === 'Mossa mancata' ? r.opportunityReason : r.expected === 'Geniale' ? r.brilliantAssessment?.reason : r.greatAssessment?.reason}. Indicazione: ${r.cause}.`,
    `Sequenza degli indici: prima ${pct(r.sequence.beforeOpponent)}; disponibile ${pct(r.sequence.available)}; giocata ${pct(r.sequence.played)}; conferma separata ${pct(r.sequence.independentlyConfirmed)}.`,
    `Confronto: ${r.roots.analyzed}/${r.roots.legal} alternative legali; profondita coerenti: ${r.roots.coherent}; divario prima/seconda ${r.roots.gapPct?.toFixed(1) ?? '?'} punti.`, '',
    `- Prima scelta: ${short(r.roots.first)}`,
    `- Seconda scelta: ${short(r.roots.second)}`,
    `- Giocata nella stessa ricerca: ${short(r.roots.played)}`,
    `- Migliore risposta dopo la giocata: ${short(r.child)}`, '')
}
await writeFile(`${area}/dossier.md`, md.join('\n') + '\n', {flag: 'wx'})
console.log(JSON.stringify({summaries, relevant: relevant.length, selected: rows.length,
  distinctSpecialPositions: new Set(relevant.map(r => `${r.game}:${r.ply}`)).size}))
