// Offline experiment: no engine imports, engine processes, network, or searches.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { ENGINE_CONFIG } from '../src/lib/engineConfig.js'
import { refinementReason, buildRefinementPlan } from '../src/lib/analysisRefinement.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const source = 'agent-output/node-budget-public-v1'
const area = 'agent-output/refinement-priority-v1'
const read = async path => JSON.parse(await readFile(path, 'utf8'))
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const manifest = await read(`${source}/manifest.json`)
const lock = await read('agent-output/specials-frozen-candidate-v1.json')
const data = await read(`${source}/results.json`)
const timings = await read(`${source}/timings.json`)
const watched = [...manifest.sources, ...lock.sources]
for (const path of [`${source}/results.json`, `${source}/timings.json`, `${source}/manifest.json`,
  `${source}/report.md`, `${source}/offline-check.json`, `${area}/protocol.md`,
  'scripts/study-refinement-priority.js', 'src/lib/engineConfig.js']) {
  watched.push({ path, sha256: sha(await readFile(path)) })
}
async function verify() {
  for (const entry of watched) assert.equal(sha(await readFile(entry.path)), entry.sha256, entry.path)
}
await verify()
// Bind archived engine evidence and costs to the collected packets.
const engines = new Map(), elapsed = new Map()
for (const [i, t] of timings.entries()) {
  const path = `${source}/${t.file}`, bytes = await readFile(path), packet = JSON.parse(bytes)
  watched.push({ path, sha256: sha(bytes) })
  assert.equal(packet.fen, manifest.schedule[i].fen)
  assert.equal(packet.nodes, manifest.schedule[i].nodes)
  assert.equal(packet.elapsedMs, t.elapsedMs)
  engines.set(`${packet.nodes}:${packet.fen}`, packet.engine)
  if (packet.nodes === 1000000) elapsed.set(packet.fen, packet.elapsedMs)
}
const thresholds = Object.values(ENGINE_CONFIG.classification)
const excluded = e => e.isBookMove || ['book', 'forced'].includes(e.classification) || e.playedMate === 0
const confirmed = e => !excluded(e) && ['great', 'brilliant', 'missed'].includes(e.classification)
const boundary = e => Number.isFinite(e.dropPct) ? Math.min(...thresholds.map(n => Math.abs(n - e.dropPct))) : Infinity
function gap(e) {
  const lines = e.engine.specialLines
  if (!Array.isArray(lines) || lines.length < 2 || lines[0].pv?.[0] !== e.engine.bestmove
    || !lines.slice(0, 2).every(l => Number.isFinite(l.evalCp) && l.mate == null)) return Infinity
  const diff = lines[0].evalCp - lines[1].evalCp
  return diff >= 0 ? diff : Infinity
}
const close = e => !excluded(e) && e.classification === 'best' && gap(e) <= 20
function rank(e) {
  if (e.evaluationEvidence?.status === 'conflicting') return 0
  if (e.evaluationEvidence?.status === 'unavailable') return 1
  if (e.specialAssessment?.brilliant?.status === 'candidate' || e.specialAssessment?.grande?.status === 'candidate') return 2
  if (e.evaluationEvidence?.status === 'independent') return 3
  return 4
}
const byEvidence = (a, b) => rank(a) - rank(b) || a.ply - b.ply
const policies = {
  chronological: entries => entries.filter(refinementReason),
  evidence: entries => entries.filter(refinementReason).sort(byEvidence),
  boundary: entries => entries.filter(refinementReason).sort((a, b) => boundary(a) - boundary(b) || a.ply - b.ply),
  distributed: entries => {
    const candidates = entries.filter(refinementReason), count = Math.min(12, candidates.length)
    const indices = Array.from({ length: count }, (_, i) => count === 1 ? 0 : Math.round(i * (candidates.length - 1) / (count - 1)))
    return [...indices.map(i => candidates[i]), ...candidates.filter((e, i) => !indices.includes(i))]
  },
  specials: entries => entries.filter(e => confirmed(e) || refinementReason(e))
    .sort((a, b) => Number(confirmed(b)) - Number(confirmed(a)) || byEvidence(a, b)),
  closeBest: entries => entries.filter(e => close(e) || refinementReason(e))
    .sort((a, b) => Number(close(b)) - Number(close(a)) || (close(a) && close(b) ? gap(a) - gap(b) : 0) || byEvidence(a, b)),
}
function select(entries, policy, cap) {
  const selected = [], positions = new Set()
  for (const e of policies[policy](entries)) {
    const proposed = new Set([...positions, e.fenBefore, e.fenAfter])
    if (proposed.size > cap) continue
    selected.push(e)
    proposed.forEach(fen => positions.add(fen))
    if (selected.length === 12) break
  }
  return { selected, positions }
}
const ordinaryPair = (a, b) => ['best', 'excellent'].includes(a) && ['best', 'excellent'].includes(b)
const results = []
for (const g of data.games) {
  for (const [key, entries] of [['initial', g.initialEntries], ['full', g.fullEntries]]) {
    assert.deepEqual(reclassifyReviewedMoves(entries).map(e => e.classification), g.rows.map(r => r[key]))
    for (const e of entries) for (const engine of [e.engine, e.playedEngine]) {
      if (!engine.terminal) assert.deepEqual(engine, engines.get(`${engine.analysisMetadata.budget.value}:${engine.fen}`))
    }
  }
  const baseline = JSON.stringify(g.initialEntries), initial = g.initialEntries
  const plan = buildRefinementPlan(initial)
  assert.deepEqual(plan, g.plan)
  for (const mode of ['12-moves', 'matched-fens']) for (const policy of Object.keys(policies)) {
    const cap = mode === 'matched-fens' ? plan.positions.length : Infinity
    const { selected, positions } = select(initial, policy, cap)
    assert.deepEqual([...positions], [...select(initial, policy, cap).positions])
    assert.ok(selected.length <= 12 && positions.size <= cap)
    const projected = initial.map((e, i) => ({ ...e,
      engine: positions.has(e.fenBefore) ? g.fullEntries[i].engine : e.engine,
      playedEngine: positions.has(e.fenAfter) ? g.fullEntries[i].playedEngine : e.playedEngine }))
    const view = reclassifyReviewedMoves(projected)
    if (policy === 'chronological') {
      assert.deepEqual(selected.map(e => e.ply), plan.selectedPlies)
      assert.deepEqual([...positions], plan.positions)
      assert.deepEqual(view.map(e => e.classification), g.rows.map(r => r.selective))
    }
    const rows = initial.map((e, i) => ({ ply: e.ply, san: e.san, selected: selected.some(s => s.ply === e.ply),
      initial: e.classification, full: g.fullEntries[i].classification, selective: view[i].classification,
      initialBest: e.bestUci, fullBest: g.fullEntries[i].bestUci, selectiveBest: view[i].bestUci }))
    const changed = rows.filter(r => r.initial !== r.full)
    const matched = changed.filter(r => r.selective === r.full)
    results.push({ game: g.game, mode, policy, candidates: policies[policy](initial).length,
      selected: selected.map(e => ({ ply: e.ply, san: e.san, reason: refinementReason(e),
        evidence: e.evaluationEvidence?.status, boundaryDistance: Number.isFinite(boundary(e)) ? boundary(e) : null,
        confirmedSpecial: confirmed(e), closeBestGapCp: Number.isFinite(gap(e)) ? gap(e) : null })),
      positions: [...positions], searches: [...positions].filter(fen => elapsed.has(fen)).length,
      extraMs: [...positions].reduce((sum, fen) => sum + (elapsed.get(fen) ?? 0), 0),
      fullChanges: changed.length, matchedChanges: matched.length,
      matchedBestExcellent: matched.filter(r => ordinaryPair(r.initial, r.full)).length,
      matchedOther: matched.filter(r => !ordinaryPair(r.initial, r.full)).length,
      introducedDiscordances: rows.filter(r => r.initial === r.full && r.selective !== r.full).length,
      remainingDiscordances: rows.filter(r => r.selective !== r.full).length,
      bestChangesMatched: rows.filter(r => r.initialBest !== r.fullBest && r.selectiveBest === r.fullBest).length,
      rows })
    assert.equal(JSON.stringify(initial), baseline)
  }
}
const totals = []
for (const mode of ['12-moves', 'matched-fens']) for (const policy of Object.keys(policies)) {
  const records = results.filter(r => r.mode === mode && r.policy === policy)
  const positions = new Set(records.flatMap(r => r.positions))
  const sum = key => records.reduce((n, r) => n + r[key], 0)
  totals.push({ mode, policy, selectedMoves: records.reduce((n, r) => n + r.selected.length, 0),
    positions: positions.size, extraSeconds: [...positions].reduce((n, fen) => n + (elapsed.get(fen) ?? 0), 0) / 1000,
    matchedChanges: sum('matchedChanges'), matchedBestExcellent: sum('matchedBestExcellent'),
    matchedOther: sum('matchedOther'), introducedDiscordances: sum('introducedDiscordances'),
    remainingDiscordances: sum('remainingDiscordances'), bestChangesMatched: sum('bestChangesMatched') })
}
await verify()
await mkdir(area, { recursive: true })
await writeFile(`${area}/results.json`, JSON.stringify({ newSearches: 0, precisionMeasured: false,
  frozenInputsVerified: lock.sources.length, sources: watched, totals, results }, null, 2) + '\n')
