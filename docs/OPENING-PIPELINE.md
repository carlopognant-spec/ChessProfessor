# Automazione dei lotti di apertura

**Sviluppo sospeso dal 29 ottobre 2026:** stato, blocco dell'hash e istruzioni
di ripresa sono nel [riepilogo della roadmap](ROADMAP-E-PROMPT-OPERATIVI.md).
Non avviare nuovi lotti o ricerche fino a richiesta esplicita di Carlo.

## Ripresa e output sintetici

**SIC-08 R1 concluso:** **144 test mirati, build no-env e 72/72 casi browser PASS**. [Registro QA](data/opening-taimanov-bd3-p022-r1-qa.json): tutti i 523 file protetti sono invariati; i 287 casi roadmap Siciliana restano disponibili. Il prossimo lotto riguarda i rimanenti ingressi Taimanov con a3, f4, Dd2 e ...Cf6 anticipato. Non ripetere le ricerche dei lotti completati. Il limite del vecchio test delle bozze resta distinto e non è dichiarato risolto.

**SIC-08 R1, 28 ottobre 2026:** integrati sette percorsi Taimanov con Ad3 e sette esercizi: **309 corsi/esercizi, 48 siciliani**. Il [progetto R1](OPENING-TAIMANOV-BD3-P022-R1-DESIGN.md) conserva la revisione del solo seguito ...h5 e l'esito originale; il [risultato offline](OPENING-TAIMANOV-BD3-P022-R1-RESULTS.md) verifica tutti i 17 confronti e sette esercizi, con 30 riusi e 12 nuove ricerche. Copertura 1.994 esatte, 203 trasposte, 10.125 assenti; la QA applicativa è registrata separatamente dopo il run, senza confonderla con questi controlli offline.

**Collaudo SIC-07 R1 concluso:** build no-env e **90/90 casi browser PASS** sulla build compilata; tutti i 223 casi roadmap Siciliana restano disponibili. [Registro QA e limiti](data/opening-taimanov-be2-p022-r1-qa.json): 793 test unitari distinti passati nei tentativi registrati, un TODO preesistente e un timeout residuo del comando di preparazione bozze (correttezza verificata separatamente). I timeout non sono stati aumentati. Il prossimo lavoro P02 riguarda gli altri rami Taimanov Qc7/Ae3, non una nuova raccolta di SIC-07/R1.

**SIC-07 R1, 27 ottobre 2026:** i nove percorsi e nove esercizi sono integrati: **302 corsi/esercizi**. Il [piano revisionato](OPENING-TAIMANOV-BE2-P022-R1-DESIGN.md) corregge la risorsa tattica Cdb5 e il suo esercizio; 34 risultati compatibili riusati e 11 nuove ricerche, con tutti i 18 confronti e nove esercizi accettati. Il [risultato](OPENING-TAIMANOV-BE2-P022-R1-RESULTS.md) verifica contenuti e copertura offline; gli esiti applicativi appartengono al registro QA. Il [fallimento originale](OPENING-TAIMANOV-BE2-P022-GATE-REVIEW.md) e il suo ledger restano conservati.

Per una normale ripresa partire da [OPENING-NOW.md](OPENING-NOW.md), generato dai dati, oppure eseguire `node scripts/openings-workflow.mjs brief`. La skill di progetto [opening-workflow](../.agents/skills/opening-workflow/SKILL.md) e [AGENTS.md](../AGENTS.md) indicano questo ingresso. Il riepilogo distingue app attuale, proiezione e ricerche persistite; non certifica automaticamente QA applicativa.

```powershell
node scripts/openings-workflow.mjs brief
node scripts/openings-workflow.mjs brief --write
node scripts/openings-workflow.mjs brief --check
node scripts/openings-workflow.mjs inspect --course sicilian:taimanov-be2-nge7
node scripts/openings-workflow.mjs inspect --course sicilian:taimanov-be2-nge7 --section notes --limit 2
node scripts/openings-workflow.mjs history --limit 3
```

`brief --write` aggiorna il solo riepilogo e il suo [JSON](data/opening-pipeline/current.json). `--check` ricalcola dati e firma degli input e rifiuta uno stato superato. Baseline, fonti, hash protetti e ledger passano dai controlli comuni. La firma comprende i moduli delle aperture, gli strumenti di questa interfaccia e le prove motore del lotto. Non è una firma di validazione dell'intera applicazione.

