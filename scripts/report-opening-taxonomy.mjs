import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {resolveOpeningFamily} from '../src/lib/openingFamily.js'
import {OPENING_LESSONS,openingCatalogSourceFamily} from '../src/lib/openingLessons.js'
import {prepareOpeningCatalog} from '../src/lib/openingLibrary.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'

const hash=value=>createHash('sha256').update(value).digest('hex')
const check=process.argv.includes('--check')
assert(process.argv.slice(2).every(arg=>arg==='--check'))
const raw=await fs.readFile('src/data/openingCatalog.json'),catalog=JSON.parse(raw)
const baseline=JSON.parse(await fs.readFile('docs/data/opening-taxonomy-baseline.json','utf8'))
const scope=JSON.parse(await fs.readFile('docs/data/opening-scope-audit.json','utf8'))
assert.equal(hash(raw),baseline.sourceCatalogSha256,'Source snapshot changed')
for(const [file,expected]of Object.entries(baseline.hashes))assert.equal(hash(await fs.readFile(file)),expected,file)
const courseRows=ALL_OPENING_JOURNEYS.map(({id,family,title,moves})=>({id,family,title,moves}))
assert.equal(hash(JSON.stringify(courseRows)),baseline.courseDigest,'Authored course identity or route changed')
const prepared=prepareOpeningCatalog(catalog.entries)
const changes=[],needsReview=[],basisCounts={},families=OPENING_LESSONS.map(({id,title})=>({id,title,sourceCount:0,runtimeCount:0}))
const byFamily=new Map(families.map(row=>[row.id,row]))
for(let i=0;i<catalog.entries.length;i++){
  const before=catalog.entries[i],after=prepared[i],resolution=resolveOpeningFamily(before.name,before.eco)
  assert.equal(before.family,openingCatalogSourceFamily(before.name,before.eco).id,'Source builder assignment changed')
  assert.equal(after.id,before.id)
  assert.equal(after.moves,before.moves)
  assert.equal(after.aliases,before.aliases)
  assert.equal(after.name,before.name)
  assert.equal(after.eco,before.eco)
  assert.equal(after.family,resolution.id)
  assert(byFamily.has(after.family))
  byFamily.get(before.family).sourceCount++
  byFamily.get(after.family).runtimeCount++
  basisCounts[resolution.basis]=(basisCounts[resolution.basis]??0)+1
  const row={id:before.id,name:before.name,eco:before.eco,sourceFamily:before.family,family:after.family,
    basis:resolution.basis,needsReview:resolution.needsReview}
  if(before.family!==after.family)changes.push(row)
  if(resolution.needsReview)needsReview.push(row)
}
const foundationIds=[]
for(const guide of OPENING_LESSONS){
  const board=new Chess();board.loadPgn(guide.line);const key=board.history().join(' ')
  const found=prepared.find(row=>row.family===guide.id&&row.moves.join(' ')===key)
  assert(found,`Missing foundation: ${guide.id}`)
  foundationIds.push({family:guide.id,id:found.id})
}
const external=scope.records.filter(row=>row.source==='lichess').map(row=>{
  const resolution=resolveOpeningFamily(row.name,row.eco)
  return {id:row.id,groupId:row.groupId,name:row.name,eco:row.eco,...resolution}
})
const inputHashes={}
for(const file of ['src/lib/openingFamily.js','src/lib/openingLessons.js','src/lib/openingLibrary.js',
  'scripts/build-opening-catalog.mjs','scripts/report-opening-taxonomy.mjs','docs/data/opening-taxonomy-baseline.json']){
  inputHashes[file]=hash(await fs.readFile(file))
}
const report={schema:1,checkedOn:'2026-10-20',policy:'Primary heading first; explicitly named systems only under generic parents; ECO fallbacks marked for review. Library navigation only.',
  scopeDecision:'Full fixed eco.json plus Lichess corpus accepted by Carlo; this lot changes runtime library grouping only.',
  inputHashes,sourceCatalogSha256:hash(raw),courseDigest:baseline.courseDigest,
  summary:{sourceEntries:catalog.entries.length,changedAssignments:changes.length,basisCounts,
    reviewAssignments:needsReview.length,foundations:foundationIds.length,courses:courseRows.length,
    lichessReviewReferences:external.filter(row=>row.needsReview).length,
    protectedHashesVerified:Object.keys(baseline.hashes).length},
  verification:{sourceBytes:'PASS',catalogIdentities:'PASS',catalogMovesAndAliases:'PASS',
    courseIdentitiesAndMoves:'PASS',foundationLinks:'PASS',sourceBuilderAssignments:'PASS',protectedHashes:'PASS'},
  families,foundations:foundationIds,changes,needsReview,
  lichessNeedsReview:external.filter(row=>row.needsReview)}
const output='docs/data/opening-taxonomy.json',text=JSON.stringify(report,null,2)+'\n'
if(check)assert.equal(await fs.readFile(output,'utf8'),text,'Taxonomy report is stale')
else await fs.writeFile(output,text)
console.log(JSON.stringify({mode:check?'check':'write',...report.summary,verification:report.verification},null,2))
