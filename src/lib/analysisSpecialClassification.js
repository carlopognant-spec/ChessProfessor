import * as core from './specialClassification.js'
import { annotateClassification } from './classificationDecision.js'

export { SPECIAL_POLICY } from './specialClassification.js'

export function displaySpecialMoves(entries, enabled = false) {
  if (enabled) return entries
  return core.displaySpecialMoves(entries, enabled).map((entry, i) => entry === entries[i] ? entry
    : annotateClassification({ ...entry,
      ...(entry.candidateAssessment ? { candidateAssessment: { ...entry.candidateAssessment,
        classification: entry.classification, verdict: 'not-applicable', reason: 'special-display-disabled' } } : {}),
      specialAssessment: { ...entry.specialAssessment,
        grande: { status: 'insufficient', reason: 'special-display-disabled' },
        brilliant: { status: 'insufficient', reason: 'special-display-disabled' },
        events: (entry.specialAssessment.events ?? []).filter(event => event.status !== 'supported') } }))
}

export function formatSpecialAssessment(entry) {
  const candidate = entry.candidateAssessment
  if (entry.specialAssessment?.grande?.reason === 'special-display-disabled') return ''
  if (candidate?.version !== 'grande-evidence-candidate-v3' || candidate.verdict === 'not-applicable') {
    return core.formatSpecialAssessment(entry)
  }
  if (entry.classification !== 'great') return ''
  if (candidate.inheritance) return 'Etichetta Grande conservata per compatibilità; non è una nuova conferma tattica.'
  return 'Certificato tattico verificato entro il suo orizzonte legale. Non dimostra una vittoria forzata completa.'
}

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
