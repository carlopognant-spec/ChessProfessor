import fs from 'node:fs/promises'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {OPENING_EXPANSION_PLAN} from '../src/lib/openingExpansionPlan.js'
import {ALL_OPENING_JOURNEYS,familyJourneys} from '../src/lib/openingJourneys.js'
import expansion from '../src/data/openingExpansion.js'
import practical from '../src/data/openingPracticalCases.js'
import caroNotes from '../src/lib/openingCaroNotes.js'
import strategicNotes from '../src/lib/openingStrategicNotes.js'

const reviewedNotes={...strategicNotes,...caroNotes}
for(const [id,row] of Object.entries(reviewedNotes)){
  const course=ALL_OPENING_JOURNEYS.find(course=>course.id===id)
  if(!course||row.line!==course.moves.join(' '))throw Error(`Review required before reporting opening notes: ${id}`)
}

const evidence=JSON.parse(await fs.readFile('docs/data/opening-expansion-verification.json','utf8'))
const families=OPENING_LESSONS.map(guide=>{
  const courses=familyJourneys(guide.id),planned=OPENING_EXPANSION_PLAN.filter(row=>row.family===guide.id)
  return {id:guide.id,title:guide.title,legacy:courses.filter(course=>!course.expansion).length,
    added:courses.filter(course=>course.expansion).length,total:courses.length,practicalCases:practical.entries.filter(item=>item.family===guide.id).length,
    reviewedCourses:courses.filter(course=>reviewedNotes[course.id]).length,
    additionalReviewedNotes:courses.reduce((sum,course)=>sum+Object.keys(reviewedNotes[course.id]?.notes??{}).length,0),
    branches:planned.map(row=>{
      const course=courses.find(course=>course.id===row.id),proof=evidence.evidence.find(item=>item.id===row.id)
      return {id:row.id,title:row.title,status:!course?'pending':course.expansion&&proof?'source-legal-model-checked':'legacy-playable',
        sourceId:course?.expansion?.sourceId??null,sourceName:course?.expansion?.sourceName??null,
        documentedPlies:course?.expansion?.publishedPlies??null,engineCheckedPlies:proof?.checks.length??0,
        reviewedNotes:Object.keys(reviewedNotes[row.id]?.notes??{}).length,
        practicalCase:practical.entries.find(item=>item.courseId===row.id)?.id??null}
    })}
})
const pending=families.flatMap(family=>family.branches.filter(branch=>branch.status==='pending').map(branch=>branch.id))
const report={schema:1,scope:`37 families; explicit ${OPENING_EXPANSION_PLAN.length}-branch expansion inventory, not all possible theoretical moves`,
  source:expansion.source,engine:expansion.policy,totalCourses:ALL_OPENING_JOURNEYS.length,
  addedCourses:expansion.entries.length,reviewedCourses:Object.keys(reviewedNotes).length,
  reviewedNotes:Object.values(reviewedNotes).reduce((sum,row)=>sum+Object.keys(row.notes).length,0),
  practicalCases:practical.entries.length,practicalUncovered:practical.uncovered,pending,families}
