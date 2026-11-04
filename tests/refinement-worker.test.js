import { readFileSync } from 'node:fs'
import { Worker as NodeWorker } from 'node:worker_threads'
import { describe, expect, it, vi } from 'vitest'
import { createRefinementWorkerClient } from '../src/lib/refinementWorkerClient.js'
import { buildRefinementPlan, refineGameEntries, selectRefinementView } from '../src/lib/analysisRefinement.js'
import { reclassifyAnalysisMoves } from '../src/lib/reviewMoves.js'
import { nativeProofFor } from '../src/lib/nativeEvidence.js'

const read = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url)))
const cohorts = read('agent-output/special-completion-v1/cohorts.json').cases
const packets = new Map()
for (const record of read('agent-output/special-completion-evidence-v1/collection.json').records) {
  const packet = read(record.path); packets.set(packet.fen, packet.engine)
}
const example = () => reclassifyAnalysisMoves(structuredClone(cohorts.find(c => c.id === 'personal-05' && c.cohort === 'old')
  .entries.slice(24, 27)).map((entry, i) => ({ ...entry, ply: i + 1 })))

// Run the actual browser worker module in a Node worker; only the transport is adapted.
function workerFactory() {
  const worker = new NodeWorker(`
    const { parentPort, workerData } = require('node:worker_threads');
    const queued = []; let ready = false;
    globalThis.self = { postMessage: data => parentPort.postMessage(data) };
    parentPort.on('message', data => ready ? self.onmessage({data}) : queued.push(data));
    import(workerData.module).then(() => { ready = true; for (const data of queued) self.onmessage({data}); });
  `, { eval: true, workerData: { module: new URL('../src/lib/refinementWorker.js', import.meta.url).href } })
  const bridge = { postMessage: data => worker.postMessage(data), terminate: () => worker.terminate() }
  worker.on('message', data => bridge.onmessage?.({ data }))
  worker.on('error', error => bridge.onerror?.(error))
  return bridge
}
const cachedSearch = async (fen, nodes, multiPv) => {
  expect(nodes).toBe(1000000); expect(multiPv).toBe(5)
  expect(packets.has(fen)).toBe(true)
  return structuredClone(packets.get(fen))
}

describe('refinement off the UI thread, same rules and evidence', () => {
  it('cancels planning before any engine exists and can create a fresh worker', async () => {
    const factory = vi.fn(workerFactory), client = createRefinementWorkerClient({ workerFactory: factory })
    try {
      const entries = example(), controller = new AbortController()
      const planning = client.plan(entries, { criticalOnly: true }, controller.signal)
      const rejected = expect(planning).rejects.toMatchObject({ name: 'AbortError' })
      controller.abort()
      await rejected
      expect((await client.plan(entries, { criticalOnly: true })).positions.length).toBeGreaterThan(0)
      expect(factory).toHaveBeenCalledTimes(2)
    } finally { client.destroy() }
  }, 30000)

  it('uses the unchanged plan, validations and classification and never overlaps engine searches', async () => {
    const client = createRefinementWorkerClient({ workerFactory }), entries = example(), before = JSON.stringify(entries)
    try {
      const plan = await client.plan(entries, { criticalOnly: true })
      expect(plan).toEqual(buildRefinementPlan(entries, { criticalOnly: true }))
      let active = 0, maximum = 0
      const analyzePosition = vi.fn(async (...args) => {
        maximum = Math.max(maximum, ++active)
        try { return await cachedSearch(...args) } finally { active-- }
      })
      const partials = [], result = await client.run(entries, plan, { analyzePosition, onEntries: value => partials.push(value) })
      const reference = await refineGameEntries({ entries, plan, analyzePosition: cachedSearch })
      expect(result.entries).toEqual(reference.entries)
      expect(result.refined).toEqual(selectRefinementView(reference.entries, true))
      expect(result.refined[2]).toMatchObject({ classification: 'great', candidateAssessment: { verdict: 'confirmed' } })
      expect(maximum).toBe(1)
      expect(analyzePosition.mock.calls.map(call => call[0])).toEqual(plan.positions)
      expect(partials.length).toBeGreaterThan(0)
      expect(JSON.stringify(entries)).toBe(before)
    } finally { client.destroy() }
  }, 30000)

  it('terminates a busy session, keeps its completed proof and resumes only missing evidence', async () => {
    const client = createRefinementWorkerClient({ workerFactory }), entries = example(), controller = new AbortController()
    try {
      const plan = await client.plan(entries, { criticalOnly: true })
      let partial, completeLate, reachedSecond
      const second = new Promise(resolve => { reachedSecond = resolve })
      let count = 0
      const running = client.run(entries, plan, { signal: controller.signal, onEntries: value => { partial = value },
        analyzePosition: (...args) => ++count === 1 ? cachedSearch(...args) : new Promise(resolve => {
          completeLate = () => cachedSearch(...args).then(resolve); reachedSecond()
        }) })
      const rejected = expect(running).rejects.toMatchObject({ name: 'AbortError' })
      await second
      controller.abort()
      await rejected
      expect(nativeProofFor(partial[2])).toMatchObject({ root: expect.any(Object), child: null })
      const saved = JSON.stringify(partial)
      await completeLate()
      const resumed = await client.plan(partial, { criticalOnly: true })
      expect(resumed.positions).not.toContain(plan.positions[0])
      expect(resumed.positions).toEqual(plan.positions.slice(1))
      expect(JSON.stringify(partial)).toBe(saved)
    } finally { client.destroy() }
  }, 30000)

  it('rejects forged plans in the worker before asking Stockfish', async () => {
    const client = createRefinementWorkerClient({ workerFactory }), analyzePosition = vi.fn()
    try {
      const entries = example(), plan = await client.plan(entries, { criticalOnly: true })
      await expect(client.run(entries, { ...plan, actualNodeCap: 99999999 }, { analyzePosition }))
        .rejects.toThrow('Piano di approfondimento non valido')
      expect(analyzePosition).not.toHaveBeenCalled()
    } finally { client.destroy() }
  }, 30000)
})
