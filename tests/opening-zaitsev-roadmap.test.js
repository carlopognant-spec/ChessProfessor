import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS,journeyCoach,openingWrittenContext} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumFork,curriculumReturnIndex} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import zaitsev from '../src/data/openingZaitsevCourses.js'

const json=file=>JSON.parse(fs.readFileSync(file,'utf8'))
const plan=json('docs/data/opening-zaitsev-p022-plan.json')
const design=json('docs/data/opening-zaitsev-p022-design-verification.json')
const proof=json('docs/data/opening-zaitsev-p022-practical-verification.json')
const catalog=json('src/data/openingCatalog.json')
const editorial=json('docs/data/opening-zaitsev-p022-editorial.json')
const hash=v=>createHash('sha256').update(v).digest('hex')
const replay=moves=>{const b=new Chess();moves.forEach(san=>b.move(san));return b}
const material=(b,side)=>b.board().flat().filter(Boolean)
  .reduce((n,p)=>n+(p.color===side?1:-1)*({p:1,n:3,b:3,r:5,q:9,k:0}[p.type]),0)

describe('Zaitsev source boundary, practice and frozen evidence',()=>{
  it('preserves all 282 previous courses, exercises and byte-bound artifacts',()=>{
    const ids=new Set(design.baseline.courses.map(row=>row.id))
    const rows=ALL_OPENING_JOURNEYS.filter(row=>ids.has(row.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(rows).toEqual(design.baseline.courses)
    expect(hash(JSON.stringify(rows))).toBe(plan.baseline.courseDigest)
    const exercises=practical.entries.filter(row=>ids.has(row.courseId))
    expect(exercises).toHaveLength(282)
    expect(hash(JSON.stringify(exercises))).toBe(plan.baseline.practicalDigest)
    for(const [file,sha]of Object.entries(plan.preserveFiles))expect(hash(fs.readFileSync(file)),file).toBe(sha)
    expect(ALL_OPENING_JOURNEYS).toHaveLength(286)
    expect(practical.entries).toHaveLength(286)
  })
  it('separates the documented prefix from the authored pair and binds notes to the full sequence',()=>{
    const course=zaitsev.entries[0],source=catalog.entries.find(row=>row.id===plan.source.catalogId)
    expect(course.moves.slice(0,10)).toEqual(source.moves)
    expect(course.moves.slice(10)).toEqual(['Bxc6','Qxc6'])
    expect(course.provenance).toMatchObject({kind:'documented-prefix-with-authored-continuation',documentedPlies:10,
      authoredContinuationPlies:2,generatedPlies:0,continuationStatus:'bounded-engine-checked'})
    for(const [key,value]of Object.entries(editorial.course))expect(course[key]).toEqual(value)
    for(const [key,value]of Object.entries(editorial.exercise)){
      const item=practical.entries.find(row=>row.courseId===course.id)
      expect(item[key]).toBe(value)
    }
    expect(proof.editorialHash).toBe(hash(fs.readFileSync('docs/data/opening-zaitsev-p022-editorial.json')))
    for(const [pair,note]of Object.entries(course.editorialNotes)){
      expect(openingWrittenContext(course,Number(pair)).debrief).toBe(note)
      expect(openingWrittenContext({...course,moves:[...course.moves.slice(0,-1),'bxc6']},Number(pair)).debrief).not.toBe(note)
    }
    const end=replay(course.moves)
    expect(end.get('c6')).toEqual({type:'q',color:'b'})
    expect(end.get('e8')).toEqual({type:'k',color:'b'})
    expect(end.get('e1')).toEqual({type:'k',color:'w'})
    expect(end.isAttacked('e4','b')).toBe(true);expect(end.isAttacked('e4','w')).toBe(true)
  })
  it('offers the black fork in both directions and gives each learner an active move after it',()=>{
    const child=zaitsev.entries[0],parent=ALL_OPENING_JOURNEYS.find(row=>row.id==='sicilian:chekhover-bd7')
    const siblings=ALL_OPENING_JOURNEYS.filter(row=>row.family==='sicilian')
    expect(commonPrefix(parent.moves,child.moves)).toBe(9)
    expect([...curriculumFork(siblings,child.moves,9).children.keys()]).toEqual(['Bd7','Qd7'])
    for(const [from,to]of [[parent,child],[child,parent]])expect(curriculumReturnIndex(siblings,[from.id],to)).toBe(9)
    for(const side of ['w','b']){
      let index=initialPracticeIndex(child.moves,side),turns=0,afterFork=0
      while(index<child.moves.length){
        const coach=journeyCoach(child,index,side),b=replay(child.moves.slice(0,index))
        expect(coach.before).toBe(b.fen());expect(b.turn()).toBe(side)
        if(index>=9)afterFork++
        const result=practiceMove(child.moves,index,side,coach.san)
        expect(['correct','complete']).toContain(result.status);index=result.index;turns++
      }
      expect(turns).toBe(6);expect(afterFork).toBeGreaterThan(0)
    }
    expect(practiceMove(child.moves,10,'w','Qd3').status).toBe('different-line')
    expect(siblings.some(row=>row.moves.slice(0,11).join(' ')===[...child.moves.slice(0,10),'Qd3'].join(' '))).toBe(false)
  })
  it('retains the legal queen-trade resources and proves every immediate exercise reply',()=>{
    const root=zaitsev.entries[0].moves.slice(0,10)
    expect(replay(root.slice(0,9)).moves()).not.toContain('Nxd4')
    for(const first of ['Nc3','Ba4']){
      const end=replay([...root,first,'Nxd4','Bxd7+','Bxd7','Nxd4'])
      expect(material(end,'b')).toBe(0)
    }
    const ex=plan.course.exercise,b=replay(root),initial=material(b,'b')
    b.move(ex.mistake)
    expect(b.moves({verbose:true}).filter(row=>row.captured==='q').map(row=>row.san)).toEqual(['Nxd4'])
    b.move(ex.answer)
    const gains=b.moves().map(san=>{b.move(san);const gain=material(b,'b')-initial;expect(b.isCheckmate()).toBe(false);b.undo();return gain})
    expect(gains).toHaveLength(36);expect(Math.min(...gains)).toBe(6)
    const item=practical.entries.find(row=>row.courseId===plan.course.id)
    expect(item.moves).toEqual(b.history());expect(item.startIndex).toBe(11)
    expect(practiceMove(item.moves,11,'b','Nxd4').status).toBe('complete')
  })
  it('uses same-position signed comparisons and shares one root control with the exercise',()=>{
    expect(proof.goCommands).toBe(5);expect(proof.nodesRequested).toBe(1000000)
    expect(proof.continuationChecks.map(row=>row.signedCpDifference)).toEqual([74,-20])
    for(const row of proof.continuationChecks){
      expect(row.signedCpDifference).toBe(row.control.cp-row.selected.cp)
      expect(row.acceptanceLoss).toBe(Math.max(0,row.signedCpDifference))
      expect(row.acceptanceLoss).toBeLessThanOrEqual(plan.enginePlan.maximumAuthoredMoveCpLoss)
      const control=design.engineJobs.find(job=>job.id===row.controlId)
      const selected=design.engineJobs.find(job=>job.id===row.selectedId)
      expect(control.fen).toBe(selected.fen)
    }
    const ex=proof.evidence[0]
    expect(ex.baselineJobId).toBe('zaitsev:root-control')
    expect(ex.baseline).toEqual(proof.continuationChecks[0].control)
    expect(ex.cpChange).toBe(ex.baseline.cp+ex.search.cp)
    expect(ex.cpChange).toBeGreaterThanOrEqual(plan.enginePlan.minimumCpChange)
    expect(ex.search.bestmove).toBe('c6d4')
  })
})
