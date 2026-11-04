import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS,journeyCoach,openingWrittenContext} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumFork,curriculumReturnIndex,curriculumCheckpoint} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import additions from '../src/data/openingChekhoverEarlyCourses.js'

const json=file=>JSON.parse(fs.readFileSync(file,'utf8')),hash=v=>createHash('sha256').update(v).digest('hex')
const plan=json('docs/data/opening-chekhover-early-p022-plan.json'),design=json('docs/data/opening-chekhover-early-p022-design-verification.json')
const proof=json('docs/data/opening-chekhover-early-p022-practical-verification.json'),catalog=json('src/data/openingCatalog.json')
const result=json('docs/data/opening-chekhover-early-p022-result.json')
const replay=moves=>{const b=new Chess();for(const san of moves)b.move(san);return b}
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)
const siblings=ALL_OPENING_JOURNEYS.filter(c=>c.family==='sicilian')

describe('early Chekhover orders and independent progress',()=>{
  it('preserves all 288 previous courses and exercises and 134 frozen files',()=>{
    const ids=new Set(design.baseline.courses.map(c=>c.id))
    const rows=ALL_OPENING_JOURNEYS.filter(c=>ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(rows).toEqual(design.baseline.courses);expect(hash(JSON.stringify(rows))).toBe(plan.baseline.courseDigest)
    const old=practical.entries.filter(c=>ids.has(c.courseId))
    expect(old).toHaveLength(288);expect(hash(JSON.stringify(old))).toBe(plan.baseline.practicalDigest)
    expect(Object.keys(plan.preserveFiles)).toHaveLength(134)
    for(const [file,sha] of Object.entries(plan.preserveFiles))expect(hash(fs.readFileSync(file)),file).toBe(sha)
    expect(ALL_OPENING_JOURNEYS).toHaveLength(309);expect(practical.entries).toHaveLength(309)
    expect(siblings).toHaveLength(48)
  })
  it('adds three source positions and separates all three authored plies from the source',()=>{
    expect(new Set(plan.courses.flatMap(c=>c.sourceRecords.map(r=>r.positionId))).size).toBe(3)
    expect(result.scope.newlyReached).toHaveLength(3)
    expect(result.scope.coverage).toEqual({exact:1952,'transposition-only':201,absent:10169})
    expect(result.scope.chekhover).toEqual({positions:22,remainingAbsent:[]})
    for(const [i,course] of additions.entries.entries()){
      const spec=plan.courses[i]
      expect(course.moves).toEqual(spec.moves);expect(course.provenance).toMatchObject(spec.provenance)
      expect(course.provenance.continuationStatus).toBe('bounded-engine-checked')
      for(const record of spec.sourceRecords)
        expect(course.moves.slice(0,record.plies)).toEqual(catalog.entries.find(c=>c.id===record.id.slice(4)).moves)
      expect(spec.authoredMoves.map(m=>m.index)).toEqual(Array.from({length:spec.provenance.authoredContinuationPlies},(_,i)=>spec.provenance.documentedPlies+i))
    }
    expect(additions.entries.map(c=>[c.provenance.documentedPlies,c.provenance.authoredContinuationPlies])).toEqual([[9,1],[8,2]])
  })
  it('binds notes to the actual Black reply and distinguishes the open bishop diagonal',()=>{
    for(const [i,course] of additions.entries.entries())for(const [pair,note] of Object.entries(plan.courses[i].editorialNotes)){
      expect(openingWrittenContext(course,Number(pair)).debrief).toBe(note)
      expect(journeyCoach(course,Number(pair)+1,'b').debrief).toBe(note)
      expect(openingWrittenContext({...course,moves:course.moves.slice(0,-1)},Number(pair)).debrief).not.toBe(note)
    }
    const nf6=replay(additions.entries[0].moves.slice(0,8)),bd7=replay(additions.entries[1].moves.slice(0,8))
    expect(nf6.attackers('e4','b')).toContain('f6');expect(nf6.attackers('e4','w')).toContain('d4')
    expect(nf6.isAttacked('d4','b')).toBe(false)
    for(const sq of ['b8','g8'])expect(bd7.get(sq)).toEqual({type:'n',color:'b'})
    expect(bd7.attackers('a4','b')).toContain('d7')
    const old=replay(siblings.find(c=>c.id==='sicilian:chekhover-bd7').moves.slice(0,10))
    expect(old.get('c6')?.type).toBe('n');expect(old.attackers('a4','b')).not.toContain('d7')
    const end=replay(additions.entries[0].moves)
    expect(end.attackers('e4','w')).toEqual(expect.arrayContaining(['d4','c3']))
    expect(end.get('b8')?.type).toBe('n');expect(end.get('f8')?.type).toBe('b')
  })
  it('keeps the convergent orders distinct and resumes at prefix 7 in both colors',()=>{
    const [a,b]=additions.entries
    expect(a.id).not.toBe(b.id);expect(a.moves).not.toEqual(b.moves)
    expect(replay(a.moves).fen()).toBe(replay(b.moves).fen())
    expect(commonPrefix(a.moves,b.moves)).toBe(7)
    const runs=additions.entries.map(course=>({course,index:0}))
    expect(design.navigation.forks).toHaveLength(6)
    for(const fork of design.navigation.forks){
      const from=siblings.find(c=>c.id===fork.from),course=siblings.find(c=>c.id===fork.to)
      expect(commonPrefix(from.moves,course.moves)).toBe(7)
      expect(curriculumReturnIndex(siblings,[from.id],course)).toBe(7)
      expect(curriculumCheckpoint(siblings,course,7)).toEqual({index:7,reason:'fork'})
      expect(practiceMove(from.moves,7,'b',course.moves[7]).status).toBe('different-line')
      runs.push({course,index:7})
    }
    for(const run of runs)for(const side of ['w','b']){
      let index=run.index===0?initialPracticeIndex(run.course.moves,side):run.index,turns=0
      if(replay(run.course.moves.slice(0,index)).turn()!==side)index++
      while(index<run.course.moves.length){
        const coach=journeyCoach(run.course,index,side)
        expect(coach.before).toBe(replay(run.course.moves.slice(0,index)).fen())
        const response=practiceMove(run.course.moves,index,side,coach.san)
        expect(['correct','complete']).toContain(response.status);index=response.index;turns++
      }
      expect(index).toBe(run.course.moves.length);expect(turns).toBeGreaterThan(0)
    }
  })
  it('offers four root choices and leaves legal Be3 uncovered after Nf6',()=>{
    const parent=siblings.find(c=>c.id==='sicilian:chekhover-bd7')
    expect([...curriculumFork(siblings,parent.moves,7).children.keys()]).toEqual(['Nc6','a6','Nf6','Bd7'])
    for(const course of additions.entries){
      const representative=siblings.find(c=>parent.moves.slice(0,7).every((m,i)=>c.moves[i]===m)&&c.moves[7]===course.moves[7])
      expect(representative.id).toBe(course.id)
      expect(practiceMove(course.moves,7,'b',course.moves[7])).toMatchObject({status:'correct',index:9})
      expect(practiceMove(course.moves,9,'b',course.moves[9])).toMatchObject({status:'complete',index:10})
      expect(practiceMove(course.moves,8,'w','Nc3')).toMatchObject({status:'complete',index:10})
    }
    const course=additions.entries[0]
    expect(practiceMove(course.moves,8,'w','Be3').status).toBe('different-line')
    expect(siblings.some(c=>course.moves.slice(0,8).every((m,i)=>c.moves[i]===m)&&c.moves[8]==='Be3')).toBe(false)
  })
  it('validates all 60 immediate replies and the limited material claims',()=>{
    for(const spec of plan.courses){
      const ex=spec.exercise,item=practical.entries.find(c=>c.id===ex.id),b=replay(spec.moves.slice(0,ex.beforeIndex))
      const initial=material(b,ex.exerciseSide)
      b.move(ex.mistake)
      expect(b.isCheck()).toBe(false)
      expect(b.moves({verbose:true}).filter(m=>m.captured===ex.capturedType).map(m=>m.san)).toEqual([ex.answer])
      b.move(ex.answer)
      const gains=b.moves().map(san=>{b.move(san);expect(b.isGameOver()).toBe(false);const gain=material(b,ex.exerciseSide)-initial;b.undo();return gain})
      expect(gains).toHaveLength(ex.expectedLegalImmediateReplies)
      expect(Math.min(...gains)).toBe(ex.expectedMinimumImmediateMaterialGain)
      expect(item.moves).toEqual(b.history());expect(item.startIndex).toBe(ex.beforeIndex+1)
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,ex.answer).status).toBe('complete')
    }
    const first=new Chess(proof.evidence[0].answerFen);first.move('Nc6')
    expect(first.attackers('d4','b')).toContain('c6')
    expect(proof.evidence.map(e=>e.minimumImmediateMaterialGain)).toEqual([3,9])
  })
  it('checks each authored move separately and reuses exactly two controls as exercise baselines',()=>{
    expect(proof.goCommands).toBe(8);expect(proof.nodesRequested).toBe(1600000)
    expect(proof.continuationChecks.map(c=>[c.courseId,c.authoredIndex,c.san,c.acceptanceLoss])).toEqual([
      ['sicilian:chekhover-nf6',9,'Bd7',46],['sicilian:chekhover-early-bd7',8,'Nc3',19],['sicilian:chekhover-early-bd7',9,'Nf6',24]])
    for(const c of proof.continuationChecks){
      const jobs=design.engineJobs.filter(j=>j.courseId===c.courseId&&j.authoredIndex===c.authoredIndex)
      expect(jobs).toHaveLength(2);expect(jobs[0].fen).toBe(jobs[1].fen)
      expect(c.fen).toBe(replay(siblings.find(x=>x.id===c.courseId).moves.slice(0,c.authoredIndex)).fen())
      expect(c.signedCpDifference).toBe(c.control.cp-c.selected.cp)
      expect(c.acceptanceLoss).toBe(Math.max(0,c.signedCpDifference));expect(c.acceptanceLoss).toBeLessThanOrEqual(100)
    }
    expect(design.engineJobs.filter(j=>j.uses.includes('exercise-baseline'))).toHaveLength(2)
    expect(proof.evidence.map(e=>e.cpChange)).toEqual([561,719])
    for(const [i,e] of proof.evidence.entries()){
      const control=proof.continuationChecks[i]
      expect(e.baselineJobId).toBe(control.controlId);expect(e.baseline).toEqual(control.control)
      expect(e.cpChange).toBe(e.search.cp+e.baseline.cp);expect(e.cpChange).toBeGreaterThanOrEqual(200)
    }
  })
})
