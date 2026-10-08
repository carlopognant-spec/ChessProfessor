import { Chess } from 'chess.js'
import { evaluateFrozenGame } from './grande-frozen-evaluation.js'
import { classifySameOfferBrilliant } from './brilliant-same-offer-v4.js'
import { completedRootScore } from './grande-completed-score.js'

export function validateSupplementalSearches(bundle, manifest) {
  const config = manifest?.configuration
  if (bundle?.summary?.failure != null || bundle?.summary?.capExceeded !== false || !Array.isArray(bundle.searches)
    || config?.packageVersion !== '19.0.0' || config.build !== 'large-single' || config.multiPv !== 1
    || config.threads !== 1 || config.hashMb !== 16 || config.hashPolicy !== 'ucinewgame + Clear Hash before every search'
    || !Array.isArray(manifest.schedule)) throw Error('Unsupported supplementary evidence')
  const keys = new Set()
  return bundle.searches.filter(s => s.status === 'estimated').map(search => {
    const key = `${search.fen} ${search.rootUci}`
    if (keys.has(key)) throw Error('Duplicate supplementary root')
    keys.add(key)
    if (search.engineVersion !== 'Stockfish 19 WASM' || ![200000, 1000000].includes(search.budgetNodes)
      || search.stoppedForCap || !manifest.schedule.some(r => r.fen === search.fen && r.rootUci === search.rootUci && r.budgetNodes === search.budgetNodes)
      || !Array.isArray(search.rawLines)) throw Error('Search provenance mismatch')
    const selected = completedRootScore(search.rawLines, search.rootUci).completed
    const claimed = search.completed
    if (!selected || !claimed || ['evalCp', 'mate', 'depth', 'nodesAtScore', 'raw', 'bound'].some(k => selected[k] !== claimed[k])
      || JSON.stringify(selected.pv) !== JSON.stringify(claimed.pv)) throw Error('Score does not match raw UCI')
    const game = new Chess(search.fen)
    for (const uci of selected.pv) game.move({ from: uci.slice(0,2), to: uci.slice(2,4), promotion: uci[4] })
    return search
  })
}

export function evaluateFrozenSpecials(fixture, cache, grandeModel, book, supplemental = []) {
  // Grande performs PGN/FEN/configuration checks and derives common categories.
  const grande = evaluateFrozenGame(fixture, cache, grandeModel, book)
  return cache.entries.map((entry, index) => {
    const prior = grande[index]
    const result = classifySameOfferBrilliant(entry, prior.base, cache.entries[index - 2], cache.entries[index - 1], supplemental)
    const grandeAssigned = prior.predicted === 'Grande', brilliantAssigned = result.brilliant
    const predicted = brilliantAssigned ? 'Geniale' : grandeAssigned ? 'Grande' : prior.base
    return { ...prior, predicted, grandeAssigned, brilliantAssigned,
      overlap: grandeAssigned && brilliantAssigned, grandeStatus: prior.status, grandeReason: prior.reason,
      brilliantStatus: result.status, brilliantReason: result.reason, brilliantEvidence: result.evidence,
      comparison: result.comparison, attributions: result.attributions }
  })
}

export function specialMetrics(rows) {
  const included = rows.filter(r => !r.excluded), labelled = included.filter(r => r.expected != null)
  return { plies: rows.length, included: included.length, labelled: labelled.length,
    unlabelled: included.length - labelled.length, overlaps: included.filter(r => r.overlap).length,
    categories: ['Grande', 'Geniale'].map(category => {
      const assigned = labelled.filter(r => r.predicted === category), positive = labelled.filter(r => r.expected === category)
      const tp = assigned.filter(r => r.expected === category).length
      return { category, tp, fp: assigned.length - tp, fn: positive.length - tp,
        precision: assigned.length ? tp / assigned.length : null, recall: positive.length ? tp / positive.length : null,
        unlabelledAssignments: included.filter(r => r.expected == null && r.predicted === category).length }
    }), brilliantAbstentions: included.filter(r => r.brilliantStatus === 'insufficient').length,
    grandeAbstentions: included.filter(r => r.grandeStatus === 'insufficient').length }
}
