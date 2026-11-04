# Routing dei modelli personale e di progetto

Configurato il 27 ottobre 2026 tramite le funzionalità native di Codex. [Configurazione](../.codex/config.toml), [criteri decisionali](../AGENTS.md), [verifica locale](data/codex-routing-validation.json), [verifica personale](data/codex-routing-global-validation.json).

| Responsabilità | Modello | Ragionamento | Attivazione |
| --- | --- | --- | --- |
| Conversazione, coordinamento, pianificazione, codice, terminale e Git | GPT-6.1 Sol | Medium | Predefinito del progetto |
| Compito circoscritto o ricerca ripetitiva con beneficio concreto | GPT-6 Luna | High | Ruolo opzionale `luna` |
| Implementazione circoscritta o revisione indipendente | GPT-6.1 Sol | Medium | Ruolo opzionale `sol` |
| Architettura, ambiguità importante, debugging complesso | GPT-6 Astra | Medium | Ruolo opzionale `astra` |
| Problema eccezionalmente difficile ancora irrisolto | GPT-6 Astra | High | Ruolo opzionale `astra_high` |

Il principale decide se delegare valutando incertezza, rischio, dipendenze, complessità logica e verifiche precedenti. Se Sol basta, completa il lavoro senza agenti. La durata non è un criterio sufficiente per Astra. Non c'è una sequenza obbligatoria Luna → Astra → Astra High né una review Astra sistematica. Il limite di due sottoagenti concorrenti è un tetto, non un obiettivo. I sottoagenti non delegano ulteriormente.

Le istruzioni definiscono i criteri della decisione; i file TOML impostano realmente modello e reasoning dei ruoli. Sol conserva la responsabilità finale e verifica i risultati. La nuova richiesta sostituisce le precedenti pause manuali dei progetti di apertura. Le prove congelate restano immutate e le loro indicazioni di modello sono storiche.

## Funzionalità e versioni verificate

- Verifica precedente: estensione `26.1007.21434`, binario `codex-cli 0.162.0-alpha.17.2`.
- Binario risolto dal terminale e verificato nella ripresa: estensione `26.1021.22027`, `codex-cli 0.164.0-alpha.11.1`. Questo identifica il binario interrogato, non certifica il backend della conversazione.
- Entrambi i binari erano stati verificati con la configurazione precedente. La verifica aggiornata dei quattro ruoli usa il binario 0.164 con `app-server --strict-config`; i ruoli sono registrati tramite `[agents.<nome>]` e `config_file`.
- L'app-server espone `account/read`: il login corrente è **ChatGPT Plus**. `model/list`, interrogato con quel login, elenca Sol, Luna e Astra con i reasoning richiesti. Non è stato usato soltanto il catalogo incluso nel binario.
- `multi_agent` risulta stabile e attivo. `step_model_switching` è una funzione in sviluppo e disattivata: non viene abilitata.

La selezione automatica riguarda la **delega reale a un altro modello**, mentre la conversazione principale rimane Sol. Non è configurato un cambio automatico in-place del principale. Il tool della sessione può esporre i ruoli configurati oppure soltanto modello e reasoning espliciti; AGENTS.md descrive entrambi i casi senza aggirare i limiti del client.

## Attivazione

