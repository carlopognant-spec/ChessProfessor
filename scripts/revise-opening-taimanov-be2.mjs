// Explicit SIC-07 design revision. Offline only; the failed ledger stays immutable.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {json,hashes,fileHash,encode,write,replay,material,engineJobs} from './openings/common.mjs'
import {analyzePlan} from './openings/planning.mjs'

const original='docs/data/opening-taimanov-be2-p022',stem=original+'-r1'
const plan=await json(original+'-plan.json'),old=await json(original+'-design-verification.json')
plan.lot='P02.2-SIC-07-R1';plan.status='revised-design';plan.revisionOf=original+'-plan.json'
plan.revisionReason='The original castling continuation loses 160 cp; Ndb5 is a tactical resource, not a punishable error. Preserve the failed evidence and teach the compensation.'
const c=plan.courses[0]
c.moves=c.moves.slice(0,14).concat('Ndb5','axb5','Nxb5','Qa5+','Bd2','Qb6')
c.provenance.authoredContinuationPlies=6
c.authoredMoves=c.moves.slice(14).map((san,i)=>{const m=replay(c.moves.slice(0,14+i)).move(san);return {index:14+i,san,uci:m.from+m.to+(m.promotion??'')}})
c.contrast='Dopo Dc7, Ae3 e a6, Cge7 sviluppa il cavallo g8 senza attaccare e4, ma occupa la diagonale dell’alfiere f8. Il seguito mostra perché il controllo di b5 da parte del pedone a6 non basta, da solo, a escludere un salto tattico del cavallo.'
c.whitePlan='Valuta il salto tattico Cdb5: dopo axb5, Cxb5 recupera il pedone attaccando la donna c7. Rispondi allo scacco e considera attività e compenso, senza confonderli con un guadagno materiale.'
c.blackPlan='Prima di catturare in b5 controlla i tempi del secondo cavallo sulla donna. Dopo Cxb5 la donna deve sottrarsi all’attacco; lo scacco Da5+ permette di guadagnare un tempo, poi occorre tenere conto di Ad2.'
c.endpointReason='La continuazione didattica gioca il sacrificio, la ripresa con attacco alla donna, lo scacco e la sua parata. Dopo Db6 la donna è al sicuro dall’alfiere d2 e il cavallo b5 resta attivo, sostenuto dall’alfiere e2. Non è una vittoria dimostrata per nessuno.'
c.sourceDisclosure='La fonte documenta le prime 14 semimosse. Cdb5 axb5 Cxb5 Da5+ Ad2 Db6 è una continuazione didattica selezionata dalla ricerca salvata, non una prosecuzione attribuita alla fonte. Le sei mosse aggiunte richiedono confronti separati a budget limitato.'
c.editorialNotes['14']='Cdb5 attacca la donna c7 e offre il cavallo al pedone a6. Non basta contare il materiale: dopo axb5 l’altro cavallo può riprendere in b5 attaccando nuovamente la donna c7. La cattura del Nero è giocata per esaminare concretamente questa risorsa, non come confutazione del salto.'
c.editorialNotes['16']='Cxb5 recupera il pedone con il cavallo c3 e attacca la donna c7. Il Bianco ha ceduto un cavallo per un pedone e cerca compenso nell’attività. Da5+ sottrae la donna all’attacco e dà scacco lungo a5-b4-c3-d2-e1: c3 è stata liberata dal cavallo.'
c.editorialNotes['18']='Ad2 interrompe lo scacco sulla diagonale verso e1 e attacca la donna a5. Db6 sottrae la donna a quell’attacco e attacca il cavallo b5, che è difeso dall’alfiere e2. Il re bianco resta al centro; attività, minacce e materiale vanno valutati insieme.'
const ex=c.exercise
Object.assign(ex,{beforeIndex:15,mistake:'Qxh2',answer:'Rxh2',exerciseSide:'w',capturedType:'q',title:'La donna sulla colonna h',objective:'La donna nera ha catturato in h2. Controlla quale pezzo bianco può catturarla e se il materiale resta al sicuro dopo la replica.',explanation:'Txh2 cattura la donna con la torre h1. Il Nero può ancora catturare il cavallo b5 con axb5: anche includendo quella replica, il saldo materiale minimo rispetto a prima della deviazione è +5. È un esercizio costruito sulla cattura della donna, non una confutazione di Cdb5.'})
const board=replay(c.moves.slice(0,ex.beforeIndex)),initial=material(board,ex.exerciseSide)
board.move(ex.mistake);board.move(ex.answer)
ex.expectedLegalImmediateReplies=board.moves().length
ex.expectedMinimumImmediateMaterialGain=Math.min(material(board,ex.exerciseSide)-initial,...board.moves().map(san=>{board.move(san);const n=material(board,ex.exerciseSide)-initial;board.undo();return n}))
assert.equal(ex.expectedLegalImmediateReplies,27);assert.equal(ex.expectedMinimumImmediateMaterialGain,5)
plan.preserveFiles={...plan.preserveFiles,...await hashes([original+'-plan.json',original+'-design-verification.json'])}
plan.plannedFiles.engineDirectory=stem+'-engine'
plan.plannedFiles.practicalVerification=stem+'-practical-verification.json'
plan.plannedFiles.result=stem+'-result.json'
plan.plannedFiles.resultDocument='docs/OPENING-TAIMANOV-BE2-P022-R1-RESULTS.md'
const sourceDirectory=original+'-engine',manifest=await json(sourceDirectory+'/manifest.json')
// Match complete search inputs, not job IDs or four-field position identities.
const exercises=plan.courses.map(spec=>{
 const b=replay(spec.moves.slice(0,spec.exercise.beforeIndex)),before=b.fen();b.move(spec.exercise.mistake)
 return {id:spec.exercise.id,before,after:b.fen()}
})
const jobs=engineJobs(plan,exercises),manifestSha256=await fileHash(sourceDirectory+'/manifest.json')
plan.reuseEngineJobs=jobs.flatMap(job=>{
 const i=manifest.jobs.findIndex(j=>j.fen===job.fen&&JSON.stringify(j.roots)===JSON.stringify(job.roots))
 return i<0?[]:[{jobId:job.id,directory:sourceDirectory,jobIndex:i+1,manifestSha256}]
})
assert.equal(jobs.length,45);assert.equal(plan.reuseEngineJobs.length,34)
plan.enginePlan.primaryJobs=jobs.length
plan.enginePlan.maximumGoCommands=(jobs.length-plan.reuseEngineJobs.length)*2
plan.enginePlan.maximumRequestedNodes=plan.enginePlan.maximumGoCommands*plan.enginePlan.nodesPerGo
plan.revisionBudget={newPrimaryJobs:11,reusedJobs:34,maximumNewGoCommands:22,maximumNewRequestedNodes:4400000,previousGoCommands:37,previousNodesRequested:7400000,combinedMaximumGoCommands:59,combinedMaximumRequestedNodes:11800000,policy:'One reviewed candidate. No repeated compatible searches, candidate sweep, automatic retry or threshold changes.'}
const scope=await json('docs/data/opening-scope-audit.json')
const analysis=analyzePlan(plan,old.baseline.courses,scope)
const geometryFacts=old.geometryFacts.filter(f=>f.courseId!==c.id||f.index!==16)
for(const [index,label,test] of [
 [16,'axb5 captures the offered knight; Nc3 can recapture with tempo on Qc7',b=>b.get('b5')?.color==='b'&&b.get('b5')?.type==='p'&&b.get('c3')?.type==='n'&&b.moves().includes('Nxb5')],
 [18,'Qa5 checks along the newly opened diagonal after Nxb5 attacks Qc7',b=>b.isCheck()&&b.get('a5')?.type==='q'&&!b.get('c3')&&b.get('b5')?.type==='n'&&b.moves().includes('Bd2')],
 [20,'Bd2 parried check; Qb6 attacks Nb5, defended by Be2',b=>!b.isCheck()&&b.get('d2')?.type==='b'&&b.get('b6')?.type==='q'&&b.attackers('b5','b').includes('b6')&&b.attackers('b5','w').includes('e2')]
]){const b=replay(c.moves.slice(0,index));assert(test(b),label);geometryFacts.push({courseId:c.id,index,label,fen:b.fen()})}
const planPath=stem+'-plan.json',designPath=stem+'-design-verification.json'
const check=process.argv.includes('--check')
async function output(file,value){if(check)assert.equal(await fs.readFile(file,'utf8'),encode(value),file);else await write(file,value)}
await output(planPath,plan)
const inputHashes=await hashes([planPath,'scripts/revise-opening-taimanov-be2.mjs','scripts/openings/common.mjs','scripts/openings/planning.mjs','src/lib/openingJourneys.js','src/lib/openingPracticalLibrary.js'])
const design={...analysis,status:'revised-design-verified-not-published',inputHashes,baseline:old.baseline,preservedFiles:Object.keys(plan.preserveFiles).length,geometryFacts,
 navigation:{...analysis.navigation,forks:analysis.navigation.transitions,internalConvergence:old.navigation.internalConvergence,uncoveredAlternative:plan.navigation.uncoveredAlternative,browserPlan:old.navigation.browserPlan},
 originalDesign:original+'-design-verification.json',revisionBudget:plan.revisionBudget,limits:'Frozen previous plan and failed ledger preserved. All 18 authored comparisons and nine exercises must pass before joint publication. Browser and application QA pending.'}
await output(designPath,design)
console.log(encode({status:'PASS',plan:planPath,design:designPath,...analysis.summary,geometryFacts:geometryFacts.length,revisionBudget:plan.revisionBudget}))
