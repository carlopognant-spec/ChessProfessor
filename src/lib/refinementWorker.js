import { buildRefinementPlan, refineGameEntries, selectRefinementView, refinementFor } from './analysisRefinement.js'

const searches = new Map()
let nextSearch = 0
const errorData = error => ({ name: error.name, message: error.message })

self.onmessage = async ({ data }) => {
  if (data.type === 'search-result') {
    const pending = searches.get(data.searchId)
    if (!pending) return
    searches.delete(data.searchId)
    if (data.error) pending.reject(Object.assign(new Error(data.error.message), { name: data.error.name }))
    else pending.resolve(data.result)
    return
  }
  const { id, operation, entries, options, plan } = data
  try {
    let result
    if (operation === 'inspect') result = {
      plan: buildRefinementPlan(entries), hasRefinements: entries.some(entry => refinementFor(entry)),
    }
    else if (operation === 'plan') result = buildRefinementPlan(entries, options)
    else if (operation === 'view') result = selectRefinementView(entries, true)
    else if (operation === 'run') {
      result = await refineGameEntries({ entries, plan,
        analyzePosition: (fen, nodes, multiPv, searchOptions) => new Promise((resolve, reject) => {
          const searchId = ++nextSearch
          searches.set(searchId, { resolve, reject })
          self.postMessage({ id, type: 'search', searchId, fen, nodes, multiPv, options: searchOptions })
        }),
        onEntries: value => self.postMessage({ id, type: 'entries', entries: value }),
        onProgress: value => self.postMessage({ id, type: 'progress', value }),
      })
      // Compute once here; navigation and React reuse this exact projection.
      result = { ...result, refined: selectRefinementView(result.entries, true) }
    } else throw Error('Operazione di approfondimento non supportata')
    self.postMessage({ id, type: 'result', result })
  } catch (error) { self.postMessage({ id, type: 'error', error: errorData(error) }) }
}
