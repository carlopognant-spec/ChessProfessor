import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'
import { NativeEngine } from './qa/native-engine.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { analyzeGame } from '../src/lib/gameAnalysis.js'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { SPECIAL_POLICY } from '../src/lib/specialClassification.js'

const root = new URL('../', import.meta.url)
const area = new URL('agent-output/external-specials-v1/', root)
const sha = data => createHash('sha256').update(data).digest('hex')
const read = async path => JSON.parse(await readFile(new URL(path, root)))
const save = (directory, name, value) => writeFile(new URL(name, directory), JSON.stringify(value, null, 2) + '\n', { flag: 'wx' })
const api = 'https://api.chess.com/pub/player/yosoyfood/games/2022/08'
const article = 'https://adventuresofachessnoob.com/2022/08/22/brilliant-vienna-gambit-my-subscriber-goes-super-saiyan/'
const gameUrl = 'https://www.chess.com/game/live/53976549565'
if (process.argv[2] === '--prepare') {
  await mkdir(area, { recursive: true })
  const response = await fetch(api, { headers: { 'User-Agent': 'ChessProfessor public game research' } })
  if (!response.ok) throw Error(`Public API HTTP ${response.status}`)
  const data = await response.json(), source = data.games.find(g => g.url === gameUrl)
  if (!source) throw Error('Selected public game unavailable')
  const game = new Chess(); game.loadPgn(source.pgn)
  const moves = game.history()
  if (moves.length !== 25) throw Error('Unexpected public game length')
  const annotations = [
    { ply: 15, san: 'Bxf4', category: 'brilliant' },
    { ply: 17, san: 'Bxf7+', category: 'brilliant' },
    { ply: 19, san: 'Qxf3', category: 'great' },
    { ply: 21, san: 'Qh5+', category: 'great' },
  ]
  for (const a of annotations) if (moves[a.ply - 1] !== a.san) throw Error('Annotation / PGN mismatch')
  const fixture = { id: 'external-vienna-53976549565', gameUrl, article, api,
    annotationProvenance: 'author-reported Chess.com Game Review, August 2022; not fresh platform labels',
    partialAnnotations: true, selection: 'public positive examples; not random or representative',
    pgn: source.pgn, ratings: { white: source.white.rating, black: source.black.rating }, moves, annotations }
  await save(area, 'fixture.json', fixture)
  const fixtureHash = sha(await readFile(new URL('fixture.json', area)))
  const replay = new Chess(), schedule = []
  for (const [i, san] of moves.entries()) {
    schedule.push({ index: schedule.length, ply: i + 1, phase: 'before', fen: replay.fen(), multiPv: 5, budgetNodes: 200000 })
    replay.move(san)
    schedule.push({ index: schedule.length, ply: i + 1, phase: 'after', fen: replay.fen(), multiPv: 1, budgetNodes: 200000 })
  }
  await save(area, 'manifest.json', { createdAt: new Date().toISOString(), fixtureHash,
    policy: SPECIAL_POLICY.version, independentOfTrainingGames: true, rulesFrozenBeforeCollection: true,
    configuration: { packageVersion: '19.0.0', build: 'large-single', threads: 1, hashMb: 16,
      hashPolicy: 'ucinewgame + Clear Hash before every search' },
    nominalNodes: 10000000, actualNodeCap: 10200000, reservePerSearch: 2000,
    additionalSearchesPermitted: false, schedule })
  console.log(JSON.stringify({ prepared: fileURLToPath(area), searches: schedule.length, nominalNodes: 10000000 }))
} else if (['--run', '--resume-transport-fix'].includes(process.argv[2])) {
  const resuming = process.argv[2] === '--resume-transport-fix'
  const fixture = await read('agent-output/external-specials-v1/fixture.json')
  const manifest = await read(resuming ? 'agent-output/external-specials-v1/transport-fix-manifest.json' : 'agent-output/external-specials-v1/manifest.json')
  if (sha(await readFile(new URL('fixture.json', area))) !== manifest.fixtureHash
    || manifest.policy !== SPECIAL_POLICY.version || manifest.schedule.length !== 50
    || manifest.nominalNodes !== 10000000 || manifest.actualNodeCap !== 10200000) throw Error('Manifest mismatch')
  const pkg = await read('node_modules/stockfish/package.json')
  if (pkg.version !== manifest.configuration.packageVersion) throw Error('Engine package mismatch')
  const currentAudit = await read('agent-output/special-classification-2026-10-09T12-14-50-139Z/results.json')
  const watched = [...currentAudit.sources,
    ...['scripts/external-specials-probe.js', 'agent-output/external-specials-v1/fixture.json',
      'agent-output/external-specials-v1/manifest.json', 'agent-output/external-specials-v1/protocol.md',
      'scripts/qa/native-engine.js', 'scripts/qa/wasm-engine.cjs', 'node_modules/stockfish/package.json']
      .map(path => ({ path }))]
  if (resuming) for (const path of ['agent-output/external-specials-v1/transport-fix-manifest.json',
    'agent-output/external-specials-v1/transport-fix-protocol.md']) watched.push({ path })
  for (const source of watched) {
    const actual = sha(await readFile(new URL(source.path, root)))
    if (source.sha256 && source.sha256 !== actual) throw Error(`Changed frozen policy/input: ${source.path}`)
    source.sha256 = actual
  }
  const book = createOpeningBook((await read('src/data/openingPositions.json')).positions)
  const directory = new URL(`agent-output/external-specials-probe-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
  await mkdir(directory)
  await save(directory, 'manifest.json', manifest)
  let engine, totalNodes = 0, failure = null
  const searches = []
  if (resuming) {
    const reused = await read(manifest.reuse.path)
    if (sha(await readFile(new URL(manifest.reuse.path, root))) !== manifest.reuse.sha256
      || reused.index !== 0 || reused.fen !== manifest.schedule[0].fen) throw Error('Invalid reused opening search')
    searches.push(reused); totalNodes = reused.actualNodes
    await save(directory, 'search-000.json', reused)
  }
  try {
    engine = new NativeEngine(process.execPath, 120000, [fileURLToPath(new URL('scripts/qa/wasm-engine.cjs', root)),
      fileURLToPath(new URL('node_modules/stockfish/bin/stockfish-19-single.js', root))])
    await engine.init()
    if (engine.version !== 'Stockfish 19 WASM') throw Error('Unexpected UCI engine identity')
    for (const task of manifest.schedule) {
      if (resuming && task.index === 0) continue
      if (totalNodes + task.budgetNodes + manifest.reservePerSearch > manifest.actualNodeCap) throw Error('Budget exhausted')
      const game = new Chess(task.fen), count = Math.min(task.multiPv, game.moves().length)
      if (!count) throw Error('Unexpected terminal search')
      await engine.request(['ucinewgame', 'setoption name Clear Hash', `setoption name MultiPV value ${task.multiPv}`, 'isready'],
        raw => raw === 'readyok' ? true : undefined)
      const rawLines = [], latest = new Map(), evidence = createMultiPvEvidence(count)
      let nodes = 0
      const bestmove = await engine.request([`position fen ${task.fen}`, `go nodes ${task.budgetNodes}`], raw => {
        rawLines.push(raw); evidence.accept(raw)
        nodes = Math.max(nodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
        const match = raw.match(/\bscore (cp|mate) (-?\d+)/)
        if (raw.startsWith('info ') && match && !/\b(?:upperbound|lowerbound)\b/.test(raw)) {
          const multipv = Number(raw.match(/\bmultipv (\d+)/)?.[1] ?? 1)
          latest.set(multipv, { multipv, depth: Number(raw.match(/\bdepth (\d+)/)?.[1] ?? 0),
            evalCp: match[1] === 'cp' ? Number(match[2]) : null, mate: match[1] === 'mate' ? Number(match[2]) : null,
            pv: raw.match(/\bpv (.+)/)?.[1].trim().split(/\s+/) ?? [], raw })
        }
        if (raw.startsWith('bestmove ')) return raw.split(' ')[1]
      })
      const lines = [...latest.values()].sort((a, b) => a.multipv - b.multipv)
      const specialLines = evidence.finish(bestmove)
      totalNodes += nodes
      const record = { ...task, engineVersion: engine.version, actualNodes: nodes, bestmove, rawLines,
        latestRootMatchesBestmove: lines[0]?.pv?.[0] === bestmove,
        engine: { evalCp: lines[0].evalCp, mate: lines[0].mate, lines, specialLines,
          analysisMetadata: { multiPv: task.multiPv, nodes: task.budgetNodes } } }
      await save(directory, `search-${String(task.index).padStart(3, '0')}.json`, record)
      searches.push(record)
      // Persist telemetry before validation, including unsuccessful searches.
      if (!nodes || !game.moves({ verbose: true }).some(m => `${m.from}${m.to}${m.promotion ?? ''}` === bestmove)
        || !lines.length) throw Error('Missing telemetry or illegal bestmove')
      for (const line of [...lines, ...specialLines]) {
        const legal = new Chess(task.fen)
        for (const uci of line.pv) legal.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
      }
      if (totalNodes > manifest.actualNodeCap) throw Error('Actual node cap exceeded')
      if (searches.length % 10 === 0) console.log(JSON.stringify({ completed: searches.length, planned: 50, totalNodes }))
    }
  } catch (error) { failure = error.stack } finally { engine?.close() }
  let entries = [], rows = []
  if (!failure) {
    let before = 0, after = 1
    entries = await analyzeGame({ moves: fixture.moves, openingBook: book,
      analyzePosition: async fen => {
        const search = searches[before]; before += 2
        if (search.fen !== fen) throw Error('Root FEN mismatch'); return search.engine
      },
      analyzePlayedPosition: async fen => {
        const search = searches[after]; after += 2
        if (search.fen !== fen) throw Error('Child FEN mismatch'); return search.engine
      } })
    rows = entries.map(e => ({ ply: e.ply, san: e.playedMove, classification: e.classification,
      baseClassification: e.baseClassification, assessment: e.specialAssessment,
      reference: fixture.annotations.find(a => a.ply === e.ply)?.category ?? null }))
  }
  for (const source of watched) if (sha(await readFile(new URL(source.path, root))) !== source.sha256) throw Error(`Input changed: ${source.path}`)
  const labelled = rows.filter(r => r.reference), matched = labelled.filter(r => r.reference === r.classification)
  const summary = { version: SPECIAL_POLICY.version, searches: searches.length, nominalNodes: manifest.nominalNodes,
    actualNodes: totalNodes, cap: manifest.actualNodeCap, capExceeded: totalNodes > manifest.actualNodeCap, failure,
    labelledMoves: labelled.length, matches: matched.length,
    unlabelledSpecials: rows.filter(r => !r.reference && ['great', 'brilliant', 'missed'].includes(r.classification)).length,
    falsePositivesMeasurable: false, sourceHashesUnchanged: true, appChanged: false,
    independentOfTrainingGames: true, representativeValidation: false, annotationProvenance: fixture.annotationProvenance }
  if (resuming) summary.transportRecovery = { previousAttempt: manifest.previousAttempt,
    reusedSearches: 1, newlyExecutedSearches: searches.length - 1,
    previousFailedSearchActualNodes: null, previousFailedSearchNominalNodes: 200000,
    cumulativeActualNodesAcrossAttemptsKnown: false,
    reason: 'align runner with app; latest unbounded PV1 may differ from bestmove; empty completed evidence stays insufficient' }
  await save(directory, 'results.json', { summary, rows, entries, sources: watched })
  await writeFile(new URL('report.md', directory), ['# Primo confronto esterno: Vienna Gambit', '',
    `Fonte delle etichette: [articolo dell’autore](${article}). Mosse verificate attraverso la [API pubblica](${api}).`, '',
    'Regole v5 fissate prima della raccolta; partita selezionata per quattro esempi positivi. Le etichette del 2022 sono riferite dall’autore: non rappresentano necessariamente il Game Review attuale. Rating 1028/1058; il classificatore locale non usa una calibrazione per rating.', '',
    ...Object.entries(summary).map(([key, value]) => `- ${key}: ${JSON.stringify(value)}`), '',
    '| Ply | Mossa | Riferimento | Risultato | Motivo Grande | Motivo Geniale |', '|---:|---|---|---|---|---|',
    ...labelled.map(r => `| ${r.ply} | ${r.san} | ${r.reference} | ${r.classification} | ${r.assessment.grande.reason} | ${r.assessment.brilliant.reason} |`), '',
    'Le mosse non annotate restano sconosciute, non negativi. Nessuna soglia aggiornata in base ai risultati; nessun fitting, nessuna integrazione nell’app e nessun riutilizzo come test indipendente dopo eventuali modifiche future.', '',
  ].join('\n'), { flag: 'wx' })
  console.log(JSON.stringify({ output: fileURLToPath(directory), summary }, null, 2))
  if (failure) process.exitCode = 1
} else throw Error('Use --prepare or --run; --prepare writes the manifest before any engine search')
