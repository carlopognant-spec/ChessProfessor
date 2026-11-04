# Selezione dei modelli e autonomia

La richiesta di Carlo del 27 ottobre 2026 sostituisce la precedente procedura di cambio manuale dei modelli, anche dove è ancora descritta nei progetti e rapporti storici. Le impostazioni tecniche sono in `.codex/config.toml` e `.codex/agents/*.toml`; il modello non cambia per effetto di queste istruzioni da sole.

Sol Medium è l'agente principale: ragiona, pianifica, programma, esegue comandi, verifica e gestisce le attività fino alla conclusione. Delega autonomamente solo quando il beneficio concreto supera il costo di avvio, contesto e revisione; altrimenti completa il lavoro da solo. Non è richiesta una pipeline di agenti per ogni richiesta.

- `luna` (GPT-6 Luna High): compiti circoscritti, ricerca nei file e analisi ripetitive con risultato verificabile. Usa gli script per il lavoro deterministico quando bastano.
- `sol` (GPT-6.1 Sol Medium): implementazione circoscritta o revisione indipendente quando la delega offre un vantaggio concreto, con file di competenza espliciti e senza duplicare il lavoro del principale.
- `astra` (GPT-6 Astra Medium): architettura, ambiguità rilevante, dipendenze complesse o debugging difficile quando resta un'incertezza tecnica che influenza la soluzione.
- `astra_high` (GPT-6 Astra High): escalation eccezionale se prove o verifiche lasciano irrisolto un problema particolarmente difficile; normalmente riusa l'analisi di Sol/Astra Medium. Si può ricorrervi direttamente per una difficoltà eccezionale documentata, senza eseguire per forza tutti i livelli.

Prima di delegare valuta incertezza, rischio della modifica, dipendenze, complessità logica e verifiche già eseguite. La durata, il numero di file o un singolo test fallito non bastano da soli per coinvolgere Astra. Assegna una domanda o responsabilità precisa, il minimo contesto, prove già raccolte e criterio di completamento; evita duplicazioni ed editing concorrente degli stessi file. Sol controlla i risultati e mantiene la responsabilità finale. Non richiedere review Astra sistematiche. I sottoagenti non delegano ulteriormente.

Usa i ruoli configurati quando il client li espone; se il tool della sessione supporta soltanto modello e reasoning espliciti, seleziona davvero gli stessi valori con contesto minimo. Se tale capacità manca, continua con Sol oppure dichiara il limite e richiedi il cambio manuale solo quando necessario. Non simulare cambi di modello e non avviare processi API o agenti annidati per aggirare i limiti del client.

Autenticazione e autorizzazioni restano ereditate dal client. Usare l'accesso ChatGPT; non introdurre chiavi API, provider a pagamento o fallback API. Prima di push, Git distruttivo, deploy o altre azioni irreversibili serve autorizzazione esplicita per l'operazione; se manca, chiedi conferma. Commit ordinari solo quando richiesti. Il routing non amplia il perimetro autorizzato.

# Ripresa dei lotti di apertura

Per la roadmap aperture parti da `node scripts/openings-workflow.mjs brief` e dalla skill `.agents/skills/opening-workflow/SKILL.md`. Carica progetto, corso o errore pertinente tramite i comandi indicati, evitando letture integrali dei rapporti storici per una normale ripresa. `docs/OPENING-NOW.md` è generato: verifica la sua attualità con `brief --check` o rigeneralo con `brief --write`.

I dettagli restano nei rapporti e nei ledger. Una sintesi non sostituisce controlli su tutti i dati né certifica QA applicativa. Restano applicabili le istruzioni della roadmap su fonti, file congelati e controlli; per i modelli prevale la selezione autonoma descritta sopra. Non leggere `.env`; commit, push e deploy soltanto quando autorizzati.
