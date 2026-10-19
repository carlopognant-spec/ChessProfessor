import {describe,it,expect} from 'vitest'
import {teachingCheckpoint} from '../scripts/opening-teaching-checkpoint.mjs'

describe('recoverable teaching checkpoints',()=>{
  const previousEntries=[{id:'completed',signature:'same'},{id:'later-family',signature:'same'},{id:'changed-policy',signature:'old'}]
  const previousEvidence=previousEntries.map(entry=>({id:entry.id,search:'old:'+entry.id}))
  const options={entries:[{id:'completed',signature:'same',revised:true}],evidence:[{id:'completed',search:'new'}],
    previousEntries,previousEvidence,retain:entry=>entry.signature==='same'}

  it('retains a later family when a run stops before reaching its new branch',()=>{
    const snapshot=teachingCheckpoint(options)
    expect(snapshot.entries.map(entry=>entry.id)).toEqual(['completed','later-family'])
    expect(snapshot.evidence).toEqual([{id:'completed',search:'new'},{id:'later-family',search:'old:later-family'}])
    expect(snapshot.entries[0].revised).toBe(true)
    expect(previousEntries[0].revised).toBeUndefined()
  })

  it('resumes from an early checkpoint and keeps all matching evidence',()=>{
    const early=teachingCheckpoint(options)
    const resumed=teachingCheckpoint({entries:[{id:'new-branch',signature:'same'}],evidence:[{id:'new-branch',search:'generated'}],
      previousEntries:early.entries,previousEvidence:early.evidence,retain:()=>true})
    expect(resumed.entries.map(entry=>entry.id)).toEqual(['new-branch','completed','later-family'])
    expect(resumed.evidence.map(proof=>proof.search)).toEqual(['generated','new','old:later-family'])
  })

  it('fails instead of publishing retained material without its evidence',()=>{
    expect(()=>teachingCheckpoint({...options,previousEvidence:[]})).toThrow('without evidence')
    expect(()=>teachingCheckpoint({...options,evidence:[],previousEvidence:[]})).toThrow('without evidence')
    expect(()=>teachingCheckpoint({...options,evidence:[]})).toThrow('without evidence')
  })
})