const table = records => ['| Strategia | Mosse | FEN | Extra s | Cambi intercettati | Migliore/Ottima | Altri | Discordanze introdotte |',
  '|---|---:|---:|---:|---:|---:|---:|---:|', ...records.map(r =>
    `| ${r.policy} | ${r.selectedMoves ?? r.selected.length} | ${Array.isArray(r.positions) ? r.positions.length : r.positions} | ${(r.extraSeconds ?? r.extraMs / 1000).toFixed(2)} | ${r.matchedChanges} | ${r.matchedBestExcellent} | ${r.matchedOther} | ${r.introducedDiscordances} |`)]
const report = ['# Studio offline della priorità', '',
  '13 ottobre 2026. Due partite pubbliche già studiate, 130 semimosse. Zero nuove ricerche.',
  'Selezione con dati a 200k; confronto con evidenze archiviate a 1M. Nessun riferimento indipendente Chess.com.',
  'Cambi intercettati: concordanza con la versione completa, non correzioni dimostrate.',
  'Discordanze introdotte: righe su cui iniziale e completa concordavano, ma la versione mista differisce.', '',
  '## Massimo 12 mosse per partita', '', ...table(totals.filter(r => r.mode === '12-moves')), '',
  '## Stesso tetto di FEN del lotto attuale, massimo 12 mosse', '', ...table(totals.filter(r => r.mode === 'matched-fens')), '',
  'Stesso tetto di FEN non significa stesso tempo: il costo dipende dalle posizioni. I tempi sono somme delle richieste Node WASM già raccolte, non misure dell’app.',
  'Totali deduplicati per FEN; le FEN condivise possono comparire in entrambe le tabelle per partita.', '',
  ...data.games.flatMap(g => ['## ' + g.game, '', ...table(results.filter(r => r.game === g.game && r.mode === 'matched-fens')), '',
    ...results.filter(r => r.game === g.game && r.mode === 'matched-fens').map(r =>
      `- ${r.policy}: ply ${r.selected.map(e => e.ply).join(', ')}; prima scelta cambiata intercettata ${r.bestChangesMatched}; discordanti dalla completa ${r.remainingDiscordances}.`), '']),
  '## Limiti', '',
  'Strategie fissate nel protocollo prima della simulazione, ma il campione era già conosciuto. Studio esplorativo, nessuna ottimizzazione di soglie o prova di generalizzazione.',
  'Il criterio closeBest usa solo snapshot completi coerenti con bestmove e divario massimo 20 cp: ipotesi diagnostica, non criterio attivato.',
  'Speciali confermate e candidati hanno copertura limitata in queste partite; categorie assenti non sono valutabili.',
  'Evidenze miste possono cambiare categorie anche su righe adiacenti non selezionate: tutte le righe sono riclassificate.',
  `Replay iniziale/completo e parità del selettore cronologico superati. Hash delle sorgenti e ${lock.sources.length} input congelati verificati prima/dopo.`,
  'App, classificatore, rating, budget iniziale e report storici invariati. Risultati dettagliati e segnali iniziali in results.json.', '']
await writeFile(`${area}/report.md`, report.join('\n'))
console.log(JSON.stringify({ totals, checks: 'passed', newSearches: 0 }, null, 2))