I default personali sono in `C:\Users\carlo\.codex\config.toml`, i quattro ruoli in `C:\Users\carlo\.codex\agents\` e i criteri comuni in `C:\Users\carlo\.codex\AGENTS.md`. Sono riutilizzabili negli altri progetti; le configurazioni specifiche dei progetti e gli override del client possono prevalere. ChessProfessor conserva anche la propria configurazione locale coerente.

Ricaricare la finestra VS Code e aprire una nuova conversazione Codex per ricaricare elenco e default dei ruoli. Una conversazione già aperta non cambia retroattivamente modello o elenco dei ruoli. Le scelte esplicite dell'interfaccia e gli override di avvio possono prevalere sui default del progetto: mantenere Sol Medium come principale.

Il progetto risulta già trusted nella configurazione personale. Sono stati aggiunti soltanto i ruoli alla configurazione personale e le istruzioni globali, prima vuote. Il confronto TOML con il backup `C:\Users\carlo\.codex\tmp\routing-backup-20261027-211007` verifica che tutte le impostazioni personali precedenti siano identiche. Non sono stati modificati il percorso `chatgpt.cliExecutable`, sandbox, policy delle conferme, provider, login o credenziali. Le autorizzazioni restano quelle del client e i sottoagenti le ereditano. Per push, Git distruttivo, deploy e altre operazioni irreversibili resta necessaria l'autorizzazione esplicita; il routing non concede nuove autorizzazioni.

## Verifica ripetibile

```powershell
node scripts/check-codex-routing.mjs
node scripts/check-codex-routing.mjs --write
node scripts/check-codex-routing.mjs --global
node scripts/check-codex-routing.mjs --global --write
```

Il primo comando controlla; il secondo aggiorna il rapporto JSON. È richiesto Python 3.11+ per il parser TOML standard. Con `--binary PERCORSO` si può verificare l'altro binario installato senza cambiare quello usato dall'estensione.

Il controllo avvia un app-server locale, verifica la configurazione effettiva e il livello del progetto (con `--global` usa la cartella personale e rifiuta qualsiasi override di progetto), controlla i TOML dei ruoli e confronta modelli/reasoning con il catalogo dell'account. Fallisce se il login non è ChatGPT, se un modello o effort manca, se il progetto non è caricato o se vengono inseriti override di provider/autorizzazioni nella configurazione del progetto. Non legge i file delle credenziali, non mostra indirizzi email o token e non invia richieste di generazione ai modelli.

La disponibilità dei quattro ruoli nel catalogo dell'account è verificata. Nella ripresa sono stati avviati e completati due incarichi nativi reali: `routing_audit` con ruolo `luna` per le lacune e `routing_review` con modello esplicito `gpt-6.1-sol` / `medium` per la revisione. Il secondo usa parametri espliciti perché l'elenco dei ruoli della conversazione aperta non include ancora `sol`. I risultati e i limiti sono registrati nella [prova pratica](data/codex-routing-practical-validation.json). Il tool conferma avvio e completamento; non espone un'attestazione indipendente del modello backend. Astra resta verificato nel catalogo e nella configurazione: non sono state eseguite chiamate solo dimostrative. Il rapporto non certifica un risparmio quantitativo della quota Plus.

## Limiti

- Ogni sottoagente consuma quota. Il risparmio dipende dalle decisioni reali e dal contesto trasmesso, non dal solo numero di ruoli configurati.
- La disponibilità dei modelli e i limiti Plus possono cambiare: il controllo può essere ripetuto con il login corrente. Il catalogo non promette quota residua o disponibilità illimitata.
- Non è stata introdotta fatturazione API. L'autenticazione rimane controllata dal client; un file di progetto non è usato per forzare impostazioni di login globali. Se in futuro cambia il metodo di accesso, il controllo lo segnala e non configura alcun fallback API.
- I ruoli personali sono riutilizzabili nelle nuove sessioni; quelli locali richiedono un progetto trusted. Client non aggiornati, override espliciti o strumenti della sessione possono limitarne l'uso: il principale deve dichiararlo, senza simulare un cambio di modello.

## Documentazione ufficiale consultata

- [Impostazioni dell'estensione VS Code](https://learn.chatgpt.com/docs/ide/settings).
- [Configurazione del progetto e precedenza](https://learn.chatgpt.com/docs/config-file/config-basic).
- [Riferimento delle opzioni](https://learn.chatgpt.com/docs/config-file/config-reference).
- [Sottoagenti e configurazione dei modelli](https://learn.chatgpt.com/docs/agent-configuration/subagents).

La documentazione corrente descrive anche agenti auto-rilevati con uno schema più recente. Qui è usata la registrazione esplicita dei ruoli `config_file`, riconosciuta dalle due versioni installate e verificata tramite app-server; non vengono attivate funzioni sperimentali per inseguire il comportamento di una versione diversa.
