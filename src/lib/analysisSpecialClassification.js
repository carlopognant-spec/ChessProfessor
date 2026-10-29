import * as core from './specialClassification.js'

export { SPECIAL_POLICY, displaySpecialMoves, formatSpecialAssessment } from './specialClassification.js'

// The frozen classifier already rejects bound:true. Normalize newer flag encodings at the analysis boundary.
export function normalizeAnalysisBounds(value) {
  const memo = new WeakMap(), visiting = new WeakSet()
  function normalize(input) {
    if (!input || typeof input !== 'object') return input
    const prototype = Object.getPrototypeOf(input)
    if (!Array.isArray(input) && prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Dati di analisi non JSON non supportati')
    }
    if (visiting.has(input)) throw new TypeError('Dati di analisi ciclici non supportati')
    if (memo.has(input)) return memo.get(input)
    visiting.add(input)
    let output = input
    const copy = () => {
      if (output === input) {
        output = Array.isArray(input) ? input.slice() : { ...input }
        if (prototype === null) Object.setPrototypeOf(output, null)
      }
    }
    for (const [key, child] of Object.entries(input)) {
      const normalized = normalize(child)
      if (normalized !== child) { copy(); output[key] = normalized }
    }
    if (!Array.isArray(input) && (input.lowerbound || input.upperbound) && input.bound !== true) {
      copy(); output.bound = true
    }
    visiting.delete(input); memo.set(input, output)
    return output
  }
  return normalize(value)
}

const call = (name, args) => core[name](...normalizeAnalysisBounds(args))
export const classifySpecialMove = (...args) => call('classifySpecialMove', args)
export const reclassifySpecialMoves = (...args) => call('reclassifySpecialMoves', args)
export const refreshPreviousSacrifice = (...args) => call('refreshPreviousSacrifice', args)
export const pendingGrandeRecovery = (...args) => call('pendingGrandeRecovery', args)
export const pendingNativeAlternatives = (...args) => call('pendingNativeAlternatives', args)
