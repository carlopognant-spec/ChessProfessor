// Mechanical design preparation; no publication, generated chess advice or engine.
import assert from 'node:assert/strict'
import {hash,replay,positionKey,coverageIndex,exerciseEvidence,engineJobs} from './common.mjs'
import {sourceRows} from './context.mjs'
import {commonPrefix,curriculumTree,curriculumFork,curriculumCheckpoint} from '../../src/lib/openingCurriculum.js'
import {practiceMove,initialPracticeIndex} from '../../src/lib/openingLibrary.js'

export function training(course,side,start){
  let index=start,turns=0
  if(index<course.moves.length&&replay(course.moves.slice(0,index)).turn()!==side)index++
  while(index<course.moves.length){const r=practiceMove(course.moves,index,side,course.moves[index])
    assert(['correct','complete'].includes(r.status));assert(r.index>index);index=r.index;turns++}
  return {learnerTurns:turns,endpointReached:index===course.moves.length}
}
export function draftRoutes(scope,baseline,prefix){
  const records=sourceRows(scope,prefix);assert(records.length,'No records for this exact SAN prefix')
  const orders=[...new Set(records.map(r=>r.moves))]
  const leaves=orders.filter(a=>!orders.some(b=>b.startsWith(a+' '))).sort()
  const current=coverageIndex(baseline,scope),states=new Map(current.states.map(r=>[r.id,r.state]))
  const routes=leaves.map(order=>{
    const moves=order.split(' ');replay(moves)
    const parents=baseline.filter(c=>c.family===records.find(r=>r.moves===order).applicationFamily)
      .map(c=>({id:c.id,prefix:commonPrefix(c.moves,moves)})).sort((a,b)=>b.prefix-a.prefix||a.id.localeCompare(b.id))
    const checkpoint=parents[0]?.prefix??0
    return {id:'draft:'+hash(order).slice(0,16),family:records.find(r=>r.moves===order).applicationFamily,moves,
      sourceRecords:records.filter(r=>order===r.moves||order.startsWith(r.moves+' ')).map(r=>({id:r.id,positionId:r.groupId,plies:r.moves.split(' ').length})),
      suggestedParent:parents[0]??null,checkpoint,
      activeTurns:Object.fromEntries(['w','b'].map(s=>[s,training({moves},s,checkpoint).learnerTurns])),
      needs:['review route selection and parent','specific plans and notes','exercise and all replies','review any teaching continuation','engine policy and protected baseline']}
  })
  // Candidate-to-candidate forks can also leave a color with no active turn.
  const emptyCheckpoints=[]
  for(const from of routes)for(const to of routes){if(from===to)continue;const index=commonPrefix(from.moves,to.moves)
    for(const side of ['w','b'])if(!training(to,side,index).learnerTurns)emptyCheckpoints.push({from:from.id,to:to.id,index,side})}
  const positionIds=[...new Set(records.map(r=>r.groupId))]
  return {schema:1,status:'draft-not-reviewed-not-executable',prefix:prefix.trim().split(/\s+/).join(' '),
    records:records.length,sourcePositions:positionIds.length,absentPositions:positionIds.filter(id=>states.get(id)==='absent').length,
    leafOrders:leaves.length,routes,emptyCheckpoints,
    limits:'No moves, explanations or exercises invented. This candidate file is not a lot plan and cannot be collected or published.'}
}
export function analyzePlan(plan,baseline,scope){
  const planned=plan.courses;assert(Array.isArray(planned)&&planned.length,'No courses')
  assert.equal(new Set(planned.map(c=>c.id)).size,planned.length,'Repeated course ID')
  assert(planned.every(c=>!baseline.some(b=>b.id===c.id)),'New ID already exists in baseline')
  const records=new Map(scope.records.map(r=>[r.id,r])),positions=new Map(scope.positions.map(p=>[p.id,p]))
  const exercises=[],routes=[]
  for(const c of planned){
    const p=c.provenance;assert(p&&p.generatedPlies===0,'Review generated provenance')
    assert.equal(c.moves.length,p.documentedPlies+p.authoredContinuationPlies)
    assert(!replay(c.moves).isGameOver(),'Terminal route needs review')
    assert.equal(c.sourceRecords.at(-1).plies,p.documentedPlies)
    for(const ref of c.sourceRecords){const r=records.get(ref.id);assert(r,'Unknown source record')
      if(ref===c.sourceRecords.at(-1))assert.equal(r.applicationFamily,c.family,'Terminal source family mismatch')
      assert.equal(r.moves,c.moves.slice(0,ref.plies).join(' '));assert.equal(r.groupId,ref.positionId)
      assert.equal(positionKey(replay(c.moves.slice(0,ref.plies))),positions.get(ref.positionId)?.position)}
    const parent=baseline.find(b=>b.id===c.existingParentCourseId);assert(parent,'Missing existing parent')
    assert.equal(parent.family,c.family,'Parent family mismatch')
    assert.equal(commonPrefix(c.moves,parent.moves),c.sharedPrefixPlies,'Wrong parent prefix')
    routes.push({id:c.id,endpointFen:replay(c.moves).fen(),
      fullTraining:Object.fromEntries(['w','b'].map(s=>[s,training(c,s,initialPracticeIndex(c.moves,s))]))})
    assert(Object.values(routes.at(-1).fullTraining).every(t=>t.learnerTurns>0))
    exercises.push(exerciseEvidence(c,plan.enginePlan.minimumImmediateMaterial))
  }
  const selected=[...new Map([...planned.map(c=>baseline.find(b=>b.id===c.existingParentCourseId)),...planned].map(c=>[c.id,c])).values()]
  const transitions=[],emptyCheckpoints=[]
  for(const from of selected)for(const to of selected){
    if(from===to||from.family!==to.family)continue
    const index=commonPrefix(from.moves,to.moves)
    if(index>=Math.min(from.moves.length,to.moves.length)){
      transitions.push({from:from.id,to:to.id,index,checkpoint:curriculumCheckpoint(selected,to,index),kind:'contained-or-continuation'});continue
    }
    const turn=replay(to.moves.slice(0,index)).turn(),fork=curriculumFork(selected,to.moves,index)
    assert(fork?.children.has(from.moves[index])&&fork.children.has(to.moves[index]))
    assert.equal(practiceMove(from.moves,index,turn,to.moves[index]).status,'different-line')
    const followed=practiceMove(to.moves,index,turn,to.moves[index]);assert(['correct','complete'].includes(followed.status))
    const active=Object.fromEntries(['w','b'].map(s=>[s,training(to,s,index)]))
    for(const [side,result] of Object.entries(active))if(!result.learnerTurns)emptyCheckpoints.push({from:from.id,to:to.id,index,side})
    transitions.push({from:from.id,to:to.id,index,turn,training:active,kind:'fork'})
  }
  assert.equal(emptyCheckpoints.length,0,'Checkpoint leaves a learner with zero active moves; review continuations')
  const browserPairs=[]
  function visit(node){const children=[...node.children.values()]
    if(children.length>1)for(const to of children.slice(1))browserPairs.push({from:children[0].courses[0].id,to:to.courses[0].id,index:node.prefix.length,turn:replay(node.prefix).turn()})
    for(const child of children)visit(child)}
  for(const family of new Set(selected.map(c=>c.family)))visit(curriculumTree(selected.filter(c=>c.family===family)))
  const jobs=engineJobs(plan,exercises),before=coverageIndex(baseline,scope),after=coverageIndex([...baseline,...planned],scope)
  assert.equal(new Set(jobs.map(j=>JSON.stringify([j.fen,j.roots]))).size,jobs.length,'Repeated search requires explicit sharing review')
  const previous=new Map(before.states.map(r=>[r.id,r.state]))
  const newlyReached=after.states.filter(r=>previous.get(r.id)==='absent'&&r.state!=='absent')
  if(plan.baseline?.coverage)assert.deepEqual(before.coverage,plan.baseline.coverage)
  if(plan.expectedCoverage)assert.deepEqual(after.coverage,plan.expectedCoverage)
  assert.equal(jobs.length,plan.enginePlan.primaryJobs)
  const reused=plan.reuseEngineJobs??[]
  assert.equal(new Set(reused.map(r=>r.jobId)).size,reused.length,'Repeated reuse mapping')
  assert(reused.every(r=>jobs.some(j=>j.id===r.jobId)),'Unknown reused job')
  assert.equal(plan.enginePlan.maximumGoCommands,(jobs.length-reused.length)*2)
  assert.equal(plan.enginePlan.maximumRequestedNodes,plan.enginePlan.maximumGoCommands*plan.enginePlan.nodesPerGo)
  return {schema:1,lot:plan.lot,status:'mechanics-verified-editorial-and-engine-review-still-required',
    courses:routes,exercises,engineJobs:jobs,navigation:{transitions,browserPairs,emptyCheckpoints},
    coverage:{baseline:before.coverage,projected:after.coverage,newlyReached},
    summary:{courses:planned.length,documentedPlies:planned.reduce((n,c)=>n+c.provenance.documentedPlies,0),
      authoredPlies:planned.reduce((n,c)=>n+c.authoredMoves.length,0),exerciseReplies:exercises.reduce((n,e)=>n+e.replies.length,0),
      transitions:transitions.length,browserPairs:browserPairs.length,jobs:jobs.length,
      newExactPositions:newlyReached.filter(r=>r.state==='exact').length,newTransposedPositions:newlyReached.filter(r=>r.state==='transposition-only').length,
      engineSearchesExecuted:0},
    limits:'Legality and source coverage do not certify strategic prose, best moves, browser behavior, or learned skill. No engine executed.'}
}
