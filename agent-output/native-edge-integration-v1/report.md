# v24 — axb4 confermata con prove indipendenti

Rispetto a v23: **una Grande corretta in più**, nessuna regressione.
Totale nel campione di sviluppo: **32/34 Grandi, 4/4 Geniali**, zero falsi
positivi speciali su854mosse distinte/1116osservazioni. Nessuna validazione
indipendente. Il confronto automatico usa ancora la baseline v22, quindi
riporta quattro miglioramenti cumulativi, non quattro rispetto a v23.

La regola riconosce una nuova conseguenza forzante quando solo la scelta
giocata conserva un vantaggio relativo nel modello del motore. Si usa l'asse
simmetrico del mezzo punto, con intervalli interamente sopra o sotto, non
una soglia in cp adattata a questa partita. La scelta e tutte le quattro
alternative richiedono posizioni figlie verificate separatamente. Le riprese
ordinarie e l'incasso di forchette restano esclusi. Non si certifica una
vittoria forzata o una copertura di ogni mossa legale oltre le prime cinque.

Il censimento sulle prove disponibili trova9osservazioni compatibili:8sono
giàGrandi,una è axb4. La selezione non legge le etichette attese. Le quattro
nuove ricerche a1M sono tutte completate e rigiocate:4000923nodi entro4020000,
zero retry. App e archivio usano gli stessi certificati numerici, lasciando
invariati profilo iniziale e sette campi numerici. Le20dipendenze congelate
restano intatte.

Verifiche:556test passati,1TODO,60file;build riuscita;3browser passati:
trearchivi tattici v22,flusso axb4 dalla coppia alle quattro alternative e
riapertura offline,riuso dei tentativi senzaWorker.18test specifici includono
prove mancanti,duplicate,alterate,incomplete e alternative contraddittorie.

## Due casi restano aperti

Una diagnosi separata ha ripetuto a10M tutte le5posizioni instabili del
precedente studio a5M,non soltanto gli errori di riferimento:10FEN,
100004046nodi entro100050000,zero retry,replay passato. Questa ricerca non
cambia budget,curve o punteggi dell'app.

- **14...c6:** a10M torna migliore,confronto completato−194cp per il Nero,
  seconda a6−222cp;la posizione figlia conferma−160cp.
- **38...Ne4:** migliore+61cp per il Nero,seconda Rg6+48cp;la posizione
  figlia dopo la difesa d5 conferma+53cp. L'esito nativo è ora concorde.

Questi dati non dimostrano che siano scelte uniche decisive. Restano attese
Grande nel riferimento,con fonte non ricordata dall'utente. È stata chiesta
la verifica delle due etichette; nessuna correzione al riferimento è stata
presunta. Report completo in ../depth-stability-v1/report.md.
