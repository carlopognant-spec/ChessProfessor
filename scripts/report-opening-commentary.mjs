import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {ALL_OPENING_JOURNEYS,openingWrittenContext} from '../src/lib/openingJourneys.js'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import fullNotes from '../src/lib/openingFullNotes.js'

for(const [id,row] of Object.entries(fullNotes)){
  const course=ALL_OPENING_JOURNEYS.find(course=>course.id===id)
  if(!course||row.line!==course.moves.join(' '))throw Error(`Review required before reporting additional pair notes: ${id}`)
}

const families=OPENING_LESSONS.map(guide=>{
  const courses=ALL_OPENING_JOURNEYS.filter(row=>row.family===guide.id)
  const rows=courses.map(course=>{
    const positionOnly=[]
    for(let index=0;index<course.moves.length;index+=2)if(openingWrittenContext(course,index).debriefOrigin!=='written')positionOnly.push(index)
    const pairs=Math.ceil(course.moves.length/2)
    return {id:course.id,halfMoves:course.moves.length,pairs,writtenPairs:pairs-positionOnly.length,positionOnly,fullyWritten:!positionOnly.length}
  })
  return {id:guide.id,title:guide.title,courses:courses.length,halfMoves:rows.reduce((n,row)=>n+row.halfMoves,0),
    pairs:rows.reduce((n,row)=>n+row.pairs,0),writtenPairs:rows.reduce((n,row)=>n+row.writtenPairs,0),
    fullyWrittenCourses:rows.filter(row=>row.fullyWritten).length,rows}
})
const sum=field=>families.reduce((n,row)=>n+row[field],0)
const report={schema:1,courseDigest:createHash('sha256').update(JSON.stringify(ALL_OPENING_JOURNEYS.map(row=>({id:row.id,moves:row.moves})))).digest('hex'),
  courses:ALL_OPENING_JOURNEYS.length,families:families.length,explainedHalfMoves:sum('halfMoves'),
  pairs:sum('pairs'),writtenPairs:sum('writtenPairs'),fullyWrittenCourses:sum('fullyWrittenCourses'),
  additionalPairNotes:Object.values(fullNotes).reduce((n,row)=>n+Object.keys(row.notes).length,0),
  fullyWrittenFamilies:families.filter(row=>row.fullyWrittenCourses===row.courses).map(row=>row.id),
  policy:'Single-move explanations are derived from the actual board. Written pair notes are counted separately; shared exact prefixes count as uses, not unique authored texts.',familyRows:families}
await fs.writeFile('docs/data/opening-commentary-coverage.json',JSON.stringify(report,null,2)+'\n')
const lines=['# Copertura dei commenti mossa per mossa','',
  `I ${report.courses} percorsi contengono ${report.explainedHalfMoves} semimosse. Ogni semimossa giocata ha una spiegazione dei suoi effetti, distinta dalla risposta realmente eseguita dall’avversario. I testi sono calcolati sulla posizione: non vengono dichiarati commenti strategici individualmente scritti.`,
  '',`I passaggi con una nota scritta sono ${report.writtenPairs} su ${report.pairs} coppie di mosse; ${report.fullyWrittenCourses} percorsi hanno una nota scritta per ogni coppia. Questi sono utilizzi nel corso: lo stesso testo può essere riusato su prefissi esattamente uguali. Non sono conteggi di testi unici.`,
  '', `Famiglie interamente commentate per coppia: **${families.filter(row=>report.fullyWrittenFamilies.includes(row.id)).map(row=>row.title).join(', ')}**. Sono state aggiunte ${report.additionalPairNotes} note individuali ai passaggi precedentemente scoperti di queste famiglie. Anche gli altri percorsi conservano le note già presenti e le spiegazioni posizionali di ogni mossa.`,
  '', 'Le note strategiche scritte restano un approfondimento. Il riepilogo del turno descrive prima la mossa dell’allievo e poi l’effettiva risposta avversaria: giocando con il Nero, questa è la successiva mossa del Bianco. Le spiegazioni non compaiono prima di aver giocato.',
  '', 'Le frecce includono gli attacchi scoperti con origine nel pezzo che controlla davvero il bersaglio. Controllo, pressione e sostegno descrivono la geometria: non certificano che una futura cattura sia legale o vantaggiosa. Non viene attivato Stockfish.',
  '', '| Famiglia | Percorsi | Semimosse spiegate | Coppie con nota scritta | Percorsi interamente commentati per coppia |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...families.map(row=>`| ${row.title} | ${row.courses} | ${row.halfMoves} | ${row.writtenPairs}/${row.pairs} | ${row.fullyWrittenCourses} |`),
  '', 'I passaggi ancora privi di nota scritta sono elencati per percorso in [formato leggibile dalla macchina](data/opening-commentary-coverage.json). La scrittura individuale integrale resta un lavoro aperto; le spiegazioni posizionali non vengono contate come revisione editoriale.',
  '', 'Rigenerazione: `node scripts/report-opening-commentary.mjs`. I test riproducono tutte le mosse dei 280 percorsi e controllano i fatti dichiarati sulla scacchiera, oltre alle transizioni dei turni e ai casi di en passant, arrocco, promozione e attacco scoperto.','']
await fs.writeFile('docs/OPENING-COMMENTARY-COVERAGE.md',lines.join('\n'))
console.log(JSON.stringify({courses:report.courses,explainedHalfMoves:report.explainedHalfMoves,writtenPairs:report.writtenPairs,pairs:report.pairs,fullyWrittenCourses:report.fullyWrittenCourses},null,2))
