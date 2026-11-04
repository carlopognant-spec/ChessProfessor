import fs from 'node:fs'
import {describe,it,expect} from 'vitest'
import additions from '../src/data/openingTaimanovBd3Courses.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import {ALL_OPENING_JOURNEYS,openingWrittenContext,journeyCoach} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumReturnIndex,curriculumCheckpoint,curriculumFork} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import {hash,replay,positionKey,exerciseEvidence,engineJobs,coverageIndex} from '../scripts/openings/common.mjs'

const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),stem='docs/data/opening-taimanov-bd3-p022-r1'
const plan=read(stem+'-plan.json'),design=read(stem+'-design-verification.json')
const proof=read(stem+'-practical-verification.json'),report=read(stem+'-result.json')
const siblings=ALL_OPENING_JOURNEYS.filter(c=>c.family==='sicilian'),course=id=>siblings.find(c=>c.id===id)
function train(c,side,start){
  let index=start,turns=0
  if(index<c.moves.length&&replay(c.moves.slice(0,index)).turn()!==side)index++
  while(index<c.moves.length){
    const r=practiceMove(c.moves,index,side,c.moves[index])
    expect(['correct','complete']).toContain(r.status);expect(r.index).toBeGreaterThan(index)
    index=r.index;turns++
  }
  expect(index).toBe(c.moves.length);expect(turns).toBeGreaterThan(0)
  return {learnerTurns:turns,endpointReached:true}
}

