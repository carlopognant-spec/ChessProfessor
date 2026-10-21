import fs from 'node:fs/promises'
import {OPENING_LESSONS} from '../src/lib/openingLessons.js'
import {OPENING_EXPANSION_PLAN} from '../src/lib/openingExpansionPlan.js'
import {ALL_OPENING_JOURNEYS,familyJourneys,openingWrittenContext} from '../src/lib/openingJourneys.js'
import expansion from '../src/data/openingExpansion.js'
import practical from '../src/lib/openingPracticalLibrary.js'
import roadmap from '../src/data/openingRoadmapCourses.js'
import zaitsev from '../src/data/openingZaitsevCourses.js'
import chekhover from '../src/data/openingChekhoverCourses.js'
import caroNotes from '../src/lib/openingCaroNotes.js'
import strategicNotes from '../src/lib/openingStrategicNotes.js'
import fullNotes from '../src/lib/openingFullNotes.js'

const reviewedNotes={...strategicNotes,...caroNotes}
for(const [id,row] of [...Object.entries(reviewedNotes),...Object.entries(fullNotes)]){
  const course=ALL_OPENING_JOURNEYS.find(course=>course.id===id)
  if(!course||row.line!==course.moves.join(' '))throw Error(`Review required before reporting opening notes: ${id}`)
}

const evidence=JSON.parse(await fs.readFile('docs/data/opening-expansion-verification.json','utf8'))
const roadmapEntries=[...roadmap.entries,...zaitsev.entries,...chekhover.entries]
const families=OPENING_LESSONS.map(guide=>{
  const courses=familyJourneys(guide.id),planned=[...OPENING_EXPANSION_PLAN,...roadmapEntries].filter(row=>row.family===guide.id)
  return {id:guide.id,title:guide.title,legacy:courses.filter(course=>!course.expansion&&!course.provenance).length,
    added:courses.filter(course=>course.expansion||course.provenance).length,
    documentedCourses:courses.filter(course=>course.provenance?.kind==='documented-line').length,
    authoredContinuationCourses:courses.filter(course=>course.provenance?.kind==='documented-prefix-with-authored-continuation').length,
    total:courses.length,practicalCases:practical.entries.filter(item=>item.family===guide.id).length,
    reviewedCourses:courses.filter(course=>reviewedNotes[course.id]).length,
    additionalReviewedNotes:courses.reduce((sum,course)=>sum+Object.keys(reviewedNotes[course.id]?.notes??{}).length,0),
    additionalPairNotes:courses.reduce((sum,course)=>sum+Object.keys(fullNotes[course.id]?.notes??{}).length,0),
    fullyWrittenCourses:courses.filter(course=>course.moves.every((_,index)=>index%2||openingWrittenContext(course,index).debriefOrigin==='written')).length,
    branches:planned.map(row=>{
      const course=courses.find(course=>course.id===row.id),proof=evidence.evidence.find(item=>item.id===row.id)
      const source=course?.provenance??course?.expansion
      return {id:row.id,title:row.title,status:!course?'pending':course.provenance?.kind==='documented-line'?'documented-line':course.provenance?.kind==='documented-prefix-with-authored-continuation'?'documented-prefix-authored-continuation':course.expansion&&proof?'source-legal-model-checked':'legacy-playable',
        sourceId:source?.sourceId??null,sourceName:source?.sourceName??null,
        documentedPlies:source?.documentedPlies??source?.publishedPlies??null,
        authoredContinuationPlies:source?.authoredContinuationPlies??0,
        engineCheckedPlies:source?.continuationStatus==='bounded-engine-checked'?source.authoredContinuationPlies:proof?.checks.length??0,
        reviewedNotes:Object.keys(reviewedNotes[row.id]?.notes??{}).length,
        practicalCase:practical.entries.find(item=>item.courseId===row.id)?.id??null}
    })}
})
const pending=families.flatMap(family=>family.branches.filter(branch=>branch.status==='pending').map(branch=>branch.id))
const report={schema:2,scope:`Full fixed P01 corpus A accepted: 12,322 source positions. This route inventory contains ${OPENING_EXPANSION_PLAN.length} historic branch declarations and ${roadmapEntries.length} roadmap routes; it is not the complete source corpus.`,
  source:expansion.source,engine:expansion.policy,totalCourses:ALL_OPENING_JOURNEYS.length,
  addedCourses:expansion.entries.length+roadmapEntries.length,historicalAddedCourses:expansion.entries.length,
  documentedCourses:roadmapEntries.filter(row=>row.provenance.kind==='documented-line').length,
  authoredContinuationCourses:roadmapEntries.filter(row=>row.provenance.kind==='documented-prefix-with-authored-continuation').length,
  roadmapNotes:roadmapEntries.reduce((sum,row)=>sum+Object.keys(row.editorialNotes).length,0),
  reviewedCourses:Object.keys(reviewedNotes).length,
  reviewedNotes:Object.values(reviewedNotes).reduce((sum,row)=>sum+Object.keys(row.notes).length,0),
  additionalPairNotes:Object.values(fullNotes).reduce((sum,row)=>sum+Object.keys(row.notes).length,0),
  fullyWrittenFamilies:families.filter(family=>family.fullyWrittenCourses===family.total).map(family=>family.id),
  practicalCases:practical.entries.length,practicalUncovered:practical.uncovered,pending,families}
