// Offline only: reads captured UCI; never starts an engine or makes requests.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { refinementReason } from '../src/lib/analysisRefinement.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'

const source = 'agent-output/node-budget-public-v1', area = 'agent-output/refinement-stability-v1'
const read = async p => JSON.parse(await readFile(p, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
const data = await read(`${source}/results.json`), manifest = await read(`${source}/manifest.json`)
const timings = await read(`${source}/timings.json`)
const previous = await read('agent-output/refinement-priority-v1/results.json')
const lock = await read('agent-output/specials-frozen-candidate-v1.json')
const watched = [...manifest.sources, ...lock.sources]
for (const path of [`${source}/results.json`, `${source}/timings.json`, `${source}/manifest.json`,
  'agent-output/refinement-priority-v1/results.json', 'agent-output/refinement-priority-v1/findings.md',
  'agent-output/refinement-priority-v1/report.md', `${area}/protocol.md`, 'scripts/study-refinement-stability.js']) {
  watched.push({ path, sha256: sha(await readFile(path)) })
}
async function verify() {
  for (const e of watched) assert.equal(sha(await readFile(e.path)), e.sha256, e.path)
}
await verify()
const signals = new Map(), engines = new Map(), costs = new Map()
for (const [i, t] of timings.entries()) {
  const path = `${source}/${t.file}`, bytes = await readFile(path), p = JSON.parse(bytes)
  watched.push({ path, sha256: sha(bytes) })
  assert.equal(p.fen, manifest.schedule[i].fen)
  assert.equal(p.nodes, manifest.schedule[i].nodes)
  assert.equal(p.elapsedMs, t.elapsedMs)
  engines.set(`${p.nodes}:${p.fen}`, p.engine)
  if (p.nodes !== 200000) { costs.set(p.fen, t.elapsedMs); continue }
  const count = Math.min(5, new Chess(p.fen).moves().length), collector = createMultiPvEvidence(count)
  const depths = new Map()
  let first
  for (const raw of p.rawLines) {
    if (raw.startsWith('info ') && /\bmultipv 1\b/.test(raw)) first = raw.match(/\bpv (\S+)/)?.[1]
    collector.accept(raw)
    const complete = collector.finish(first)
    if (complete.length && complete.at(-1).raw === raw) {
      depths.delete(complete[0].depth)
      depths.set(complete[0].depth, { depth: complete[0].depth, best: complete[0].pv[0],
        nodes: Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0) })
    }
  }
  assert.deepEqual(collector.finish(p.bestmove), p.engine.specialLines)
  const window = [...depths.values()].slice(-3), available = window.length === 3
  const flips = available ? window.slice(1).filter((e, j) => e.best !== window[j].best).length : null
  const finalMismatch = available ? window.at(-1).best !== p.bestmove : null
  signals.set(p.fen, { available, completeDepths: depths.size, window, finalBest: p.bestmove,
    flips, finalMismatch, score: available ? flips + Number(finalMismatch) : 0 })
}
const excluded = e => e.isBookMove || ['book', 'forced'].includes(e.classification) || e.playedMate === 0
const signal = (e, policy) => policy === 'root' ? signals.get(e.fenBefore)?.score ?? 0
  : Math.max(signals.get(e.fenBefore)?.score ?? 0, signals.get(e.fenAfter)?.score ?? 0)
const nearPair = r => ['best', 'excellent'].includes(r.initial) && ['best', 'excellent'].includes(r.full)
function select(entries, policy, cap) {
  const candidates = entries.filter(e => !excluded(e) && (signal(e, policy) > 0 || refinementReason(e)))
    .sort((a, b) => signal(b, policy) - signal(a, policy) || a.ply - b.ply)
  const selected = [], positions = new Set()
  for (const e of candidates) {
    const proposed = new Set([...positions, e.fenBefore, e.fenAfter])
    if (proposed.size > cap) continue
    selected.push(e)
    proposed.forEach(f => positions.add(f))
    if (selected.length === 12) break
  }
  return { selected, positions, candidates: candidates.length }
}
const results = [], diagnostics = []
for (const g of data.games) {
  const entries = g.initialEntries, preserved = JSON.stringify(entries)
  for (const archived of [entries, g.fullEntries]) for (const e of archived) for (const engine of [e.engine, e.playedEngine]) {
    if (!engine.terminal) assert.deepEqual(engine, engines.get(`${engine.analysisMetadata.budget.value}:${engine.fen}`))
  }
  for (const [i, e] of entries.entries()) diagnostics.push({ game: g.game, ply: e.ply, san: e.san,
    eligible: !excluded(e), initial: e.classification, full: g.rows[i].full,
    categoryChanged: g.rows[i].initial !== g.rows[i].full,
    bestChanged: g.rows[i].initialBestUci !== g.rows[i].fullBestUci,
    initiallyDoubtful: Boolean(refinementReason(e)), dropPct: e.dropPct,
    before: signals.get(e.fenBefore) ?? null, after: signals.get(e.fenAfter) ?? null })
  for (const mode of ['12-moves', 'matched-fens']) for (const policy of ['root', 'either']) {
    const cap = mode === 'matched-fens' ? g.plan.positions.length : Infinity
    const { selected, positions, candidates } = select(entries, policy, cap)
    assert.deepEqual(selected.map(e => e.ply), select(entries, policy, cap).selected.map(e => e.ply))
    assert.ok(selected.length <= 12 && positions.size <= cap)
    const view = reclassifyReviewedMoves(entries.map((e, i) => ({ ...e,
      engine: positions.has(e.fenBefore) ? g.fullEntries[i].engine : e.engine,
      playedEngine: positions.has(e.fenAfter) ? g.fullEntries[i].playedEngine : e.playedEngine })))
    const rows = entries.map((e, i) => ({ ply: e.ply, san: e.san, initial: e.classification,
      full: g.rows[i].full, selective: view[i].classification, selected: selected.some(s => s.ply === e.ply),
      initialBest: e.bestUci, fullBest: g.fullEntries[i].bestUci, selectiveBest: view[i].bestUci }))
    const matched = rows.filter(r => r.initial !== r.full && r.selective === r.full)
    results.push({ game: g.game, mode, policy, candidates,
      selected: selected.map(e => ({ ply: e.ply, san: e.san, score: signal(e, policy), reason: refinementReason(e) })),
      positions: [...positions], extraMs: [...positions].reduce((n, f) => n + (costs.get(f) ?? 0), 0),
      matchedChanges: matched.length, matchedBestExcellent: matched.filter(nearPair).length,
      matchedOther: matched.filter(r => !nearPair(r)).length,
      introducedDiscordances: rows.filter(r => r.initial === r.full && r.selective !== r.full).length,
      remainingDiscordances: rows.filter(r => r.selective !== r.full).length,
      bestChangesMatched: rows.filter(r => r.initialBest !== r.fullBest && r.selectiveBest === r.fullBest).length, rows })
    assert.equal(JSON.stringify(entries), preserved)
    console.log(JSON.stringify({ game: g.game, mode, policy, completed: results.length }))
  }
}
const groups = []
for (const policy of ['root', 'either']) for (const flagged of [true, false]) {
  const rows = diagnostics.filter(r => r.eligible && (policy === 'root' ? r.before?.available : r.before?.available && r.after?.available)
    && ((policy === 'root' ? r.before.score : Math.max(r.before.score, r.after.score)) > 0) === flagged)
  groups.push({ policy, flagged, moves: rows.length, changedCategories: rows.filter(r => r.categoryChanged).length,
    changedBest: rows.filter(r => r.bestChanged).length,
    initiallyNotDoubtfulChanges: rows.filter(r => !r.initiallyDoubtful && r.categoryChanged).length })
}
const totals = []
for (const mode of ['12-moves', 'matched-fens']) for (const policy of ['root', 'either']) {
  const records = results.filter(r => r.mode === mode && r.policy === policy), positions = new Set(records.flatMap(r => r.positions))
  const sum = key => records.reduce((n, r) => n + r[key], 0)
  totals.push({ mode, policy, selectedMoves: records.reduce((n, r) => n + r.selected.length, 0), positions: positions.size,
    extraSeconds: [...positions].reduce((n, f) => n + (costs.get(f) ?? 0), 0) / 1000,
    matchedChanges: sum('matchedChanges'), matchedBestExcellent: sum('matchedBestExcellent'), matchedOther: sum('matchedOther'),
    introducedDiscordances: sum('introducedDiscordances'), bestChangesMatched: sum('bestChangesMatched') })
}
await verify()
await mkdir(area, { recursive: true })
await writeFile(`${area}/results.json`, JSON.stringify({ newSearches: 0, precisionMeasured: false,
  frozenInputsVerified: lock.sources.length, sources: watched, groups, totals, results, diagnostics }, null, 2) + '\n')
const table = records => ['| Strategia | Mosse | FEN | Extra s | Cambi | Migliore/Ottima | Altri | Prima scelta | Discordanze introdotte |',
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|', ...records.map(r =>
    `| ${r.policy} | ${r.selectedMoves ?? r.selected.length} | ${Array.isArray(r.positions) ? r.positions.length : r.positions} | ${(r.extraSeconds ?? r.extraMs / 1000).toFixed(2)} | ${r.matchedChanges} | ${r.matchedBestExcellent} | ${r.matchedOther} | ${r.bestChangesMatched} | ${r.introducedDiscordances} |`)]
