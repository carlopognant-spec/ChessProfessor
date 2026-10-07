import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { classifyMissedOpportunity } from '../src/lib/missedOpportunity.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { gameAccuracy } from '../src/lib/accuracy.js'

// Only stored analyses. No engines, generators, Partite directories or env loading.
const root = fileURLToPath(new URL('../', import.meta.url))
const qa = path.join(root, 'tests/fixtures/qa')
const large = path.join(qa, 'analysis-cache-large-200k/2026-10-07T09-51-26-999Z')
const output = path.join(root, 'agent-output/roadmap-3-1-3-2')
const json = async file => JSON.parse(await readFile(file, 'utf8'))
const book = createOpeningBook((await json(path.join(root, 'src/data/openingPositions.json'))).positions)
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const watched = ids.flatMap(id => [path.join(qa, `${id}.json`), path.join(qa, 'analysis-cache', `${id}.json`), path.join(large, `${id}.json`)])
const digest = async file => createHash('sha256').update(await readFile(file)).digest('hex')
const hashes = await Promise.all(watched.map(digest))
const reports = []

function classify(fixture, cache) {
  if (cache.pgn !== fixture.pgn) throw Error('PGN cache discordante')
  const game = new Chess(), rows = []
  let bookPath = true
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.fenBefore !== game.fen() || entry.ply !== index + 1 || fixture.annotations[index]?.san !== entry.san) throw Error('Catena cache discordante')
    const side = game.turn(), moveHistorySan = game.history(), move = game.move(entry.san)
    if (entry.fenAfter !== game.fen() || entry.uci !== `${move.from}${move.to}${move.promotion ?? ''}`) throw Error('Mossa cache discordante')
    const isBookMove = bookPath && !game.isCheckmate() && book.hasPosition(entry.fenAfter)
    if (!isBookMove) bookPath = false
    const common = classifyAnalysisEntries([{ ...entry, ...moveEvaluationFields(entry.engine, entry.playedEngine, entry.uci, { isCheckmate: game.isCheckmate() }),
      playedMove: entry.san, side, moveHistorySan, isBookMove }])[0]
    rows.push({ ...classifyMissedOpportunity(common, rows.at(-1)), expected: fixture.annotations[index].category })
  }
  if (rows.length !== fixture.annotations.length) throw Error('Analisi incompleta')
  return rows
}

