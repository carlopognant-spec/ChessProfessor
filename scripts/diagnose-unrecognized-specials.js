import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../src/lib/classification.js'
import { calculateWinProbability } from '../src/lib/evaluation.js'
import { SPECIAL_POLICY } from '../src/lib/specialClassification.js'
import { auditLegalFork } from './grande-fork-legal.js'
import { classifySameOfferBrilliant } from './brilliant-same-offer-v4.js'
import { validateSupplementalSearches } from './specials-frozen-evaluation.js'

const root = new URL('../', import.meta.url), watched = new Map()
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); watched.set(path, hash(bytes)); return JSON.parse(bytes)
}
const args = process.argv.slice(2)
if (args.length && (args.length !== 2 || args[0] !== '--audit' || !args[1])) throw Error('Use --audit <results.json>')
const audit = await input(args[1] ?? 'agent-output/special-classification-2026-10-09T14-30-16-854Z/results.json')
if (audit.summary.version !== SPECIAL_POLICY.version) throw Error('Audit does not match current policy')
for (const source of audit.sources) {
  const bytes = await readFile(new URL(source.path, root))
  if (hash(bytes) !== source.sha256) throw Error(`Audit source changed: ${source.path}`)
  watched.set(source.path, source.sha256)
}
const supplemental = validateSupplementalSearches(
  await input('agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json'),
  await input('agent-output/brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json'))
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`),
  'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const labels = { best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', missed: 'Mossa mancata', great: 'Grande', brilliant: 'Geniale', book: 'Libro' }
const categories = { Grande: 'great', Geniale: 'brilliant', 'Mossa mancata': 'missed' }
const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
const material = (game, side) => game.board().flat().filter(Boolean)
  .reduce((sum, piece) => sum + (piece.color === side ? 1 : -1) * values[piece.type], 0)
const primary = engine => engine?.lines?.find(line => line.multipv === 1) ?? engine
function index(line) {
  if (!line || line.bound || /\b(?:upperbound|lowerbound)\b/.test(line.raw ?? '')) return null
  if (Number.isInteger(line.mate) && line.mate !== 0) return Number(line.mate > 0)
  return line.mate == null && Number.isFinite(line.evalCp) ? calculateWinProbability(line.evalCp) : null
}
function variation(fen, line, invert = false) {
  if (!line) return null
  const game = new Chess(fen), sans = []
  for (const uci of line.pv ?? []) {
    if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) throw Error('Invalid UCI in cache')
    sans.push(game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san)
  }
  const raw = index(line)
  return { rank: line.multipv ?? null, depth: line.depth ?? null,
    evalCp: line.evalCp == null ? null : (invert ? -line.evalCp : line.evalCp),
    mate: line.mate == null ? null : (invert ? -line.mate : line.mate),
    index: raw == null ? null : invert ? 1 - raw : raw,
    uci: line.pv?.[0], san: sans[0] ?? null, pv: sans.slice(0, 12),
    availablePlies: sans.length, endsInMate: game.isCheckmate(), bound: Boolean(line.bound) }
}
const round = value => value == null ? 'N/D' : value.toFixed(3)
const evaluation = line => !line ? 'N/D' : line.mate != null ? `matto ${line.mate}`
  : line.evalCp == null ? 'N/D' : `${line.evalCp >= 0 ? '+' : ''}${(line.evalCp / 100).toFixed(2)}`
const rows = []
for (const id of ids) {
  const relevant = audit.rows.filter(row => row.id === id && categories[row.expected] && row.after !== categories[row.expected])
  if (!relevant.length) continue
  const cache = await input(`tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`)
  const numerical = cache.entries.map(e => classifyAnalysisEntries([{ ...e, playedMove: e.san,
    ...moveEvaluationFields(e.engine, e.playedEngine, e.uci), isBookMove: false }])[0])
  for (const row of relevant) {
    const entry = cache.entries[row.ply - 1], previous = cache.entries[row.ply - 2]
    if (entry.san !== row.san || entry.ply !== row.ply) throw Error('Audit/cache mismatch')
    const before = new Chess(entry.fenBefore), side = before.turn(), startMaterial = material(before, side)
    const after = new Chess(entry.fenBefore), move = after.move(entry.san)
    if (after.fen() !== entry.fenAfter || `${move.from}${move.to}${move.promotion ?? ''}` !== entry.uci) throw Error('Invalid played move')
    const roots = entry.engine.lines.map(line => variation(entry.fenBefore, line))
    const child = variation(entry.fenAfter, primary(entry.playedEngine), true)
    const playedRoots = roots.filter(line => line.uci === entry.uci)
    const sameDepth = roots.filter(line => line.depth === roots[0].depth)
    const prior = previous ? variation(previous.fenBefore, primary(previous.engine), true) : null
    const priorAfter = previous ? variation(previous.fenAfter, primary(previous.playedEngine)) : null
    const targets = after.board().flat().filter(piece => piece && piece.color !== side
      && after.attackers(piece.square, side).includes(move.to)).map(piece => ({ square: piece.square, type: piece.type }))
    const fork = targets.length >= 2 ? auditLegalFork(entry) : null
    const own = cache.entries[row.ply - 3]
    const historicalSacrifice = row.expected === 'Geniale'
      ? classifySameOfferBrilliant(entry, labels[numerical[row.ply - 1].classification], own, previous, supplemental) : null
    const previousNumerical = numerical[row.ply - 2]?.classification ?? null
    const afterIndex = child?.index, bestIndex = roots[0]?.index
    const playedIndex = playedRoots.length === 1 ? playedRoots[0].index : null
    const consistency = playedIndex == null || afterIndex == null ? null : Math.abs(playedIndex - afterIndex)
    const distinctComparable = roots.filter(line => line.uci !== entry.uci && line.depth === roots[0].depth && line.index != null)
    const strongestComparable = distinctComparable.sort((a, b) => b.index - a.index)[0] ?? null
    const maintained = playedIndex == null || afterIndex == null ? null : Math.min(playedIndex, afterIndex)
    const quantitativeProfile = strongestComparable && maintained != null ? {
      alternative: strongestComparable.san, alternativeIndex: strongestComparable.index,
      maintainedIndex: maintained, comparableGap: bestIndex - strongestComparable.index,
      criticalDefense: maintained >= SPECIAL_POLICY.good && strongestComparable.index <= SPECIAL_POLICY.poor
        && bestIndex - strongestComparable.index >= SPECIAL_POLICY.gap,
      criticalWinningChoice: maintained >= SPECIAL_POLICY.winning && strongestComparable.index <= SPECIAL_POLICY.nonWinning
        && bestIndex - strongestComparable.index >= SPECIAL_POLICY.gap,
      onlyPartialEvidence: true,
    } : null
    const d = { id, ply: row.ply, san: row.san, moveNumber: Math.ceil(row.ply / 2), side,
      expected: row.expected, actual: labels[row.after], assessment: row.assessment,
      fenBefore: entry.fenBefore, fenAfter: entry.fenAfter,
      numerical: { ...moveEvaluationFields(entry.engine, entry.playedEngine, entry.uci),
        dropPct: numerical[row.ply - 1].dropPct, bestProbability: numerical[row.ply - 1].bestProbability,
        playedProbability: numerical[row.ply - 1].playedProbability,
        classification: numerical[row.ply - 1].classification },
      context: { previousSan: previous?.san, previousNumerical, beforeIndex: prior?.index,
        availableAfterOpponentIndex: priorAfter?.index, currentBestIndex: bestIndex,
        playedRootIndex: playedIndex, independentAfterIndex: afterIndex, consistency,
        opponentGain: bestIndex == null || prior?.index == null ? null : bestIndex - prior.index },
      evidence: { roots, child, duplicateRoots: roots.length - new Set(roots.map(line => line.uci)).size,
        sameDepthCount: sameDepth.length, allSameDepth: sameDepth.length === roots.length,
        playedRootCount: playedRoots.length,
        rootChildConflict: consistency != null && consistency > SPECIAL_POLICY.consistency },
      structure: { captured: move.captured ?? null, check: after.isCheck(), replyingToCheck: before.isCheck(),
        materialBefore: startMaterial, materialAfter: material(after, side),
        materialGain: material(after, side) - startMaterial, attackedTargets: targets,
        legalReplies: after.moves().length, fork },
      empiricalFamily: { numericalBest: numerical[row.ply - 1].classification === 'best',
        playedIsPv1: roots[0].uci === entry.uci, noCapture: !move.captured,
        afterNumericalError: ['mistake', 'blunder'].includes(previousNumerical) }, quantitativeProfile,
      missedGates: { beforeNotAlreadyWinning: prior?.index != null && prior.index <= SPECIAL_POLICY.nonWinning,
        bestWinning: bestIndex != null && bestIndex >= SPECIAL_POLICY.winning,
        numericalPlayedLosesWin: numerical[row.ply - 1].playedProbability <= SPECIAL_POLICY.nonWinning,
        independentPlayedLosesWin: afterIndex != null && afterIndex <= SPECIAL_POLICY.nonWinning,
        sufficientNewOpportunity: bestIndex != null && prior?.index != null && bestIndex - prior.index >= SPECIAL_POLICY.gap,
        differentFromBest: roots[0].uci !== entry.uci }, historicalSacrifice }
    rows.push(d)
  }
}
const unresolved = audit.summary.metrics.reduce((sum, category) => sum + category.fn, 0)
if (rows.length !== unresolved) throw Error(`Expected ${unresolved} unresolved moves, found ${rows.length}`)
for (const [path, expected] of watched) if (hash(await readFile(new URL(path, root))) !== expected) throw Error(`Input changed: ${path}`)
const directory = new URL(`agent-output/move-diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('results.json', directory), JSON.stringify({ version: SPECIAL_POLICY.version,
  newSearches: 0, sourceHashesUnchanged: true, independentValidation: false, rows,
  sources: [...watched].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
const lines = [`# Diagnosi delle ${rows.length} categorie speciali non riconosciute`, '',
  'Le valutazioni sono dalla prospettiva di chi gioca la mossa esaminata, espresse in pedoni (+1,00 = +100 cp). Gli indici sono della curva locale, non probabilità umane. Ricerche nuove: zero. Le varianti sono rigiocate legalmente; descrivono le stime del motore al budget disponibile, non una dimostrazione contro tutte le difese.', '',
  'Il motivo registrato dal detector è il primo blocco incontrato, non necessariamente l’unico. Le verifiche successive qui mostrate distinguono il problema dei dati dalla compatibilità delle regole.', '']
for (const d of rows) {
  const rootLine = d.evidence.roots[0], alternative = d.evidence.roots[1]
  lines.push(`## ${d.id} — ${d.moveNumber}.${d.side === 'b' ? '..' : ''} ${d.san} (ply ${d.ply})`, '',
    `Attesa: **${d.expected}**. Attuale: **${d.actual}**. Perdita numerica: ${d.numerical.dropPct.toFixed(2)} punti dell’indice percentuale; fonte ${d.numerical.evaluationSource}.`, '',
    `Migliore: **${rootLine.san}**, ${evaluation(rootLine)}, depth ${rootLine.depth}. Seconda: **${alternative?.san}**, ${evaluation(alternative)}, depth ${alternative?.depth}. Dopo la giocata, ricerca indipendente: **${evaluation(d.evidence.child)}**, depth ${d.evidence.child?.depth}.`, '',
    `Variante migliore: ${rootLine.pv.join(' ')}. Dopo la giocata: ${d.evidence.child?.pv.join(' ')}.`, '',
    `Struttura: ${d.structure.check ? 'dà scacco' : 'non dà scacco'}; presa ${d.structure.captured ?? 'nessuna'}; saldo materiale immediato ${d.structure.materialGain >= 0 ? '+' : ''}${d.structure.materialGain}; ${d.structure.legalReplies} risposte legali. Bersagli attaccati dal pezzo mosso: ${d.structure.attackedTargets.map(t => `${t.type}@${t.square}`).join(', ') || 'nessuno'}.`, '',
    `Dati: profondità radici ${d.evidence.roots.map(r => r.depth).join('/')}; ${d.evidence.duplicateRoots} duplicati; differenza radice giocata/ricerca indipendente ${round(d.context.consistency)} (massimo locale 0,100).`, '',
    `Blocco Grande: **${d.assessment.grande.reason}** (${d.assessment.grande.status}). Blocco Geniale: **${d.assessment.brilliant.reason}** (${d.assessment.brilliant.status}).`, '',
    `Famiglia empirica: precedente ${d.context.previousSan ?? 'N/D'} = ${labels[d.context.previousNumerical] ?? 'N/D'}; ${d.empiricalFamily.noCapture ? 'senza presa' : 'con presa'}.`, '')
  if (d.expected === 'Mossa mancata') lines.push(
    `Indici: prima dell’avversario ${round(d.context.beforeIndex)}; migliore disponibile ${round(d.context.currentBestIndex)}; giocata secondo il classificatore ${round(d.numerical.playedProbability)}; dopo la giocata secondo la ricerca indipendente ${round(d.context.independentAfterIndex)}.`,
    `Condizioni: ${Object.entries(d.missedGates).map(([key, value]) => `${key}=${value}`).join('; ')}. Nessuna radice di queste sette mosse segnala un matto vincente.`, '')
  if (d.historicalSacrifice) lines.push(
    `Verifica supplementare del sacrificio con le prove storiche già validate: **${d.historicalSacrifice.reason}**, status ${d.historicalSacrifice.status}. Alternative vincenti senza sacrificio: ${d.historicalSacrifice.evidence.winningNonSacrifices.map(a => `${a.uci} (${a.evalCp} cp, depth ${a.depth})`).join(', ') || 'nessuna'}.`, '')
  if (d.expected === 'Grande') lines.push(d.quantitativeProfile
    ? `Verifica aggiuntiva con la migliore alternativa distinta già disponibile alla stessa profondità (${d.quantitativeProfile.alternative}): difesa critica=${d.quantitativeProfile.criticalDefense}, scelta vincente critica=${d.quantitativeProfile.criticalWinningChoice}. È un controllo condizionale su prove parziali: non assegna una categoria e non prova che siano coperte tutte le alternative.`
    : 'Non è disponibile neppure un’alternativa distinta alla profondità della PV1 per il confronto aggiuntivo.', '')
  lines.push('| Rank | Mossa | Valutazione | Depth | Variante |', '|---|---|---|---|---|',
    ...d.evidence.roots.map(r => `| ${r.rank} | ${r.san} | ${evaluation(r)} | ${r.depth} | ${r.pv.slice(0, 6).join(' ')} |`), '')
}
lines.push('## Cosa sappiamo del riferimento', '',
  'Chess.com descrive Grande come una mossa critica e Geniale come un buon sacrificio; il riconoscimento è più permissivo per giocatori meno esperti. Mossa mancata riguarda un errore avversario non sfruttato, con soglie di posizione dipendenti dal rating. Il nostro indice fisso non rappresenta quel modello. [Definizioni ufficiali](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc).', '',
  'Anche la forza di Game Review può cambiare i risultati. Non conosciamo configurazione e valutazioni usate per tutte le annotazioni originali: una discordanza non dimostra da sola che il riferimento sia errato o che la cache sia sufficiente. [Spiegazione ufficiale](https://support.chess.com/en/articles/11845102-why-did-my-move-classification-change-in-game-review).', '')
await writeFile(new URL('report.md', directory), lines.join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), moves: rows.length,
  categories: Object.fromEntries(Object.keys(categories).map(label => [label, rows.filter(r => r.expected === label).length])), newSearches: 0 }, null, 2))
