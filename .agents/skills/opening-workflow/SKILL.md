---
name: opening-workflow
description: Riprendi, prepara o verifica i lotti di aperture di ChessProfessor usando dati mirati e la pipeline locale. Usala per la roadmap aperture, non per altre funzionalità dell'app.
---

Esegui dalla radice del repository `node scripts/openings-workflow.mjs brief`. Il riepilogo deriva dai file e verifica baseline e ledger; il file salvato `docs/OPENING-NOW.md` è un punto di ingresso, da rigenerare/verificare se necessario. Per una semplice domanda di stato bastano queste informazioni.

Carica altri dati solo per la decisione attuale:

- `inspect --course ID`: mosse, provenienza e stato. Aggiungi `--section notes`, `exercise` o `source` per il dettaglio, con `--offset` e `--limit`.
- `inspect --position ID` / `--record ID`: riferimenti esatti. `sources --prefix "SAN"` cerca gli ordini sorgenti con quel prefisso.
- `history`: indice paginato dei risultati storici, senza riscrivere i rapporti. Non attribuirne gli esiti al codice corrente.
- `draft --prefix "SAN"`: prepara candidati strutturali da tutti i record, salvando il dettaglio su file. Nessuna scelta scacchistica viene approvata automaticamente.
- `assess --plan docs/data/PIANO.json`: verifica fonti, legalità, turni attivi ai checkpoint, esercizi, copertura e job. Non certifica testi strategici o mosse migliori. Il rapporto completo è nel percorso `evidence` restituito.
- `run --step verify --lot ID`: esegue la pipeline esistente con risposta sintetica. Anche `prepare`, `collect`, `build`, `report`, `inventories` restano passi espliciti. `details --file PERCORSO --offset N --limit N` apre solo una porzione degli artefatti del nuovo flusso.

Per l'implementazione leggi soltanto il progetto indicato dal riepilogo e i corsi pertinenti. Leggi [la guida](../../../docs/OPENING-PIPELINE.md) quando servono comandi QA, budget o ripresa; consulta [la roadmap](../../../docs/ROADMAP-E-PROMPT-OPERATIVI.md) per nuove decisioni di fase. Non ricostruire normalmente tutta la cronologia.

Mantieni la distinzione fra app installata, proiezione e prove storiche. Usa script per calcoli e controlli su tutti i dati; l'output paginato non limita i record verificati. Conserva i rapporti originali, gli hash, le soglie e i ledger. Non leggere `.env`. Non avviare ricerche motore da una domanda di stato o durante l'ottimizzazione degli strumenti.

Per i modelli seguire il routing autonomo in `AGENTS.md`, che sostituisce le vecchie pause manuali: Sol completa il lavoro ordinario e delega solo con beneficio concreto ai modelli realmente supportati. Le raccomandazioni dei progetti congelati restano storiche, senza imporre passaggi Astra automatici. Per nuovi lotti restano necessarie revisione didattica, prove limitate e QA proporzionata. Un errore conserva il dettaglio su file: apri il caso pertinente e correggi la causa senza rigenerare prove congelate. Commit, push e deploy richiedono la specifica autorizzazione della sessione.
