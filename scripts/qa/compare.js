import { Chess } from 'chess.js'
import { classifyAnalysisEntries, moveEvaluationFields } from '../../src/lib/classification.js'
import { ENGINE_CONFIG } from '../../src/lib/engineConfig.js'
import { formatMateComparison } from '../../src/lib/mateComparison.js'
import { classifyMissedOpportunity, formatMissedOpportunity } from '../../src/lib/missedOpportunity.js'

export const labels = { best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', book: 'Libro', brilliant: 'Geniale', great: 'Grande', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const scale = ['Migliore', 'Ottima', 'Buona', 'Imprecisione', 'Errore', 'Errore grave']
const unsupported = ['Geniale', 'Grande']
const referenceLabels = [...Object.values(labels), 'Forzata']

export function fixtureMoves(fixture) {
  const game = new Chess()
  game.loadPgn(fixture.pgn)
  if (game.getHeaders().SetUp === '1') throw new Error('PGN con posizione iniziale personalizzata non supportato')
  const moves = game.history()
  const seen = new Set()
  for (const annotation of fixture.annotations) {
    if (!Number.isInteger(annotation.ply) || seen.has(annotation.ply) || moves[annotation.ply - 1] !== annotation.san || !referenceLabels.includes(annotation.category)) {
      throw new Error(`Annotazione non valida: ply ${annotation.ply}`)
    }
    seen.add(annotation.ply)
  }
  if (fixture.annotations.length !== moves.length) throw new Error('Serve una annotazione per ogni ply')
  return moves
}

export function validateCache(cache, fixture, config) {
  const moves = fixtureMoves(fixture)
  if (cache.schemaVersion !== 1 || cache.pgn !== fixture.pgn || cache.depth !== config.defaultDepth || cache.multiPv !== config.multiPv || !cache.engineVersion || cache.entries.length !== moves.length) throw new Error('Cache incompatibile con fixture o configurazione')
  const game = new Chess()
  for (const [index, entry] of cache.entries.entries()) {
    if (entry.ply !== index + 1 || entry.san !== moves[index] || entry.fenBefore !== game.fen()) throw new Error(`Cache non valida: ply ${index + 1}`)
    const move = game.move(moves[index])
    if (entry.uci !== `${move.from}${move.to}${move.promotion ?? ''}` || entry.fenAfter !== game.fen()) throw new Error(`Cache non valida: mossa ${index + 1}`)
    for (const result of [entry.engine, entry.playedEngine]) {
      if (!result || !Array.isArray(result.lines) || ![result.evalCp, result.mate].every(value => value === null || Number.isFinite(value))) throw new Error(`Valutazione cache non valida: ply ${index + 1}`)
    }
  }
  return cache
}

export function compare(fixture, cache, suspectLabels = [], { openingBook } = {}) {
  const expectedCounts = Object.fromEntries(referenceLabels.map(label => [label, 0]))
  const exclusions = { book: 0, unsupported: 0, suspect: 0, missing: 0, forced: 0 }
  const matrix = {}
  let included = 0, exact = 0, withinOne = 0, ordinalIncluded = 0
  const classifiedEntries = []
  let bookPathActive = Boolean(openingBook)
  for (const [index, entry] of cache.entries.entries()) {
    const isCheckmate = new Chess(entry.fenAfter).isCheckmate()
    const fields = moveEvaluationFields(entry.engine, entry.playedEngine, entry.uci, { isCheckmate })
    const isBookMove = bookPathActive && !isCheckmate && openingBook.hasPosition(entry.fenAfter)
    if (!isBookMove) bookPathActive = false
    const base = classifyAnalysisEntries([{ ...entry, ...fields, ply: index + 1, playedMove: entry.san, isBookMove: false }])[0]
    classifiedEntries.push(classifyMissedOpportunity({ ...base, isBookMove }, classifiedEntries.at(-1)))
  }
  const rows = fixture.annotations.map(annotation => {
    const entry = cache.entries[annotation.ply - 1]
    if (!entry || entry.san !== annotation.san) throw new Error(`Cache/annotazione discordanti: ply ${annotation.ply}`)
    const classified = classifiedEntries[annotation.ply - 1]
    const actual = labels[classified.classification]
    const reasons = []
    expectedCounts[annotation.category]++
    if (annotation.category === 'Libro') reasons.push('book')
    if (annotation.category === 'Forzata') reasons.push('forced')
    if (unsupported.includes(annotation.category)) reasons.push('unsupported')
    if (suspectLabels.some(item => item.game === fixture.id && item.ply === annotation.ply)) reasons.push('suspect')
    if (classified.dropPct == null) reasons.push('missing')
    for (const reason of reasons) exclusions[reason]++
    if (!reasons.length) {
      included++
      if (scale.includes(annotation.category)) ordinalIncluded++
      if (actual === annotation.category) exact++
      if (scale.includes(actual) && Math.abs(scale.indexOf(actual) - scale.indexOf(annotation.category)) <= 1) withinOne++
      matrix[annotation.category] ??= {}
      matrix[annotation.category][actual] = (matrix[annotation.category][actual] ?? 0) + 1
    }
    return { ...classified, ply: annotation.ply, san: annotation.san, expected: annotation.category, actual, reasons }
  })
  return { id: fixture.id, label: fixture.label, engineVersion: cache.engineVersion, depth: cache.depth, multiPv: cache.multiPv, sanity: fixture.sanity === true, total: rows.length, included, ordinalIncluded, excluded: rows.length - included, exact, withinOne, exactPct: included ? 100 * exact / included : null, withinOnePct: ordinalIncluded ? 100 * withinOne / ordinalIncluded : null, expectedCounts, exclusions, matrix, rows }
}

export function renderReport(reports, pending = []) {
  const cell = value => value == null ? 'N/D' : String(value).replaceAll('|', '\\|').replaceAll('\n', ' ')
  const out = ['# Confronto QA', '', 'Classificazione per calo di probabilità (punti percentuali). Soglie iniziali non tarate sulle fixture: ' + JSON.stringify(ENGINE_CONFIG.classification) + '. Le esclusioni possono sovrapporsi. Modello approssimato: sigmoid(cp/400), senza taglio dei centipawn. Matto vincente: 100%; perdente: 0%.', '']
  const main = reports.filter(report => !report.sanity)
  out.push('Mossa giocata valutata dalla stessa ricerca MultiPV quando presente a pari profondità; altrimenti analisi indipendente della posizione successiva. Una mossa diversa dalla PV principale riceve al massimo Ottima, salvo matto dato. Senza identità UCI/PV si conserva il criterio precedente.', '')
  out.push('Mossa mancata inclusa nel confronto esatto, senza posizione nella scala ordinale. Entro una classe usa soltanto le categorie comuni attese. Regola locale provvisoria: ' + JSON.stringify(ENGINE_CONFIG.missedOpportunity) + '; errore avversario adiacente, nuova occasione confermata e PV alternativa legale.', '')
  if (main.length) {
    const summary = summarizeReports(main)
    out.push('## Totale del gruppo (sanity esclusa)', '', `Ply: ${summary.total}; inclusi: ${summary.included}; esclusi: ${summary.total - summary.included}.`, `Corrispondenza esatta: ${cell(summary.exactPct)}%; entro una classe: ${cell(summary.withinOnePct)}%.`, '', '| Categoria attesa | Totale | Inclusi | Esatti |', '|---|---|---|---|')
    for (const [label, counts] of Object.entries(summary.categories)) out.push(`| ${label} | ${counts.total} | ${counts.included} | ${counts.exact} |`)
    const commonExact = scale.reduce((count, label) => count + summary.categories[label].exact, 0)
    out.push('', `Categorie comuni: ${commonExact}/${summary.ordinalIncluded} esatte (${cell(summary.ordinalIncluded ? 100 * commonExact / summary.ordinalIncluded : null)}%); entro una classe: ${summary.withinOne}/${summary.ordinalIncluded}.`)
    out.push('')
  }
  for (const report of reports) {
    const sources = report.rows.reduce((counts, row) => {
      counts[row.evaluationSource] = (counts[row.evaluationSource] ?? 0) + 1
      return counts
    }, {})
    out.push(`Motore: ${cell(report.engineVersion)}; depth ${cell(report.depth)}; MultiPV ${cell(report.multiPv)}.`, '')
    out.push('Fonti delle valutazioni: ' + JSON.stringify(sources), '')
    const missedRows = report.rows.filter(row => row.expected === 'Mossa mancata' || row.actual === 'Mossa mancata')
    if (missedRows.length) {
      out.push('Confronto Mossa mancata:', '', '| ply | SAN | Attesa | Ottenuta | Verifica | Variante |', '|---|---|---|---|---|---|')
      for (const row of missedRows) out.push('| ' + [row.ply, row.san, row.expected, row.actual, row.missedOpportunityReason, formatMissedOpportunity(row.missedOpportunity)].map(cell).join(' | ') + ' |')
      out.push('')
    }
    const mateRows = report.rows.filter(row => row.mateComparison)
    if (mateRows.length) {
      out.push('Confronto distanza matto (dalla posizione prima della mossa; non modifica le categorie):', '', '| ply | SAN | Osservazione |', '|---|---|---|')
      for (const row of mateRows) out.push(`| ${row.ply} | ${cell(row.san)} | ${cell(formatMateComparison(row.mateComparison))} |`)
      out.push('')
    }
    out.push(`## ${cell(report.id)}: ${cell(report.label)}${report.sanity ? ' (sanity, separata dalla taratura)' : ''}`, '', `Ply: ${report.total}; inclusi: ${report.included}; esclusi unici: ${report.excluded}.`, `Corrispondenza esatta: ${cell(report.exactPct)}%; entro una classe: ${cell(report.withinOnePct)}%.`, '', 'Conteggi attesi:', ...Object.entries(report.expectedCounts).map(([key, count]) => `- ${key}: ${count}`), '', 'Esclusioni: ' + JSON.stringify(report.exclusions), '', '| ply | SAN | Attesa | Ottenuta | dropPct | deltaCp | bestEval | bestMate | playedEval | playedMate | Esclusioni |', '|---|---|---|---|---|---|---|---|---|---|---|')
    for (const row of report.rows) out.push('| ' + [row.ply, row.san, row.expected, row.actual, row.dropPct, row.evalDelta, row.bestEval, row.bestMate, row.playedEval, row.playedMate, row.reasons.join(', ')].map(cell).join(' | ') + ' |')
    out.push('', 'Matrice di confusione (attesa × ottenuta):', '', '| Attesa | ' + Object.values(labels).join(' | ') + ' |', '|---|' + Object.values(labels).map(() => '---|').join(''))
    for (const [expected, counts] of Object.entries(report.matrix)) out.push('| ' + expected + ' | ' + Object.values(labels).map(label => counts[label] ?? 0).join(' | ') + ' |')
    out.push('')
  }
  if (pending.length) out.push('## Dati mancanti', '', ...pending.map(item => `- ${cell(item)}`), '')
  return out.join('\n')
}

export function summarizeReports(reports) {
  const selected = reports.filter(report => !report.sanity)
  const categories = Object.fromEntries(referenceLabels.map(label => [label, { total: 0, included: 0, exact: 0 }]))
  let total = 0, included = 0, exact = 0, withinOne = 0, ordinalIncluded = 0
  for (const report of selected) {
    total += report.total; included += report.included; exact += report.exact; withinOne += report.withinOne
    ordinalIncluded += report.ordinalIncluded ?? report.included
    for (const row of report.rows) {
      const counts = categories[row.expected]
      counts.total++
      if (!row.reasons.length) { counts.included++; if (row.actual === row.expected) counts.exact++ }
    }
  }
  return { total, included, ordinalIncluded, exact, withinOne, exactPct: included ? 100 * exact / included : null, withinOnePct: ordinalIncluded ? 100 * withinOne / ordinalIncluded : null, categories }
}
