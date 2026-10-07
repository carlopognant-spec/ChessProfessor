# Grande — esperimento offline v1, proposta operativa

Data: 7 ottobre 2026. Un solo punto, documentazione preventiva. Nessuna modifica app o cache; nessuna ricerca motore eseguita. Integra grande-geniale-protocol-v1-draft.md. Questo documento propone un ramo euristico cp; non sostituisce il ramo discreto del piano precedente e non autorizza il calcolo.

## Obiettivo circoscritto

Studiare una sola mossa che conserva una posizione almeno pari mentre ogni alternativa porta a uno svantaggio marcato, secondo analisi Stockfish a budget definito. È una definizione locale limitata di Grande; non copre ogni definizione pubblica Chess.com, non prova l'esito matematico e non assegna Geniale.

Le costanti sotto sono proposte di progetto fissate senza consultare nuovi dati o etichette. Non sono soglie ufficiali, stime del rumore né valori già calibrati. Richiedono approvazione esplicita prima dell'esperimento. Le soglie produttive 1/3/5/10/20 restano intatte.

## Parametri proposti da congelare

| Parametro | Proposta | Significato |
|---|---:|---|
| Categoria iniziale | Migliore, isEngineBest=true | Solo candidati compatibili con il cap attuale |
| Minimo mosse legali | 2 | Esclude unica mossa forzata |
| Valore minimo della giocata | 0 cp | Posizione stimata almeno pari |
| Valore massimo di ogni alternativa | −200 cp | Nessun'altra radice conserva posizione almeno pari |
| Distacco minimo | 200 cp | Giocata rispetto alla migliore alternativa |
| Margine di guardia | 50 cp per radice | Fascia preventiva intorno ai valori osservati |
| Oscillazione massima fra budget | 50 cp per radice | Filtro operativo di instabilità, non intervallo statistico |
| Prima raccolta | 200.000 nodi per radice | Copertura completa con ricerche vincolate |
| Conferma | 1.000.000 nodi per radice | Secondo budget, senza cambiare motore |
| Tetto totale per sessione | 100.000.000 nodi nominali | Limite di costo prima dei risultati |

Tutti i cp sono dalla prospettiva del giocatore che muove nella FEN iniziale. Il ramo cp si astiene se una qualunque radice ha score mate, bound, score mancante o risultato incompleto. Nessuna conversione mate→cp per superare queste soglie. Nessuna modifica delle due curve cp→probabilità.

## Decisione per posizione

1. Applicare le guardie del protocollo comune: SAN/UCI/FEN coerenti, almeno due legali, categoria iniziale valida, esclusione di Libro/Non valutabile/matto dato/Mossa mancata.
2. Enumerare tutte le mosse legali prima di analizzare; deduplicare per UCI. Conservare l'ordine lessicografico per rendere ripetibile la raccolta.
3. Raccogliere entrambe le analisi per ogni radice con searchmoves sulla stessa FEN iniziale, MultiPV 1. Queste sono ricerche sperimentali: non sostituiscono MultiPV 5 dell'app, non alimentano automaticamente i suoi risultati e non diventano analisi del fenAfter.
4. Per ogni radice r con score s200k e s1M, richiedere abs(s200k−s1M) <= 50 cp. Costruire l'inviluppo operativo low(r)=min(s200k,s1M)−50 e high(r)=max(s200k,s1M)+50. Non chiamarlo intervallo di confidenza.
5. La giocata m deve risultare la migliore in entrambe le raccolte. Richiedere low(m) >= 0; per OGNI alternativa r, high(r) <= −200; infine low(m)−max(high(r)) >= 200.
6. Nessuna alternativa può essere omessa o irrisolta. Candidati che non soddisfano le condizioni mantengono la categoria comune; registrare il primo motivo di esclusione e tutte le prove disponibili.

La guardia rende la proposta più restrittiva delle soglie nominali: per esempio una giocata osservata a +20 cp non passa low>=0. È deliberato; non diminuire il margine per recuperare esempi attesi. Score concordanti a due budget non dimostrano correttezza né indipendenza statistica.

