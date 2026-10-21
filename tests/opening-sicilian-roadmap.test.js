import fs from 'node:fs'
import {createHash} from 'node:crypto'
import {describe,it,expect} from 'vitest'
import {Chess} from 'chess.js'
import {ALL_OPENING_JOURNEYS,journeyCoach,openingWrittenContext} from '../src/lib/openingJourneys.js'
import {commonPrefix,curriculumFork,curriculumReturnIndex} from '../src/lib/openingCurriculum.js'
import {initialPracticeIndex,practiceMove} from '../src/lib/openingLibrary.js'
import roadmap from '../src/data/openingRoadmapCourses.js'
import practical from '../src/lib/openingPracticalLibrary.js'

const json=file=>JSON.parse(fs.readFileSync(file,'utf8'))
const plan=json('docs/data/opening-sicilian-p022-plan.json'),scope=json('docs/data/opening-scope-audit.json')
const baseline=json('docs/data/opening-taxonomy-baseline.json'),source=json('src/data/openingCatalog.json')
const hash=value=>createHash('sha256').update(value).digest('hex')
const replay=moves=>{const b=new Chess();moves.forEach(san=>b.move(san));return b}
describe('documented Sicilian routes added by the roadmap',()=>{
  it('preserves all 280 original routes and the historical source evidence byte for byte',()=>{
    const ids=new Set(scope.courses.map(row=>row.id))
    const original=ALL_OPENING_JOURNEYS.filter(row=>ids.has(row.id)).map(({id,family,title,moves})=>({id,family,title,moves}))
    expect(original).toHaveLength(280);expect(hash(JSON.stringify(original))).toBe(baseline.courseDigest)
    expect(ALL_OPENING_JOURNEYS.filter(row=>!ids.has(row.id)).map(row=>row.id)).toEqual([...plan.courses.map(row=>row.id),'sicilian:chekhover-zaitsev','sicilian:chekhover-c4-g6','sicilian:chekhover-qd3','sicilian:chekhover-qd2'])
    for(const [file,sha]of Object.entries({...baseline.hashes,...plan.preserveFiles}))expect(hash(fs.readFileSync(file)),file).toBe(sha)
  })
  it('binds the full new routes to fixed sources and lets both colors reach the real endpoint',()=>{
    for(const course of roadmap.entries){
      const spec=plan.courses.find(row=>row.id===course.id),entry=source.entries.find(row=>row.id===spec.sourceId)
      expect(course.moves).toEqual(entry.moves);expect(course.moves).toHaveLength(spec.sourcePlies)
      expect(course.provenance).toMatchObject({kind:'documented-line',documentedPlies:course.moves.length,generatedPlies:0})
      expect(replay(course.moves).isGameOver()).toBe(false)
      for(const side of ['w','b']){
        let index=initialPracticeIndex(course.moves,side),turns=0
        while(index<course.moves.length){
          const coach=journeyCoach(course,index,side),board=replay(course.moves.slice(0,index))
          expect(board.turn()).toBe(side);expect(coach.before).toBe(board.fen())
          const result=practiceMove(course.moves,index,side,board.move(coach.san).san)
          expect(['correct','complete']).toContain(result.status)
          index=result.index;turns++
        }
        expect(index).toBe(course.moves.length);expect(turns).toBe(course.moves.length/2)
      }
    }
    const najdorf=replay(roadmap.entries[0].moves),chekhover=replay(roadmap.entries[1].moves)
    expect(najdorf.get('e8')).toEqual({type:'k',color:'b'});expect(najdorf.fen().split(' ')[2]).toBe('kq')
    expect(chekhover.get('g8')).toEqual({type:'k',color:'b'});expect(chekhover.get('c1')).toEqual({type:'k',color:'w'})
  })
  it('places the real choices at their shared prefixes and keeps legal alternatives distinct from the selected line',()=>{
    const courses=ALL_OPENING_JOURNEYS.filter(row=>row.family==='sicilian')
    for(const spec of plan.courses){
      const child=courses.find(row=>row.id===spec.id),parent=courses.find(row=>row.id===spec.existingParentCourseId)
      expect(commonPrefix(parent.moves,child.moves)).toBe(spec.sharedPrefixPlies)
      expect(curriculumReturnIndex([parent,child],[parent.id],child)).toBe(spec.sharedPrefixPlies)
      const fork=curriculumFork(courses,child.moves,spec.sharedPrefixPlies)
      expect(fork.children.has(child.moves[spec.sharedPrefixPlies])).toBe(true)
      expect(fork.children.has(parent.moves[spec.sharedPrefixPlies])).toBe(true)
    }
    const child=courses.find(row=>row.id==='sicilian:chekhover-bd7')
    expect(practiceMove(child.moves,9,'b','Qd7').status).toBe('different-line')
    expect(courses.find(row=>row.moves.slice(0,10).join(' ')===[...child.moves.slice(0,9),'Qd7'].join(' ')).id).toBe('sicilian:chekhover-zaitsev')
  })
  it('keeps the two pin mechanisms distinct and invalidates notes if the course sequence changes',()=>{
    const chek=roadmap.entries[1],b=replay(chek.moves.slice(0,9))
    expect(b.moves()).not.toContain('Nxd4')
    const najdorf=roadmap.entries[0],n=replay(najdorf.moves.slice(0,13))
    expect(n.moves()).toContain('Nxe4');n.move('Nxe4');expect(n.move('Bxd8').captured).toBe('q')
    for(const course of roadmap.entries)for(const [pair,note]of Object.entries(course.editorialNotes)){
      expect(openingWrittenContext(course,Number(pair)).debrief).toBe(note)
      const changed={...course,moves:[...course.moves.slice(0,-1),'h6']}
      expect(openingWrittenContext(changed,Number(pair)).debrief).not.toBe(note)
    }
  })
  it('publishes the two additional exercises alongside every historical course without duplicate IDs',()=>{
    expect(practical.entries).toHaveLength(286);expect(new Set(practical.entries.map(row=>row.id)).size).toBe(286)
    for(const course of roadmap.entries){
      const item=practical.entries.find(row=>row.courseId===course.id)
      expect(item.startIndex).toBe(item.moves.length-1)
      const b=replay(item.moves.slice(0,item.startIndex));expect(b.turn()).toBe(item.exerciseSide)
      expect(practiceMove(item.moves,item.startIndex,item.exerciseSide,item.moves[item.startIndex]).status).toBe('complete')
    }
  })
})
