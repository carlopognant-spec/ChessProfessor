import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { Chess } from 'chess.js'

const root = new URL('../', import.meta.url), sources = []
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
async function input(path) {
  const bytes = await readFile(new URL(path, root)); sources.push({ path, sha256: hash(bytes) }); return JSON.parse(bytes)
}
const baseline = await input('agent-output/brilliant-offer-v2-2026-10-08T02-16-04-769Z/results.json')
const attribution = await input('agent-output/brilliant-offer-attribution-v3-2026-10-08T02-28-55-079Z/results.json')
const ids = [...Array.from({ length: 6 }, (_, i) => `personal-0${i + 1}`), 'game-1-chigorin-steinitz-1892', 'game-2-saintamant-staunton-1843']
const requests = [], seen = new Set()
for (const id of ids) {
  const cachePath = `tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/${id}.json`
  const cache = await input(cachePath)
  if (cache.packageVersion !== '19.0.0' || cache.searchLimit?.value !== 200000 || cache.multiPv !== 5
    || cache.threads !== 1 || cache.hashMb !== 16) throw Error('Incompatible cache')
  for (const entry of cache.entries) {
    const old = baseline.rows.find(r => r.id === id && r.ply === entry.ply)
    const current = attribution.rows.find(r => r.id === id && r.ply === entry.ply)
    if (!old || !current || old.san !== entry.san || current.san !== entry.san) throw Error('Baseline mismatch')
    if (current.status !== 'insufficient' || current.reason !== 'missing-acceptance-score') continue
    const legal = new Set(new Chess(entry.fenAfter).moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion ?? ''}`))
    for (const offer of old.evidence.offers) {
      if (!offer.candidateMaterialLoss || offer.continuation?.probabilityMover != null) continue
      if (!legal.has(offer.replyUci)) throw Error('Illegal requested root')
      const key = `${entry.fenAfter} ${offer.replyUci}`
      if (seen.has(key)) throw Error('Duplicate request: explicit provenance merge required')
      seen.add(key)
      requests.push({ id, ply: entry.ply, san: entry.san, cachePath, fen: entry.fenAfter,
        rootUci: offer.replyUci, replySan: offer.replySan, scorePerspective: 'side-to-move at FEN; opponent of offering player',
        reason: 'missing saved score for legal material acceptance', budgetNodes: 200000 })
    }
  }
}
for (const source of sources) if (hash(await readFile(new URL(source.path, root))) !== source.sha256) throw Error('Source changed')
const manifest = { schemaVersion: 1, status: 'prepared-not-executed', selectionUsesExpectedLabels: false,
  selection: 'all v3 abstentions caused by missing acceptance score; fixture order, ply order, legal reply order',
  searchesExecuted: 0, actualNodes: null, requests: requests.length,
  distinctPositions: new Set(requests.map(r => r.fen)).size, nominalNodes: requests.length * 200000,
  proposedGlobalActualNodeCap: 7500000, stopOnCap: true, retryPolicy: 'none',
  configuration: { packageVersion: '19.0.0', build: 'large-single', multiPv: 1, threads: 1, hashMb: 16,
    hashPolicy: 'ucinewgame + Clear Hash before every search', requestedAdditionalOutput: 'UCI_ShowWDL true; record option support',
    collection: 'last completed unbounded root score; raw UCI; legal PV replay; node counts' },
  classificationPolicy: 'evaluate frozen v3 once all evidence is collected; never treat missing/truncated search as favorable; no app activation',
  budgetCapIsForFutureRun: true, independentValidation: false, sources, schedule: requests }
const directory = new URL(`agent-output/brilliant-missing-evidence-manifest-${new Date().toISOString().replace(/[:.]/g, '-')}/`, root)
await mkdir(directory)
await writeFile(new URL('manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ output: fileURLToPath(directory), status: manifest.status, requests: requests.length,
  positions: manifest.distinctPositions, nominalNodes: manifest.nominalNodes, cap: manifest.proposedGlobalActualNodeCap, searchesExecuted: 0 }, null, 2))