Le depth reali si registrano per ciascuna ricerca. Non si presenta una MultiPV mista come graduatoria a pari depth: qui si confrontano ricerche separate a budget di nodi uguale per ciascun passaggio, dichiarandone il limite. Depth diverse non sono una prova di equivalenza delle ricerche. Un risultato interrotto o privo di score completo causa astensione.

## Motore, raccolta e manifest

Proposta: Stockfish 19 large-single, pacchetto 19.0.0, Threads 1, Hash 16 MB. Prima di ogni ricerca ucinewgame e Clear Hash; attendere readyok. Budget per go come sopra, registrando nodi reali ed eventuale sforamento. Nessun confronto con il motore nativo 16 per decidere la regola.

Il manifest futuro deve essere creato PRIMA dei go e separare dati di posizione ed etichette. Candidati scelti con le guardie correnti su TUTTE le mosse di P1–P6, non selezionati perché annotati Grande. Identificare FEN, ply, giocata UCI, categoria comune, legali, file sorgente e SHA-256. Non caricare i risultati attesi nel runner motore.

Prima del manifest reale e del calcolo occorre via libera a leggere le sole fixture P1–P6 e relative cache. In questo punto nessuna fixture letta. Partite/7–10 e .env esclusi. H1–H2 non entrano nel primo esperimento.

Output futuro proposto in una cartella nuova agent-output/grande-experiment-v1/<run-id>/, creata con errore se esiste. Nessuna scrittura in tests/fixtures/qa/** o cartelle baseline. Conservare manifest, versione parametri, raw UCI, score e motivi; nessuna modifica dei file originali.

## Costo e arresto

Per una posizione con L legali: 2L ricerche; 1.200.000 × L nodi nominali. Esempio puramente aritmetico, non conteggio osservato: 30 legali => 60 ricerche e 36.000.000 nodi.

Prima del calcolo conteggiare il costo di TUTTI i candidati. Se supera il tetto di 100 milioni, non selezionare un sottoinsieme dopo averne visto i risultati e non avviare il calcolo: riportare costo e richiedere una decisione sul manifest/tetto. Tempi in secondi NON MISURATI; il budget dell'esperimento non è la latenza prevista dell'app.

Non aumentare il budget, aggiungere un terzo passaggio, cambiare margini o ampliare la definizione durante la sessione. Stop/errore produce risultato incompleto, non promozione. La politica del ramo discreto matto richiede un esperimento distinto.

## Verifica e criteri di avanzamento

Prima delle partite: test sintetici delle decisioni con score controllati, entrambe le prospettive, confini esatti, due buone difese, alternativa fuori MultiPV, score mancanti/bound/mate, unica legale, mossa non PV1, inversione del ranking e oscillazione superiore al limite. Per la raccolta verificare searchmoves, FEN e metadati; test di trasporto non sostituiscono verifiche scacchistiche.

Report P1–P6: ogni candidato e ogni astensione, alternative complete, score ai due budget, inviluppi, depth e costo. Solo dopo risultati congelati confrontare tutte le etichette attese: TP/FP/FN, precisione e richiamo, più copertura. Le mosse Grande escluse dal filtro iniziale restano FN nel conteggio totale, con motivo distinto. Zero assegnati => precisione non definita.

Qualunque falso positivo noto blocca la proposta di adozione v1 fino a diagnosi separata. Zero falsi positivi sullo sviluppo non basta per attivarla: prima occorre una decisione sui limiti e un protocollo di validazione indipendente approvato. Non ottimizzare le costanti su P1–P6 e chiamare il risultato validazione.

Geniale, integrazione UI, schema archivio e validazione 7–10 restano punti successivi. Nessun classificatore implementato in questo passaggio.

## Esecuzione del presente punto

ESEGUITO: lettura della bozza precedente, scrittura di questo solo documento. Parametri proposti, non adottati.

NON ESEGUITO: manifest/costo sui candidati reali, lettura fixture, analisi motore, confronto etichette, test, build, browser, implementazione, commit/push.

STOP. Prima di procedere al manifest o al calcolo, approvare o correggere questo protocollo concreto; nessuna ricerca autorizzata dalla sua sola creazione.
