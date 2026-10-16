// One preregistered proposal, offline only. Missing packets never start a search.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { capturedSearchKey as key } from './qa/verify-captured-search.mjs'

const area = 'agent-output/refinement-special-coverage-v1'
await mkdir(area)
const sha = b => createHash('sha256').update(b).digest('hex'), sources = new Map()
const input = async path => { const b = await readFile(path); sources.set(path, sha(b)); return JSON.parse(b) }
const save = (name, v) => writeFile(`${area}/${name}`, JSON.stringify(v, null, 2) + '\n', { flag: 'wx' })
const candidate = `
// Verify empirical promotions and unresolved maintenance of equilibrium.
function specialCoverageReason(entry) {
  if (entry.classification === 'great' && entry.specialAssessment?.grande?.evidenceKind === 'empirical-family'
    && entry.bestMate == null) return 'empirical-special'
  const context = entry.specialAssessment?.context
  if (entry.numericalClassification !== 'best' || entry.bestMate != null || entry.playedMate != null
    || entry.evaluationEvidence?.status !== 'coherent' || !context
    || context.before > SPECIAL_POLICY.poor || context.createdGain < SPECIAL_POLICY.gap
    || context.available < SPECIAL_POLICY.good || context.available > SPECIAL_POLICY.nonWinning) return null
  const child = entry.playedEngine?.lines?.find(l => l.multipv === 1) ?? entry.playedEngine
  if (!Number.isFinite(child?.evalCp) || child.mate != null || child.bound || child.lowerbound || child.upperbound
    || /\\b(?:lowerbound|upperbound)\\b/.test(child.raw ?? '')) return null
  const maintained = 1 - calculateWinProbability(child.evalCp)
  return maintained < SPECIAL_POLICY.good && Math.abs(maintained - entry.bestProbability) <= SPECIAL_POLICY.consistency
    ? 'uncorroborated-recovery' : null
}
`
const raw = await readFile('src/lib/analysisRefinement.js', 'utf8')
sources.set('src/lib/analysisRefinement.js', sha(Buffer.from(raw)))
let source = raw.replaceAll('\r\n', '\n')
assert(source.includes("  if (['independent', 'conflicting', 'unavailable'].includes(entry.evaluationEvidence?.status))"))
source = `import { SPECIAL_POLICY } from './specialPolicy.js'\nimport { calculateWinProbability } from './evaluation.js'\n` + source
source = source.replace("selectionVersion: 'evidence-priority-v2'", "selectionVersion: 'evidence-priority-v3'")
source = source.replace('export function refinementReason(entry) {', candidate + '\nexport function refinementReason(entry) {')
source = source.replace("  if (['independent', 'conflicting', 'unavailable'].includes(entry.evaluationEvidence?.status))",
  "  const coverage = specialCoverageReason(entry)\n  if (coverage) return coverage\n  if (['independent', 'conflicting', 'unavailable'].includes(entry.evaluationEvidence?.status))")
source = source.replace("  if (['unavailable', 'conflicting'].includes(entry.evaluationEvidence?.status)) return 3",
  "  if (specialCoverageReason(entry)) return 2\n  if (['unavailable', 'conflicting'].includes(entry.evaluationEvidence?.status)) return 3")
await writeFile(`${area}/candidate.js`, source, { flag: 'wx' })
const modSource = source.replaceAll("from 'chess.js'", `from '${import.meta.resolve('chess.js')}'`)
  .replace(/from '(\.\/[^']+)'/g, (_, p) => `from '${new URL(p, new URL('../src/lib/analysisRefinement.js', import.meta.url)).href}'`)