await fs.writeFile('docs/data/opening-coverage.json',JSON.stringify(report,null,2)+'\n')
const lines=['# Inventario e avanzamento delle aperture','',
  `Ambito esplicito: tutte le 37 famiglie della biblioteca. I ${OPENING_EXPANSION_PLAN.length} rami elencati sotto comprendono anche alcuni percorsi già presenti; non sono ${OPENING_EXPANSION_PLAN.length} nuovi sistemi. Le trasposizioni e i sinonimi non vengono contati come nuove aperture.`,
  '',`Percorsi giocabili: **${report.totalCourses}**, di cui **${report.addedCourses} aggiunti**. Rami dell’inventario ancora da inserire: **${pending.length}**.`,
  '', '## Metodo e limiti','',
  'Ogni nuova linea ha una posizione caratteristica collegata a un record del catalogo eco.json già fissato nel progetto. Un collegamento per trasposizione richiede la stessa posizione, turno, diritti di arrocco e possibilità di en passant. Gli eventuali passi redazionali successivi sono separati dalla parte documentata.',
  '', 'Si preferiscono continuazioni già documentate, fino a 24 semimosse, quando compatibili con il ramo. Il seguito restante fino alla mossa 16 è un modello didattico costruito offline con Stockfish 16 nativo, un thread, 32 MiB di hash, 200.000 nodi per mossa e hash azzerata. Non è una nuova fonte di teoria, una partita storica o una prova di unicità delle mosse. Il browser non avvia il motore. Le ricerche e le posizioni sono registrate nel file di verifica; questo motore non è lo Stockfish 19 del browser.',
  '', `Ogni ramo ha piani specifici per entrambi i colori e una spiegazione della scelta caratteristica. Tutti i ${report.reviewedCourses} nuovi percorsi, distribuiti nelle 37 famiglie, hanno inoltre almeno due note strategiche individualmente scritte: ${report.reviewedNotes} note in totale, di cui 36 nella Caro-Kann. Le note collegano la scelta del giocatore alla risposta avversaria, ai bersagli e alla trasformazione del centro; compaiono dopo aver giocato, per lasciare la soluzione negli indizi facoltativi. Sono legate alle sequenze complete revisionate: se le mosse cambiano, i test e questo report richiedono una nuova revisione dei testi.`,
  '', `Le spiegazioni degli altri passaggi descrivono i fatti della scacchiera e riusano il corpus scritto solo nelle stesse posizioni e sequenze. Non vengono dichiarati commenti individualmente scritti per ogni mossa delle ${report.totalCourses} linee. La revisione dei passaggi chiave non equivale alla revisione editoriale integrale di tutte le lezioni.`,
  '', 'Le verifiche automatiche certificano legalità, provenienza della posizione, continuità, assenza di duplicati nella famiglia e corrispondenza delle mosse del seguito ai risultati registrati. Non certificano da sole la correttezza di ogni spiegazione strategica o la completezza della teoria di ogni apertura.',
  '', `Esercizi sulle deviazioni: **${practical.entries.length}**. Percorsi senza un esercizio costruito validato: **${practical.uncovered.length}**. Ogni esercizio parte da una posizione del percorso, aggiunge una deviazione legale e richiede una risorsa concreta. Il confronto con Stockfish 16 usa 200.000 nodi; il guadagno materiale minimo viene inoltre controllato contro tutte le repliche legali immediate. Sono controlli a orizzonte limitato, non dimostrazioni sull’intera partita. Non viene attribuita una frequenza a questi errori, né vengono presentati come partite storiche. Le sei trappole precedenti restano una raccolta distinta.`,
  '', '## Perché i conteggi sono diversi','',
  'I conteggi misurano i percorsi insegnati nel sito, non il numero totale di varianti teoriche di un’apertura. Caro-Kann ed Est-Indiana hanno ricevuto approfondimenti dedicati prima dell’ampliamento generale: il loro numero inizialmente maggiore rifletteva la sequenza del lavoro. Gli ampliamenti successivi cercano decisioni mancanti, strutture e risposte avversarie distinte; non impongono lo stesso numero a tutte le famiglie e non usano la quantità di alias ECO come misura di completezza.',
  '', 'La [revisione delle lacune](OPENING-EXPANSION-AUDIT.md) documenta i 37 rami aggiunti nel secondo ampliamento e le linee già coperte che non sono state ricontate con un altro nome.',
  '', '## Conteggi per famiglia','', '| Famiglia | Preesistenti | Nuovi | Totale | Esercizi | Note revisionate | Rami da inserire |','| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...families.map(family=>`| ${family.title} | ${family.legacy} | ${family.added} | ${family.total} | ${family.practicalCases} | ${family.additionalReviewedNotes} | ${family.branches.filter(branch=>branch.status==='pending').length} |`),
  '', '## Rami dichiarati','',
  ...families.flatMap(family=>[`### ${family.title}`,'',...family.branches.map(branch=>`- ${branch.status==='pending'?'[ ]':'[x]'} ${branch.title} — ${branch.status==='legacy-playable'?'percorso preesistente':branch.status==='pending'?'da inserire':`fonte ${branch.sourceId}; ${branch.documentedPlies} semimosse documentate, ${branch.engineCheckedPlies} semimosse del seguito controllate`}${branch.practicalCase?'; esercizio disponibile':''}`),'']),
  '## Evidenze','', '- [Inventario leggibile dalla macchina](data/opening-coverage.json)', '- [Posizioni e risultati del controllo offline](data/opening-expansion-verification.json)',
  '- [Controlli degli esercizi pratici](data/opening-practical-verification.json)',
  '- [Fonte del catalogo](https://github.com/JeffML/eco.json)', '- [Nomi e convenzioni Lichess](https://github.com/lichess-org/chess-openings)',
  '', 'Rigenerazione: `node scripts/build-opening-expansion.mjs` conserva i checkpoint compatibili con la stessa fonte, contenuto e configurazione; `node scripts/report-opening-coverage.mjs` ricostruisce questo inventario. Nessuna rigenerazione dei benchmark o delle cache di analisi delle partite è necessaria.','']
await fs.writeFile('docs/OPENING-COVERAGE.md',lines.join('\n'))
console.log(JSON.stringify({families:families.length,totalCourses:report.totalCourses,added:report.addedCourses,reviewedCourses:report.reviewedCourses,reviewedNotes:report.reviewedNotes,pending:pending.length},null,2))
