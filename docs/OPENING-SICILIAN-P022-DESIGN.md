# P02.2 — Primo lotto Siciliana: progetto eseguibile

Data: 20 ottobre 2026. Lotto: `P02.2-SIC-01`.
Configurazione concordata per la progettazione: GPT-6 Astra / High.
**Stato: progettazione verificata; corsi non ancora pubblicati, controllo motore non eseguito.**

Aggiornamento successivo: il lotto è stato implementato. Per lo stato corrente e i controlli effettivi usare il [rapporto di esito](OPENING-SICILIAN-P022-RESULTS.md). Specifica e prove di progettazione sotto restano la fotografia precedente all'implementazione.

Il perimetro completo A è già stato confermato da Carlo. Questo documento definisce il primo lotto di implementazione dentro quel perimetro; non sostituisce le 12.322 posizioni con due soli corsi e non richiede una nuova approvazione del perimetro.

## Risultato da realizzare

Aggiungere due percorsi giocabili con entrambi i colori, ciascuno con piani specifici, note minime e un esercizio sulla sua idea caratteristica:

| Percorso nuovo | ID stabile proposto | Conclusione |
| --- | --- | --- |
| Najdorf con 6.Ag5: sviluppo classico | `sicilian:najdorf-bg5-classical` | 11...Ab7, 22 semimosse |
| Chekhover: 4.Dxd4 e risposta ...Ad7 | `sicilian:chekhover-bd7` | 10...O-O, 20 semimosse |

Entrambe le sequenze sono integralmente presenti nella fonte fissata. Non servono continuazioni generate per arrivare alla mossa 16. Gli arresti sono scelti per la posizione ottenuta: coordinazione attorno a e4 e controgioco nero nella Najdorf; struttura definita, sviluppo e arrocchi opposti nella Chekhover.

La [specifica strutturata](data/opening-sicilian-p022-plan.json) contiene PGN, ID delle fonti, posizioni radice, piani, 13 note per coppia di mosse, esercizi e limiti del controllo motore. Le note sono il contenuto minimo del lotto; non attestano la revisione integrale P03.

## Fonti e limiti