I report storici restano intatti: `history` ne presenta un indice paginato con percorso e hash. Non occorre riscriverli o inserirli tutti nel contesto del modello. `inspect --position ID` e `inspect --record ID` recuperano riferimenti esatti; `sources --prefix "SAN"` filtra il corpus. `--offset` e `--limit` limitano la presentazione, non i dati controllati. Il limite massimo di una pagina è 50 elementi.

## Preparazione comune dei progetti

```powershell
node scripts/openings-workflow.mjs draft --prefix "e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Be2" --limit 2
node scripts/openings-workflow.mjs assess --plan docs/data/opening-taimanov-be2-p022-plan.json
node scripts/openings-workflow.mjs run --step verify --lot sic-07
```

`draft` estrae tutti gli ordini terminali e i riferimenti, propone il genitore per prefisso già presente e individua i checkpoint senza mosse attive per uno dei colori. Salva un candidato **non revisionato e non eseguibile** nella cache; non decide quali percorsi pubblicare, non inventa continuazioni, commenti o esercizi e non registra un lotto. Nel caso SIC-07 ritrova nove ordini terminali e 20 checkpoint diretti senza mosse attive prima dell'aggiunta delle continuazioni.

`assess` verifica una specifica completa con funzioni comuni: legalità e fonte delle mosse, confine documentato/didattico, entrambi i colori, transizioni, tutte le repliche degli esercizi, copertura e budget. Il risultato completo è salvato nel percorso `evidence`; la risposta riporta soltanto i conteggi. Sul piano SIC-07 riproduce i 37 job e le 341 repliche della prova congelata. Non sostituisce la revisione dei testi e dei fatti geometrici specifici, il controllo motore o il browser. Le prove storiche non vengono rigenerate.

`run --step` richiama i comandi del lotto già esistenti e restituisce una sintesi, conservando il risultato completo in `.cache/opening-pipeline/workflow/`. I passi supportati sono `verify`, `prepare`, `collect`, `build`, `report`, `inventories`. `collect` rimane esplicito, soggetto all'autorizzazione e al piano congelato. Per il rapporto di proiezione aggiungere `--projection`; per i confronti degli artefatti `--check`, nei soli passi che lo supportano.

Per leggere un dettaglio usare `details --file PERCORSO_EVIDENCE --offset 0 --limit 20`. Il comando accetta soltanto artefatti della nuova interfaccia, pagina le righe e segnala quelle tagliate. In caso di errore la CLI termina con codice 1, mostra il messaggio sintetico e salva lo stack completo con un riferimento. Tutti i dati restano disponibili; la sintesi non elimina controlli.

Le cache QA con hash degli input e il fallback completo restano quelli del runner precedente. I comandi qui sopra non modificano il modello né rendono necessari MCP, database vettoriali o servizi esterni. Una nuova conversazione può riprendere dal riepilogo verificato e aprire soltanto i dettagli pertinenti.

Il flusso comune sostituisce la copia di collector, builder e reporter per ogni nuovo gruppo. Le specifiche didattiche restano nei piani JSON; fonti, scelte, soglie e budget non vengono decisi automaticamente dagli script.

Il registro [lots.json](data/opening-pipeline/lots.json) indica il lotto attivo, piano e prova di progetto. SIC-05 è un caso storico di sola lettura per il confronto degli output; SIC-06 è il primo utilizzatore del flusso nuovo. SIC-06 è stato raccolto e integrato con il flusso comune: l'applicazione contiene 293 corsi ed esercizi. [Risultato automatico](data/opening-pipeline/sic-06-result.md).

## Comandi del lotto

```powershell
npm.cmd run openings:lot -- status
npm.cmd run openings:lot -- verify
npm.cmd run openings:lot -- report --projection
npm.cmd run openings:lot -- prepare
npm.cmd run openings:lot -- collect
npm.cmd run openings:lot -- build
npm.cmd run openings:lot -- build --check
npm.cmd run openings:lot -- report
npm.cmd run openings:lot -- report --check
npm.cmd run openings:lot -- inventories
npm.cmd run openings:lot -- inventories --check
```

`--lot sic-06` seleziona esplicitamente un gruppo; altrimenti si usa `activeLot` del registro. Senza comando si esegue **status**, che non lancia motori, test o generazione.

