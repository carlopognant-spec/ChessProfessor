# SIC-07 R1: nove percorsi Taimanov con Ae3/Ae2

Revisione del 27 ottobre 2026 per completare l'ampliamento P02 già concordato. Il [piano originale](data/opening-taimanov-be2-p022-plan.json), la sua prova e il ledger restano congelati. Il [fallimento originale](OPENING-TAIMANOV-BE2-P022-GATE-REVIEW.md) è conservato, non cancellato o trasformato in un esito positivo.

L'obiettivo resta pubblicare insieme **nove corsi e nove esercizi**, passando da 293 a 302. Otto percorsi sono invariati. Nel percorso `nge7`, dopo il prefisso documentato di 14 semimosse, il seguito didattico diventa `Ndb5 axb5 Nxb5 Qa5+ Bd2 Qb6`. Gioca il sacrificio, la ripresa con attacco alla donna, lo scacco e la parata: il materiale immediato non basta a confutare Cdb5. Sono scelte didattiche revisionate sulle analisi salvate, non una continuazione attribuita alla fonte.

Il nuovo esercizio parte dopo Cdb5: ...Dxh2 permette Txh2. Sono controllate tutte le 27 repliche legali immediate; anche ...axb5 lascia un saldo minimo di +5. L'accettazione richiede inoltre lo swing motore minimo di 200 cp, invariato. Nessuna unicità della mossa vincente o vittoria finale viene inferita dal solo materiale.

Il [piano R1](data/opening-taimanov-be2-p022-r1-plan.json) e la [prova offline](data/opening-taimanov-be2-p022-r1-design-verification.json) contengono nove percorsi, 150 semimosse documentate e 18 didattiche, 322 repliche, 90 transizioni e 29 fatti geometrici. Fonti, perimetro e copertura prevista sono invariati: 24 nuove posizioni esatte e una trasposta, fino a 1.980/203/10.139. Sono protetti anche il piano e la prova originali, oltre ai 216 file precedenti.

Budget esplicito prima della raccolta R1:

- 45 job logici: 34 riusati dal ledger originale con FEN completa, radici e politica di ricerca identiche; 11 nuovi primari.
- I 34 riusi sono i 32 job degli altri otto corsi e i controlli liberi dopo ...Cge7 e Cdb5. Le firme originali e le trascrizioni rimangono intatte e vengono rilette e validate.
- Nuove ricerche: sei confronti vincolati delle mosse didattiche; quattro controlli liberi agli indici 16-19; una ricerca dopo ...Dxh2. Stockfish 16 congelato, un thread, hash 32 MB, MultiPV 1, clear hash e 200.000 nodi per ricerca, timeout 30 secondi.
- Massimo 22 nuovi `go`, 4.400.000 nodi richiesti incluse conferme e interruzioni. Sommando le 37 ricerche precedenti: tetto complessivo 59 `go` e 11.800.000 nodi richiesti. Nessun aumento del tetto originale di 74 `go`.
- Massima perdita didattica 100 cp, minimo swing esercizio 200 cp e materiale +2. Nessuna soglia modificata, nessuna ripetizione dei job compatibili o ricerca automatica di sostituti.

I gate si applicano a tutte le 18 mosse didattiche e tutti i nove esercizi. Un nuovo fallimento richiede una nuova revisione esplicita: non è autorizzata una ricerca per tentativi.

La matrice browser resta quella progettata: 82 nuovi casi, 90 selezionati con otto regressioni, 223 casi roadmap Siciliana disponibili. Il seguito più lungo non cambia i nove bivi. Verificare da entrambi i colori anche le convergenze a3/b5 e arrocco/b5 senza trasferire progressi per sola posizione.

Il rigeneratore offline è [revise-opening-taimanov-be2.mjs](../scripts/revise-opening-taimanov-be2.mjs). Eseguire il suo `--check` prima dell'integrazione; dopo usare baseline, `build --check`, report e QA no-env. Nessun cambio al classificatore. Nessun commit, push o deploy.
