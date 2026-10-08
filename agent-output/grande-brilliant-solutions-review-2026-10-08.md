# Diagnosi completata e confronto delle possibili soluzioni

8 ottobre 2026. Questa analisi usa i dati già disponibili e fonti pubbliche ufficiali. Nessun nuovo modello attivato, soglia modificata o motore avviato. Non è una validazione indipendente.

## Risultati reali di questo passo

[Audit compensazione](brilliant-compensation-history-2026-10-08T02-33-32-816Z/report.md): 592 mosse, 213 accettazioni materiali, 120 offerte persistenti. Di queste, 103 non hanno copertura sufficiente degli score; 11 risultano già compensate secondo la soglia esistente 0,45; 6 risultano sfavorevoli anche adesso. Nessun caso documentato di compensazione che passa da sfavorevole a favorevole. I 103 casi ignoti non dimostrano che questo fenomeno non esista.

Nella partita 2, dopo Bxa6, la probabilità locale per il Nero passa da circa 0,485 a 0,464: l'arrocco non rende nuova una compensazione prima assente secondo questo criterio. Per Rf3 manca nell'audit il precedente score ordinario di Qxh8. Separatamente, le due ricerche mirate già raccolte dopo Rb3 mostrano +903/+977 per il Bianco: questa evidenza selezionata attraverso il riferimento sostiene che la precedente accettazione fosse già favorevole, senza costituire validazione né prova causale.

Il confronto tra due momenti diversi include anche una mossa avversaria: non dimostra che la mossa del giocatore abbia causato un miglioramento. Non va trasformato automaticamente in un nuovo classificatore.

[Audit recuperi legali](brilliant-legal-recovery-audit-2026-10-08T02-37-12-298Z/results.json): 182 delle 213 accettazioni permettono una presa legale immediata che ripristina il saldo materiale iniziale. In 13 casi la PV salvata non sceglie quel recupero; in 125 manca la PV dell'accettazione. Sono possibilità materiali, non risposte tatticamente valide dimostrate.

- Dopo l'arrocco della partita 2 e Bxa6, il Nero può giocare bxa6 oppure Bxc3+ ripristinando il saldo. La PV sceglie invece Qc7. Il vecchio controllo sul solo secondo ply della PV perde queste possibilità.
- Dopo Rf3/Rxh8, sono legali Qxf5+ e Rxf5+ con recupero del saldo; manca la valutazione di queste specifiche risposte.
- Dopo Nxe5/Nxe5 della partita 6, non esiste un recupero immediato di questo tipo. Il recupero al quarto ply avviene tramite una combinazione.
- Anche Rb3/Qxh8 consente Qxf5+, e Rxf5+/Qxf5 consente Qxg6+. Dunque vietare qualsiasi presa che recupera subito materiale eliminerebbe due Geniale di riferimento. Serve controllare che quella presa regga alle successive risposte, non solo contare i pezzi.

Geniale v3 resta TP 1, FP 0, FN 2 sullo sviluppo già studiato. Grande prudente resta TP 6, FP 0, FN 18. Zero falsi positivi osservati non significa affidabilità perfetta su partite nuove.

## Cosa può spiegare il disaccordo con Chess.com

