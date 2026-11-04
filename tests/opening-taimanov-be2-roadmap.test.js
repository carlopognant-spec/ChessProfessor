import fs from 'node:fs'
import {describe,it,expect} from 'vitest'
import additions from '../src/data/openingTaimanovBe2Courses.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import {ALL_OPENING_JOURNEYS,openingWrittenContext,journeyCoach} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumReturnIndex,curriculumCheckpoint,curriculumFork} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import {hash,replay,positionKey,exerciseEvidence,engineJobs,coverageIndex} from '../scripts/openings/common.mjs'

const read=f=>JSON.parse(fs.readFileSync(f,'utf8'))
const stem='docs/data/opening-taimanov-be2-p022-r1'
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

describe('Taimanov Ae2 reviewed revision R1',()=>{
  it('preserves all 293 previous courses and exercises and 218 frozen artifacts',()=>{
    const ids=new Set(design.baseline.courses.map(c=>c.id))
    const rows=ALL_OPENING_JOURNEYS.filter(c=>ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(rows).toEqual(design.baseline.courses);expect(hash(JSON.stringify(rows))).toBe(plan.baseline.courseDigest)
    const old=practical.entries.filter(c=>ids.has(c.courseId))
    expect(old).toHaveLength(293);expect(hash(JSON.stringify(old))).toBe(plan.baseline.practicalDigest)
    expect(Object.keys(plan.preserveFiles)).toHaveLength(218)
    for(const [file,sha] of Object.entries(plan.preserveFiles))expect(hash(fs.readFileSync(file)),file).toBe(sha)
    expect(ALL_OPENING_JOURNEYS).toHaveLength(309);expect(practical.entries).toHaveLength(309);expect(siblings).toHaveLength(48)
    expect(new Set(ALL_OPENING_JOURNEYS.map(c=>c.id)).size).toBe(309)
    expect(new Set(practical.entries.map(c=>c.id)).size).toBe(309)
  })
  it('keeps all nine documented source orders separate from the 18 authored half-moves',()=>{
    expect(additions.entries).toHaveLength(9)
    const scope=read('docs/data/opening-scope-audit.json'),records=new Map(scope.records.map(r=>[r.id,r]))
    let documented=0,authored=0,notes=0
    for(const [i,c] of additions.entries.entries()){
      const spec=plan.courses[i],p=c.provenance
      expect(c.moves).toEqual(spec.moves);expect(c.moves).toHaveLength(p.documentedPlies+p.authoredContinuationPlies)
      expect(p.generatedPlies).toBe(0);expect(p.continuationStatus).toBe('bounded-engine-checked')
      expect(replay(c.moves).isGameOver()).toBe(false)
      for(const ref of spec.sourceRecords)expect(records.get(ref.id).moves).toBe(c.moves.slice(0,ref.plies).join(' '))
      for(const [pair,note] of Object.entries(spec.editorialNotes)){
        expect(openingWrittenContext(c,Number(pair)).debrief).toBe(note)
        expect(journeyCoach(c,Number(pair)+1,'b').debrief).toBe(note)
        expect(openingWrittenContext({...c,moves:c.moves.slice(0,-1)},Number(pair)).debrief).not.toBe(note);notes++
      }
      documented+=p.documentedPlies;authored+=p.authoredContinuationPlies
    }
    expect([documented,authored,notes]).toEqual([150,18,48])
    expect(additions.entries[0].moves.slice(14)).toEqual(['Ndb5','axb5','Nxb5','Qa5+','Bd2','Qb6'])
  })
  it('completes all courses and all 90 directed exact SAN checkpoints in both colors',()=>{
    for(const c of additions.entries)for(const side of ['w','b'])train(c,side,initialPracticeIndex(c.moves,side))
    expect(design.navigation.forks).toHaveLength(90)
    for(const f of design.navigation.forks){
      const from=course(f.from),to=course(f.to),index=commonPrefix(from.moves,to.moves)
      expect(index).toBe(f.index);expect(curriculumReturnIndex(siblings,[from.id],to)).toBe(index)
      expect(curriculumCheckpoint(siblings,to,index)).toEqual({index,reason:'fork'})
      expect([...curriculumFork(siblings,to.moves,index).children.keys()]).toEqual(expect.arrayContaining([from.moves[index],to.moves[index]]))
      expect(practiceMove(from.moves,index,f.turn,to.moves[index]).status).toBe('different-line')
      for(const side of ['w','b'])expect(train(to,side,index)).toEqual(f.training[side])
    }
  })
  it('checks all 322 legal immediate exercise replies and the actual training answers',()=>{
    let replies=0
    for(const c of additions.entries){
      const spec=plan.courses.find(s=>s.id===c.id),e=exerciseEvidence({...spec,moves:c.moves},2)
      expect(e).toEqual(design.exercises.find(x=>x.id===e.id));replies+=e.replies.length
      const item=practical.entries.find(x=>x.id===e.id)
      expect(item.moves).toEqual(e.moves);expect(item.startIndex).toBe(spec.exercise.beforeIndex+1)
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,spec.exercise.answer).status).toBe('complete')
    }
    expect(replies).toBe(322)
    expect(plan.courses[0].exercise).toMatchObject({beforeIndex:15,mistake:'Qxh2',answer:'Rxh2',exerciseSide:'w',expectedMinimumImmediateMaterialGain:5})
  })
  it('replays the 45 logical engine jobs, retaining 34 compatible results and the new-search budget',()=>{
    const exercises=plan.courses.map(c=>exerciseEvidence(c,2)),jobs=engineJobs(plan,exercises)
    expect(jobs).toEqual(design.engineJobs);expect(jobs).toHaveLength(45)
    expect(proof.reusedJobs).toBe(34);expect(proof.reusedEvidence).toHaveLength(34)
    expect(proof.goCommands).toBeGreaterThanOrEqual(11);expect(proof.goCommands).toBeLessThanOrEqual(22)
    expect(proof.nodesRequested).toBe(proof.goCommands*200000)
    expect(proof.continuationChecks).toHaveLength(18)
    for(const check of proof.continuationChecks){
      expect(check.acceptanceLoss).toBe(Math.max(0,check.control.cp-check.selected.cp))
      expect(check.acceptanceLoss).toBeLessThanOrEqual(100)
      const c=course(check.courseId)
      expect(check.fen).toBe(replay(c.moves.slice(0,check.authoredIndex)).fen())
      expect(check.san).toBe(c.moves[check.authoredIndex])
    }
    expect(proof.evidence).toHaveLength(9)
    for(const e of proof.evidence){expect(e.cpChange).toBe(e.baseline.cp+e.search.cp);expect(e.cpChange).toBeGreaterThanOrEqual(200)}
  })
  it('counts coverage against all source positions and keeps converged move orders separate',()=>{
    const scope=read('docs/data/opening-scope-audit.json'),actual=coverageIndex([...design.baseline.courses,...additions.entries],scope)
    expect(actual.coverage).toEqual(plan.expectedCoverage);expect(report.coverage).toEqual(plan.expectedCoverage)
    expect(report.newlyReached.filter(p=>p.state==='exact')).toHaveLength(24)
    expect(report.newlyReached.filter(p=>p.state==='transposition-only')).toHaveLength(1)
    const [a,b]=design.navigation.internalConvergence.courseIds.map(course)
    expect(positionKey(replay(a.moves))).toBe(positionKey(replay(b.moves)))
    expect(replay(a.moves).fen()).not.toBe(replay(b.moves).fen());expect(commonPrefix(a.moves,b.moves)).toBe(14)
    expect(curriculumReturnIndex(siblings,[a.id],b)).toBe(14)
    const u=plan.navigation.uncoveredAlternative,c=course(u.courseId)
    expect(practiceMove(c.moves,u.index,replay(c.moves.slice(0,u.index)).turn(),u.san).status).toBe('different-line')
    expect(siblings.some(s=>commonPrefix(c.moves,s.moves)>=u.index&&s.moves[u.index]===u.san)).toBe(false)
  })
  it('binds all 29 reviewed geometry facts to the actual board and checks the revised forcing sequence',()=>{
    expect(design.geometryFacts).toHaveLength(29)
    for(const fact of design.geometryFacts)expect(replay(course(fact.courseId).moves.slice(0,fact.index)).fen(),fact.label).toBe(fact.fen)
    const [nge7,,a3b5,castleB5,castleBe7,a3be7,exchange,na4,nb6]=additions.entries
    const at=(c,n)=>replay(c.moves.slice(0,n))
    expect(at(nge7,10).attackers('c2','b')).not.toContain('c7')
    expect(at(nge7,12).attackers('d4','w')).toContain('e3');expect(at(nge7,12).get('d7')?.type).toBe('p')
    expect(at(nge7,14).get('e7')?.type).toBe('n');expect(at(nge7,14).attackers('e4','b')).not.toContain('e7')
    expect(at(nge7,16).moves()).toContain('Nxb5');expect(at(nge7,17).attackers('c7','w')).toContain('b5')
    expect(at(nge7,18).isCheck()).toBe(true);expect(at(nge7,18).moves()).toContain('Bd2')
    expect(at(nge7,20).isCheck()).toBe(false);expect(at(nge7,20).attackers('b5','b')).toContain('b6')
    expect(at(nge7,20).attackers('b5','w')).toContain('e2')
    for(const c of [a3b5,castleB5,castleBe7,a3be7,exchange,na4,nb6]){
      expect(at(c,14).attackers('e4','b')).toContain('f6');expect(at(c,14).attackers('e4','w')).toContain('c3')
    }
    for(const c of [a3b5,castleB5]){expect(at(c,18).attackers('e4','b')).not.toContain('b7');expect(at(c,18).attackers('b4','w')).toContain('a3')}
    expect(at(castleBe7,18).attackers('e5','w')).toContain('f4');expect(at(castleBe7,18).attackers('e5','b')).toContain('d6')
    for(const c of [exchange,na4,nb6]){expect(at(c,16).get('g1')?.type).toBe('k');expect(at(c,16).moves()).toContain('Na4')}
    expect(at(exchange,18).attackers('d5','b')).toContain('c6');expect(at(na4,18).isAttacked('e4','w')).toBe(false)
    expect(at(nb6,21).attackers('a8','w')).toContain('b6');expect(at(nb6,21).attackers('c8','w')).toContain('b6')
    expect(at(nb6,21).attackers('c7','w')).not.toContain('b6');expect(at(nb6,21).attackers('b6','w')).toContain('e3')
    expect(at(nb6,22).attackers('c8','b')).toContain('b8')
  })
})
