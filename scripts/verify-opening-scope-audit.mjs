// Independent linear replay of P01 results, without the generator's shared trie.
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS} from '../src/lib/openingJourneys.js'

const hash = value => createHash('sha256').update(value).digest('hex')
const path = 'docs/data/opening-scope-audit.json'
const bytes = await fs.readFile(path), audit = JSON.parse(bytes)
for (const [file, expected] of Object.entries(audit.inputHashes)) assert.equal(hash(await fs.readFile(file)), expected, file)
for (const file of audit.sources.lichess.files) assert.equal(hash(await fs.readFile(`docs/data/opening-audit-sources/${file.name}`)),file.sha256,file.name)
const position = game => game.fen().split(' ').slice(0,4).join(' ')
const coursesBySequence = new Map(), coursesByPosition = new Map(), courseEnds = new Map()
let courseMoves = 0, sourceMoves = 0
const add = (map,key,id) => { if(!map.has(key))map.set(key,new Set());map.get(key).add(id) }
for (const course of ALL_OPENING_JOURNEYS) {
  const game = new Chess(), prefix = []
  for (const san of course.moves) {
    game.move(san,{strict:true});prefix.push(san);courseMoves++
    add(coursesBySequence,prefix.join(' '),course.id)
    add(coursesByPosition,position(game),course.id)
  }
  add(courseEnds,prefix.join(' '),course.id)
}
const replay = new Map(), groupRows = new Map()
for (const row of audit.records) {
  if (!replay.has(row.moves)) {
    const game = new Chess(), prefixes = [], moves = row.moves.split(' ')
    for (let i=0;i<moves.length;i++) {
      game.move(moves[i],{strict:true});sourceMoves++
      prefixes.push({sequence:moves.slice(0,i+1).join(' '),position:position(game)})
    }
    replay.set(row.moves,{position:position(game),prefixes})
  }
  const observed = replay.get(row.moves)
  assert.equal(row.groupId,`position:${hash(observed.position).slice(0,16)}`)
  const reach = coursesBySequence.has(row.moves)?'exact':coursesByPosition.has(observed.position)?'transposition':'absent'
  assert.equal(row.sequenceReach,reach,row.id)
  if(!groupRows.has(row.groupId))groupRows.set(row.groupId,[])
  groupRows.get(row.groupId).push(row)
}
const sorted = iterable => [...iterable].sort()
const sourceEnds = new Map(audit.records.map(row => [row.moves,row.groupId]))
const expectedEdgesByGroup = new Map(), expectedFrontier = new Set()
const groupMap = new Map(audit.positions.map(group=>[group.id,group]))
for (const row of audit.records) {
  const prefixes = replay.get(row.moves).prefixes
  const first = prefixes.findIndex(prefix => !coursesBySequence.has(prefix.sequence))
  if (first < 0) continue
  const before = first ? prefixes[first-1].position : position(new Chess())
  const san = row.moves.split(' ')[first]
  const id = `edge:${hash(`${before}|${san}`).slice(0,16)}`
  add(expectedEdgesByGroup,row.groupId,id)
  if (['absent','course-ended'].includes(groupMap.get(row.groupId).reach)) expectedFrontier.add(id)
}
let verifiedGroups=0,verifiedParents=0
for (const group of audit.positions) {
  const rows = groupRows.get(group.id),exact = new Set(),transposed = new Set(),ended = new Set(),parents = new Set()
  for (const row of rows) {
    const observed = replay.get(row.moves)
    assert.equal(observed.position,group.position)
    for(const id of coursesBySequence.get(row.moves)??[])exact.add(id)
    for(const id of coursesByPosition.get(observed.position)??[])transposed.add(id)
    const prefixes=observed.prefixes.slice(0,-1)
    for(const prefix of prefixes)for(const id of courseEnds.get(prefix.sequence)??[])ended.add(id)
    for(const prefix of [...prefixes].reverse()) {
      const parent=sourceEnds.get(prefix.sequence)
      if(parent&&parent!==group.id){parents.add(parent);break}
    }
  }
  exact.forEach(id=>transposed.delete(id))
  const reach=exact.size?'exact':transposed.size?'transposition':ended.size?'course-ended':'absent'
  assert.equal(group.reach,reach,group.id)
  assert.deepEqual(group.exactCourses,sorted(exact),group.id)
  assert.deepEqual(group.transposedCourses,sorted(transposed),group.id)
  assert.deepEqual(group.endedCourses,sorted(ended),group.id)
  assert.deepEqual(group.parentIds,sorted(parents),group.id)
  assert.deepEqual(sorted(group.recordIds),sorted(rows.map(row=>row.id)))
  assert.deepEqual(group.firstMissingEdgeIds,sorted(expectedEdgesByGroup.get(group.id)??[]),group.id)
  verifiedGroups++;verifiedParents+=parents.size
}
// These two states must remain distinct; same pieces alone is insufficient.
const initial = new Chess().fen()
assert.notEqual(position(new Chess(initial)),position(new Chess(initial.replace(' w ',' b '))))
assert.notEqual(position(new Chess(initial)),position(new Chess(initial.replace(' KQkq ',' - '))))
const ep = new Chess('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1')
assert.notEqual(position(ep),position(new Chess(ep.fen().replace(' d6 ',' - '))))
assert.equal(replay.size,audit.summary.uniqueSequences)
assert.equal(verifiedGroups,audit.summary.uniquePositions)
assert.equal(courseMoves,audit.summary.coursePlies)
assert.deepEqual(sorted(audit.frontier.map(edge=>edge.id)),sorted(expectedFrontier))
assert.equal(expectedFrontier.size,audit.summary.firstMissingEdges)
for(const edge of audit.missingEdges){
  const game=new Chess(`${edge.before} 0 1`)
  game.move(edge.san,{strict:true})
  assert.equal(position(game),edge.after,edge.id)
}
const result={schema:1,checkedOn:'2026-10-20',method:'Independent sequential replay, no shared prefix trie',
  auditSha256:hash(bytes),checkerSha256:hash(await fs.readFile('scripts/verify-opening-scope-audit.mjs')),
  sourceRecords:audit.records.length,distinctSequences:replay.size,sourceMovesReplayed:sourceMoves,
  courses:ALL_OPENING_JOURNEYS.length,courseMovesReplayed:courseMoves,
  verifiedPositions:verifiedGroups,verifiedParentLinks:verifiedParents,
  sequenceReach:'PASS',positionReach:'PASS',courseReferences:'PASS',parentReferences:'PASS',
  firstMissingEdges:'PASS',verifiedFrontierEdges:expectedFrontier.size,
  inputHashes:'PASS',positionIdentityGuards:'PASS',engineSearches:0,networkRequests:0}
await fs.writeFile('docs/data/opening-scope-verification.json',JSON.stringify(result,null,2)+'\n')
console.log(JSON.stringify(result,null,2))
