# Revisione ripetibile, senza nuove ricerche

Eseguire dalla cartella del progetto:

```powershell
npm run review:auto
```

Il comando confronta il classificatore attuale con l'ultima baseline verificata
v22. Usa esclusivamente il campione di sviluppo già raccolto: 13 partite,
854 mosse distinte e 1116 osservazioni. Non legge le partite di validazione,
non modifica riferimenti e non avvia Stockfish. La prima esecuzione prepara
una cache derivata; le successive la riutilizzano. A sorgenti e prove identiche,
riusa anche il risultato, evitando di ricalcolare le classificazioni.

Per confrontare un proprio candidato locale:

```powershell
npm run review:auto -- --candidate percorso/al/proprio-candidato.js
```

`--candidate` accetta un modulo locale attendibile che esporta
`reclassifySpecialMoves`. Esegue codice JavaScript, quindi usare solo candidati
del progetto. Gli import relativi `./` del candidato sono risolti da `src/lib`,
come negli studi storici. Le prove e i riferimenti sono identici per entrambi i
confronti; nessuna etichetta attesa entra nel classificatore.

Leggere **agent-output/review-automation/latest.md**. Il JSON accanto contiene
gli hash e i dettagli dei soli cambiamenti, falsi positivi e casi speciali aperti.
Ogni configurazione conserva anche un rapporto identificato dal proprio hash.
`latest` indica l'ultimo modello eseguito: controllare `candidate` nel JSON per
distinguere app e prototipo. I file prepared.json sono derivati, non baseline.

Il comando termina con codice 1 per regressioni, falsi positivi speciali,
cambiamenti nei sette campi numerici, riferimenti o prove incoerenti. Un caso
già irrisolto non rende fallito il controllo: resta esplicitamente nel rapporto.
La mancanza di falsi positivi vale solo per questo campione di sviluppo.

`--refresh` ricostruisce la cache derivata se cambiano le prove o il protocollo
di preparazione. Non ripete ricerche del motore. Non eseguire i vecchi script
monouso per aggiornare questo rapporto.

Questo controllo ricalcola classificazioni su prove salvate: **non sostituisce**
test del planner, archivio e browser. Per ogni gruppo di modifiche usare prima
i test pertinenti; prima di accettare una modifica all'app eseguire la suite
completa e la build. I nuovi script non integrano automaticamente i candidati.

Flusso di lavoro: modifica una regola → esegui il confronto → esamina solo
le differenze → integra se le prove bastano → verifica il flusso dell'app.
Nuove ricerche si progettano separatamente solo per prove mancanti; niente
approfondimenti automatici indefiniti sulle tre fonti storiche incerte.
