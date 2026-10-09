import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Chess } from 'chess.js'
import { createMultiPvEvidence } from '../src/lib/multiPvEvidence.js'
import { classifySpecialMove, reclassifySpecialMoves } from '../src/lib/specialClassification.js'

// Offline verification and diagnosis only: never starts an engine or edits input.
const root = new URL('../', import.meta.url)
const directory = new URL('agent-output/external-specials-probe-2026-10-09T14-03-37-245Z/', root)
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const read = async name => JSON.parse(await readFile(new URL(name, directory)))
const results = await read('results.json'), manifest = await read('manifest.json')
for (const source of results.sources) {
  if (sha(await readFile(new URL(source.path, root))) !== source.sha256) throw Error(`Changed source: ${source.path}`)
}
let actualNodes = 0, discordantRoots = 0
for (const task of manifest.schedule) {
  const search = await read(`search-${String(task.index).padStart(3, '0')}.json`)
  if (task.fen !== search.fen || task.phase !== search.phase || task.budgetNodes !== search.budgetNodes
    || search.multiPv !== task.multiPv) throw Error('Search / manifest mismatch')
  const count = Math.min(task.multiPv, new Chess(task.fen).moves().length)
  const evidence = createMultiPvEvidence(count)
  let nodes = 0
  for (const raw of search.rawLines) {
    evidence.accept(raw)
    nodes = Math.max(nodes, Number(raw.match(/\bnodes (\d+)/)?.[1] ?? 0))
  }
  const bestmove = search.rawLines.at(-1)?.match(/^bestmove ([a-h][1-8][a-h][1-8][qrbn]?)/)?.[1]
  if (bestmove !== search.bestmove || nodes !== search.actualNodes
    || JSON.stringify(evidence.finish(bestmove)) !== JSON.stringify(search.engine.specialLines)) throw Error('Raw UCI mismatch')
  for (const line of [...search.engine.lines, ...search.engine.specialLines]) {
    if (!search.rawLines.includes(line.raw)) throw Error('Score missing from raw UCI')
    const game = new Chess(task.fen)
    for (const uci of line.pv) game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] })
  }
  if (search.engine.lines[0].pv[0] !== bestmove) discordantRoots++
  actualNodes += nodes
}
if (actualNodes !== results.summary.actualNodes || actualNodes > manifest.actualNodeCap) throw Error('Telemetry mismatch')
const recomputed = reclassifySpecialMoves(results.entries)
if (recomputed.some((entry, i) => entry.classification !== results.entries[i].classification)) throw Error('Saved classifications do not reproduce')

const entry = results.entries[14], next = results.entries[15]
if (entry.fenAfter !== next.fenBefore || next.engine.specialLines.length !== 5
  || new Set(next.engine.specialLines.map(l => l.depth)).size !== 1) throw Error('Unusable acceptance source')
const acceptance = next.engine.specialLines.find(l => l.pv[0] === 'g4f3')
if (!acceptance) throw Error('Missing previously collected acceptance')
const game = new Chess(entry.fenAfter), san = []
for (const uci of acceptance.pv) san.push(game.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] }).san)
// A declared hypothetical evidence substitution, never a reported app prediction.
const secondary = classifySpecialMove({ ...entry, playedEngine: { ...entry.playedEngine,
  specialLines: next.engine.specialLines } }, results.entries[13], results.entries[12])
const diagnosis = { offlineOnly: true, newSearches: 0, verifiedSearches: 50, verifiedActualNodes: actualNodes,
  cumulativeNodesAcrossAttemptsKnown: false, discordantLatestRoots: discordantRoots,
  allSavedClassificationsReproduced: true, hashesUnchanged: true,
  sameFenEvidence: { san: entry.playedMove, originalClassification: entry.classification,
    originalReason: entry.specialAssessment.brilliant.reason, acceptanceSource: 'next-move-completed-root-snapshot',
    fen: entry.fenAfter, depth: acceptance.depth, evalCpOpponent: acceptance.evalCp,
    mateOpponent: acceptance.mate, pv: san,
    hypotheticalClassification: secondary.classification,
    hypotheticalReason: secondary.specialAssessment.brilliant.reason,
    categoryChanged: secondary.classification !== entry.classification,
    explanation: 'The acceptance score supports compensation; the PV ends with Bxh8 followed by Be6, so the current final-two-quiet-plies requirement remains unsatisfied.' } }
await writeFile(new URL('offline-evidence-review.json', directory), JSON.stringify(diagnosis, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify(diagnosis, null, 2))
