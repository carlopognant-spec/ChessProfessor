# Confronto numerico affidabile e fatti della mossa

Regole fissate prima dell'implementazione, 9 ottobre 2026.

- Nessuna ricerca motore aggiuntiva, nessun fitting, nessuna modifica a rating, sigmoid o soglie.
- Conservare i 20 input del manifest congelato e le cache originali. Implementare il confronto in un modulo distinto dal classificatore congelato.
- Preferire lo snapshot MultiPV completato solo se completo rispetto al numero richiesto/legale, ordinato, di profondità uniforme, con score esatti, radici distinte, varianti legali e prima scelta coerente con il risultato finale. Migliore e giocata devono provenire dallo stesso snapshot, senza mescolare score più recenti.
- Senza snapshot valido, usare una coppia root legacy soltanto se migliore e giocata hanno score esatti, stessa profondità, radici non ambigue e varianti legali. Altrimenti confrontare le analisi separate, dichiarando il limite. Le perdite negative indipendenti sono discordanti, non prova che la giocata sia migliore.
- La mossa uguale a PV1 mantiene legittimamente perdita zero nello stesso confronto. Non sostituirla con la ricerca child solo per ottenere un'etichetta attesa diversa.
- Forzata significa unica mossa legale verificata sulla posizione iniziale e sulla catena FEN; conservare anche la categoria numerica. Libro rimane un'informazione separata dalla categoria numerica senza cambiare il repertorio o allargare le regole speciali.
- Stesso percorso per analisi live, archivi e confronto QA. Il toggle delle categorie speciali non deve disattivare Forzata o i limiti del confronto numerico.
- Misurare tutte le 592 mosse consentite contro la baseline v6; riportare correzioni e regressioni, senza dichiarare validazione indipendente. Le partite 7–10 rimangono riservate e non vengono lette.
- Test indipendenti dalle etichette campione: snapshot incompleto, duplicato, bound, cambi di profondità/prima scelta, segni per entrambi i colori, dati mancanti, matto e legale forzata. Verificare anche archivio offline e UI senza nuove ricerche.

Il miglioramento atteso è la confrontabilità dei dati e la trasparenza, non una percentuale di concordanza prefissata. Dopo unit test, build e collaudo browser, commit e push su main autorizzati da Carlo.
