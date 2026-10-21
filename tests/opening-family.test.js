import {readFileSync} from 'node:fs'
import {Chess} from 'chess.js'
import {describe,it,expect} from 'vitest'
import {resolveOpeningFamily} from '../src/lib/openingFamily.js'
import {openingFamily,openingCatalogSourceFamily,OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {prepareOpeningCatalog,validOpeningProgress} from '../src/lib/openingLibrary.js'

const source=JSON.parse(readFileSync(new URL('../src/data/openingCatalog.json',import.meta.url)))

describe('opening families follow their primary opening rather than a subvariation',()=>{
  it.each([
    ['French Defense: Two Knights Variation','C00','french'],
    ['English Opening: Caro-Kann Defensive System','A11','english'],
    ['English Opening: Symmetrical Variation, Anti-Benoni Variation','A31','english'],
    ["Queen's Gambit Declined: Ragozin Defense, Alekhine Variation",'D38','queens-gambit'],
    ['Four Knights Game: Spanish Variation','C48','four-knights'],
    ['Nimzowitsch Defense: Pseudo-Spanish Variation','B00','nimzowitsch'],
    ['Caro-Kann Defense: Two Knights Attack','B11','caro'],
    ['Vienna Game: Stanley Variation, Three Knights Variation','C28','vienna'],
    ['Sicilian Defense: Four Knights Variation','B45','sicilian'],
    ['Scotch Game: Four Knights Variation','C47','scotch'],
    ['Italian Game: Bird Attack','C53','italian'],
    ["King's Gambit Declined: Nimzowitsch Countergambit",'C31','kings-gambit'],
    ['Hungarian Opening: Sicilian Invitation','A00','other'],
    ['Grob Opening: London Defense','A00','other'],
    ['Van Geet Opening: Reversed Nimzowitsch','A00','other'],
    ['Modern: Two Knights Variation','B06','pirc'],
    ['Pterodactyl Defense, Sicilian','B06','pirc'],
    ['English Defense','A40','owen'],
    ["King's Indian Attack: Sicilian Variation",'A08','reti'],
    ["King's Indian Defense: Classical Variation",'E90','kings-indian'],
    ['Zukertort Opening: Sicilian Invitation','A04','reti'],
    ['Colle System: Zukertort Variation','D05','colle'],
    ['Blumenfeld Countergambit','E10','queens-pawn'],
    ['Neo-Gruenfeld: Alekhine Variation','D70','grunfeld'],
    ['Two Knights Defence, Traxler Counterattack','C57','italian'],
    ['KID: historical source name','E90','kings-indian'],
    ['QGD: historical source name','D35','queens-gambit'],
    ['Queen’s Indian Defence: Classical Variation','E17','queens-indian'],
  ])('%s stays in %s / %s',(name,eco,family)=>{
    expect(openingFamily(name,eco).id).toBe(family)
    expect(resolveOpeningFamily(name,eco).id).toBe(family)
  })

  it.each([
    ["Queen's Pawn Game: London System",'D02','london'],
    ['Indian Defense: London System','A45','london'],
    ["Queen's Pawn Game: Colle System",'D04','colle'],
    ['Indian Defense: Budapest Defense','A51','budapest'],
  ])('recognizes an explicit system inside the generic parent %s',(name,eco,id)=>{
    expect(resolveOpeningFamily(name,eco)).toMatchObject({id,basis:'named-system',needsReview:false})
  })

  it('keeps broad ECO assignments and unknown headings visible as review cases',()=>{
    expect(resolveOpeningFamily('Historical variation','E90')).toMatchObject({id:'kings-indian',basis:'eco-range',needsReview:true})
    expect(resolveOpeningFamily('Unknown: French Defense','E10')).toMatchObject({id:'queens-pawn',basis:'eco-range',needsReview:true})
    expect(resolveOpeningFamily('Unknown: French Defense','invalid')).toMatchObject({id:'other',basis:'unclassified',needsReview:true})
    expect(resolveOpeningFamily("Queen's Pawn Game: Zukertort Variation",'D02')).toMatchObject({id:'queens-pawn',needsReview:true})
    expect(resolveOpeningFamily('Neo-Old Indian / Modern','A41').needsReview).toBe(true)
  })

  it('prepares every source identity without modifying moves, names, aliases or source assignments',()=>{
    const before=JSON.stringify(source.entries),prepared=prepareOpeningCatalog(source.entries)
    expect(prepared).toHaveLength(12377)
    for(let index=0;index<prepared.length;index++){
      const raw=source.entries[index],row=prepared[index]
      expect(row.id).toBe(raw.id)
      expect(row.moves).toBe(raw.moves)
      expect(row.name).toBe(raw.name)
      expect(row.aliases).toBe(raw.aliases)
      expect(row.eco).toBe(raw.eco)
      expect(raw.family).toBe(openingCatalogSourceFamily(raw.name,raw.eco).id)
      expect(OPENING_LESSONS.some(guide=>guide.id===row.family)).toBe(true)
    }
    expect(JSON.stringify(source.entries)).toBe(before)
    const french=prepared.find(row=>row.id==='337da71237d2792f')
    expect(french.family).toBe('french')
    expect(french.search).toContain('difesa francese')
    expect(french.search).not.toContain('partita italiana')
  })

  it('keeps all 37 authored foundation routes linked to their original catalog identity',()=>{
    const prepared=prepareOpeningCatalog(source.entries)
    for(const guide of OPENING_LESSONS){
      const board=new Chess();board.loadPgn(guide.line)
      const key=board.history().join(' ')
      const raw=source.entries.find(row=>row.family===guide.id&&row.moves.join(' ')===key)
      expect(raw,guide.id).toBeTruthy()
      const ready=prepared.find(row=>row.id===raw.id)
      expect(ready.family,guide.id).toBe(guide.id)
      expect(ready.moves).toEqual(board.history())
    }
  })

  it('preserves saved catalog and journey progress when a favorite changes navigation group',()=>{
    const id='337da71237d2792f',session={completed:3,clean:2,lastPlayed:'2026-10-19'}
    const stored={version:1,favorites:[id],sessions:{[`${id}:w`]:session,'journey:v1:french:w':session}}
    const restored=validOpeningProgress(JSON.parse(JSON.stringify(stored)))
    const row=prepareOpeningCatalog(source.entries).find(row=>restored.favorites.includes(row.id))
    expect(row.family).toBe('french')
    expect(restored.sessions[`${row.id}:w`]).toEqual(session)
    expect(restored.sessions['journey:v1:french:w']).toEqual(session)
  })
})