| Comando | Operazione |
| --- | --- |
| `verify` | Baseline e hash protetti, fonti, confini documentati/didattici, esercizi con tutte le repliche, job e copertura prevista |
| `prepare` | Manifest e copie immutabili degli strumenti, senza ricerche |
| `collect` | Unico comando che può avviare Stockfish, con il driver congelato e il budget del piano |
| `build` | Rilegge le trascrizioni, applica tutti i gate e genera i moduli solo dopo il loro superamento |
| `report --projection` | Rapporto corrente e proiezione distinti, senza attribuire al sito i contenuti previsti |
| `report` | Richiede moduli integrati e prove verificate; produce JSON e Markdown coerenti |
| `inventories` | Aggiorna inventario e copertura dei commenti dal runtime, senza motore |
| `status` / `resume` | Ricostruisce il punto di ripresa dagli input e dal registro motore; suggerisce la prossima operazione |

`--check` confronta gli output e non li riscrive. Non è ammesso per `collect`: raccolta e controlli offline sono comandi distinti.

Lo stato di lavoro è in `.cache/opening-pipeline/<lot>/state.json`. La firma include specifiche, strumenti, baseline e file congelati; se cambiano gli input, gli esiti precedenti non sono indicati come riutilizzabili. La presenza di un modulo non dimostra il superamento dei gate: `build --check` ne ricostruisce il contenuto.

Le richieste motore persistite consumano budget anche in caso di interruzione. Un job interrotto/fallito richiede revisione; `status` segnala anche i lock, senza cancellarli. Le copie degli strumenti nel nuovo ledger consentono di conservarne la provenienza quando il registro generale viene ampliato o la pipeline evolve. Prima di continuare una raccolta il codice deve corrispondere al manifest preparato; il replay offline verifica le copie congelate e le trascrizioni. I ledger storici restano immutati.

Il builder confronta separatamente tutte le mosse di `authoredMoves`, accettando anche l'array vuoto. Le baseline vengono condivise soltanto come previsto dalle FEN complete e dagli usi nel piano. Per la copertura si confrontano invece i primi quattro campi FEN; i diversi contatori non sono scartati nei job motore.

## Selezione dei prossimi gruppi

```powershell
npm.cmd run openings:backlog -- --limit 12
npm.cmd run openings:backlog -- --family sicilian --limit 5
npm.cmd run openings:backlog -- --write
```

Il selettore raggruppa gli ordini sorgente al primo ramo non giocabile. Ordina per posizioni sorgenti assenti e conta il guadagno marginale, sottraendo quelle già comprese nei candidati precedenti. Poi favorisce il prefisso già disponibile più lungo. Il risultato salvato è [backlog.json](data/opening-pipeline/backlog.json).

Il numero di posizioni indica la dimensione del gruppo da esaminare: non promette che basti un corso per coprirlo. Sinonimi e ordini diversi della stessa posizione non aumentano il conteggio. Frequenza pratica, qualità delle mosse, costo editoriale e valore didattico non sono stimati dal selettore; richiedono revisione. Non viene ridotto il perimetro A né imposto un volume uguale a tutte le famiglie.

## Verifiche proporzionate e ripresa

```powershell
npm.cmd run openings:qa
npm.cmd run openings:qa -- --run
npm.cmd run openings:qa -- --full --run
```

Senza `--run` viene mostrato il piano dei controlli. Per impostazione predefinita si considerano tutti i file modificati e non tracciati del checkout. `--changed percorso` può essere ripetuto per una selezione esplicita: viene registrata nel rapporto e certifica soltanto quel perimetro, non tutto il lavoro pendente.

- Strumenti della pipeline: test del contratto comune, verifica del lotto attivo, confronto byte per byte con SIC-05 e controllo documenti.
- Documenti e specifiche: verifica di fonti/baseline e controllo UTF-8, JSON e collegamenti.
- Soli nuovi moduli di contenuto: test dei percorsi, build e browser soltanto con una selezione QA del lotto esplicitamente registrata e revisionata. Senza tale selezione si passa alla modalità completa.
- Codice runtime, dipendenze, file sconosciuti, traguardo di famiglia o consegna Git/pubblicazione: verifica completa. I test storici restano disponibili; non vengono eliminati per rendere verde il lotto.

Per gli aggregatori è prevista una sola eccezione verificabile: si rimuovono gli import e gli inserimenti dichiarati nel registro e il contenuto risultante deve avere esattamente l'hash precedente del progetto. Se coincide, la modifica è classificata come aggiunta di dati; qualunque altra modifica al file fa scattare la verifica completa. Non basta che il nome del file sia in una lista consentita.

La modalità completa esegue suite no-env, build no-env e tutti i casi browser della roadmap. Una selezione più piccola per i contenuti mantiene i controlli su tutti i nuovi percorsi e le transizioni nella logica, e concentra il browser sui comportamenti distinti. L'aggiornamento di una selezione va motivato nel progetto, senza indebolire gli invarianti.

