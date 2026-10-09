import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { auditCompensationHistory } from './brilliant-compensation-history.js'
import { auditWinningSameOffer } from './brilliant-same-offer-v4.js'
import { completedRootScore } from './grande-completed-score.js'
import { validateSupplementalSearches } from './specials-frozen-evaluation.js'

const root = new URL('../', import.meta.url), watched = new Map()
const hash = data => createHash('sha256').update(data).digest('hex')
async function input(path, json = true) {
  const bytes = await readFile(new URL(path, root))
  watched.set(path, hash(bytes))
  return json ? JSON.parse(bytes) : bytes.toString('utf8')
}
await input('agent-output/brilliant-causality-review-v1-protocol.md', false)
await input('scripts/audit-brilliant-causality.js', false)
const audit = await input('agent-output/special-classification-2026-10-09T12-14-50-139Z/results.json')
for (const source of audit.sources) {
  const bytes = await readFile(new URL(source.path, root))
  if (hash(bytes) !== source.sha256) throw Error(`Changed audit source: ${source.path}`)
  watched.set(source.path, source.sha256)
}
const supplemental = validateSupplementalSearches(
  await input('agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json'),
  await input('agent-output/brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json'))
const rb3 = await input('agent-output/brilliant-rb3-acceptance-2026-10-08T02-03-27-001Z/results.json')
if (rb3.summary.failure || !rb3.summary.sourceHashesUnchanged || rb3.summary.capExceeded
  || rb3.searches.length !== 2) throw Error('Invalid Rb3 evidence bundle')
for (const search of rb3.searches) {
  const selected = completedRootScore(search.rawLines, search.rootUci).completed
  if (!selected || JSON.stringify(selected) !== JSON.stringify(search.completed)
    || search.rootUci !== 'c8h8' || ![200000, 1000000].includes(search.budgetNodes)
    || search.engineVersion !== 'Stockfish 19 WASM') throw Error('Invalid Rb3 score provenance')
}
const searches = [...supplemental, ...rb3.searches]
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`),
  'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const rows = []
const play = (game, uci) => game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
function enrich(entry) {
  const additions = searches.filter(s => s.fen === entry.fenAfter)
    .map(s => ({ ...s.completed, multipv: 1,
      evidenceSource: `supplementary-${s.budgetNodes}-nodes-depth-${s.completed.depth}` }))
  return { ...entry, playedEngine: { ...entry.playedEngine,
    lines: [...(entry.playedEngine?.lines ?? []), ...additions] } }
}
function matingEstimate(entry) {
  const game = new Chess(entry.fenAfter), legalReplies = game.moves().length
  const line = entry.playedEngine?.lines?.find(l => l.multipv === 1)
  if (!line || !(line.mate < 0) || line.bound || /\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')) return null
  const san = []
  for (const uci of line.pv) san.push(play(game, uci).san)
  return { mateForMover: -line.mate, depth: line.depth, legalReplies,
    completeMatingPV: game.isCheckmate() && san.length === 2 * Math.abs(line.mate),
    san, proofAgainstEveryDefense: false }
}
for (const id of ids) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  const enrichedEntries = cache.entries.map(enrich)
  for (const [i, entry] of cache.entries.entries()) {
    // Supplementary scores are additional independent sources, never replacements.
    const enriched = enrichedEntries[i]
    const history = auditCompensationHistory(enriched, enrichedEntries[i - 2], cache.entries[i - 1])
    for (const offer of history.offers) {
      const matching = enriched.playedEngine.lines.filter(l => l.pv?.[0] === offer.offer.replyUci)
      offer.current.rows.forEach((row, index) => {
        row.source = matching[index].evidenceSource ?? 'current-playedEngine'
      })
      for (const prior of offer.previous) {
        const previousMatching = enrichedEntries[i - 2].playedEngine.lines.filter(l => l.pv?.[0] === prior.rootUci)
        let previousIndex = 0
        for (const row of prior.rows) if (row.source === 'previous-own-playedEngine') {
          row.source = previousMatching[previousIndex++].evidenceSource ?? row.source
        }
      }
    }
    const sameOffer = auditWinningSameOffer(entry)
    const mate = matingEstimate(entry)
    const game = new Chess(entry.fenBefore)
    const roots = entry.engine.lines.map(line => {
      const variation = new Chess(entry.fenBefore), san = []
      for (const uci of line.pv) san.push(play(variation, uci).san)
      return { uci: line.pv[0], san: san[0], depth: line.depth,
        cp: line.evalCp, mate: line.mate, bound: Boolean(line.bound),
        completeMatingPV: variation.isCheckmate(), pv: san }
    })
    if (!history.offers.length && !mate) continue
    play(game, entry.uci)
    if (game.fen() !== entry.fenAfter) throw Error('Invalid FEN chain')
    rows.push({ id, ply: entry.ply, san: entry.san, fenBefore: entry.fenBefore,
      fenAfter: entry.fenAfter, history, sameOffer, matingEstimate: mate, roots })
  }
}
// Join references only after computing evidence for the complete sample.
for (const row of rows) {
  const prior = audit.rows.find(r => r.id === row.id && r.ply === row.ply)
  if (!prior || prior.san !== row.san) throw Error('Audit row mismatch')
  row.reference = prior.expected; row.classification = prior.after
  row.liveReason = prior.assessment.brilliant.reason
}
const statusCounts = {}
for (const row of rows) for (const offer of row.history.offers) {
  statusCounts[offer.status] = (statusCounts[offer.status] ?? 0) + 1
}
for (const [path, digest] of watched) if (hash(await readFile(new URL(path, root))) !== digest) throw Error(`Input changed: ${path}`)
const summary = { plies: audit.rows.length, reviewedMoves: rows.length, statusCounts,
  reusedSupplementarySearches: searches.length, newSearches: 0, classificationChanged: false,
  sourceHashesUnchanged: true, metrics: audit.summary.metrics, independentValidation: false }
const directory = new URL(`agent-output/brilliant-causality-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, rows,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
const focused = rows.filter(r => (r.id === 'game-1-chigorin-steinitz-1892' && [53, 55, 61].includes(r.ply))
  || (r.id === 'personal-02' && r.ply === 14) || (r.id === 'personal-04' && r.ply === 55))