describe('Taimanov Bd3 reviewed source subtree',()=>{
  it('preserves the 302-course baseline, every old exercise and every frozen artifact',()=>{
    const ids=new Set(design.baseline.courses.map(c=>c.id))
    const rows=ALL_OPENING_JOURNEYS.filter(c=>ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(rows).toEqual(design.baseline.courses);expect(rows).toHaveLength(302)
    expect(hash(JSON.stringify(rows))).toBe(plan.baseline.courseDigest)
    const old=practical.entries.filter(c=>ids.has(c.courseId))
    expect(old).toHaveLength(302);expect(hash(JSON.stringify(old))).toBe(plan.baseline.practicalDigest)
    for(const [file,sha] of Object.entries(plan.preserveFiles))expect(hash(fs.readFileSync(file)),file).toBe(sha)
    expect(ALL_OPENING_JOURNEYS).toHaveLength(309);expect(practical.entries).toHaveLength(309);expect(siblings).toHaveLength(48)
    expect(new Set(ALL_OPENING_JOURNEYS.map(c=>c.id)).size).toBe(309)
    expect(new Set(practical.entries.map(c=>c.id)).size).toBe(309)
  })
  it('covers all seven documented leaves and fourteen source positions with separately disclosed authored moves',()=>{
    expect(additions.entries).toHaveLength(7)
    const scope=read('docs/data/opening-scope-audit.json'),records=new Map(scope.records.map(r=>[r.id,r]))
    const sourceRows=scope.records.filter(r=>plan.sourceSubtreePrefixes.some(p=>r.moves===p||r.moves.startsWith(p+' ')))
    const orders=[...new Set(sourceRows.map(r=>r.moves))],leaves=orders.filter(a=>!orders.some(b=>b.startsWith(a+' ')))
    expect(new Set(sourceRows.map(r=>r.groupId)).size).toBe(14)
    expect(additions.entries.map(c=>c.moves.slice(0,c.provenance.documentedPlies).join(' ')).sort()).toEqual(leaves.sort())
    for(const [i,c] of additions.entries.entries()){
      const spec=plan.courses[i],p=c.provenance
      expect(c.moves).toEqual(spec.moves);expect(c.moves).toHaveLength(p.documentedPlies+p.authoredContinuationPlies)
      expect(p.generatedPlies).toBe(0);expect(replay(c.moves).isGameOver()).toBe(false)
      if(p.authoredContinuationPlies)expect(p.continuationStatus).toBe('bounded-engine-checked')
      for(const ref of spec.sourceRecords){
        const r=records.get(ref.id),board=replay(c.moves.slice(0,ref.plies))
        expect(r.moves).toBe(board.history().join(' '));expect(r.groupId).toBe(ref.positionId)
        expect(positionKey(board)).toBe(scope.positions.find(p=>p.id===ref.positionId).position)
      }
      expect(commonPrefix(c.moves,course(spec.existingParentCourseId).moves)).toBe(12)
    }
  })
  it('binds every new pair explanation from Bd3 onward to the exact course for both players',()=>{
    for(const [i,c] of additions.entries.entries()){
      const spec=plan.courses[i]
      expect(Object.keys(spec.editorialNotes).map(Number)).toEqual(Array.from({length:Math.ceil((c.moves.length-12)/2)},(_,n)=>12+2*n))
      for(const [pair,note] of Object.entries(spec.editorialNotes)){
        expect(openingWrittenContext(c,Number(pair)).debrief).toBe(note)
        expect(journeyCoach(c,Number(pair)+1,'b').debrief).toBe(note)
        expect(openingWrittenContext({...c,moves:c.moves.slice(0,-1)},Number(pair)).debrief).not.toBe(note)
      }
    }
  })
  it('completes the seven routes and all 56 directed checkpoints for both learner colors',()=>{
    for(const c of additions.entries)for(const side of ['w','b'])train(c,side,initialPracticeIndex(c.moves,side))
    expect(design.navigation.forks).toHaveLength(56)
    for(const f of design.navigation.forks){
      const from=course(f.from),to=course(f.to),index=commonPrefix(from.moves,to.moves)
      expect(index).toBe(f.index);expect(curriculumReturnIndex(siblings,[from.id],to)).toBe(index)
      expect(curriculumCheckpoint(siblings,to,index)).toEqual({index,reason:'fork'})
      expect([...curriculumFork(siblings,to.moves,index).children.keys()]).toEqual(expect.arrayContaining([from.moves[index],to.moves[index]]))
      expect(practiceMove(from.moves,index,f.turn,to.moves[index]).status).toBe('different-line')
      for(const side of ['w','b'])expect(train(to,side,index)).toEqual(f.training[side])
    }
    const u=plan.navigation.uncoveredAlternative,c=course(u.courseId)
    expect(practiceMove(c.moves,u.index,replay(c.moves.slice(0,u.index)).turn(),u.san).status).toBe('different-line')
    expect(siblings.some(s=>commonPrefix(c.moves,s.moves)>=u.index&&s.moves[u.index]===u.san)).toBe(false)
  })
  it('enumerates every legal immediate exercise reply and completes each actual training answer',()=>{
    let replies=0
    for(const c of additions.entries){
      const spec=plan.courses.find(s=>s.id===c.id),e=exerciseEvidence({...spec,moves:c.moves},plan.enginePlan.minimumImmediateMaterial)
      expect(e).toEqual(design.exercises.find(x=>x.id===e.id));replies+=e.replies.length
      const item=practical.entries.find(x=>x.id===e.id)
      expect(item.moves).toEqual(e.moves);expect(item.startIndex).toBe(spec.exercise.beforeIndex+1)
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,spec.exercise.answer).status).toBe('complete')
    }
    expect(replies).toBe(design.summary.exerciseReplies)
  })
  it('checks every authored comparison and exercise against the frozen job plan and budget',()=>{
    const policy=plan.enginePlan,exercises=plan.courses.map(c=>exerciseEvidence(c,policy.minimumImmediateMaterial)),jobs=engineJobs(plan,exercises)
    expect(jobs).toEqual(design.engineJobs);expect(jobs).toHaveLength(policy.primaryJobs)
    const reused=plan.reuseEngineJobs?.length??0,newPrimary=jobs.length-reused
    expect(proof.reusedJobs??0).toBe(reused);expect(policy.maximumGoCommands).toBe(newPrimary*2)
    expect(proof.goCommands).toBeGreaterThanOrEqual(newPrimary);expect(proof.goCommands).toBeLessThanOrEqual(policy.maximumGoCommands)
    expect(proof.nodesRequested).toBe(proof.goCommands*policy.nodesPerGo)
    expect(proof.nodesRequested).toBeLessThanOrEqual(policy.maximumRequestedNodes)
    expect(proof.continuationChecks).toHaveLength(plan.courses.reduce((n,c)=>n+c.authoredMoves.length,0))
    for(const check of proof.continuationChecks){
      expect(check.acceptanceLoss).toBe(Math.max(0,check.control.cp-check.selected.cp))
      expect(check.acceptanceLoss).toBeLessThanOrEqual(policy.maximumAuthoredMoveLossCp)
      const c=course(check.courseId)
      expect(check.fen).toBe(replay(c.moves.slice(0,check.authoredIndex)).fen());expect(check.san).toBe(c.moves[check.authoredIndex])
    }
    expect(proof.evidence).toHaveLength(7)
    for(const e of proof.evidence){expect(e.cpChange).toBe(e.baseline.cp+e.search.cp);expect(e.cpChange).toBeGreaterThanOrEqual(policy.minimumExerciseSwingCp)}
  })
  it('computes source coverage across the complete corpus and keeps the historical report distinct',()=>{
    const scope=read('docs/data/opening-scope-audit.json'),actual=coverageIndex(ALL_OPENING_JOURNEYS,scope)
    expect(actual.coverage).toEqual(plan.expectedCoverage);expect(report.coverage).toEqual(plan.expectedCoverage)
    const covered=new Map(actual.states.map(p=>[p.id,p.state]))
    expect(design.sourceSubtree.positionIds).toHaveLength(14)
    for(const id of design.sourceSubtree.positionIds)expect(covered.get(id)).toBe('exact')
    expect(report.newlyReached.filter(p=>p.state==='exact')).toHaveLength(design.summary.newExactPositions)
    expect(report.newlyReached.filter(p=>p.state==='transposition-only')).toHaveLength(design.summary.newTransposedPositions)
  })
  it('checks the actual attacks, blocked diagonals and recapture structures in every reviewed geometry fact',()=>{
    const checks={
      'Bd3 supports e4, own e4 pawn blocks attack on h7':b=>b.attackers('e4','w').includes('d3')&&!b.attackers('h7','w').includes('d3')&&b.get('e4')?.type==='p',
      'b5 controls c4, Ng8 undeveloped':b=>b.attackers('c4','b').includes('b5')&&b.get('g8')?.type==='n',
      'Nf6 attacks e4, Nc3 and Bd3 defend e4':b=>b.attackers('e4','b').includes('f6')&&['c3','d3'].every(s=>b.attackers('e4','w').includes(s)),
      'Qxc6 leaves queen c6, d7 pawn, kings e1/e8':b=>b.get('c6')?.type==='q'&&b.get('d7')?.type==='p'&&b.get('e1')?.type==='k'&&b.get('e8')?.type==='k',
      'White castled, Nf6 attacks e4, b5 controls c4':b=>b.get('g1')?.type==='k'&&b.attackers('e4','b').includes('f6')&&b.attackers('c4','b').includes('b5'),
      'd-pawn recaptured c6, controls d5 and blocks Qc7 down c-file':b=>!b.get('d7')&&b.get('c6')?.type==='p'&&b.attackers('d5','b').includes('c6')&&!b.attackers('c2','b').includes('c7'),
      'Bd6 attacks e5/h2 and occupies d7 pawn advance square':b=>b.get('d7')?.type==='p'&&b.get('d6')?.type==='b'&&['e5','h2'].every(s=>b.attackers(s,'b').includes('d6')),
      'Bd6 still attacks h2 after central recapture':b=>b.attackers('h2','b').includes('d6'),
      'h5 controls g4 not g5; blocks rook h8 line to h2':b=>b.attackers('g4','b').includes('h5')&&!b.attackers('g5','b').includes('h5')&&!b.attackers('h2','b').includes('h8'),
      'Nc6 captured Nd4, vacating c6':b=>!b.get('c6')&&b.get('d4')?.type==='n'&&b.get('d4')?.color==='b',
      'Bc5 and Bd4 attack each other':b=>b.attackers('d4','b').includes('c5')&&b.attackers('c5','w').includes('d4'),
      'Qc5 attacks Nc3 defended by b2; surviving bishops d3/c8':b=>b.attackers('c3','b').includes('c5')&&b.attackers('c3','w').includes('b2')&&b.get('d3')?.type==='b'&&b.get('c8')?.type==='b',
      'Ne5 attacks Bd3 and blocks Qc7 diagonal to h2':b=>b.attackers('d3','b').includes('e5')&&!b.attackers('h2','b').includes('c7'),
      'h3 controls g4; Bc5 attacks Nd4 defended by Be3; Nd4 can move':b=>b.attackers('g4','w').includes('h3')&&b.attackers('d4','b').includes('c5')&&b.attackers('d4','w').includes('e3')&&b.moves({verbose:true}).some(m=>m.from==='d4'),
      'Kings h1/g8 and rook f8, Ne5 still attacks Bd3':b=>b.get('h1')?.type==='k'&&b.get('g8')?.type==='k'&&b.get('f8')?.type==='r'&&b.attackers('d3','b').includes('e5'),
      'h3 and h5 both control g4, Nf6 can legally move to g4':b=>b.attackers('g4','w').includes('h3')&&b.attackers('g4','b').includes('h5')&&b.moves().includes('Ng4'),
      'Nc6 captured Nd4 and vacated c6; Be3 can recapture':b=>!b.get('c6')&&b.get('d4')?.type==='n'&&b.get('d4')?.color==='b'&&b.moves().includes('Bxd4'),
      'Bc5 and Bd4 attack each other, h3 and h5 retained':b=>b.attackers('d4','b').includes('c5')&&b.attackers('c5','w').includes('d4')&&b.get('h3')?.type==='p'&&b.get('h5')?.type==='p',
      'Qc5 attacks Nc3 defended by b2, surviving bishops d3/c8, king e8':b=>b.attackers('c3','b').includes('c5')&&b.attackers('c3','w').includes('b2')&&b.get('d3')?.type==='b'&&b.get('c8')?.type==='b'&&b.get('e8')?.type==='k',
    }
    expect(new Set(design.geometryFacts.map(f=>f.courseId)).size).toBe(7)
    for(const fact of design.geometryFacts){
      const board=replay(course(fact.courseId).moves.slice(0,fact.index))
      expect(board.fen(),fact.label).toBe(fact.fen)
      expect(checks[fact.label],fact.label).toBeTypeOf('function')
      expect(checks[fact.label](board),fact.label).toBe(true)
    }
  })
})
