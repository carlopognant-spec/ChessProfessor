# Ripresa dell'audit delle forchette — 9 ottobre 2026

Ripreso il punto preciso indicato nel passaggio di consegne dell'8 ottobre:
esame legale dei dieci candidati già selezionati. [Report](report.md),
[risultati e hash](results.json), [protocollo](../grande-fork-legal-v1-protocol.md).

## Risultato

Enumerate tutte le **159 risposte legali**, 295 catture dei bersagli e 7.199
mosse avversarie nel controllo delle ricatture. Durata dell'estrazione nel
checkout corrente: circa 1,1 secondi. Nessuna ricerca Stockfish.

La presenza di un guadagno materiale immediato contro tutte le risposte,
usando lo stesso attaccante e considerando la ricattura immediata, compare
in **1 dei 5 Grande** e **2 dei 5 altri riferimenti**. Non è un criterio
sufficiente per distinguere Grande: adottarlo su questi dieci casi come regola
isolata darebbe 1 positivo corretto, 2 falsi positivi e 4 Grande mancate.
Questo è un confronto descrittivo sul sottoinsieme selezionato, non una metrica
del classificatore completo o una nuova regola adottata.

- **Nd6+, personale 4/29, Grande:** tutte e tre le risposte lasciano Nxb5,
  con almeno +6 di materiale anche dopo la ricattura immediata del cavallo.
- **Nxf6+, personale 6/35, Migliore:** entrambe le risposte lasciano Nxd7,
  con incremento minimo +6 oltre al pedone già preso dalla candidata. Una
  forchetta efficace può quindi avere un riferimento diverso da Grande.
- **Rxf6+, personale 2/43, Ottima:** tutte le cinque risposte permettono un
  incremento immediato positivo; nella prima PV salvata il motore preferisce
  però Bh6 invece di catturare subito un bersaglio. Il saldo materiale non
  determina la migliore prosecuzione.
- **Nxd6+, personale 3/19, Grande:** cxd6 e Qxd6 eliminano il cavallo. La
  candidata aveva già preso un alfiere (+3), e queste risposte riportano il
  saldo a zero. Il solo attacco a re e alfiere non prova ulteriore guadagno.
- **d4, personale 6/13, Grande:** Bxd4 elimina il pedone attaccante. La PV
  salvata prosegue Qxd4 e raggiunge +2. Il guadagno coinvolge un altro pezzo:
  limitarlo allo stesso attaccante perde questa prosecuzione. Nf3+ e Nd3+
  sono altre risposte che interrompono la cattura immediata di un bersaglio.
- **e6+, Chigorin/39, Grande:** Kxe6 e Qxe6 eliminano il pedone. Dopo Qxe6
  la PV salvata contiene Ng5+ e Nxe6: l'attacco continua con un altro pezzo.
  Dopo Kxe6 la linea salvata non mostra lo stesso guadagno immediato. Sono
  prove diverse e non vanno fuse scegliendo soltanto la linea favorevole.
- **Nxc3, Saint-Amant/80, Grande:** Qxc3 elimina il cavallo dopo lo scambio
  iniziale; la PV salvata continua Bf3 e Bxe2. Anche qui il seguito tattico
  coinvolge un pezzo diverso dall'attaccante iniziale.

Gli altri casi e tutte le difese sono elencati nel report e nel JSON. Le PV
sono ripercorse legalmente, ma le loro depth non sono tutte uguali e talvolta
più linee hanno la stessa prima risposta: non contare MultiPV 5 come cinque
difese distinte o come copertura completa.

## Decisione e prossimo punto

Nessuna nuova regola Grande adottata. La diagnosi mostra due limiti concreti:
una forchetta materialmente efficace compare anche nei negativi; alcuni
positivi richiedono sequenze di scambio, un attaccante diverso o mosse
intermedie. Il passo utile successivo è un audit uniforme delle prosecuzioni
già salvate dopo la cattura dell'attaccante, sull'intero gruppo dei dieci casi,
confrontando anche le alternative root disponibili. Non è autorizzazione a
nuove ricerche o a proclamare unicità usando le sole cinque linee.

## Verifiche

```powershell
node --test scripts/*.test.js
```

**121 test superati**, inclusi 9 nuovi test: forchetta re/donna, inchiodatura,
en passant, ricattura sfavorevole, prospettiva del Nero, bersaglio che fugge,
arrocco, promozione e posizione terminale/PV illegale.

Hash degli input e delle 20 dipendenze congelate invariati. App, formule,
soglie, lock, cache, baseline e report precedenti non modificati. Nessuna
lettura `.env`/partite 7–10, chiamata LLM, ricerca Stockfish, commit o push.
Suite app/build/browser non ripetute in questo intervento: le modifiche
consistono in nuovi script di ricerca, test e documenti.