const proposal = await import('data:text/javascript;base64,' + Buffer.from(modSource).toString('base64'))
const baseline = await input('agent-output/rule-precedence-audit-v1/verification.json')
for (const s of baseline.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
const probeLock = await input('agent-output/grande-comparison-probe-v1/protocol.json')
for (const s of probeLock.sources) {
  assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
  sources.set(s.path, s.sha256)
}
sources.set('scripts/study-refinement-special-coverage.mjs', sha(await readFile('scripts/study-refinement-special-coverage.mjs')))
await input('agent-output/grande-comparison-probe-v1/results.json')
const { cases } = await input('agent-output/special-evidence-dossier-v1/cohorts.json')
const pool = new Map()
async function packet(path, expected) {
  const b = await readFile(path)
  if (expected) assert.equal(sha(b), expected, path)
  sources.set(path, sha(b))
  const p = JSON.parse(b), restricted = p.searchMoves ?? (p.scope === 'forced-root-move' ? [p.uci] : undefined)
  const engine = restricted ? { ...p.engine, analysisMetadata: { ...p.engine.analysisMetadata, searchMoves: restricted } } : p.engine
  pool.set(key(p.fen, p.nodes, p.multiPv, restricted), { engine, path })
}
const old = await input('agent-output/new-refinement-measurement-v1/collection.json')
for (const p of old.packets) await packet(`agent-output/new-refinement-measurement-v1/${p.file}`, p.sha256)
const latest = await input('agent-output/refinement-quality-priority-v2/measurement-collection.json')
for (const p of latest.packets) await packet(p.path, p.sha256)
for (let i = 0; i < 7; i++) await packet(`agent-output/targeted-special-evidence-v1/search-${i}.json`)
for (let i = 0; i < 16; i++) await packet(`agent-output/grande-comparison-probe-v1/search-${i}.json`)
const protocol = { date: '2026-10-15', applicationChanged: false, newSearches: 0, independentValidation: false,
  proposal: 'One combined evidence-priority-v3 proposal: verify non-mating empirical Grandi and equilibrium recoveries whose completed best comparison and independent child straddle the existing favorable band. Rank with pending Grande evidence; retain all search and node limits.',
  hypothesis: 'Supported empirical labels and coherent numerical comparisons can still lack decisive special evidence. Refinement should reach these evidence gaps without weakening the classification rules.',
  acceptance: 'Complete replay on all five development games for at most two rounds; no missing packet, no regression against v15 two-round baseline, no correct special lost, no new false special. Otherwise do not integrate.',
  candidateSha256: sha(Buffer.from(source)), sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }
await save('protocol.json', protocol)
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const games = [], uses = [], missing = [], rows = []
for (const c of cases.filter(c => c.cohort === 'initial')) {
  const initial = reclassifyReviewedMoves(c.entries), before = JSON.stringify(initial)
  let entries = initial
  const rounds = []
  for (let round = 1; round <= 2; round++) {
    const plan = proposal.buildRefinementPlan(entries)
    const need = plan.positions.filter(fen => !pool.has(key(fen, plan.nodes, 5)))
    if (need.length) { missing.push({ game: c.id, round, positions: need, selected: plan.selectedPlies }); break }
    try {
      const result = await proposal.refineGameEntries({ entries, plan, analyzePosition: async (fen, nodes, multiPv, options = {}) => {
        const found = pool.get(key(fen, nodes, multiPv, options.searchMoves))
        if (!found) throw Error(`Missing recorded scoped search: ${fen}`)
        uses.push({ game: c.id, round, path: found.path, fen, nodes, multiPv, searchMoves: options.searchMoves })
        return structuredClone(found.engine)
      } })
      entries = result.entries
      rounds.push({ round, plan, searches: result.searches, actualNodes: result.actualNodes })
      console.log(JSON.stringify({ game: c.id, round, selected: plan.selectedPlies, searches: result.searches }))
    } catch (e) { missing.push({ game: c.id, round, error: e.message }); break }
  }
  assert.equal(JSON.stringify(initial), before)
  const view = proposal.selectRefinementView(entries, true)
  const bb = baseline.rows.filter(r => r.cohort === 'refined' && r.game === c.id)
  assert.equal(bb.length, view.length)
  for (const [i, e] of view.entries()) rows.push({ game: c.id, ply: e.ply, san: e.playedMove, expected: c.expected[i],
    initial: labels[initial[i].classification], before: bb[i].after, after: labels[e.classification] })
  games.push({ id: c.id, rounds, entries, view })
}
const changes = rows.filter(r => r.before !== r.after)
const specials = ['Grande', 'Geniale', 'Mossa mancata'].map(category => ({ category,
  beforeTP: rows.filter(r => r.before === category && r.expected === category).length,
  afterTP: rows.filter(r => r.after === category && r.expected === category).length,
  beforeFP: rows.filter(r => r.before === category && r.expected !== category).length,
  afterFP: rows.filter(r => r.after === category && r.expected !== category).length }))
const regressed = changes.filter(r => r.before === r.expected).length
const corrected = changes.filter(r => r.after === r.expected).length
const accepted = !missing.length && corrected > 0 && !regressed && specials.every(s => s.afterTP >= s.beforeTP && s.afterFP <= s.beforeFP)
for (const s of protocol.sources) assert.equal(sha(await readFile(s.path)), s.sha256, s.path)
await save('results.json', { accepted, complete: !missing.length, newSearches: 0, independentValidation: false,
  before: rows.filter(r => r.before === r.expected).length, after: rows.filter(r => r.after === r.expected).length,
  corrected, regressed, specials, missing, changes, rows, uses })
for (const g of games) await save(`game-${g.id}.json`, g)
console.log(JSON.stringify({ accepted, complete: !missing.length, corrected, regressed, missing, specials, changes }))
