// A checkpoint must retain compatible material that the current run has not
// visited yet. Otherwise one failed new branch can erase later reviewed courses.
export function teachingCheckpoint({entries,evidence,previousEntries,previousEvidence,retain}){
  const processed=new Set(entries.map(entry=>entry.id))
  const savedEntries=[...entries,...previousEntries.filter(entry=>!processed.has(entry.id)&&retain(entry))]
  const current=new Map(evidence.map(proof=>[proof.id,proof]))
  const previous=new Map(previousEvidence.map(proof=>[proof.id,proof]))
  const savedEvidence=savedEntries.map(entry=>processed.has(entry.id)?current.get(entry.id):previous.get(entry.id))
  if(savedEvidence.some(proof=>!proof))throw Error('Teaching checkpoint without evidence')
  return {entries:savedEntries,evidence:savedEvidence}
}
