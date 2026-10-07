import test from 'node:test'
import assert from 'node:assert/strict'
import { branchA } from './grande-v3-branch-a.js'
const root = (uci, values) => ({ uci, scores: values.map(evalCp => ({ evalCp, mate: null, bound: false })) })
test('large irrelevant oscillation is accepted when all roots and both budgets support the decision', () => {
  assert.equal(branchA([root('a', [100,110]),root('b', [-500,-800])], 'a', 2).status, 'verified-experimental')
})
test('oscillation across a decision boundary rejects', () => {
  assert.equal(branchA([root('a', [100,110]),root('b', [-500,-100])], 'a', 2).status, 'rejected')
  assert.equal(branchA([root('a', [-40,40]),root('b', [-500,-800])], 'a', 2).status, 'rejected')
})
test('both budgets and all legal roots are necessary, with early negative guard allowed', () => {
  assert.equal(branchA([root('a', [100,110]),root('b', [-500])], 'a', 2).status, 'incomplete')
  assert.equal(branchA([root('a', [100,110]),root('b', [-500,-800])], 'a', 3).status, 'incomplete')
  assert.equal(branchA([root('a', [100,110]),root('b', [0])], 'a', 3).status, 'rejected')
})
test('exact guard boundaries, unique legal, mate and bound', () => {
  assert.equal(branchA([root('a',[50,50]),root('b',[-250,-250])],'a',2).status,'verified-experimental')
  assert.equal(branchA([root('a',[100,100])],'a',1).status,'rejected')
  for (const score of [{evalCp:null,mate:3},{evalCp:100,bound:true},null]) assert.equal(branchA([{uci:'a',scores:[score]},root('b',[-500,-500])],'a',2).status,'abstained')
})
