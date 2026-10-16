import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {newQueenEvasionWinningMajor,quietCheckingForkPickup} from '../agent-output/remaining-tactical-families-v1/queen-evasion.mjs'
import {proveBishopSkewerGain,verifyBishopSkewerGain,newBishopRookSkewer} from '../agent-output/remaining-tactical-families-v1/bishop-skewer.mjs'
const area='agent-output/remaining-tactical-families-v1',sources=[],sha=b=>createHash('sha256').update(b).digest('hex')
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b},json=async p=>JSON.parse(await read(p))
const {cases}=await json('agent-output/special-completion-v1/cohorts.json')
for(const p of ['scripts/study-causal-major-tactics.mjs',`${area}/queen-evasion.mjs`,`${area}/bishop-skewer.mjs`])await read(p)
await writeFile(`${area}/causal-geometry-protocol.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanges:false,
 rationale:'Raw queen-escape geometry also matches Qxh8 after Qxf6+ Qe7. It merely realizes the already checking fork. Require actual two-ply history and distinguish an interposing check evasion from a fresh queen threat. Preserve the separate forcing capture-with-check families.',
 selection:'All1116 observations, no expected-label selection. Bishop certificate remains fixed two own moves/100000 nodes and every legal opponent reply. No score/rating/phase threshold changes.',sources},null,2)+'\n',{flag:'wx'})
const rows=[]
for(const c of cases)for(const [i,e]of c.entries.entries()){
 const queen=newQueenEvasionWinningMajor(e,c.entries[i-1],c.entries[i-2]),ordinary=quietCheckingForkPickup(e,c.entries[i-1],c.entries[i-2])
 const bishop=newBishopRookSkewer(e)?proveBishopSkewerGain(e,{maxOwnMoves:2,maxNodes:100000}):null
 if(bishop?.status==='proved')assert(verifyBishopSkewerGain(e,bishop))
 if(queen||bishop||ordinary)rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],queen,bishop,ordinary})
}
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/causal-geometry-study.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanges:false,rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(rows.map(({cohort,game,ply,san,expected,queen,bishop,ordinary})=>({cohort,game,ply,san,expected,queen:Boolean(queen),bishop:bishop?.status,ordinary:ordinary?.kind}))))
