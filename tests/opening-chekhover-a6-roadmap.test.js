import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS,journeyCoach,openingWrittenContext} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumFork,curriculumReturnIndex,curriculumCheckpoint} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import additions from '../src/data/openingChekhoverA6Courses.js'

const json=file=>JSON.parse(fs.readFileSync(file,'utf8')),hash=v=>createHash('sha256').update(v).digest('hex')
const plan=json('docs/data/opening-chekhover-a6-p022-plan.json'),design=json('docs/data/opening-chekhover-a6-p022-design-verification.json')
const proof=json('docs/data/opening-chekhover-a6-p022-practical-verification.json'),catalog=json('src/data/openingCatalog.json')
const result=json('docs/data/opening-chekhover-a6-p022-result.json')
const replay=moves=>{const b=new Chess();for(const san of moves)b.move(san);return b}
const material=(b,side)=>b.board().flat().filter(Boolean).reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)
const siblings=ALL_OPENING_JOURNEYS.filter(c=>c.family==='sicilian')

describe('Chekhover a6 source subtree and player-controlled branches',()=>{
  it('preserves all 286 earlier courses and exercises and the 108 frozen files',()=>{
    const ids=new Set(design.baseline.courses.map(c=>c.id))
    const rows=ALL_OPENING_JOURNEYS.filter(c=>ids.has(c.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(rows).toEqual(design.baseline.courses);expect(hash(JSON.stringify(rows))).toBe(plan.baseline.courseDigest)
    const old=practical.entries.filter(c=>ids.has(c.courseId))
    expect(old).toHaveLength(286);expect(hash(JSON.stringify(old))).toBe(plan.baseline.practicalDigest)
    expect(Object.keys(plan.preserveFiles)).toHaveLength(108)
    for(const [file,sha] of Object.entries(plan.preserveFiles))expect(hash(fs.readFileSync(file)),file).toBe(sha)
    expect(ALL_OPENING_JOURNEYS).toHaveLength(293);expect(practical.entries).toHaveLength(293)
    expect(siblings).toHaveLength(32)
  })
  it('counts the shared source node once and separates the one authored reply',()=>{
    expect(new Set(plan.courses.flatMap(c=>c.sourceRecords.map(r=>r.positionId))).size).toBe(5)
    expect(result.scope.newlyReached).toHaveLength(5)
    expect(result.scope.coverage).toEqual({exact:1949,'transposition-only':201,absent:10172})
    expect(result.scope.chekhover.remainingAbsent.map(r=>r.id).sort()).toEqual([
      'position:c9c6ddc7d60aa2cf','position:7161d5217d6da902','position:2b356881d43ce8ce'].sort())
    for(const [i,course] of additions.entries.entries()){
      const spec=plan.courses[i]
      expect(course.moves).toEqual(spec.moves);expect(course.provenance).toMatchObject(spec.provenance)
      for(const record of spec.sourceRecords)
        expect(course.moves.slice(0,record.plies)).toEqual(catalog.entries.find(c=>c.id===record.id.slice(4)).moves)
      expect(course.provenance.documentedPlies+course.provenance.authoredContinuationPlies).toBe(course.moves.length)
    }
    expect(additions.entries.map(c=>[c.provenance.documentedPlies,c.provenance.authoredContinuationPlies])).toEqual([[9,1],[12,0]])
  })
  it('binds the changed Black reply at pair 6 and the later notes to the actual board',()=>{
    for(const [i,course] of additions.entries.entries())for(const [pair,note] of Object.entries(plan.courses[i].editorialNotes)){
      expect(openingWrittenContext(course,Number(pair)).debrief).toBe(note)
      expect(journeyCoach(course,Number(pair)+1,'b').debrief).toBe(note)
      expect(openingWrittenContext({...course,moves:course.moves.slice(0,-1)},Number(pair)).debrief).not.toBe(note)
    }
    const root=replay(additions.entries[0].moves.slice(0,8)),be3=replay(additions.entries[0].moves),c4=replay(additions.entries[1].moves)
    expect(root.get('a6')).toEqual({type:'p',color:'b'});expect(root.get('b8')?.type).toBe('n')
    expect(root.isAttacked('d4','b')).toBe(false);expect(root.attackers('b5','b')).toContain('a6')
    expect(be3.attackers('d4','w')).toContain('e3')
    expect(be3.attackers('e4','b')).toContain('f6');expect(be3.attackers('e4','w')).toContain('d4')
    expect(c4.get('d2')?.type).toBe('q');expect(c4.moves()).not.toContain('Be3')
    expect(c4.get('f8')?.type).toBe('b');expect(c4.get('g8')?.type).toBe('n')
    for(const b of [be3,c4]){expect(b.get('e1')?.type).toBe('k');expect(b.get('e8')?.type).toBe('k')}
  })
  it('plays full courses and all six directed checkpoints with active moves for both colors',()=>{
    const runs=additions.entries.map(course=>({course,index:0}))
    for(const fork of design.navigation.forks){
      const from=siblings.find(c=>c.id===fork.from),course=siblings.find(c=>c.id===fork.to)
      expect(commonPrefix(from.moves,course.moves)).toBe(fork.index)
      expect(curriculumReturnIndex(siblings,[from.id],course)).toBe(fork.index)
      expect(curriculumCheckpoint(siblings,course,fork.index)).toEqual({index:fork.index,reason:'fork'})
      expect(curriculumFork(siblings,course.moves,fork.index)?.children.has(course.moves[fork.index])).toBe(true)
      expect(replay(course.moves.slice(0,fork.index)).turn()).toBe(fork.turn)
      expect(practiceMove(from.moves,fork.index,fork.turn,course.moves[fork.index]).status).toBe('different-line')
      runs.push({course,index:fork.index})
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
  it('selects a6 once at the root, distinguishes its next fork, and completes the short pair correctly',()=>{
    const parent=siblings.find(c=>c.id==='sicilian:chekhover-bd7')
    const representative=siblings.find(c=>c.id!==parent.id&&parent.moves.slice(0,7).every((m,i)=>c.moves[i]===m)&&c.moves[7]==='a6')
    expect(representative.id).toBe('sicilian:chekhover-a6-be3')
    expect([...curriculumFork(siblings,representative.moves,8).children.keys()]).toEqual(['Be3','c4'])
    expect(practiceMove(representative.moves,8,'w','Be3')).toMatchObject({status:'complete',index:10})
    expect(practiceMove(additions.entries[1].moves,8,'w','c4')).toMatchObject({status:'correct',index:10})
    const uncovered=plan.navigation.uncoveredAlternative,course=siblings.find(c=>c.id===uncovered.courseId)
    expect(practiceMove(course.moves,10,'w','Qd3').status).toBe('different-line')
    expect(siblings.some(c=>course.moves.slice(0,10).every((m,i)=>c.moves[i]===m)&&c.moves[10]==='Qd3')).toBe(false)
  })
  it('checks all 54 immediate replies and the different reasons the queen is lost',()=>{
    for(const spec of plan.courses){
      const ex=spec.exercise,item=practical.entries.find(c=>c.id===ex.id),b=replay(spec.moves.slice(0,ex.beforeIndex))
      const initial=material(b,ex.exerciseSide)
      b.move(ex.mistake)
      expect(b.moves({verbose:true}).filter(m=>m.captured==='q').map(m=>m.san)).toEqual([ex.answer])
      b.move(ex.answer)
      const gains=b.moves().map(san=>{b.move(san);expect(b.isGameOver()).toBe(false);const gain=material(b,ex.exerciseSide)-initial;b.undo();return gain})
      expect(gains).toHaveLength(ex.expectedLegalImmediateReplies)
      expect(Math.min(...gains)).toBe(ex.expectedMinimumImmediateMaterialGain)
      expect(item.moves).toEqual(b.history());expect(item.startIndex).toBe(ex.beforeIndex+1)
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,ex.answer).status).toBe('complete')
    }
    const first=new Chess(proof.evidence[0].answerFen)
    expect(first.moves()).not.toContain('axb6');first.move('Nd7');expect(first.attackers('b6','b')).toContain('d7')
    const second=new Chess(proof.evidence[1].answerFen)
    expect(second.attackers('d4','w')).not.toContain('c3');expect(second.move('Nxd4').from).toBe('f3')
  })
  it('accepts the fixed engine gates and reuses the authored control as the first exercise baseline',()=>{
    expect(proof.goCommands).toBe(5);expect(proof.nodesRequested).toBe(1000000)
    expect(proof.continuationChecks).toHaveLength(1)
    const c=proof.continuationChecks[0]
    expect(c.acceptanceLoss).toBe(14);expect(c.signedCpDifference).toBe(c.control.cp-c.selected.cp)
    expect(c.acceptanceLoss).toBeLessThanOrEqual(plan.enginePlan.maximumAuthoredMoveLossCp)
    expect(design.engineJobs.find(j=>j.id===c.controlId).fen).toBe(design.engineJobs.find(j=>j.id===c.selectedId).fen)
    expect(proof.evidence[0].baselineJobId).toBe(c.controlId);expect(proof.evidence[0].baseline).toEqual(c.control)
    expect(proof.evidence.map(e=>e.cpChange)).toEqual([762,617])
    for(const e of proof.evidence){expect(e.cpChange).toBe(e.search.cp+e.baseline.cp);expect(e.cpChange).toBeGreaterThanOrEqual(200)}
  })
})
