import {readFile} from 'node:fs/promises'
const d=JSON.parse(await readFile('agent-output/review-batch-v1/diagnosis.json'))
console.log('TIES',JSON.stringify(d.rows.filter(r=>r.sameScoreAlternative)))
console.log('MATE',JSON.stringify(d.rows.filter(r=>r.cohort!=='new-initial'&&(r.bestMate!=null||r.playedMate!=null)&&r.expected!==r.actual)))
console.log('BESTEXCELLENT',JSON.stringify(d.rows.filter(r=>r.cohort==='new-refined'&&['Migliore','Ottima','Buona'].includes(r.expected)&&r.expected!==r.actual)))