Chess.com descrive Geniale come sacrificio valido migliore o quasi, con posizione successiva accettabile e senza vittoria già assicurata evitando la mossa. La generosità della classificazione dipende dal livello del giocatore. Grande comprende mosse decisive e l'unica buona mossa. L'Expected Points dipende da rating e valutazione; la pagina non fornisce coefficienti completi per riprodurlo. Quindi le nostre soglie non sono soglie ufficiali. [Definizioni ufficiali](https://support.chess.com/en/articles/8572705-how-are-moves-classified-what-is-a-blunder-or-brilliant-etc).

La qualità della ricerca e le impostazioni possono cambiare le etichette anche dentro Chess.com. Nei nostri riferimenti non abbiamo tutti i metadati della revisione. Le storiche non hanno un rating numerico nel PGN: non inventarlo né attribuire loro automaticamente il livello di un maestro. [Differenze tra analisi](https://support.chess.com/en/articles/11845102-why-did-my-move-classification-change-in-game-review).

Perciò il veto locale 0,75 può essere troppo restrittivo o interpretare male il controfattuale pubblico; questo è un'ipotesi da verificare. Toglierlo per recuperare Rb3/Rxf5+ sarebbe adattamento ai due esempi, non una soluzione dimostrata.

## Soluzioni confrontate

| Strada | Problema affrontato | Limite | Decisione |
|---|---|---|---|
| Completare score delle accettazioni mancanti | Astensioni per prove assenti | Non risolve il veto già vincente o i riferimenti incompleti | Primo passo concreto |
| Confrontare diverse mosse proprie dalla stessa FEN | Compensazione introdotta dalla mossa | Servono difese comparabili; poche root non coprono tutte le alternative | Migliore direzione per la semantica del sacrificio |
| Analizzare lo scambio con tutte le ricatture legali | Falsi sacrifici da semplice conteggio | Intermezzi, scacchi e prese su altre case possono invalidare uno scambio statico | Caratteristica diagnostica con controllo motore, non veto assoluto |
| Usare WDL nativo come seconda misura | Logistica fissa ignora patte e materiale residuo | Modello di auto-gioco tra motori, non giocatori con il rating di Carlo | Confronto sperimentale, non sostituzione dell'Expected Points |
| Calibrare una funzione dipendente dal rating | Somiglianza con le decisioni della piattaforma | Solo 3 positivi Geniale; personali tra 580 e 791 Elo | Rimandare il fitting fino a nuova raccolta |
| Apprendere separatamente famiglie di Grande | Matto, forchetta, unica difesa, punizione di errore | Motivo geometrico non prova la necessità o la bontà della mossa | Ricercare famiglia per famiglia, senza unire automaticamente regole |
| Verificare stabilità a più budget | Classificazioni basate su score instabili | Più nodi non risolvono una definizione sbagliata | Conferme mirate dopo selezione, non riesecuzione generale |
| Aggiungere un modello grande o un LLM alle etichette | Interpretazione di posizioni complesse | Troppo pochi positivi, risposte non verificabili, rischio di inventare etichette | Nessun uso come giudice; eventualmente spiegare prove già verificate |

Il WDL ufficiale dipende da valutazione e materiale ed è calibrato su auto-gioco fishtest. Permette di distinguere vittoria/patta/sconfitta e calcolare punti attesi W + D/2. Non è una probabilità umana né un clone del modello di Chess.com. [Modello ufficiale Stockfish](https://github.com/official-stockfish/WDL_model). La Precisione dell'app rimane invariata anche in un futuro confronto WDL.

## Direzione scelta e ordine del lavoro

**Stockfish come valutatore delle posizioni, più un modulo tattico verificabile e una calibrazione separata delle etichette.** È la direzione che preferisco perché distingue prove mancanti, sacrificio materiale, compensazione e politica della piattaforma. Non abbiamo dati per attribuirle una probabilità numerica di successo.

1. Colmare i buchi reali: [manifest preparato](brilliant-missing-evidence-manifest-2026-10-08T02-35-36-343Z/manifest.json), 30 radici in 26 posizioni, selezionate senza etichette attese. Budget futuro 200.000 nodi per radice, 6 milioni nominali, tetto globale 7,5 milioni effettivi, nessun retry. Le ricerche sono NON ESEGUITE. Anche zero nuovi Geniale sarebbe un esito utile: separerebbe la mancanza di dati dal limite delle regole.
2. Per le offerte ancora plausibili, confrontare mosse alternative dalla medesima FEN iniziale: giocata, alternative senza offerta e alternative con offerta equivalente. Usare score unbounded con radici distinte, replay legale e configurazione documentata. MultiPV parziale non prova unicità. Fissare manifest e budget prima delle ricerche; astensione se il limite impedisce il confronto.
3. Sullo scambio, enumerare ricatture legali e risposte che le confutano. Il saldo dopo una sola presa non basta; non fissare un veto sulla durata della combinazione. Se una ricattura sembra restituire materiale ma perde la donna o permette matto, non usarla come prova contro il sacrificio.
4. Tenere stabili i rilevatori durante la raccolta futura. Conservare per ciascuna revisione PGN, rating effettivi, data, modalità/motore/forza quando disponibili, etichette complete e non solo i Geniale. Le prove sintetiche verificano la logica tattica, non la compatibilità con Chess.com. Una raccolta di soli brillanti misura richiamo, non falsi positivi.
5. Prima di attivare, confronto per partite intere con regole congelate, risultati separati per categorie e rating, campione nuovo escluso da scelta di feature/soglie. Le partite 7–10 restano riservate e non lette. Selezione di casi dubbi utile per training; valutazione finale anche su partite complete per evitare un campione artificiosamente facile.

Per Grande, conservare la regola prudente come candidato per la sola famiglia osservata dopo errore. L'assenza di presa è una correlazione del campione; non è una definizione generale. Nuove famiglie devono dimostrare il proprio contributo su casi positivi e negativi, con confronto dell'unione finale: sommare regole singolarmente promettenti può reintrodurre falsi positivi.

## Stato verificato

26 test mirati passati, inclusi 7 nuovi sulla compensazione, le fonti discordanti e la copertura mancante. Audit e manifest eseguiti; ricerche del manifest NON ESEGUITE. Hash di tutti gli input invariati. App, classificatore, soglie, Grande congelata e cache invariati. Nessun commit/push. Suite app/build/browser NON ESEGUITI.