for (const id of ids) {
  const fixture = await json(path.join(qa, `${id}.json`))
  const pgn = new Chess(); pgn.loadPgn(fixture.pgn)
  const report = { id, group: id.startsWith('personal') ? 'development' : 'historical', labels: fixture.label,
    elo: { white: pgn.getHeaders().WhiteElo ?? null, black: pgn.getHeaders().BlackElo ?? null }, schemes: {} }
  for (const [name, folder] of [['native16Depth12', path.join(qa, 'analysis-cache')], ['large19Nodes200k', large]]) {
    const cache = await json(path.join(folder, `${id}.json`))
    const rows = classify(fixture, cache)
    const positives = rows.filter(row => row.classification === 'missed')
    const expected = rows.filter(row => row.expected === 'Mossa mancata')
    const tp = positives.filter(row => row.expected === 'Mossa mancata').length
    const cases = rows.filter(row => row.expected === 'Mossa mancata' || row.classification === 'missed').map(row => ({
      ply: row.ply, san: row.san, expected: row.expected, actual: row.classification,
      base: row.baseClassification, reason: row.missedOpportunityReason,
      bestEval: row.bestEval, bestMate: row.bestMate, playedEval: row.playedEval, playedMate: row.playedMate,
      bestProbability: row.bestProbability, playedProbability: row.playedProbability, dropPct: row.dropPct,
      alternative: row.missedOpportunity?.alternative ?? null,
    }))
    const specialCandidates = rows.filter(row => ['Grande', 'Geniale'].includes(row.expected)).map(row => {
      const before = new Chess(row.fenBefore)
      const legal = before.moves({ verbose: true }).map(move => `${move.from}${move.to}${move.promotion ?? ''}`)
      const roots = new Set(row.engine.lines.map(line => line.pv?.[0]).filter(uci => legal.includes(uci)))
      const primaryDepth = row.engine.lines.find(line => line.multipv === 1)?.depth
      return { ply: row.ply, san: row.san, expected: row.expected, actual: row.classification,
        isEngineBest: row.isEngineBest, common: row.baseClassification, legalCount: legal.length, cachedRootCount: roots.size,
        allLegalRootsCovered: legal.every(uci => roots.has(uci)), sameRealDepth: row.engine.lines.every(line => line.depth === primaryDepth),
        decision: 'not-adopted', reason: row.expected === 'Grande' ? 'no-complete-uniqueness-proof' : 'no-sacrifice-defense-counterfactual-proof' }
    })
    const precision = gameAccuracy(rows)
    report.schemes[name] = { missed: { tp, fp: positives.length - tp, fn: expected.length - tp,
      precision: positives.length ? tp / positives.length : null, recall: expected.length ? tp / expected.length : null },
      missedCases: cases, specialCandidates, accuracy: { white: precision.white, black: precision.black, windowSize: precision.windowSize, partial: precision.partial } }
  }
  reports.push(report)
}
const summary = ['development', 'historical'].flatMap(group => ['native16Depth12', 'large19Nodes200k'].map(scheme => {
  const selected = reports.filter(report => report.group === group)
  const sum = key => selected.reduce((total, report) => total + report.schemes[scheme].missed[key], 0)
  const tp = sum('tp'), fp = sum('fp'), fn = sum('fn')
  return { group, scheme, tp, fp, fn, precision: tp + fp ? tp / (tp + fp) : null, recall: tp + fn ? tp / (tp + fn) : null }
}))
const unchanged = (await Promise.all(watched.map(digest))).every((hash, index) => hash === hashes[index])
if (!unchanged) throw Error('Un file protetto è cambiato')
await mkdir(output) // Fail if this report folder already exists; never overwrite.
await writeFile(path.join(output, 'results.json'), JSON.stringify({ summary, reports, protectedFiles: watched.length, hashesUnchanged: unchanged, searches: 0, comparisonChessCom: 'pending-user-data', levelModel: 'pending-user-data' }, null, 2) + '\n', { flag: 'wx' })
const lines = ['# 3.1 Diagnosi e 3.2 Precisione dalle cache', '', 'Nessuna ricerca motore. Soglie e classificazioni invariate. Dati di sviluppo, non validazione.', '', '| Gruppo | Motore/budget | TP | FP | FN | Precisione categoria | Richiamo |', '|---|---|---:|---:|---:|---:|---:|',
  ...summary.map(row => `| ${row.group} | ${row.scheme} | ${row.tp} | ${row.fp} | ${row.fn} | ${row.precision == null ? 'N/D' : (100 * row.precision).toFixed(1) + '%'} | ${row.recall == null ? 'N/D' : (100 * row.recall).toFixed(1) + '%'} |`), '',
  'Grande/Geniale non attivate: nessuna prova completa di unicità o di sacrificio/miglior difesa/controfattuale. Diagnosi di ogni esempio in results.json; nessuna nuova soglia inventata.', '', '| Partita | Bianco SF16 | Nero SF16 | Bianco large200k | Nero large200k |', '|---|---:|---:|---:|---:|',
  ...reports.map(report => `| ${report.id} | ${['native16Depth12', 'large19Nodes200k'].flatMap(name => ['white', 'black'].map(side => report.schemes[name].accuracy[side].value?.toFixed(2) ?? 'N/D')).join(' | ')} |`), '',
  'Precisione da formula richiesta, senza bonus +1 del codice lila; pesi e aggregazione verificati sulle fonti ufficiali. Clamp cp e mate a ±1000; stallo = 0 cp; catena unica di FEN tramite playedEngine, nessuna fusione dei root score indipendenti. Non equivale alla formula privata chess.com. Correlazione/scarto e stima livello NON ESEGUITI: mancano i dati dell’utente.', '',
  '## Tutti i casi Mossa mancata sul motore adottato', '', '| Partita | Ply | Mossa | Attesa | Ottenuta | Motivo | best cp/mate | played cp/mate |', '|---|---:|---|---|---|---|---|---|',
  ...reports.flatMap(report => report.schemes.large19Nodes200k.missedCases.map(row => `| ${report.id} | ${row.ply} | ${row.san} | ${row.expected} | ${row.actual} | ${row.reason} | ${row.bestEval ?? 'mate ' + row.bestMate} | ${row.playedEval ?? 'mate ' + row.playedMate} |`)), '',
  `${watched.length} hash invariati; go = 0. Cache e baseline intatti.`, '']
await writeFile(path.join(output, 'report.md'), lines.join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ summary, accuracy: reports.map(report => ({ id: report.id, ...report.schemes.large19Nodes200k.accuracy })), hashesUnchanged: unchanged, searches: 0 }, null, 2))
