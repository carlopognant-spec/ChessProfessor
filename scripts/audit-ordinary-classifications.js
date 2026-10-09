import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'

const root = new URL('../', import.meta.url), sources = new Map()
const hash = data => createHash('sha256').update(data).digest('hex')
async function input(path, json = true) {
  const bytes = await readFile(new URL(path, root)); sources.set(path, hash(bytes))
  return json ? JSON.parse(bytes) : bytes.toString('utf8')
}
await input('agent-output/ordinary-classification-diagnosis-v1-protocol.md', false)
await input('scripts/audit-ordinary-classifications.js', false)
const audit = await input('agent-output/special-classification-2026-10-09T14-30-16-854Z/results.json')
for (const s of audit.sources) {
  if (hash(await readFile(new URL(s.path, root))) !== s.sha256) throw Error(`Audit source changed: ${s.path}`)
  sources.set(s.path, s.sha256)
}
const labels = { book: 'Libro', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', great: 'Grande', brilliant: 'Geniale', unclassified: 'Non valutabile' }
const bands = { best: 0, excellent: 2, good: 5, inaccuracy: 10, mistake: 20 }
const primary = engine => engine?.lines?.find(l => l.multipv === 1) ?? engine
const index = line => line?.mate != null ? Number(line.mate > 0)
  : Number.isFinite(line?.evalCp) ? calculateWinProbability(line.evalCp) : null
const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const material = (game, side) => game.board().flat().filter(Boolean)
  .reduce((sum, p) => sum + (p.color === side ? 1 : -1) * values[p.type], 0)
function variation(fen, line, side, baseline) {
  if (!line) return null
  const game = new Chess(fen), moves = []
  for (const uci of line.pv ?? []) {
    const move = game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
    moves.push({ san: move.san, captured: move.captured ?? null, materialDelta: material(game, side) - baseline })
  }
  return { depth: line.depth, evalCp: game.turn() ? line.evalCp : line.evalCp,
    mate: line.mate, moves, endsInMate: game.isCheckmate() }
}
const rows = []
for (const id of [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`),
  'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']) {
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  for (const [i, e] of cache.entries.entries()) {
    const row = audit.rows.find(r => r.id === id && r.ply === e.ply)
    if (!row || row.san !== e.san) throw Error('Audit/cache mismatch')
    const before = new Chess(e.fenBefore), side = before.turn(), baseline = material(before, side)
    const legal = before.moves({ verbose: true }), played = before.move(e.san)
    if (before.fen() !== e.fenAfter) throw Error('Invalid FEN chain')
    const fields = moveEvaluationFields(e.engine, e.playedEngine, e.uci, { isCheckmate: before.isCheckmate() })
    const classified = classifyAnalysisEntries([{ ...e, ...fields,
      isBookMove: row.assessment.numericalClassification === 'book' }])[0]
    if (classified.classification !== row.assessment.numericalClassification) throw Error('Numerical classification mismatch')
    const publicBand = classifyAnalysisEntries([classified], bands)[0]
    const keepSpecial = ['book', 'great', 'brilliant', 'missed'].includes(row.after)
    const playedRoots = e.engine.lines.filter(l => l.pv?.[0] === e.uci)
    const child = primary(e.playedEngine), best = primary(e.engine)
    const playedRoot = playedRoots.length === 1 ? playedRoots[0] : null
    const childMoverIndex = child?.mate === 0 && before.isCheckmate() ? 1 : index(child) == null ? null : 1 - index(child)
    const ownRootIndex = index(playedRoot)
    const previous = cache.entries[i - 1]
    const previousNumerical = previous ? classifyAnalysisEntries([{ ...previous,
      ...moveEvaluationFields(previous.engine, previous.playedEngine, previous.uci), isBookMove: false }])[0] : null
    const d = { id, ply: e.ply, san: e.san, expected: row.expected, actual: labels[row.after],
      numerical: classified.classification, dropPct: classified.dropPct,
      unclampedDropPct: 100 * (classified.bestProbability - classified.playedProbability),
      bestEval: fields.bestEval, playedEval: fields.playedEval, bestMate: fields.bestMate, playedMate: fields.playedMate,
      independentPlayedEval: child?.evalCp == null ? null : -child.evalCp,
      independentPlayedMate: child?.mate == null ? null : -child.mate,
      isEngineBest: fields.isEngineBest, evaluationSource: fields.evaluationSource,
      rootDepth: best?.depth, childDepth: child?.depth, playedRootDepth: playedRoot?.depth,
      rootPlayedCount: playedRoots.length,
      allRootDepthsSame: new Set(e.engine.lines.map(l => l.depth)).size === 1,
      duplicateRoots: e.engine.lines.length - new Set(e.engine.lines.map(l => l.pv?.[0])).size,
      rootChildDifferencePoints: ownRootIndex == null || childMoverIndex == null ? null : 100 * Math.abs(ownRootIndex - childMoverIndex),
      actualWithPublicBandsOnly: labels[keepSpecial ? row.after : publicBand.classification],
      legalMoves: legal.length, forcedLegalMove: legal.length === 1,
      fenBefore: e.fenBefore, fenAfter: e.fenAfter,
      previous: previous ? { san: previous.san, numerical: previousNumerical.classification,
        bestEval: previousNumerical.bestEval, playedEval: previousNumerical.playedEval,
        beforeMoverIndex: 1 - previousNumerical.bestProbability,
        offeredMoverIndex: 1 - previousNumerical.playedProbability } : null,
      missedReason: row.missedReason, specialContext: row.assessment.context,
      secondaryEvents: row.assessment.events,
      bestIndex: classified.bestProbability, playedIndex: classified.playedProbability,
      bestSan: new Chess(e.fenBefore).move({ from: best.pv[0].slice(0, 2), to: best.pv[0].slice(2, 4), promotion: best.pv[0][4] }).san }
    if (row.after === 'blunder' || row.expected === 'Forzata') {
      d.bestVariation = variation(e.fenBefore, best, side, baseline)
      d.playedVariation = variation(e.fenAfter, child, side, baseline)
      if (d.playedVariation) {
        d.playedVariation.evalCp = d.independentPlayedEval
        d.playedVariation.mate = d.independentPlayedMate
      }
    }
    rows.push(d)
  }
}
function counts(list, key = 'actual') {
  const byCategory = {}
  for (const r of list) { byCategory[r[key]] ??= 0; byCategory[r[key]]++ }
  return byCategory
}
function stats(list, key) {
  const a = list.map(r => r[key]).filter(Number.isFinite).sort((a, b) => a - b)
  const q = f => a.length ? a[Math.floor((a.length - 1) * f)] : null
  return { count: a.length, min: q(0), q25: q(.25), median: q(.5), q75: q(.75), max: q(1) }
}
const ordinaryLabels = ['Migliore', 'Ottima', 'Buona', 'Imprecisione', 'Errore', 'Errore grave']
const distributions = Object.fromEntries(ordinaryLabels.map(label => {
  const subset = rows.filter(r => r.expected === label)
  return [label, { count: subset.length, actual: counts(subset), drop: stats(subset, 'dropPct'),
    sources: counts(subset, 'evaluationSource'), playedIsPv1: subset.filter(r => r.isEngineBest).length,
    negativeRawDrop: subset.filter(r => r.unclampedDropPct < 0).length,
    rootChildDifference: stats(subset, 'rootChildDifferencePoints') }]
}))
const wrongBlunders = rows.filter(r => r.actual === 'Errore grave' && r.expected !== 'Errore grave')
const forced = rows.filter(r => r.forcedLegalMove || r.expected === 'Forzata')
const changes = rows.filter(r => r.actualWithPublicBandsOnly !== r.actual)
const summary = { version: audit.summary.version, plies: rows.length, newSearches: 0, appChanged: false,
  exactCurrent: rows.filter(r => r.actual === r.expected).length,
  exactPublicBandsOnly: rows.filter(r => r.actualWithPublicBandsOnly === r.expected).length,
  directBandChanges: changes.length, wrongBlunders: wrongBlunders.length,
  forcedLegalMoves: forced.filter(r => r.forcedLegalMove).length,
  forcedReferences: forced.filter(r => r.expected === 'Forzata').length,
  sourceCounts: counts(rows, 'evaluationSource'), mixedRootDepths: rows.filter(r => !r.allRootDepthsSame).length,
  duplicateRootPositions: rows.filter(r => r.duplicateRoots).length,
  negativeRawDrop: rows.filter(r => r.unclampedDropPct < 0).length,
  ordinaryReferenceMovesWithPlayedPv1: rows.filter(r => ['Ottima', 'Buona', 'Imprecisione', 'Errore'].includes(r.expected) && r.isEngineBest).length,
  sourceHashesUnchanged: true }
for (const [path, digest] of sources) if (hash(await readFile(new URL(path, root))) !== digest) throw Error(`Changed source: ${path}`)
const directory = new URL(`agent-output/ordinary-classification-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ summary, distributions, wrongBlunders, forced,
  directBandChanges: changes, rows, sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(new URL('report.md', directory), ['# Diagnosi categorie ordinarie', '',
  ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
  '## Distribuzioni delle perdite locali', '', '| Riferimento | Numero | Mediana perdita | Q25 | Q75 | Giocata PV1 | Perdita grezza negativa |', '|---|---:|---:|---:|---:|---:|---:|',
  ...Object.entries(distributions).map(([label, d]) => `| ${label} | ${d.count} | ${d.drop.median?.toFixed(2)} | ${d.drop.q25?.toFixed(2)} | ${d.drop.q75?.toFixed(2)} | ${d.playedIsPv1} | ${d.negativeRawDrop} |`), '',
  '## Tre Errore grave discordanti', '',
  ...wrongBlunders.flatMap(r => [`### ${r.id}/${r.ply} ${r.san}`, '',
    `Riferimento ${r.expected}; attuale ${r.actual}; perdita ${r.dropPct.toFixed(2)} punti. Migliore ${r.bestSan}: ${r.bestEval} cp / mate ${r.bestMate}; giocata ${r.playedEval} cp / mate ${r.playedMate}.`,
    `Contesto precedente: ${JSON.stringify(r.previous)}. Blocco Mossa mancata: ${r.missedReason}. Eventi secondari: ${JSON.stringify(r.secondaryEvents)}.`,
    `PV migliore: ${r.bestVariation.moves.map(m => m.san).join(' ')}. PV dopo la giocata: ${r.playedVariation.moves.map(m => m.san).join(' ')}.`, '']),
  '## Posizioni forzate', '', ...forced.map(r => `- ${r.id}/${r.ply} ${r.san}: ${r.legalMoves} mosse legali, riferimento ${r.expected}, attuale ${r.actual}.`), '',
  '## Limiti', '',
  'Le bande pubbliche sono applicate solo per una simulazione numerica isolata: score e categorie speciali restano fissi, senza fitting. L’indice locale sigmoid(cp/400) non è Expected Points calibrato sul rating. Il child può essere più profondo ma non è automaticamente una verità più affidabile; ricerche separate possono divergere. Nessuna modifica alle soglie dell’app.', '',
  '[Documentazione primaria](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc).', ''].join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), summary, distributions,
  wrongBlunders: wrongBlunders.map(r => ({ id: r.id, ply: r.ply, san: r.san, expected: r.expected,
    drop: r.dropPct, best: r.bestEval, played: r.playedEval, bestSan: r.bestSan, missedReason: r.missedReason })), forced }, null, 2))
