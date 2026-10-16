export const LABELS = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const specials = new Set(['Grande', 'Geniale'])
export const rowKey = r => `${r.cohort}:${r.game}:${r.ply}`

export function compareReviewRows(baseline, actual) {
  const prior = new Map(baseline.map(r => [rowKey(r), r]))
  if (prior.size !== baseline.length || actual.length !== baseline.length) throw new Error('Copertura o chiavi duplicate nella baseline')
  const seen = new Set(), changes = [], numericChanges = []
  for (const r of actual) {
    const key = rowKey(r), b = prior.get(key)
    if (!b || seen.has(key) || b.expected !== r.expected) throw new Error(`Riferimento o chiave non coerente: ${key}`)
    seen.add(key)
    if (r.numericUnchanged === false) numericChanges.push(key)
    if (b.actual !== r.actual) changes.push({ ...r, before: b.actual })
  }
  const strongest = actual.filter(r => r.cohort !== 'initial')
  const regressions = changes.filter(r => r.before === r.expected && r.actual !== r.expected)
  const improvements = changes.filter(r => r.before !== r.expected && r.actual === r.expected)
  const falsePositives = actual.filter(r => specials.has(r.actual) && r.actual !== r.expected)
  const unresolved = strongest.filter(r => specials.has(r.expected) && r.actual !== r.expected)
  return {
    passed: !regressions.length && !falsePositives.length && !numericChanges.length,
    observations: actual.length, uniqueMoves: strongest.length,
    specials: [...specials].map(category => ({ category, expected: strongest.filter(r => r.expected === category).length, correct: strongest.filter(r => r.actual === category && r.expected === category).length, false: falsePositives.filter(r => r.cohort !== 'initial' && r.actual === category).length })),
    improvements, regressions, otherChanges: changes.filter(r => !improvements.includes(r) && !regressions.includes(r)),
    falsePositives, numericChanges, unresolved,
  }
}

export function renderReviewReport(report) {
  const r = report.result
  const move = x => `- ${x.game}, ply ${x.ply}, ${x.san}: ${x.before ?? x.actual} → ${x.actual}; attesa ${x.expected}`
  return `# Revisione automatica delle classificazioni\n\nEsito: ${r.passed ? 'nessuna regressione rilevata' : 'DA RIVEDERE'}.\n` +
    `Campione di sviluppo: ${r.uniqueMoves} mosse distinte, ${r.observations} osservazioni; nessuna validazione indipendente.\n` +
    `Modalità: ricalcolo su prove salvate, non verifica del flusso browser o di nuove ricerche. Nuove ricerche motore: 0.\n\n` +
    r.specials.map(s => `- ${s.category}: ${s.correct}/${s.expected}; falsi positivi: ${s.false}`).join('\n') +
    `\n\nMiglioramenti: ${r.improvements.length}. Regressioni: ${r.regressions.length}. Cambiamenti numerici: ${r.numericChanges.length}.\n\n` +
    `## Cambiamenti\n\n${[...r.improvements, ...r.regressions, ...r.otherChanges].map(move).join('\n') || 'Nessuno.'}\n\n` +
    `## Casi speciali ancora aperti\n\n${r.unresolved.map(move).join('\n') || 'Nessuno nel campione.'}\n\n` +
    `## Provenienza da verificare\n\nLe Grandi storiche 14...c6, 28...axb4 e 38...Ne4 conservano le etichette attese; l'utente non ricorda la fonte. Le due Geniali storiche sono confermate come Game Review Chess.com.\n`
}
