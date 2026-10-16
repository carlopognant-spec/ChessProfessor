// Read-only diagnosis of the completed measurement; no engine and no rule changes.
import { readFile, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { validSacrificeSearch } from '../src/lib/sacrificeSearches.js'

const area = 'agent-output/new-refinement-measurement-v1'
const sources = new Map()
const sha = b => createHash('sha256').update(b).digest('hex')
async function input(path) { const b = await readFile(path); sources.set(path, sha(b)); return JSON.parse(b) }
const results = await input(`${area}/results.json`)
assert.equal(results.complete, true)
const labels = { best: 'Migliore', excellent: 'Ottima', good: 'Buona', inaccuracy: 'Imprecisione',
  mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale', missed: 'Mossa mancata', book: 'Libro', forced: 'Forzata' }
const records = [], confirmationChoices = []
for (const game of results.perGame) {
  const baseline = await input(`agent-output/new-references-200k-v1/game-${game.id}.json`)
  const measured = game.rounds ? await input(`${area}/game-${game.id}-round-${game.rounds}.json`) : { view: baseline.entries }
  for (const e of measured.view) for (const proof of e.refinement?.sacrifices ?? []) {
    if (!proof.confirmation) continue
    const available = measured.view.flatMap(row => [row.engine, row.playedEngine])
      .filter(engine => engine?.analysisMetadata?.budget?.value === 1000000 && validSacrificeSearch(engine, proof.acceptedFen))[0]
    if (!available || proof.confirmation.analysisMetadata.budget.value >= available.analysisMetadata.budget.value) continue
    const created = results.jobs.find(job => job.game === game.id && job.plan.sacrifices.some(t => t.ply === e.ply && t.captureUci === proof.captureUci))
    confirmationChoices.push({ game: game.id, ply: e.ply, san: e.playedMove, captureUci: proof.captureUci,
      acceptedFen: proof.acceptedFen, storedNodes: proof.confirmation.analysisMetadata.budget.value,
      storedDepth: proof.confirmation.depth, availableNodes: available.analysisMetadata.budget.value,
      availableDepth: available.depth, availableWithinSameRequest: created?.plan.positions.includes(proof.acceptedFen) ?? false })
  }
  for (const [i, initial] of baseline.entries.entries()) {
    const final = measured.view[i], row = results.rows.find(r => r.game === game.id && r.ply === initial.ply)
    const beforeDepth = initial.evaluationEvidence?.rootDepth ?? null, afterDepth = final.evaluationEvidence?.rootDepth ?? null
    const latestDepth = final.engine?.lines?.find(l => l.multipv === 1)?.depth ?? null
    const rootNodes = final.engine?.analysisMetadata?.budget?.value, childNodes = final.playedEngine?.analysisMetadata?.budget?.value
    const baselineCorrect = row.initial === row.expected, finalCorrect = row.final === row.expected
    records.push({ ...row, initialStatus: initial.evaluationEvidence?.status, finalStatus: final.evaluationEvidence?.status,
      initialRootDepth: beforeDepth, finalRootDepth: afterDepth, finalLatestDepth: latestDepth,
      shallowerComparison: beforeDepth != null && afterDepth != null && afterDepth < beforeDepth,
      snapshotBehindLatest: final.evaluationEvidence?.snapshotUsed === true && afterDepth != null && latestDepth != null && afterDepth < latestDepth,
      coherentToIndependent: initial.evaluationEvidence?.status === 'coherent' && ['independent', 'conflicting'].includes(final.evaluationEvidence?.status),
      mixedBudgets: rootNodes !== childNodes, rootNodes, childNodes,
      zeroLossAlternative: final.dropPct === 0 && final.isEngineBest === false,
      corrected: !baselineCorrect && finalCorrect, regressed: baselineCorrect && !finalCorrect,
      baseCategory: labels[final.baseClassification] ?? final.baseClassification,
      greatReason: final.specialAssessment?.grande?.reason,
      greatFalsePositive: row.final === 'Grande' && row.expected !== 'Grande',
      greatFalseNegative: row.final !== 'Grande' && row.expected === 'Grande' })
  }
}
const effects = records.filter(r => r.examined)
function group(name, predicate) {
  const rows = effects.filter(predicate)
  return { name, rows: rows.length, corrected: rows.filter(r => r.corrected).length,
    regressed: rows.filter(r => r.regressed).length, finalCorrect: rows.filter(r => r.final === r.expected).length }
}
const groups = [group('tutte le mosse toccate', () => true), group('confronto a profondità minore dell’iniziale', r => r.shallowerComparison),
  group('snapshot precedente all’ultima profondità', r => r.snapshotBehindLatest),
  group('da confronto coerente ad analisi separate', r => r.coherentToIndependent),
  group('budget diversi prima e dopo', r => r.mixedBudgets), group('due budget da 1M', r => r.rootNodes === 1000000 && r.childNodes === 1000000),
  group('alternativa con perdita zero', r => r.zeroLossAlternative)]
const greatReasons = [...new Set(records.filter(r => r.final === 'Grande').map(r => r.greatReason))]
  .map(reason => ({ reason, predicted: records.filter(r => r.final === 'Grande' && r.greatReason === reason).length,
    correct: records.filter(r => r.final === 'Grande' && r.expected === 'Grande' && r.greatReason === reason).length,
    falsePositives: records.filter(r => r.greatFalsePositive && r.greatReason === reason).length }))
const ordinary = ['Migliore', 'Ottima', 'Buona', 'Imprecisione', 'Errore', 'Errore grave']
const ordinaryRows = records.filter(r => ordinary.includes(r.expected))
const ordinarySummary = ['initial', 'first', 'final'].map(stage => ({ stage, total: ordinaryRows.length,
  exact: ordinaryRows.filter(r => r[stage] === r.expected).length,
  withinOne: ordinaryRows.filter(r => ordinary.includes(r[stage]) && Math.abs(ordinary.indexOf(r[stage]) - ordinary.indexOf(r.expected)) <= 1).length }))
for (const [path, expected] of sources) assert.equal(sha(await readFile(path)), expected, path)
const report = ['# Diagnosi delle discrepanze dopo l’approfondimento', '',
  'Osservazioni sul campione già studiato: descrivono i cambi, senza dimostrare da sole la loro causa.', '',
  '| Gruppo di mosse toccate | Mosse | Correzioni | Regressioni | Etichette finali coincidenti |', '|---|---:|---:|---:|---:|',
  ...groups.map(g => `| ${g.name} | ${g.rows} | ${g.corrected} | ${g.regressed} | ${g.finalCorrect} |`), '',
  'I gruppi si sovrappongono. Una ricerca con più nodi può usare per il confronto uno snapshot precedente: il collector conserva quello coerente col bestmove finale.',
  'Snapshot precedente non significa necessariamente errato. La qualità del confronto va verificata separatamente dal budget.', '',
  '## Riuso delle conferme del sacrificio', '',
  '| Partita | Mossa | Conferma conservata | Conferma disponibile | Disponibile nella stessa richiesta |', '|---|---|---|---|---|',
  ...confirmationChoices.map(r => `| ${r.game} | ${r.san} (${r.captureUci}) | ${r.storedNodes} nodi, depth ${r.storedDepth} | ${r.availableNodes} nodi, depth ${r.availableDepth} | ${r.availableWithinSameRequest ? 'sì' : 'non dimostrato'} |`), '',
  'Il ciclo di riuso può sovrascrivere una ricerca approfondita già disponibile con quella iniziale. Questa osservazione riguarda la scelta della prova, non dimostra da sola una classificazione errata.', '',
  '## Categorie ordinarie', '', '| Passaggio | Esatte | Entro una categoria | Totale |', '|---|---:|---:|---:|',
  ...ordinarySummary.map(g => `| ${g.stage} | ${g.exact} | ${g.withinOne} | ${g.total} |`), '',
  '## Grande: famiglie del rilevatore', '', '| Motivo | Assegnate | Coincidenti | Assegnazioni in eccesso |', '|---|---:|---:|---:|',
  ...greatReasons.map(g => `| ${g.reason} | ${g.predicted} | ${g.correct} | ${g.falsePositives} |`), '',
  '## Regressioni da controllare', '', '| Partita | Posizione prima della mossa | Confermata | Iniziale → approfondita | Profondità confronto | Tipo confronto |',
  '|---|---|---|---|---|---|', ...records.filter(r => r.regressed).map(r =>
    `| ${r.game} | [${r.move} ${r.san}](${r.analysisLink}) | ${r.expected} | ${r.initial} → ${r.final} | ${r.initialRootDepth} → ${r.finalRootDepth} | ${r.finalStatus} |`), '',
  '## Grande assegnate in eccesso', '', '| Partita | Posizione prima della mossa | Confermata | Motivo | Toccata dall’approfondimento |', '|---|---|---|---|---|',
  ...records.filter(r => r.greatFalsePositive).map(r => `| ${r.game} | [${r.move} ${r.san}](${r.analysisLink}) | ${r.expected} | ${r.greatReason} | ${r.examined ? 'sì' : 'no'} |`), '',
  'FEN prima/dopo e prove complete in diagnostics.json. Nessuna soglia, regola o etichetta di riferimento modificata.', '']
await writeFile(`${area}/diagnostics.json`, JSON.stringify({ newSearches: 0, groups, greatReasons, ordinarySummary, confirmationChoices,
  records, sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
await writeFile(`${area}/diagnosis.md`, report.join('\n'), { flag: 'wx' })
console.log(JSON.stringify({ groups, greatReasons, ordinarySummary, confirmationChoices }, null, 2))