Gli esiti e i log sono in `.cache/opening-pipeline/qa/<firma>/`. Un PASS è riusato solo per lo stesso piano e gli stessi hash dei file di codice, test, specifiche e prove registrate. La firma viene ricontrollata dopo ogni comando. Se i file cambiano durante l'esecuzione, l'esito non viene accettato. `--no-reuse` forza la ripetizione; un errore interrompe la sequenza.

Il runner non contiene ricerche motore. Tutti i comandi applicativi usano le configurazioni no-env; gli script escludono `.env` e i percorsi esterni al workspace.

Per un errore browser isolato si può ripetere soltanto il caso fallito, dopo aver verificato gli input originali, con `npx.cmd playwright test --config scripts/qa-opening-browser.config.js --last-failed`. Conservare l'esito iniziale e registrare separatamente la ripetizione; non presentare la somma dei tentativi come numero di casi distinti. [Validazione della pipeline e primo lotto](OPENING-PIPELINE-RESULTS.md).

## Rapporti e controlli finali

```powershell
npm.cmd run openings:docs
npm.cmd run openings:docs -- --lot sic-06
node scripts/openings-lot.mjs build --lot sic-05 --check
```

Il controllo documenti verifica UTF-8, sintassi JSON e destinazioni dei collegamenti locali. Non interroga URL esterni e non verifica gli anchor Markdown. Il confronto con SIC-05 ricostruisce identici i due moduli e la prova degli esercizi dalle trascrizioni già raccolte; non riscrive i file storici.

I rapporti di proiezione sono separati dai risultati di implementazione. L'inventario individua automaticamente tutti i corsi con `roadmapLot`, quindi non richiede di aggiungere import o liste per ciascun lotto. I due reporter dell'inventario supportano anche `--check`. Per i modelli seguire il routing autonomo in [AGENTS.md](../AGENTS.md), che sostituisce la procedura manuale precedente; gli script delle aperture non cambiano il modello.

## Migrazione di SIC-06

Il [progetto SIC-06](OPENING-SICILIAN-EARLY-P022-DESIGN.md) conserva mosse, fonti, esercizi, gate e budget. Il suo piano e la prova di progetto restano immutati. I campi storici `plannedFiles.collector`, `builder` e `reporter` sono sostituiti operativamente dai comandi comuni; non occorrono tre nuovi script. I percorsi dei moduli, del ledger e del risultato restano quelli del piano.

Prima dell'integrazione usare `verify`, preparazione e raccolta esplicite, poi `build`. Dopo integrazione, usare `build --check`, `report`, inventari e QA. Il reporter comune usa schema 2, con copertura attuale/proiettata e posizioni nuove esatte/trasposte distinte. I controlli geometrici specifici del progetto restano evidenze del progetto, senza dichiarare automaticamente revisionati i testi liberi.

SIC-06 conserva tutti i 169 file protetti, i 12 job e i quattro confronti fissati. La matrice completa contiene 141 casi browser, tutti conservati. Per questa integrazione di soli dati il registro specifica una selezione di **62 casi: tutti i 54 nuovi e otto regressioni esistenti** (prosecuzioni, destinazioni contenute, checkpoint Zaitsev e bivio bianco a6). L'assenza di altre modifiche runtime è verificata mediante ripristino degli hash degli aggregatori. L'esito effettivo è nel rapporto QA, senza dichiarare eseguiti i 79 casi fuori selezione. La modalità `--full` rimane disponibile per tutti i 141.

## Punto di ripresa: SIC-07 progettato

Il candidato Taimanov è stato esaminato: il [progetto SIC-07](OPENING-TAIMANOV-BE2-P022-DESIGN.md) prepara insieme nove percorsi ed esercizi nel sottoramo con Ae3/Ae2. Prevede 24 nuove posizioni esatte e una trasposta; l'app rimane a 293 corsi finché non supera i gate di implementazione. Il registro attivo è `sic-07`: `verify` e `report --projection` sono già utilizzabili, `prepare` e `collect` restano da eseguire. Proseguire con **Sol Medium e deleghe opzionali**, secondo AGENTS.md. Non servono nuovi collector/builder/reporter. Le 98 posizioni residue del candidato e gli ingressi Ac4/Ad3/f3 rimangono nel perimetro A; le vecchie istruzioni di SIC-06 richiedono ora `--lot sic-06` esplicito.
