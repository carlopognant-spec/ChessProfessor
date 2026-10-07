import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'
import { createOpeningBook } from '../src/lib/openingBook.js'

// Stored P1-P6 caches only. No worker, engine executable, env loader or annotations.
const root = new URL('../', import.meta.url)
const sourceFolder = 'tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/'
const bookSource = 'src/data/openingPositions.json'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const sources = [], candidates = [], decisions = [], games = []
async function input(relativePath) {
  const bytes = await readFile(new URL(relativePath, root))
  sources.push({ path: relativePath, sha256: sha(bytes) })
  return JSON.parse(bytes.toString('utf8'))
}
const book = createOpeningBook((await input(bookSource)).positions)
const params = {
  protocol: 'grande-experiment-protocol-v1', status: 'proposed-not-adopted',
  playedMinimumCp: 0, alternativeMaximumCp: -200, minimumGapCp: 200,
  guardCp: 50, maximumBudgetOscillationCp: 50,
  budgetsPerRoot: [200000, 1000000], nominalNodeCap: 100000000,
  experimentalMultiPv: 1, threads: 1, hashMb: 16,
}
for (let number = 1; number <= 6; number++) {
  const id = `personal-0${number}`, path = `${sourceFolder}${id}.json`
  const cache = await input(path)
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.kind !== 'nodes' || cache.searchLimit.value !== 200000 || cache.multiPv !== 5 || cache.threads !== 1 || cache.hashMb !== 16 || cache.scorePerspective !== 'side-to-move at each FEN') throw Error(`Unexpected settings: ${id}`)
  const game = new Chess(), rows = []
  const pgnGame = new Chess(); pgnGame.loadPgn(cache.pgn)
  let bookPath = true, count = 0, roots = 0
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1 || entry.fenBefore !== game.fen()) throw Error(`Invalid cache chain: ${id}/${index + 1}`)
    const before = new Chess(entry.fenBefore)
    const legal = before.moves({ verbose: true }).map(m => ({ uci: `${m.from}${m.to}${m.promotion ?? ''}`, san: m.san })).sort((a, b) => a.uci.localeCompare(b.uci))
    const side = game.turn(), moveHistorySan = game.history(), move = game.move(entry.san)
    if (entry.fenAfter !== game.fen() || entry.uci !== `${move.from}${move.to}${move.promotion ?? ''}`) throw Error(`Invalid move: ${id}/${entry.ply}`)
    const isBookMove = bookPath && !game.isCheckmate() && book.hasPosition(entry.fenAfter)
    if (!isBookMove) bookPath = false
    const common = classifyAnalysisEntries([{ ...entry, ...moveEvaluationFields(entry.engine, entry.playedEngine, entry.uci, { isCheckmate: game.isCheckmate() }), side, moveHistorySan, playedMove: entry.san, isBookMove }])[0]
    const row = classifyMissedOpportunity(common, rows.at(-1)); rows.push(row)
    const primary = entry.engine.lines?.find(l => l.multipv === 1) ?? entry.engine
    let reason = null
    if (isBookMove) reason = 'book'
    else if (before.isGameOver() || game.isCheckmate() || game.isStalemate()) reason = 'terminal-or-delivered-mate'
    else if (legal.length < 2) reason = 'only-legal-move'
    else if (row.classification !== 'best') reason = `classification-${row.classification}`
    else if (row.isEngineBest !== true) reason = 'not-engine-best'
    else if (!Number.isFinite(primary.evalCp) || primary.mate != null) reason = 'missing-or-mate-primary-score'
    else if (primary.bound || primary.lowerbound || primary.upperbound || /\b(?:lowerbound|upperbound)\b/.test(primary.raw ?? '')) reason = 'bound-primary-score'
    const decision = { gameId: id, ply: entry.ply, side, san: entry.san, uci: entry.uci, classification: row.classification, isEngineBest: row.isEngineBest, legalCount: legal.length, eligible: reason == null, reason: reason ?? 'eligible-for-full-root-experiment' }
    decisions.push(decision)
    if (reason == null) {
      count++; roots += legal.length
      candidates.push({ ...decision, fenBefore: entry.fenBefore, fenAfter: entry.fenAfter, source: path, sourceSha256: sources.at(-1).sha256, legalMoves: legal, cachedPrimaryCp: primary.evalCp, searches: 2 * legal.length, nominalNodes: 1200000 * legal.length })
    }
  }
  if (game.fen() !== pgnGame.fen() || game.history().join(' ') !== pgnGame.history().join(' ')) throw Error(`Incomplete PGN replay: ${id}`)
  games.push({ id, plies: rows.length, candidates: count, legalRoots: roots, searches: 2 * roots, nominalNodes: 1200000 * roots, sourceEngine: { version: cache.engineVersion, build: cache.engineBuild, packageVersion: cache.packageVersion, hashPolicy: cache.hashPolicy } })
}
for (const source of sources) if (sha(await readFile(new URL(source.path, root))) !== source.sha256) throw Error(`Source changed: ${source.path}`)
const totalRoots = games.reduce((n, g) => n + g.legalRoots, 0)
const totals = { plies: decisions.length, candidates: candidates.length, legalRoots: totalRoots, searches: 2 * totalRoots, nominalNodes: 1200000 * totalRoots }
const overCap = totals.nominalNodes > params.nominalNodeCap
const exclusionCounts = {}
for (const d of decisions.filter(d => !d.eligible)) exclusionCounts[d.reason] = (exclusionCounts[d.reason] ?? 0) + 1
const manifest = { schemaVersion: 1, searchesExecuted: 0, annotationsRead: false, sourceHashesUnchanged: true, params, sources, totals, overCap, executionStatus: overCap ? 'blocked-by-proposed-cost-cap-no-searches-started' : 'awaiting-engine-search-authorization', games, exclusionCounts, candidates, decisions }
const directory = new URL(`agent-output/grande-manifest-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory) // Exclusive directory; never overwrite an existing result.
await writeFile(new URL('manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
const report = [ '# Grande v1 — manifest e costo, nessuna ricerca', '',
  '| Partita | Ply | Candidati | Radici legali | Ricerche previste | Nodi nominali |',
  '|---|---:|---:|---:|---:|---:|',
  ...games.map(g => `| ${g.id} | ${g.plies} | ${g.candidates} | ${g.legalRoots} | ${g.searches} | ${g.nominalNodes} |`),
  `| Totale | ${totals.plies} | ${totals.candidates} | ${totals.legalRoots} | ${totals.searches} | ${totals.nominalNodes} |`, '',
  `Tetto proposto: ${params.nominalNodeCap} nodi. Superato: ${overCap}.`,
  'Budget e soglie sperimentali proposti, non adottati. Il costo include due ricerche separate per ogni radice; nessuna deduplicazione delle FEN tra partite.',
  'Selezione da tutte le mosse delle cache P1–P6, senza annotazioni Chess.com. Nessun confronto TP/FP/FN in questo punto.',
  'Primary score mate/bound escluso; eventuali bound o depth diverse in linee secondarie non decidono il filtro: il futuro esperimento deve raccogliere tutte le radici nuovamente.',
  `${sources.length} hash sorgenti verificati invariati. go=0. .env, Partite/7–10 e baseline SF16 non letti.`,
  'Nessuna categoria assegnata dal manifest; cachedPrimaryCp è diagnostico e non supera le guardie della futura raccolta.',
  'Test/build/browser/benchmark secondi: NON ESEGUITO. Nessun commit/push. STOP.', '' ].join('\n')
await writeFile(new URL('report.md', directory), report, { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), totals, overCap, games, exclusionCounts, sourceHashesUnchanged: true, searchesExecuted: 0, annotationsRead: false }, null, 2))
