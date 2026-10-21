import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS,journeyCoach,openingWrittenContext} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumFork,curriculumReturnIndex,curriculumCheckpoint} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import additions from '../src/data/openingChekhoverCourses.js'

const json=file=>JSON.parse(fs.readFileSync(file,'utf8')),hash=v=>createHash('sha256').update(v).digest('hex')
const plan=json('docs/data/opening-chekhover-p022-plan.json'),design=json('docs/data/opening-chekhover-p022-design-verification.json')
const proof=json('docs/data/opening-chekhover-p022-practical-verification.json'),catalog=json('src/data/openingCatalog.json')
const replay=moves=>{const b=new Chess();for(const san of moves)b.move(san);return b}
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)
const siblings=ALL_OPENING_JOURNEYS.filter(c=>c.family==='sicilian')
const parent=siblings.find(c=>c.id==='sicilian:chekhover-bd7')

describe('Chekhover documented branches and strict continuation',()=>{
  it('preserves the 283-course baseline and every frozen artifact',()=>{
    const ids=new Set(design.baseline.courses.map(c=>c.id))
    const rows=ALL_OPENING_JOURNEYS.filter(c=>ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(rows).toEqual(design.baseline.courses);expect(hash(JSON.stringify(rows))).toBe(plan.baseline.courseDigest)
    const old=practical.entries.filter(c=>ids.has(c.courseId))
    expect(old).toHaveLength(283);expect(hash(JSON.stringify(old))).toBe(plan.baseline.practicalDigest)
    for(const [file,sha] of Object.entries(plan.preserveFiles))expect(hash(fs.readFileSync(file)),file).toBe(sha)
    expect(ALL_OPENING_JOURNEYS).toHaveLength(286);expect(practical.entries).toHaveLength(286)
    expect(siblings).toHaveLength(25)
  })
  it('binds four source records and four new notes to their exact sequences',()=>{
    for(const [i,course] of additions.entries.entries()){
      const spec=plan.courses[i]
      expect(course.moves).toEqual(spec.moves)
      for(const record of spec.sourceRecords){
        expect(course.moves.slice(0,record.plies)).toEqual(catalog.entries.find(c=>c.id===record.id.slice(4)).moves)
      }
      expect(course.provenance).toMatchObject(spec.provenance)
      expect(course.moves.length).toBe(spec.provenance.documentedPlies+spec.provenance.authoredContinuationPlies)
      for(const [pair,note] of Object.entries(spec.editorialNotes)){
        expect(openingWrittenContext(course,Number(pair)).debrief).toBe(note)
        expect(openingWrittenContext({...course,moves:course.moves.slice(0,-1)},Number(pair)).debrief).not.toBe(note)
      }
    }
    const [c4,qd3,qd2]=additions.entries.map(c=>replay(c.moves))
    expect(c4.get('f8')).toEqual({type:'b',color:'b'});expect(c4.get('e8')?.type).toBe('k')
    expect(qd3.get('h1')?.type).toBe('r');expect(qd3.get('e1')).toBeUndefined()
    expect(qd2.get('c7')?.type).toBe('q');expect(qd2.get('c6')?.type).toBe('b')
    for(const s of ['b8','c8','d8','e8'])expect(qd2.get(s)).toBeUndefined()
  })
  it('plays both colors to the endpoint and resumes each new route with active learner moves',()=>{
    for(const course of additions.entries)for(const side of ['w','b']){
      const spec=plan.courses.find(c=>c.id===course.id)
      for(const start of [initialPracticeIndex(course.moves,side),spec.sharedPrefixPlies]){
        let index=start,turns=0
        if(replay(course.moves.slice(0,index)).turn()!==side)index++
        while(index<course.moves.length){
          const coach=journeyCoach(course,index,side),board=replay(course.moves.slice(0,index))
          expect(board.turn()).toBe(side);expect(coach.before).toBe(board.fen())
          const result=practiceMove(course.moves,index,side,coach.san)
          expect(['correct','complete']).toContain(result.status);index=result.index;turns++
        }
        expect(index).toBe(course.moves.length);expect(turns).toBeGreaterThan(0)
      }
    }
  })
  it('keeps real forks separate from continuation and restarts a contained destination',()=>{
    for(const course of additions.entries){
      const spec=plan.courses.find(c=>c.id===course.id),prefix=spec.sharedPrefixPlies
      expect(commonPrefix(parent.moves,course.moves)).toBe(prefix)
      expect(curriculumReturnIndex(siblings,[parent.id],course)).toBe(prefix)
      if(spec.relationship==='fork'){
        expect(curriculumFork(siblings,course.moves,prefix)?.children.has(parent.moves[prefix])).toBe(true)
        expect(curriculumCheckpoint(siblings,course,prefix)).toEqual({index:prefix,reason:'fork'})
      }else{
        expect(curriculumFork(siblings,course.moves,prefix)).toBeNull()
        expect(curriculumCheckpoint(siblings,course,prefix)).toEqual({index:20,reason:'continuation'})
        const reverse=curriculumReturnIndex(siblings,[course.id],parent)
        expect(reverse).toBe(parent.moves.length)
        // Regression: returning the raw index would leave no learner move.
        expect(curriculumCheckpoint(siblings,parent,reverse)).toEqual({index:0,reason:'contained-route'})
        expect(curriculumCheckpoint(siblings,parent,reverse+2)).toEqual({index:0,reason:'contained-route'})
      }
    }
  })
  it('supports bishop targets and an endpoint exercise, with every immediate reply checked',()=>{
    for(const spec of plan.courses){
      const ex=spec.exercise,item=practical.entries.find(c=>c.id===ex.id),b=replay(spec.moves.slice(0,ex.beforeIndex))
      const initial=material(b,ex.exerciseSide)
      b.move(ex.mistake)
      expect(b.moves({verbose:true}).filter(m=>m.captured===ex.capturedType).map(m=>m.san)).toEqual([ex.answer])
      expect(b.move(ex.answer).captured).toBe(ex.capturedType)
      const gains=b.moves().map(san=>{b.move(san);expect(b.isGameOver()).toBe(false);const gain=material(b,ex.exerciseSide)-initial;b.undo();return gain})
      expect(gains).toHaveLength(ex.expectedLegalImmediateReplies)
      expect(Math.min(...gains)).toBe(ex.expectedMinimumImmediateMaterialGain)
      expect(item.moves).toEqual(b.history());expect(item.startIndex).toBe(ex.beforeIndex+1)
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,ex.answer).status).toBe('complete')
    }
    expect(plan.courses[1].exercise.beforeIndex).toBe(plan.courses[1].moves.length)
  })
  it('checks both authored moves from the same FEN and reuses the Dd2 baseline',()=>{
    expect(proof.goCommands).toBe(9);expect(proof.nodesRequested).toBe(1800000)
    expect(proof.continuationChecks.map(c=>c.acceptanceLoss)).toEqual([3,28])
    for(const c of proof.continuationChecks){
      expect(c.signedCpDifference).toBe(c.control.cp-c.selected.cp)
      expect(c.acceptanceLoss).toBeLessThanOrEqual(plan.enginePlan.maximumAuthoredMoveLossCp)
      expect(design.engineJobs.find(j=>j.id===c.controlId).fen).toBe(design.engineJobs.find(j=>j.id===c.selectedId).fen)
    }
    expect(proof.evidence.map(e=>e.cpChange)).toEqual([486,624,491])
    for(const e of proof.evidence){
      expect(e.cpChange).toBe(e.search.cp+e.baseline.cp)
      expect(e.cpChange).toBeGreaterThanOrEqual(plan.enginePlan.minimumExerciseSwingCp)
    }
    expect(proof.evidence[2].baselineJobId).toBe(proof.continuationChecks[1].controlId)
    expect(proof.evidence[2].baseline).toEqual(proof.continuationChecks[1].control)
  })
})