1. Catalogo locale `src/data/openingCatalog.json`, 12.377 record, SHA-256 `5b12a41bb34cc75560672c99cae690526e8340d761492f36f1bdfab7ee82cba2`. Provenienza: [JeffML/eco.json, revisione fissata](https://github.com/JeffML/eco.json/tree/36cfd9227f553dec1d39ee20fa0775eea8f8e165), licenza MIT conservata in `src/data/openingBook.LICENSE.txt`.
2. [Lichess chess-openings, b.tsv fissato](https://raw.githubusercontent.com/lichess-org/chess-openings/a6189a30dc273ccb21fc2536a9a2fefd5592a67a/b.tsv), revisione `a6189a30dc273ccb21fc2536a9a2fefd5592a67a`, CC0. Copia e hash nel [manifest P01](data/opening-audit-sources/manifest.json). Fonte online verificata il 20 ottobre 2026.
3. [Convenzioni ufficiali Lichess](https://raw.githubusercontent.com/lichess-org/chess-openings/a6189a30dc273ccb21fc2536a9a2fefd5592a67a/README.md): nomi gerarchici e ordini alternativi possono descrivere la stessa apertura. Confrontare le posizioni oltre ai nomi.

I due dataset non costituiscono due validazioni indipendenti: eco.json aggrega anche altre raccolte. I record delle due conclusioni hanno `src: scid` nella copia originale `ecoB.json` già disponibile. La fonte documenta la sequenza e il nome; non prova che tutte le mosse siano uniche, migliori o più frequenti. Piani e note sono una sintesi editoriale originale verificata sulla scacchiera, non testi attribuiti al dataset.

| Elemento | Fonte esatta |
| --- | --- |
| Radice Najdorf 6.Ag5 | `position:328690c82438e111`; `lichess:b.tsv:769` |
| Najdorf fino a 9...Cbd7 | `lichess:b.tsv:782`; catalogo `38a0995bf2f7dcb9` |
| Najdorf fino a 11...Ab7 | catalogo `55f893191e905f8a`, B99; originale `scid: B99j` |
| Radice Chekhover 4.Dxd4 | `position:00e320f8355c07c4`; `lichess:b.tsv:641`; catalogo `6e6563bb8fd3ca21` |
| Chekhover fino a 10...O-O | catalogo `df54a8ff7bf70e37`, B53; originale `scid: B53w` |
| Chekhover, alternativa Zaitsev | `lichess:b.tsv:642`; catalogo `77915f5f49601838`; pendente |

Le righe TSV sono numerate da 1 includendo l'intestazione, come nell'audit P01.

## Ingressi, dipendenze e didattica

### Najdorf con 6.Ag5

Sequenza SAN della specifica:

```text
1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6
5. Nc3 a6 6. Bg5 e6 7. f4 Be7 8. Qf3 Qc7
9. O-O-O Nbd7 10. Bd3 b5 11. Rhe1 Bb7
```

Il corso esistente `sicilian:najdorf` prosegue con 6.Ae3 e ...e5: conservarne ID, titolo, mosse e progressi. Il prefisso comune è di 10 semimosse; il bivio bianco è all'indice 10, prima di 6.Ag5/6.Ae3. Il ramo nuovo eredita la Siciliana aperta e la posizione dopo 5...a6, non il successivo centro con ...e5.

Obiettivi osservabili:

- Riconoscere la differenza fra l'inchiodatura relativa alla donna dopo ...e6 e il successivo sviluppo ...Ae7, che interpone un pezzo.
- Collegare f4, Df3 e l'arrocco lungo allo sviluppo, senza presentare l'attacco al re come automatico.
- Individuare le funzioni di Ad3/The1 e ...b5/Ab7 rispetto a e4.
- Alla conclusione, ricordare che il re nero è ancora in e8 e non inventare un arrocco già eseguito.

Dopo 6.Ag5 sono già censiti ordini con 6...Cbd7 e risposte diverse. Dopo 6...e6 7.f4, ...Db6 (Pedone avvelenato), ...b5 (Polugaevsky), ...Cc6 e altre scelte rimangono distinte. Il corso classico non può rappresentarle tutte.

### Chekhover con ...Ad7

```text
1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Qxd4 Nc6
5. Bb5 Bd7 6. Bxc6 Bxc6 7. Nc3 Nf6 8. Bg5 e6
9. O-O-O Be7 10. Rhe1 O-O
```

Il prefisso comune con `sicilian` è di 6 semimosse. Il bivio bianco è all'indice 6: 4.Dxd4 invece di 4.Cxd4. Non è un sottoramo della Najdorf: si separa prima di 4...Cf6 e 5...a6.

Obiettivi osservabili:

- Riconoscere l'attacco alla donna dopo ...Cc6.
- Capire perché 5.Ab5 rende illegale ...Cxd4 e perché ...Ad7 elimina l'inchiodatura al re.
- Distinguere 6...Axc6 da una ricattura di pedone: il Nero conserva i due alfieri e non doppia i pedoni.
- Collegare Cc3, Ag5, arrocco lungo e The1 a sviluppo ed e4; distinguere la successiva inchiodatura relativa in f6 da quella assoluta in c6.

5...Dd7 è il ramo Zaitsev e resta pendente. Restano pendenti anche 4...a6, 4...Cf6, 4...Ad7, lo sviluppo con c4 e i seguiti oltre la conclusione scelta. Il dettaglio completo è nel rapporto generato; questi esempi non sono una lista esaustiva.

## Copertura prevista, separata da quella effettiva

Il [rapporto offline](data/opening-sicilian-p022-design-verification.json) confronta i prefissi e le posizioni dei 280 corsi correnti con i due percorsi proposti. Identità di posizione: pezzi, tratto, diritti d'arrocco, en passant solo se legale; esclusi i contatori.

| Misura | Attuale verificato | Proiezione dopo il lotto |
| --- | ---: | ---: |
| Corsi totali | 280 | 282 |
| Corsi nella Siciliana | 19 | 21 |
| Posizioni con almeno un ordine esatto delle fonti raggiunto | 1.919 | 1.939 |
| Posizioni raggiunte soltanto per trasposizione | 201 | 201 |
| Posizioni ancora assenti | 10.202 | 10.182 |

Sono 20 nuove posizioni, di cui 6 con almeno un'ancora ECO. Non sono 20 nuovi corsi. La proiezione non modifica lo stato pubblicato o l'audit P01.

| Sottoalbero definito dal prefisso esatto | Riferimenti nelle fonti | Posizioni/ordini distinti | Nuove posizioni previste | Assenti residue |
| --- | ---: | ---: | ---: | ---: |
| Najdorf dopo 6.Ag5 | 170 | 156 / 156 | 11 | 145 |
| Chekhover dopo 4.Dxd4 | 24 | 22 / 22 | 9 | 13 |

Per questi due insiemi, l'estensione a tutti i record che condividono le medesime posizioni non aggiunge altri ordini nel corpus fissato. Non generalizzare il risultato ad altre aperture. Il rapporto elenca ID e nomi di ogni posizione residua e tutti i riferimenti: nessun elemento viene cancellato dal denominatore.

La copertura di una posizione non equivale alla spiegazione completa della variante né al completamento di tutti i suoi ordini d'ingresso.

## Esercizi selezionati e verifiche già eseguite

Gli esercizi sono deviazioni costruite, non partite storiche o errori di frequenza misurata. Le mosse sono registrate in SAN inglese; i testi italiani usano C/A/T/D/R.

| Corso | Deviazione costruita | Risorsa dell'allievo | Repliche legali enumerate | Guadagno minimo alla replica immediata |
| --- | --- | --- | ---: | ---: |
| Najdorf | Dopo 7.f4, 7...Cxe4 | Bianco: 8.Axd8 | 26 | 5 punti |
| Chekhover | Dopo 4...Cc6, 5.Ac4 | Nero: 5...Cxd4 | 39 | 6 punti |

Punteggi materiali p=1, C/A=3, T=5, D=9, misurati rispetto alla posizione prima della deviazione. Nella Najdorf anche ...Cxc3, oltre a ...Rxd8, riduce il saldo immediato a cinque. Nella Chekhover Cxd4 riprende il cavallo, lasciando donna contro cavallo. Nessuna delle 65 repliche dà matto immediato al lato dell'allievo.

È verificata l'unicità della **cattura immediata della donna**, obiettivo circoscritto di questi esercizi. Non è dimostrata l'unicità di una mossa vincente in senso generale. Il feedback deve preservare questa distinzione. Per i corsi ordinari la pratica resta disponibile con entrambi i colori; ogni esercizio tattico ha invece il lato specificato.

### Controllo motore da eseguire nel lotto di implementazione

Selezione già fissata: le quattro FEN `engineJobs` del rapporto, posizione prima e dopo la deviazione per ciascun esercizio. Nessuna scansione degli altri corsi o ricerca di errori alternativi.

- Stockfish 16 nativo già presente, hash dell'eseguibile fissato nella specifica; 1 thread, Hash 32 MiB, MultiPV 1, `ucinewgame` e Clear Hash a ogni ricerca.
- Quattro ricerche primarie, 200.000 nodi richiesti ciascuna. Solo se manca una PV completa riferita al bestmove, al massimo una conferma con `searchmoves bestmove` per ricerca primaria.
- **Massimo 8 comandi `go`, 1.600.000 nodi richiesti complessivi**, timeout 30 s per comando. Il contatore UCI può superare leggermente il budget richiesto: registrare nodi effettivi e richiesti separatamente.
- Tracciare ogni comando, incluso quello che necessita conferma. Il wrapper storico può effettuare una conferma interna e non restituisce entrambe le ricerche: aggiungere una registrazione compatibile oppure usare un driver isolato. Non contare una chiamata JavaScript come se fosse necessariamente un solo `go`.
- Congelare prima dell'avvio manifest con hash di specifica, eseguibile e driver, opzioni, FEN e radici. Salvare ogni risultato completo separatamente e non sovrascriverlo. La ripresa deve riusare il risultato solo a firma identica.
- Anche tentativi falliti o interrotti consumano il budget del lotto. Registrarli; non rilanciarli silenziosamente. Nessun aumento automatico di nodi o cambio motore.
- Richiedere bestmove uguale alla risorsa selezionata, PV legalmente riproducibile, score non bound e riferito al bestmove, cp finiti. Per conservare il metodo pratico esistente, `cp_after + cp_before >= 200`: gli score sono riferiti al lato al tratto, che si alterna. Il controllo materiale resta indipendente.
- Se esce un mate score, una risorsa diversa o un controllo insufficiente, lasciare l'esercizio non pubblicato e annotare il motivo. Non manipolare soglie o cercare altri candidati finché uno passa. Tornare alla progettazione se serve cambiare il caso.

Nessun controllo motore è stato eseguito durante questo progetto. Questa verifica limitata non certifica la partita intera e non modifica il classificatore dell'app.

## Contratto d'integrazione

La soluzione seguente è la base dell'implementazione; sono ammesse scelte equivalenti che conservino gli invarianti.

1. Aggiungere un modulo per i nuovi corsi, per esempio `src/data/openingRoadmapCourses.js`, e unirlo a `ALL_OPENING_JOURNEYS`. Non inserire i nuovi percorsi nel generatore storico che impone 32 semimosse. `variant: true`; provenienza esplicita `documented-line`, 22/20 semimosse documentate e zero generate. Non usare la presenza del vecchio campo `expansion` per attribuire automaticamente una verifica motore.
2. Mettere le 13 note della specifica in `editorialNotes`, legate alle sequenze esatte. Mantenere piani e contrasto; riusare i suggerimenti e gli effetti posizionali esistenti per i prefissi. Non esporre la soluzione dell'esercizio nel testo prima della risposta.
3. Conservare byte per byte `openingExpansion.js`, `openingPracticalCases.js` e le due prove storiche elencate in `preserveFiles`. Aggiungere i due esercizi e le loro prove in file distinti. Un aggregatore, per esempio `src/lib/openingPracticalLibrary.js`, deve unire vecchi e nuovi esercizi senza dipendere da `openingJourneys.js`, evitando cicli.
4. Aggiornare i consumatori di esercizi (`OpeningCourses.jsx`, `OpeningLibrary.jsx`, rapporti e test interessati) affinché vedano l'insieme completo. Conservare il metodo `constructed-deviation-v1` solo se i controlli previsti passano integralmente. Non spostare né riscrivere le 280 prove precedenti.
5. Riutilizzare il trie e il calcolo del prefisso comune. Il nuovo ramo Najdorf riparte all'indice 10, la Chekhover all'indice 6. Verificare il cambio proposto quando l'allievo gioca una mossa del nuovo corso dalla vecchia linea e il verso opposto. Con il Nero, il bivio riguarda una scelta dell'avversario: usare il normale passaggio dal checkpoint.
6. Per mosse legali senza percorso disponibile, preservare il messaggio che chiarisce il limite della linea e non attribuisce un errore scacchistico. Non segnare come completati Zaitsev, Pedone avvelenato o altri rami soltanto perché viene raggiunta la loro radice comune.
7. Mostrare l'origine documentata delle nuove linee con una dicitura adeguata. Il testo attuale riservato a `journey.expansion` non è una descrizione sufficiente dei nuovi percorsi. È un adattamento di provenienza, non una riprogettazione grafica P04.
8. Conservare storage `chessprofessor.openings.v1`, tutti gli ID preesistenti e le chiavi `journey:v1:<id>:<side>`. Aggiungere le nuove chiavi soltanto al completamento reale.
9. Aggiornare i rapporti correnti distinguendo corsi storici, nuova linea documentata, esercizi e copertura del corpus A. Le voci senza il vecchio campo `expansion` non sono tutte automaticamente corsi storici.

### Baseline e test: evitare un conflitto apparente

P01 e P02.1 sono fotografie di input precedenti. I loro generatori verificano anche il digest di tutti i corsi: dopo un'aggiunta legittima non devono essere rigenerati per riscrivere la storia.

Il verificatore di questo progetto è anch'esso legato alla baseline di 280 corsi. Dopo l'implementazione produrre un **nuovo rapporto di esito** che verifichi i 280 record originali come sottoinsieme identico, i due ID aggiunti e i 282 corsi totali. Conservare i report precedenti e i loro hash. Non sostituire il digest iniziale con quello nuovo per far passare un controllo.

Alcuni test storici contengono cardinalità esatte o importano solo gli esercizi storici:

- `tests/opening-scope.test.js` attende 19 corsi siciliani: aggiornare il totale a 21 con controllo aggiuntivo dell'insieme dei 19 ID originali e dei due nuovi, senza passare a una soglia permissiva.
- `tests/opening-expansion.test.js` confronta tutti i corsi con gli esercizi: verificare l'aggregato delle 282 prove, mantenendo tutti i controlli di legalità e materiale per ogni esercizio. Le prove delle 188 espansioni storiche restano sul loro insieme originale.
- I vincoli sulle 32 semimosse dei percorsi storici restano validi. I nuovi hanno conclusioni proprie, verificate contro la fonte e la ragione didattica.

## Prompt operativo per l'implementazione

> Riprendi P02.2, lotto `P02.2-SIC-01`, con GPT-6.1 Sol e ragionamento High. Leggi il protocollo comune della roadmap, questo progetto e la specifica JSON. Il perimetro completo A è approvato: non richiedere nuovamente la scelta.
>
> Verifica lo stato Git e gli invarianti iniziali, senza leggere `.env` o modificare file estranei. Implementa esclusivamente i due percorsi e i loro esercizi definiti qui, con note minime e provenienza. Conserva i 280 corsi, le prove e gli ID precedenti. Rispetta la distinzione fra archivio storico e nuovi artefatti.
>
> Per gli esercizi realizza prima la registrazione e il limite delle ricerche, poi esegui soltanto i quattro job congelati con le eventuali conferme consentite. Riusa risultati validi se già presenti. Se un esercizio fallisce, conserva il lavoro verificato ma non presentare il lotto come completo e non avviare una ricerca aperta di sostituti. Se occorre riprogettare, fermati per il cambio concordato a GPT-6 Astra / High.
>
> Verifica fonti, SAN/FEN, note legate alla sequenza, diritti d'arrocco, en passant e conclusioni; esegui i percorsi con Bianco e Nero. Verifica bivi, alternative, completamento, esercizi, assenza di soluzione anticipata e persistenza nel browser. Mantieni i test storici e aggiorna solo le aspettative che cambiano per l'aggiunta esatta. Esegui la suite no-env e la build, senza rigenerare studi congelati.
>
> Produci un rapporto attuale confrontabile con P01: ci si attende 20 posizioni nuove e 10.182 ancora assenti, da verificare sul risultato effettivo. Registra anche le 158 posizioni ancora assenti nei due sottoalberi, senza confondere questi residui con l'intera Siciliana. Aggiorna la roadmap con prove, limiti e file. Nessun commit, push o deploy.
>
> Alla chiusura del lotto fermati per la progettazione del successivo: GPT-6 Astra / High. Il prossimo punto locale da esaminare è il ramo Chekhover Zaitsev con 5...Dd7, distinto da ...Ad7, e le sue dipendenze. Non generare automaticamente tutte le sottovarianti residue sotto Sol.

## Criteri di accettazione e controlli

- Due nuovi ID, 282 corsi totali e 21 siciliani; nessuna variazione ai 280 percorsi iniziali.
- Fonti vincolate, zero mosse generate nei due nuovi corsi, 42 semimosse complessive e 13 note specifiche.
- Quattro sessioni di corso completabili, due esercizi verificati con prove motore e 65 repliche immediate riproducibili.
- Bivi a 4.Dxd4 e 6.Ag5 raggiungibili; vecchio percorso Najdorf 6.Ae3 ancora utilizzabile; alternative non coperte correttamente comunicate.
- Preferiti e completamenti vecchi invariati dopo salvataggio/ricaricamento; i nuovi progressi non sovrascrivono gli altri.
- Tutti i file protetti e gli artefatti storici conservati; nessuna modifica a Libro, classificazione, soglie o dataset QA.
- Report della copertura effettiva distinto dalla proiezione. P02 rimane in corso.

Verifiche di progettazione realmente eseguite:

```powershell
node scripts/verify-opening-sicilian-design.mjs
node scripts/verify-opening-sicilian-design.mjs --check
```

Il verificatore riproduce fonti e prefissi, completa le quattro sessioni tramite la logica di pratica, enumera le 65 repliche, controlla gli hash e calcola la proiezione sull'intero inventario. Non certifica la revisione editoriale integrale né il funzionamento nel browser. Test applicativi, build e browser appartengono all'implementazione: in questo lotto cambia solo il progetto e il suo controllo offline.
