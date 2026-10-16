import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
const area='agent-output/all-sacrifice-proofs-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b},json=async p=>JSON.parse(await read(p))
const prior=await json(`${area}/verification-v2.json`);assert(prior.passed)
const path='src/lib/sacrificeProofs.js',before=await read(`${area}/sacrificeProofs.before-request-contract.js`),now=await read(path)
assert.equal(sha(before),prior.sources.find(s=>s.path===path).sha256)
const hook="    if(!validSacrificeAttempt(engine,q.fen,q.uci))throw Error('Prova del sacrificio incompatibile')"
assert(before.toString().includes(hook))
assert.equal(now.toString(),before.toString().replace(hook,"    if(!validSacrificeAttempt(engine,q.fen,q.uci)||engine.analysisMetadata.budget.value!==q.nodes\n      ||engine.analysisMetadata.multiPv!==q.multiPv)throw Error('Prova del sacrificio incompatibile')"))
for(const s of prior.sources)if(s.path!==path)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
const collection=await json(`${area}/collection.json`),protocol=await json(`${area}/protocol.json`)
for(const r of collection.records){const b=await read(r.path);assert.equal(sha(b),r.sha256);const p=JSON.parse(b),request=protocol.schedule[r.index]
 assert.equal(p.engine.analysisMetadata.budget.value,request.nodes);assert.equal(p.engine.analysisMetadata.multiPv,request.multiPv)
}
await read('scripts/verify-sacrifice-request-contract.mjs')
await writeFile(`${area}/request-contract-verification.json`,JSON.stringify({passed:true,
 amendment:'Only adds exact requested budget/MultiPV guards. Every raw packet available to every successful public proof-only flow satisfies both guards; the full1116-flow results are therefore unchanged. Separate forged-profile unit test exercises the rejected branch.',
 verifiedPackets:collection.records.length,newSearches:0,allOtherVerifiedSourcesUnchanged:true,priorVerification:'verification-v2.json',sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({passed:true,verifiedPackets:collection.records.length,allOtherVerifiedSourcesUnchanged:true}))