await fs.writeFile('docs/data/opening-coverage.json',JSON.stringify(report,null,2)+'\n')
const lines=['# Inventario e avanzamento delle aperture','',
  `Perimetro completo A approvato: le 12.322 posizioni delle fonti fissate in P01, ancora in corso di copertura. L'elenco sotto comprende i ${OPENING_EXPANSION_PLAN.length} rami storici e ${roadmapEntries.length} nuovi percorsi della roadmap; alcuni rami storici corrispondono a corsi già presenti. Alias, posizioni e corsi sono conteggi distinti.`,
  '',`Percorsi giocabili: **${report.totalCourses}**, di cui **${report.historicalAddedCourses} dell'espansione storica**, **${report.documentedCourses} nuove linee integralmente documentate** e **${report.authoredContinuationCourses} con prefisso documentato e seguito didattico scritto**. Rami di questo elenco ancora da inserire: **${pending.length}**; questo numero non misura le posizioni mancanti nel perimetro A. La [verifica attuale Chekhover](OPENING-CHEKHOVER-P022-RESULTS.md) riporta copertura e residui effettivi.`,
  '', '## Metodo e limiti','',
  'Ogni nuova linea ha una posizione caratteristica collegata a un record del catalogo eco.json già fissato nel progetto. Un collegamento per trasposizione richiede la stessa posizione, turno, diritti di arrocco e possibilità di en passant. Gli eventuali passi redazionali successivi sono separati dalla parte documentata.',
  '', 'Nell’espansione storica si preferiscono continuazioni già documentate fino a 24 semimosse; il seguito fino alla mossa 16 è un modello didattico costruito offline con Stockfish 16 nativo, un thread, 32 MiB di hash, 200.000 nodi per mossa e hash azzerata. Non è una nuova fonte di teoria, una partita storica o una prova di unicità. Le prime due linee P02.2 hanno 22 e 20 semimosse interamente documentate. La Zaitsev ha dieci semimosse documentate e due didattiche scritte. Il lotto Chekhover successivo aggiunge 56 semimosse documentate e due didattiche scritte in tre percorsi. I seguiti scritti sono verificati con confronti alla stessa radice e budget fissato; nessuna mossa dei sei percorsi della roadmap è generata dal motore. Il browser non avvia il motore. Stockfish 16 nativo non è lo Stockfish 19 del browser.',
  '', `Ogni ramo ha piani specifici per entrambi i colori e una spiegazione della scelta caratteristica. I ${report.reviewedCourses} percorsi dell'espansione storica hanno almeno due note strategiche individualmente scritte: ${report.reviewedNotes} note, di cui 36 nella Caro-Kann. I ${roadmapEntries.length} percorsi della roadmap aggiungono ${report.roadmapNotes} note minime specifiche, conteggiate separatamente. Le note compaiono dopo aver giocato e sono legate alle sequenze complete revisionate. La revisione integrale dei commenti resta P03.`,
  '', `Le spiegazioni degli altri passaggi descrivono i fatti della scacchiera e riusano il corpus scritto solo nelle stesse posizioni e sequenze. Non vengono dichiarati commenti individualmente scritti per ogni mossa delle ${report.totalCourses} linee. La revisione dei passaggi chiave non equivale alla revisione editoriale integrale di tutte le lezioni.`,
  '', 'Il riepilogo del turno distingue la propria mossa dalla risposta realmente giocata dall’avversario. Ogni semimossa dispone di una spiegazione posizionale; le note strategiche individuali restano un conteggio distinto. La [copertura dei commenti](OPENING-COMMENTARY-COVERAGE.md) mostra i passaggi ancora da scrivere per ogni famiglia.',
  '', `Il corpus aggiuntivo di ${report.additionalPairNotes} note completa i passaggi scoperti nelle famiglie ${families.filter(family=>report.fullyWrittenFamilies.includes(family.id)).map(family=>family.title).join(', ')}: tutti i loro percorsi hanno ora una nota scritta per ogni coppia. Queste note aggiuntive sono distinte dalle ${report.reviewedNotes} note sui passaggi chiave già conteggiate. Le sequenze sono fissate in openingFullReviewedLines.js; il controllo della linea completa impedisce il riuso dopo una modifica delle mosse.`,
  '', 'Le verifiche automatiche certificano legalità, provenienza della posizione, continuità, assenza di duplicati nella famiglia e corrispondenza delle mosse del seguito ai risultati registrati. Non certificano da sole la correttezza di ogni spiegazione strategica o la completezza della teoria di ogni apertura.',
  '', `Esercizi sulle deviazioni: **${practical.entries.length}**. Percorsi senza un esercizio costruito validato: **${practical.uncovered.length}**. Ogni esercizio parte da una posizione del percorso, aggiunge una deviazione legale e richiede una risorsa concreta. Il confronto con Stockfish 16 usa 200.000 nodi; il guadagno materiale minimo viene inoltre controllato contro tutte le repliche legali immediate. Sono controlli a orizzonte limitato, non dimostrazioni sull’intera partita. Non viene attribuita una frequenza a questi errori, né vengono presentati come partite storiche. Le sei trappole precedenti restano una raccolta distinta.`,
  '', '## Perché i conteggi sono diversi','',
  'I conteggi misurano i percorsi insegnati nel sito, non il numero totale di varianti teoriche di un’apertura. Caro-Kann ed Est-Indiana hanno ricevuto approfondimenti dedicati prima dell’ampliamento generale: il loro numero inizialmente maggiore rifletteva la sequenza del lavoro. Gli ampliamenti successivi cercano decisioni mancanti, strutture e risposte avversarie distinte; non impongono lo stesso numero a tutte le famiglie e non usano la quantità di alias ECO come misura di completezza.',
  '', 'La [revisione delle lacune](OPENING-EXPANSION-AUDIT.md) documenta i 37 rami aggiunti nel secondo ampliamento e le linee già coperte che non sono state ricontate con un altro nome.',
  '', '## Conteggi per famiglia','', '| Famiglia | Preesistenti | Nuovi | Totale | Esercizi | Note sui passaggi chiave | Ulteriori note per coppia | Rami da inserire |','| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...families.map(family=>`| ${family.title} | ${family.legacy} | ${family.added} | ${family.total} | ${family.practicalCases} | ${family.additionalReviewedNotes} | ${family.additionalPairNotes} | ${family.branches.filter(branch=>branch.status==='pending').length} |`),
  '', '## Rami dichiarati','',
  ...families.flatMap(family=>[`### ${family.title}`,'',...family.branches.map(branch=>`- ${branch.status==='pending'?'[ ]':'[x]'} ${branch.title} — ${branch.status==='legacy-playable'?'percorso preesistente':branch.status==='pending'?'da inserire':`fonte ${branch.sourceId}; ${branch.documentedPlies} semimosse documentate, ${branch.engineCheckedPlies} semimosse del seguito controllate`}${branch.practicalCase?'; esercizio disponibile':''}`),'']),
  '## Evidenze','', '- [Inventario leggibile dalla macchina](data/opening-coverage.json)', '- [Posizioni e risultati del controllo offline](data/opening-expansion-verification.json)',
  '- [Controlli degli esercizi pratici storici](data/opening-practical-verification.json)',
  '- [Controlli dei due esercizi Siciliana](data/opening-sicilian-p022-practical-verification.json)',
  '- [Controlli del seguito e dell’esercizio Zaitsev](data/opening-zaitsev-p022-practical-verification.json)',
  '- [Controlli dei tre percorsi e degli esercizi Chekhover](data/opening-chekhover-p022-practical-verification.json)',
  '- [Fonte del catalogo](https://github.com/JeffML/eco.json)', '- [Nomi e convenzioni Lichess](https://github.com/lichess-org/chess-openings)',
  '', 'Aggiornamento del solo inventario: `node scripts/report-opening-coverage.mjs`. Non rilanciare i generatori storici o gli studi congelati per aggiornare un rapporto. Per il lotto Siciliana usare il verificatore offline e le prove separate indicate nel relativo rapporto.','']
await fs.writeFile('docs/OPENING-COVERAGE.md',lines.join('\n'))
console.log(JSON.stringify({families:families.length,totalCourses:report.totalCourses,added:report.addedCourses,reviewedCourses:report.reviewedCourses,reviewedNotes:report.reviewedNotes,pending:pending.length},null,2))
