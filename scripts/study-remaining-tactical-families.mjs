import {readFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {queenEvasionWinningMajor} from '../agent-output/remaining-tactical-families-v1/queen-evasion.mjs'
import {newBishopRookSkewer,proveBishopSkewerGain,verifyBishopSkewerGain} from '../agent-output/remaining-tactical-families-v1/bishop-skewer.mjs'
const area='agent-output/remaining-tactical-families-v1',sha=b=>createHash('sha256').update(b).digest('hex'),sources=[]
const read=async p=>{const b=await readFile(p);sources.push({path:p,sha256:sha(b)});return b},json=async p=>JSON.parse(await read(p))
const {cases}=await json('agent-output/special-completion-v1/cohorts.json'),baseline=await json('agent-output/native-winning-integration-v1/verification.json')
assert(baseline.passed)
for(const p of ['scripts/study-remaining-tactical-families.mjs',`${area}/queen-evasion.mjs`,`${area}/bishop-skewer.mjs`])await read(p)
await writeFile(`${area}/geometry-protocol.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanges:false,
 selection:'Every move in all1116 development observations, deduplicating exact geometry only. Expected labels report errors but never select geometry or proof searches.',
 hypotheses:['A legally threatened queen evades an attacker by the sole major capture that wins at least a rook-for-minor exchange after every immediate legal reply. Taking the queen attacker itself and ordinary material realization remain separate.',
 'A new quiet bishop skewer of two enemy rooks forces at least one pawn net gain or mate within two further own forcing moves, with every legal opponent reply included. Check evasions are all legal moves, not just captures. Forcing-search subsets may miss proofs but cannot certify false strategies.'],
 limits:{maxOwnMoves:2,maxNodes:100000},sources},null,2)+'\n',{flag:'wx'})
const cache=new Map(),rows=[]
for(const c of cases)for(const [i,e]of c.entries.entries()){
 const k=[e.fenBefore,e.playedUci,e.fenAfter].join('|')
 if(!cache.has(k)){
  const queen=queenEvasionWinningMajor(e),geometry=newBishopRookSkewer(e)
  const bishop=geometry?proveBishopSkewerGain(e,{maxOwnMoves:2,maxNodes:100000}):null
  if(bishop?.status==='proved')assert(verifyBishopSkewerGain(e,bishop),`Independent certificate replay ${c.id}/${e.ply}`)
  cache.set(k,{queen,bishop})
 }
 const r=cache.get(k);if(r.queen||r.bishop)rows.push({cohort:c.cohort,game:c.id,ply:e.ply,san:e.playedMove,expected:c.expected[i],...r})
}
for(const s of sources)assert.equal(sha(await readFile(s.path)),s.sha256,s.path)
await writeFile(`${area}/geometry-study.json`,JSON.stringify({developmentOnly:true,independentValidation:false,newEngineSearches:0,productionChanges:false,observations:1116,distinctPositions:cache.size,rows,sources},null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify(rows.map(({cohort,game,ply,san,expected,queen,bishop})=>({cohort,game,ply,san,expected,queen:queen?{gain:queen.gain,minimum:queen.minimumAfterReply,threats:queen.threats}:null,bishop:bishop?{status:bishop.status,nodes:bishop.nodes}:null}))))
