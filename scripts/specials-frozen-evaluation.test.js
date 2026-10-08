import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createOpeningBook } from '../src/lib/openingBook.js'
import { evaluateFrozenSpecials, validateSupplementalSearches, specialMetrics } from './specials-frozen-evaluation.js'

const input = async path => JSON.parse(await readFile(new URL('../'+path,import.meta.url)))
const fixture = await input('tests/fixtures/qa/personal-06.json')
const cache = await input('tests/fixtures/qa/analysis-cache-large-200k/2026-10-07T09-51-26-999Z/personal-06.json')
const model = await input('agent-output/grande-prudent-candidate-v1.json')
const book = createOpeningBook((await input('src/data/openingPositions.json')).positions)
const bundle = await input('agent-output/brilliant-missing-evidence-2026-10-08T02-44-32-731Z/results.json')
const manifest = await input('agent-output/brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json')

test('all 30 supplemental scores match their raw UCI and frozen search manifest', () => {
  assert.equal(validateSupplementalSearches(bundle,manifest).length,30)
})
test('changed scores, bounds, root provenance and duplicates are rejected', () => {
  for (const mutate of [b=>{b.searches[0].completed.depth++},b=>{b.searches[0].completed.bound=true},
    b=>{b.searches[0].rootUci='a1a8'},b=>{b.searches.push(structuredClone(b.searches[0]))}]) {
    const wrong=structuredClone(bundle); mutate(wrong)
    assert.throws(()=>validateSupplementalSearches(wrong,manifest))
  }
})
test('incompatible configuration or failed engine run cannot silently become evidence', () => {
  const wrong=structuredClone(manifest);wrong.configuration.threads=2
  assert.throws(()=>validateSupplementalSearches(bundle,wrong))
  assert.throws(()=>validateSupplementalSearches({...bundle,summary:{...bundle.summary,failure:'timeout'}},manifest))
})
test('reference changes and absent annotations do not change predictions', () => {
  const evidence=validateSupplementalSearches(bundle,manifest), saved=JSON.stringify({fixture,cache})
  const original=evaluateFrozenSpecials(fixture,cache,model,book,evidence)
  const relabelled=structuredClone(fixture); relabelled.annotations=[]
  const unlabelled=evaluateFrozenSpecials(relabelled,cache,model,book,evidence)
  assert.deepEqual(unlabelled.map(r=>[r.predicted,r.grandeReason,r.brilliantReason]),original.map(r=>[r.predicted,r.grandeReason,r.brilliantReason]))
  assert.equal(original.find(r=>r.ply===11).predicted,'Geniale')
  assert.ok(unlabelled.every(r=>r.expected===null))
  assert.equal(JSON.stringify({fixture,cache}),saved)
})
test('partial games and unsupported cache settings fail before producing a report', () => {
  assert.throws(()=>evaluateFrozenSpecials(fixture,{...cache,entries:cache.entries.slice(1)},model,book))
  assert.throws(()=>evaluateFrozenSpecials(fixture,{...cache,threads:2},model,book))
})
test('unlabelled special moves are not false positives and overlap is explicit', () => {
  const metrics=specialMetrics([
    {predicted:'Geniale',expected:'Geniale',overlap:true},
    {predicted:'Grande',expected:null},
    {predicted:'Geniale',expected:'Forzata',excluded:true},
  ])
  assert.equal(metrics.overlaps,1)
  assert.deepEqual(metrics.categories.map(c=>[c.category,c.tp,c.fp,c.fn,c.unlabelledAssignments]),[['Grande',0,0,0,1],['Geniale',1,0,0,0]])
})