await writeFile(new URL('report.md', directory), [
  '# Sacrificio e causalità: risultati', '',
  JSON.stringify(summary, null, 2), '',
  ...focused.flatMap(r => [`## ${r.id}/${r.ply} ${r.san}`, '',
    `Riferimento: ${r.reference}; categoria attuale: ${r.classification}; blocco: ${r.liveReason}.`, '',
    ...r.history.offers.map(o => `${o.offer.replySan}: ${o.status}. Score attuali dal lato di chi sacrifica: ${JSON.stringify(o.current.rows.map(s => ({ source: s.source, depth: s.depth, cpOpponent: s.evalCpOpponent, mateOpponent: s.mateOpponent, index: s.probabilityMover })))}. Score precedenti: ${JSON.stringify(o.previous)}.`), '',
    `Alternative con la stessa offerta: ${JSON.stringify(r.sameOffer.matches.map(m => ({ san: m.san, depth: m.depth, cp: m.evalCp, mate: m.mate })))}.`,
    `Variante di matto: ${JSON.stringify(r.matingEstimate)}.`, '',
    '| Root | Depth | cp | Mate |', '|---|---:|---:|---:|',
    ...r.roots.map(l => `| ${l.san} | ${l.depth} | ${l.cp ?? ''} | ${l.mate ?? ''} |`), '']),
  '## Interpretazione', '',
  'Rb3: Qxh8 è compensata nelle due ricerche esistenti (+903/+977 cp per il Bianco). La cattura precedente c8h8 non ha score disponibile: non possiamo chiamarla già compensata. h4 mantiene il medesimo cavallo in presa alla stessa depth di Rb3 e con score quasi uguale (+642 contro +656). La sola compensazione attuale non attribuisce la novità alla torre b3. Servirebbero score di Qxh8 dopo la precedente mossa propria e dopo h4, dalla FEN corretta con il Nero al tratto.', '',
  'Rxf5+: Qxf5 è l’unica risposta legale. La stima mate -6 a depth 42 ha una PV completa fino al matto; Qf8+ conserva temporaneamente il sacrificio, Qxf5+ recupera la donna al quarto ply. Il sacrificio tattico è documentato. g5+ (+983 cp, depth 15) e Qf8+ (+715 cp, depth 14) risultano già molto favorevoli, ma non aver trovato mate in queste ricerche non dimostra che non esista. Non confrontare depth 42 e depth 15 come prove di unicità. Servirebbero ricerche comparabili sulle alternative, con budget fissato prima.', '',
  'I controlli O-O/Rf3/Rac1 impediscono di equiparare ogni offerta compensata a una nuova Geniale. In particolare Rac1 ha alternative con lo stesso pezzo offerto e mate già stimato. Nessuna regola basata sulla SAN e nessuna promozione per assenza di prove contrarie.', '',
  'Decisione: conservare le categorie v5. Il veto persistente è un criterio prudenziale di attribuzione, non una dimostrazione che il sacrificio fosse già buono. Il veto sulle alternative è una scelta locale sulla necessità del sacrificio, non nega il motivo tattico. Prima di modificarli mancano confronti causali e ricerche comparabili. Nessuna nuova ricerca, nessuna nuova classificazione; conteggio invariato 15/37 sul campione già studiato.', '',
].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
