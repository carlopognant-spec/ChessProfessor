// Offline reporting only: this script never constructs an engine or issues go.
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { reclassifyReviewedMoves } from '../src/lib/reviewMoves.js'
import { buildRefinementPlan, selectRefinementView } from '../src/lib/analysisRefinement.js'

const area = 'agent-output/node-budget-public-v1'
const data = JSON.parse(await readFile(`${area}/results.json`, 'utf8'))
const manifest = JSON.parse(await readFile(`${area}/manifest.json`, 'utf8'))
const timings = JSON.parse(await readFile(`${area}/timings.json`, 'utf8'))
const sha = b => createHash('sha256').update(b).digest('hex')
for (const s of manifest.sources) if (sha(await readFile(s.path)) !== s.sha256) throw Error(`Source changed: ${s.path}`)
if (data.searches !== manifest.searches || data.actualNodes > manifest.actualNodeCap
  || timings.length !== manifest.searches || timings.reduce((s, t) => s + t.actualNodes, 0) !== data.actualNodes) throw Error('Telemetry mismatch')
const rawEngines = new Map()
for (const [i, t] of timings.entries()) {
  const packet = JSON.parse(await readFile(`${area}/${t.file}`, 'utf8')), task = manifest.schedule[i]
  if (packet.fen !== task.fen || packet.nodes !== task.nodes || packet.actualNodes !== t.actualNodes) throw Error('Raw schedule mismatch')
  const snapshots = createMultiPvEvidence(Math.min(5, new Chess(packet.fen).moves().length)), latest = new Map()
  let actualNodes = 0, bestmove
  for (const raw of packet.rawLines) {
    snapshots.accept(raw)
    actualNodes = Math.max(actualNodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
    const score = raw.match(/\bscore (cp|mate) (-?\d+)/)
    if (raw.startsWith('info ') && score && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
      const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
      latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
        evalCp: score[1] === 'cp' ? Number(score[2]) : null, mate: score[1] === 'mate' ? Number(score[2]) : null,
        pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
    }
    if (raw.startsWith('bestmove ')) bestmove = raw.split(/\s+/)[1]
  }
  const lines = [...latest.values()].sort((a, b) => a.multipv - b.multipv), specialLines = snapshots.finish(bestmove)
  if (actualNodes !== packet.actualNodes || actualNodes > packet.nodes + 5000 || bestmove !== packet.bestmove
    || JSON.stringify(lines) !== JSON.stringify(packet.engine.lines)
    || JSON.stringify(specialLines) !== JSON.stringify(packet.engine.specialLines)) throw Error('Raw replay mismatch')
  rawEngines.set(`${packet.nodes}:${packet.fen}`, packet.engine)
}
const labels = { book: 'Libro', forced: 'Forzata', best: 'Migliore', excellent: 'Ottima', good: 'Buona',
  inaccuracy: 'Imprecisione', mistake: 'Errore', blunder: 'Errore grave', great: 'Grande', brilliant: 'Geniale',
  missed: 'Mossa mancata', unclassified: 'Non valutabile' }
const seconds = ms => (ms / 1000).toFixed(2)
const globalRows = data.games.flatMap(g => g.rows)
const fens = [...new Set(data.games.flatMap(g => [g.initialEntries[0].fenBefore, ...g.initialEntries.map(e => e.fenAfter)]))]
const cost = (positions, nodes) => timings.filter(t => t.nodes === nodes && positions.has(fens[t.position])).reduce((s, t) => s + t.elapsedMs, 0)
const categories = Object.entries(labels).map(([key, label]) => ({ key, label,
  initial: globalRows.filter(r => r.initial === key).length, full: globalRows.filter(r => r.full === key).length,
  selective: globalRows.filter(r => r.selective === key).length,
  left: globalRows.filter(r => r.initial === key && r.full !== key).length,
  entered: globalRows.filter(r => r.initial !== key && r.full === key).length }))
const transition = new Map()
for (const r of globalRows.filter(r => r.initial !== r.full)) {
  const key = `${labels[r.initial]} → ${labels[r.full]}`; transition.set(key, (transition.get(key) ?? 0) + 1)
}
const games = []
for (const g of data.games) {
  for (const [name, entries] of [['initial', g.initialEntries], ['full', g.fullEntries]]) {
    for (const e of entries) for (const stored of [e.engine, e.playedEngine]) {
      const raw = rawEngines.get(`${stored.analysisMetadata.budget.value}:${stored.fen}`)
      if (!stored.terminal && JSON.stringify(raw) !== JSON.stringify(stored)) throw Error('Archived engine differs from raw')
    }
    const recomputed = reclassifyReviewedMoves(entries)
    if (recomputed.some((e, i) => e.classification !== g.rows[i][name])) throw Error(`Replay mismatch: ${g.game}/${name}`)
  }
  const replay = selectRefinementView(g.selectiveCanonical, true)
  for (const [i, entry] of g.selectiveCanonical.entries()) {
    const { refinement, ...baseline } = entry
    if (JSON.stringify(baseline) !== JSON.stringify(g.initialEntries[i])) throw Error('Selective overwrote baseline')
    for (const stored of [refinement?.engine, refinement?.playedEngine].filter(Boolean)) {
      const raw = rawEngines.get(`1000000:${stored.fen}`)
      if (!stored.terminal && JSON.stringify({ ...raw, actualNodes: 0 }) !== JSON.stringify(stored)) throw Error('Selective differs from captured raw')
    }
  }
  if (replay.some((e, i) => e.classification !== g.rows[i].selective)
    || JSON.stringify(buildRefinementPlan(g.initialEntries)) !== JSON.stringify(g.plan)) throw Error('Selective mismatch')
  const positions = new Set([g.initialEntries[0].fenBefore, ...g.initialEntries.map(e => e.fenAfter)])
  const initialMs = cost(positions, 200000), fullMs = cost(positions, 1000000), selectiveExtraMs = cost(new Set(g.plan.positions), 1000000)
  games.push({ game: g.game, ...g.summary, initialMs, fullMs, fullRatio: fullMs / initialMs,
    selectedMoves: g.plan.selectedPlies.length, candidates: g.plan.candidateCount, selectedPositions: g.plan.positions.length,
    selectiveExtraMs, initialPlusSelectiveMs: initialMs + selectiveExtraMs,
    changes: g.rows.filter(r => r.initial !== r.full || r.initial !== r.selective) })
}
const total200 = data.timingSummary.find(t => t.nodes === 200000).wallMs.total
const total1m = data.timingSummary.find(t => t.nodes === 1000000).wallMs.total
const report = ['# Aumento dei nodi: due partite pubbliche', '',
  'Fonte: [PGN Mentor, Mondiale 2024](https://www.pgnmentor.com/events/WorldChamp2024.pgn).',
  'Prime due partite del file, selezione fissata prima delle ricerche. Nessuna etichetta indipendente disponibile.', '',
  `130 semimosse; ${manifest.positions} FEN distinte; ${data.searches} ricerche senza ripetizioni.`,
  `Nodi effettivi: ${data.actualNodes.toLocaleString('it-IT')}; limite: ${manifest.actualNodeCap.toLocaleString('it-IT')}.`,
  `Verificati ${data.frozenInputsVerified} input congelati. Codice applicativo, soglie e budget iniziale invariati.`, '',
  '## Tempo misurato', '',
  `PC: ${manifest.timingEnvironment.cpu}; ${manifest.timingEnvironment.platform}/${manifest.timingEnvironment.arch}; ${manifest.timingEnvironment.node}.`,
  'Stockfish 19 large-single WASM, un thread, Hash 16 MB, MultiPV 5, hash pulita per ricerca.',
  'Esecuzione tramite Node, non browser: tempi di ricerca e trasporto, caricamento iniziale separato.',
  'Nessuna misura di telefono, batteria, RAM, fluidità UI o tempo completo di apertura/import.', '',
  '| Budget | Totale richieste (s) | Mediana per FEN (s) | P90 per FEN (s) | Totale tempo UCI (s) |',
  '|---|---:|---:|---:|---:|',
  ...data.timingSummary.map(t => `| ${t.nodes.toLocaleString('it-IT')} | ${seconds(t.wallMs.total)} | ${seconds(t.wallMs.median)} | ${seconds(t.wallMs.p90)} | ${seconds(t.uciMs.total)} |`), '',
  `Rapporto dei tempi totali: ${(total1m / total200).toFixed(2)}×. Mediana dei rapporti accoppiati: ${data.pairedRatio.median.toFixed(2)}×.`,
  `Avvio del motore separato: ${seconds(data.startupMs)} secondi. Una sola esecuzione, ordine dei budget alternato; nessun intervallo di confidenza.`, '',
  '## Cambiamenti del motore e copertura selettiva', '',
  '| Partita | Mosse | Categorie cambiate a 1M | Prima scelta cambiata | Cambi completi intercettati dal lotto selettivo |',
  '|---|---:|---:|---:|---:|',
  ...games.map(g => `| ${g.game} | ${data.games.find(x => x.game === g.game).plies} | ${g.labelChanges} | ${g.bestMoveChanges} | ${g.fullChangesMatchedBySelective}/${g.labelChanges} |`), '',
  'Il confronto selettivo riguarda un solo lotto, massimo 12 mosse: non equivale a premere più volte il comando.',
  'La versione completa a 1M non è un riferimento di correttezza; la copertura misura concordanza, non precisione.', '',
  '| Categoria | Iniziale | Completa 1M | Selettiva | Uscite dalla categoria a 1M | Ingressi a 1M |',
  '|---|---:|---:|---:|---:|---:|',
  ...categories.map(c => `| ${c.label} | ${c.initial} | ${c.full} | ${c.selective} | ${c.left} | ${c.entered} |`), '',
  '## Transizioni', '', ...[...transition].map(([name, n]) => `- ${name}: ${n}`), '',
  ...games.flatMap(g => ['## ' + g.game, '',
    `Dubbie iniziali: ${g.candidates}; selezionate: ${g.selectedMoves}; FEN del lotto: ${g.selectedPositions}.`,
    `Costo delle FEN della partita: iniziale ${seconds(g.initialMs)} s; completa 1M ${seconds(g.fullMs)} s.`,
    `Costo aggiuntivo del lotto stimato sommando le ricerche già misurate: ${seconds(g.selectiveExtraMs)} s; iniziale più lotto ${seconds(g.initialPlusSelectiveMs)} s.`,
    'Questa somma non è una nuova misura end-to-end dell’app. Le FEN condivise compaiono nei costi individuali di entrambe le partite, ma una volta sola nei totali globali.', '',
    '| Ply | Mossa | 200k | Completa 1M | Lotto selettivo | Selezionata | Perdita 200k → 1M |',
    '|---|---|---|---|---|---|---|',
    ...g.changes.map(r => `| ${r.ply} | ${r.san} | ${labels[r.initial]} | ${labels[r.full]} | ${labels[r.selective]} | ${r.selected} | ${r.initialDrop?.toFixed(3) ?? 'N/D'} → ${r.fullDrop?.toFixed(3) ?? 'N/D'} |`), '']),
  '## Limiti e decisione', '',
  'Due partite di grandi maestri non rappresentano le partite amatoriali. Cambiamento non significa miglioramento: mancano etichette esterne.',
  'Nessuna nuova precisione generale, nessuna correzione/regressione dimostrata rispetto a Chess.com. Il risultato storico 329/592 resta distinto.',
  'Conservare il profilo rapido e l’approfondimento facoltativo. Il costo e i cambiamenti misurati non giustificano da soli un aumento globale.',
  'Per decidere servono riferimenti indipendenti su partite nuove e una misura nel browser sui dispositivi di destinazione.', '',
  'Verifica offline: classificazioni ricostruite da tutti i raw conservati, piano selettivo e telemetria riconciliati. Nessuna ricerca aggiuntiva.', '']
await writeFile(`${area}/report.md`, report.join('\n'), { flag: 'wx' })
await writeFile(`${area}/offline-check.json`, JSON.stringify({ newSearches: 0, sourcesVerified: manifest.sources.length,
  frozenInputsVerified: data.frozenInputsVerified, replayedPlies: globalRows.length,
  classificationReference: null, categories, transitions: Object.fromEntries(transition), games }, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ categories, transitions: Object.fromEntries(transition), games }, null, 2))
