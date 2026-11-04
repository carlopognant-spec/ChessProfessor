# Grande v3: chiusura e proposta di integrazione

Aggiornamento: la successiva integrazione applicativa è documentata in
[GRANDE-V3-INTEGRATION.md](GRANDE-V3-INTEGRATION.md). Il checkpoint offline
e la proposta originaria riportati sotto restano come riferimento storico.

1 novembre 2026. Candidata offline nella worktree `work/grande-candidate-20261030`.
Policy live non sostituita. Nessuna nuova ricerca Stockfish, soglia o eccezione per posizione.

## Modifica conclusa

`grandeCandidateV3.js` raccoglie i confronti ordinari e i pacchetti validati prima
del verdetto, indipendentemente dall'etichetta pubblicata. Legge sia i campi
`nativeDecisionProof`/`grandeDecisionProof` sia le prove persistite negli approfondimenti.
Valida FEN, legalità delle PV, bound, completezza/profondità comune del MultiPV,
profilo e coerenza della coppia radice/figlia. Un pacchetto invalido non oscura una
coppia ordinaria valida. Il motivo osservazionale non precede i certificati.

I certificati riusano le famiglie legali esistenti: forchetta con scacco,
evasione della donna con guadagno maggiore unico, evasione del cavallo con pin
relativo alla donna e infilata verificata sulle torri. Le realizzazioni di
materiale già deciso restano escluse. Restano le soglie pubblicate di qualità,
indice mantenuto e coerenza. I certificati hanno un orizzonte dichiarato;
non provano una vittoria contro ogni seguito futuro.

`candidateAssessment` separa `tactical-confirmed`, `comparative`, `observed`,
`insufficient`. Solo un certificato tattico e un confronto di qualità valido
consentono una nuova promozione. Le assegnazioni v2 conservate senza certificato
restano ereditate: storiche, contestuali o comparative. Non diventano nuove conferme.

La proiezione aggiorna `specialAssessment` e `classificationDecision`, conserva
l'origine e non cambia score/profili né il record sorgente. Il formatter applicativo
legge lo stato candidato: una retrocessione non mostra un testo da Grande;
un'ereditata non è descritta come nuova conferma. I dati senza candidata
mantengono il formatter pubblicato. Grande e Migliore restano fuori dal ripasso
degli errori; le verifiche fresche del ripasso restano quelle esistenti.

## Unico replay offline

Input congelato: `C:/Users/carlo/AppData/Local/Temp/chessprofessor-grande-candidate-v2-results-20261030.json`.
Output: `C:/Users/carlo/AppData/Local/Temp/chessprofessor-grande-candidate-v3-results-20261101.json`.

857 righe, 6 escluse dai conteggi di riferimento, 851 con riferimento Grande.
Il corpus è già studiato: non è validazione indipendente. Le due diagnosi
negative senza etichetta completa hanno un riferimento negativo per Grande,
non una categoria numerica inventata.

| Politica | TP | FP | FN | Corrispondenze esatte di categoria |
| --- | ---: | ---: | ---: | ---: |
| Pubblicata | 23 | 2 | 12 | 516 |
| v1 congelata | 4 | 0 | 31 | 497 |
| v2 congelata | 23 | 0 | 12 | 516 |
| v3, input ordinari identici | 23 | 0 | 12 | 516 |
| v3, otto coppie supplementari recuperate | 26 | 0 | 9 | 519 |

Con input ordinari: 2 Grandi con certificato verificato, 21 ereditate
(14 storiche, 4 contestuali, 3 comparative). Con i pacchetti recuperati:
5 certificate e le stesse 21 ereditate. La v2 contava 5 nuove conferme
sul corpus ordinario; tre erano confronti senza certificato tattico, ora
esplicitamente ereditati. Questo cambia la provenienza, non le etichette.

536 verdetti ordinari sono inconcludenti, inclusi i 21 ereditati; 515 non
assegnano Grande. Il numero include tutte le Migliori/Ottime esaminate,
non soltanto le mosse indicate come Grande dal riferimento. Non misura errori.
Nessuna variazione rispetto alla v2; rispetto alla pubblicata solo le due
false promozioni diagnostiche sono rimosse. Altre categorie invariate.

Gli stessi 134 controlli già inclusi nella v2 sono stati elaborati nello stesso
passaggio: 4 con etichetta completa, 130 senza riferimento. Nessuna variazione
rispetto alla v2; due Grandi comparative ereditate. Rispetto alla pubblicata,
solo Be4 passa da Grande a Migliore. Non è un falso positivo misurabile senza
riferimento. Le 857 righe principali non contengono mosse senza riferimento Grande.

