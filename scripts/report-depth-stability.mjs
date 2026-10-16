import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { Chess } from 'chess.js'
import { nativeWdlInterval } from '../src/lib/nativeWdl.js'
const area = 'agent-output/depth-stability-v1', sources = new Map()
const hash = b => createHash('sha256').update(b).digest('hex')
const read = async p => { const b = await readFile(p); sources.set(p, hash(b)); return b }
const json = async p => JSON.parse(await read(p))
assert((await json(`${area}/replay-check.json`)).passed)
const protocol = await json(`${area}/protocol.json`), collection = await json(`${area}/collection.json`), packets = new Map()
for (const r of collection.records) { const b = await read(r.path); assert.equal(hash(b), r.sha256); const p = JSON.parse(b); packets.set(p.fen, p) }
const describe = (p, side = 1) => {
  const row = l => l ? { uci: l.pv[0], depth: l.depth, cp: l.evalCp == null ? null : side * l.evalCp,
    mate: l.mate == null ? null : side * l.mate,
    native: l.evalCp == null ? null : nativeWdlInterval(p.fen, side * l.evalCp)?.dominant ?? null,
    pv: l.pv } : null
  return { bestmove: p.engine.bestmove, completed: p.engine.specialLines.map(row), latest: row(p.engine), nodes: p.nodes, actualNodes: p.actualNodes }
}
const rows = protocol.selected.map(t => {
  const board = new Chess(t.fen), played = board.move(t.san), uci = played.from + played.to + (played.promotion ?? '')
  assert.equal(board.fen(), t.after)
  const root = describe(packets.get(t.fen)), child = describe(packets.get(t.after), -1)
  return { ...t, uci, root, child, playedIsBest: root.bestmove === uci, completedPair: !!root.completed[0] && !!child.completed[0],
    nativeAgreement: root.completed[0]?.native === child.completed[0]?.native,
    rootGapCp: root.completed.length > 1 ? root.completed[0].cp - root.completed[1].cp : null }
})
await read('scripts/report-depth-stability.mjs'); await read('src/lib/nativeWdl.js')
for (const [p, h] of sources) assert.equal(hash(await readFile(p)), h, p)
await writeFile(`${area}/report.json`, JSON.stringify({ diagnosticOnly: true, productionChanged: false, independentValidation: false,
  referenceLabelsUsedForSelection: false, newEngineSearches: 0, actualNodes: collection.actualNodes, cap: collection.cap, rows,
  sources: [...sources].map(([path, sha256]) => ({ path, sha256 })) }, null, 2) + '\n', { flag: 'wx' })
const table = rows.map(r => `| ${r.game}/${r.ply} ${r.san} | ${r.root.bestmove} | ${r.root.completed[0]?.cp ?? 'N/D'} | ${r.child.completed[0]?.cp ?? 'N/D'} | ${r.rootGapCp ?? 'N/D'} |`).join('\n')
await writeFile(`${area}/report.md`, `# Verifica delle instabilita del motore\n\nTutte le cinque posizioni con bestmove cambiato, confronto incompleto o esito nativo discordante nel precedente studio a5M. Dieci FEN a10M, ${collection.actualNodes} nodi entro ${collection.cap}; zero retry, replay passato. Nessuna modifica all'app o alle etichette.\n\n| Caso | Best10M | Root completata (cp autore) | Child completata (cp autore) | Differenza dalla seconda (cp) |\n|---|---|---:|---:|---:|\n${table}\n\nLe ultime stime parziali e i confronti completati rimangono separati nel JSON. Il fatto che una mossa sia migliore non prova da solo che debba essere Grande. c6 e Ne4 restano riferimenti aperti: non si introducono soglie per farli coincidere.\n`, { flag: 'wx' })
console.log(JSON.stringify({ passed: true, actualNodes: collection.actualNodes, rows: rows.map(({ game, ply, san, playedIsBest, completedPair, nativeAgreement, rootGapCp }) => ({ game, ply, san, playedIsBest, completedPair, nativeAgreement, rootGapCp })) }))