const report = ['# Instabilità iniziale: confronto offline', '',
  'Segnale: cambi della prima scelta nelle ultime tre profondità complete a 200k, più discordanza col bestmove finale.',
  'root: FEN prima della mossa; either: massimo segnale prima/dopo. Scelta basata solo sui raw iniziali.', '',
  ...['12-moves', 'matched-fens'].flatMap(mode => ['## ' + mode, '',
    ...table([...previous.totals.filter(r => r.mode === mode && r.policy === 'chronological'), ...totals.filter(r => r.mode === mode)]), '']),
  '## Frequenza dei cambi nel campione eleggibile', '',
  '| Segnale | Presente | Mosse | Categorie cambiate | Prima scelta cambiata | Cambi non dubbi iniziali |',
  '|---|---|---:|---:|---:|---:|', ...groups.map(r =>
    `| ${r.policy} | ${r.flagged} | ${r.moves} | ${r.changedCategories} | ${r.changedBest} | ${r.initiallyNotDoubtfulChanges} |`), '',
  'La tabella esclude Libro/Forzata/matto dato e finestre incomplete; non sono gruppi randomizzati né misure di precisione.', '',
  ...data.games.flatMap(g => ['## ' + g.game, '', ...table(results.filter(r => r.game === g.game && r.mode === 'matched-fens')), '',
    ...results.filter(r => r.game === g.game && r.mode === 'matched-fens').map(r => `- ${r.policy}: ply ${r.selected.map(e => e.ply).join(', ')}.`), '']),
  '## Controlli e limiti', '',
  `Snapshot finali ricostruiti con il collector applicativo, evidenze collegate ai raw; hash e ${lock.sources.length} input congelati verificati prima/dopo.`,
  'Selezioni deterministiche e baseline immutata. Zero nuove ricerche, app e studi precedenti invariati.',
  'Studio esplorativo su dati già osservati; nessuna taratura di finestra o soglia. Concordanza a 1M non significa correttezza Chess.com.',
  'Costo stimato dai tempi Node WASM archivati, deduplicato per FEN; non misura browser o telefono.',
  'Evidenze sostituite anche sulle righe adiacenti; riclassificate tutte le mosse. Dettagli e segnali in results.json.', '']
await writeFile(`${area}/report.md`, report.join('\n'))
console.log(JSON.stringify({ groups, totals, checks: 'passed', newSearches: 0 }, null, 2))
