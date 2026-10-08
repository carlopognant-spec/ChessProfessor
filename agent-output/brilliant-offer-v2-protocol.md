# Geniale v2: offerta di pezzo mosso o lasciato in presa

8 ottobre 2026. Protocollo fissato prima della valutazione. Rb3 è già stato diagnosticato: non usare il suo esito per eliminare guardie o scegliere soglie. Personali 1–6 e due storiche già studiate, nessuna validazione indipendente. Nessuna nuova ricerca, modifica all'app, a Grande, a soglie/file precedenti/cache; niente .env/7–10 o commit/push.

## Estensione di copertura

- Candidato comune Migliore oppure Ottima, coerentemente con migliore/quasi migliore; Libro, Mossa mancata, altre categorie e matto dato protetti. Non modificare le soglie del classificatore comune.
- Enumerare le risposte legali che accettano pezzi non pedoni, anche diversi da quello appena mosso. Perdita netta dopo accettazione almeno 2 rispetto a prima della giocata, come v1.
- La risposta migliore può rifiutare il sacrificio. La posizione dopo la giocata e tutte le accettazioni materiali devono avere probabilità locale per il giocatore almeno 0,45, usando solo score senza bound disponibili.
- Richiedere copertura di tutte le accettazioni materiali tramite PV child salvata oppure evidenza supplementare già raccolta per quella FEN/radice; niente nuovi go. Risposte mancanti causano astensione, non score inventati.
- Per almeno un'accettazione: PV legale di almeno 8 ply, o matto prima; niente recupero immediato del saldo tramite presa. Saldi e recuperi successivi registrati. Accettazioni che sono semplici scambi non costituiscono l'offerta qualificante.
- Le due ricerche supplementari Rb3/Qxh8 possono essere utilizzate soltanto con corrispondenza FEN/root/configurazione e replay; scegliere deterministicamente il budget più alto già raccolto. Questo specifico dato è stato selezionato attraverso un riferimento, quindi riportare separatamente il contributo della ricerca mirata.

## Controfattuale senza sacrificio

Conservare il veto v1 0,75, precisando che riguarda un'alternativa SENZA offerta materiale: per ogni root mostrata già vincente, ripercorrere la mossa e enumerare le catture legali di risposta. Se nessuna accettazione perde almeno 2 punti netti, la root è un'alternativa vincente senza sacrificio e veto Geniale. Se l'alternativa offre anch'essa un pezzo, non usarla come prova di vittoria senza sacrificio. Non chiamare il MultiPV una copertura di tutte le mosse legali.

Priorità: protezioni, controfattuale vincente, qualità dopo la giocata, copertura/compensazione delle accettazioni, natura dell'offerta. Le PV e la possibilità di catturare un pezzo sono evidenze a budget limitato, non una prova di sacrificio favorevole contro tutte le difese.

## Confronto

Assegnare soltanto Geniale, senza alterare Grande congelata. Confronto v1/v2 per personali e storiche: TP/FP/FN, precisione/richiamo, numero di astensioni, tutti i candidati/positivi attesi e motivi. Segnalare se il supporto viene da pezzo lasciato in presa e/o miglior difesa che rifiuta. Nessuna attivazione automatica. Tre positivi non bastano per stimare affidabilità; non forzare il riconoscimento dei due storici.