## Casi e limiti congelati

| Casi | Esito v3 con prove recuperate |
| --- | --- |
| Qxa8, Nd5, Bf3 | Grande con certificato tattico verificato |
| Qxc7, Nc4, e6+, axb4, Nxc3 | Migliore; confronto disponibile, certificato tattico assente |
| Ne4, c6, Nxe4 | Nessuna promozione con i dati disponibili |
| 13...Nf5 | Ottima; motivo del pin relativo riconosciuto, insufficiente per Grande |
| 18...Qg6 | Migliore; evasione ordinaria della donna |
| 25...Qxf6 | Migliore; catturare lo scaccante non basta |
| Be4, controllo pubblico ply 74 | Migliore, caso sensibile alla soglia |

Per Be4 l'indice mantenuto coerente della coppia selezionata è
`0.7497913878870148`, contro `winning = 0.75`: margine `-0.00020861211298517368`.
Lo stato speciale pubblicato proveniva da un confronto diverso; il valore
normalizzato verificato dalla candidata resta appena sotto soglia. Nessuna
stima dell'incertezza del motore è disponibile: caso inconcludente, soglie ferme.

Tutte le otto coppie recuperate sono assenti dagli input ordinari congelati.
Sono archivi di studio, non prove disponibili automaticamente al giocatore.
Il secondo scenario allega le stesse coppie al campo persistibile
`refinement.nativeProof`; non importa fixture nell'app e non modifica archivi.
Il percorso esistente `selectRefinementView` proietta prove persistite nei campi
decisionali dopo la validazione; `gameArchive` le conserva tramite i merge
esistenti. La v3 può quindi usarle quando presenti davvero. Una nuova analisi
ordinaria non ottiene gratuitamente le ricerche supplementari da un milione di nodi.

I nove falsi negativi residui dello scenario arricchito e l'assenza di
validazione indipendente sono limiti noti. Non giustificano altre regole o cicli.

## Verifiche e proposta stabile

120 test passati in cinque file: candidate v1/v2/v3, boundary speciale e
decisioni/spiegazioni. I 20 test v3 includono precedenza del certificato sul
motivo, nuova ammissione, otto coppie recuperate, assenza dei pacchetti ordinari,
prove malformate, eredità, testo dopo retrocessione, esclusione dal ripasso e
salvataggio/lettura IndexedDB simulato senza mutazione del sorgente.

Il replay contiene assert su categorie protette, coerenza dei tre stati,
formatter, immutabilità di dati e profili, casi prioritari e hash.
I dieci file protetti, i moduli v1/v2 e gli input congelati verificati sono
identici. Aperture sospese e checkout originale non modificati.

Comandi riproducibili dalla worktree (scegliere un output nuovo: non sovrascrive):

```powershell
node node_modules/vitest/vitest.mjs run --config scripts/qa-no-env-test.config.js tests/grande-candidate-v3.test.js tests/grande-candidate-v2.test.js tests/grande-candidate.test.js tests/analysis-special-classification.test.js tests/classification-decision.test.js
node scripts/evaluate-grande-candidate-v3.mjs --input C:\Users\carlo\AppData\Local\Temp\chessprofessor-grande-candidate-v2-results-20261030.json --output C:\Users\carlo\AppData\Local\Temp\grande-v3-reproduction.json
```

Proposta: integrare questa v3 e chiudere temporaneamente il classificatore,
accettando i limiti elencati. L'integrazione applicativa dovrà applicare la v3
al risultato pubblicato prima dell'annotazione finale, sia nel percorso
incrementale `gameAnalysis` (anche dopo refresh della mossa precedente) sia
nella riclassificazione `reviewMoves`, già usata da archivi e approfondimenti.
Il contesto pubblicato deve restare separato dalle etichette candidate, come nel
replay; isolare il riclassificatore pubblicato evita ricorsioni con l'adattatore
offline. Le prove supplementari arrivano soltanto dagli approfondimenti reali,
senza nuove ricerche automatiche o import di fixture. Il ripasso conserva i
propri criteri e le verifiche fresche. Questi sono collegamenti applicativi,
non una v4 o una nuova calibrazione.

La candidata non è stata collegata ai percorsi live: build e test applicativi
end-to-end non eseguiti, come richiesto. Saranno il controllo dell'integrazione,
senza un altro ciclo sperimentale. Nessun commit, push o deploy.
