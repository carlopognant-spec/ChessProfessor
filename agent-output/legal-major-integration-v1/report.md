# Integrazione v23

Qxa8 (personal-05), Nd5 (personal-06) e Bf3 (Saint Amant–Staunton)
sono ora riconosciute dalle regole dell'app, usando prove separate valide.
La verifica conserva i sette campi numerici e le 20 dipendenze congelate.

Sul campione di sviluppo: **31/34 Grandi, 4/4 Geniali**, zero falsi positivi
speciali, tre miglioramenti e zero regressioni su 1116 osservazioni di
854 mosse distinte. Riferimenti invariati, nessuna validazione indipendente.
Confronto riproducibile: `npm run review:auto`. Copia del risultato corrente:
[classifier-verification.json](classifier-verification.json).

Le nuove regole verificano tre eventi distinti: fuga della donna con cattura
vantaggiosa unica, fuga del cavallo che sfrutta un'inchiodatura alla donna,
infilata sulle torri con una strategia legale entro due proprie mosse.
La presa della donna dopo Nd5 è condizionata alla cattura del cavallo;
la prova di Bf3 non è una dimostrazione illimitata di vittoria.

Le prove a 1M devono essere valide, coerenti e applicate nella vista
approfondita. Aggiornato il selettore per riconoscere anche la fuga Nd5.
Corretto il riuso implicito delle prove native nella vista iniziale quando
si riapre un archivio: il dato salvato resta disponibile alla vista approfondita.

Verifiche eseguite: suite completa 59 file, 537 test passati e 1 TODO;
ulteriori 3 test mirati passati dopo la guardia finale sulla proiezione;
build riuscita; 4 test browser passati, inclusi i tre archivi v22 offline,
Qxc7 con tutte le alternative, riuso senza Worker e sacrificio storico.
Nessuna nuova ricerca Stockfish: richieste dei test soddisfatte da prove
registrate e mock. La build mantiene il warning sulle dimensioni dei bundle.

## Restano tre Grandi

- **14...c6:** la ricerca a 5M termina preferendo a6; manca un confronto
  completato coerente con quel bestmove. Non giustifica una promozione di c6.
- **28...axb4:** migliore confermata, ma il criterio attuale di scelta unica
  vincente non è dimostrato. Qualsiasi criterio diverso richiede un confronto
  generale e controlli negativi, senza adattare soglie a questa sola mossa.
- **38...Ne4:** stime della posizione prima e dopo non confermano lo stesso
  esito nativo; non si sceglie la stima più favorevole per assegnare Grande.

Carlo non ricorda la fonte di queste tre etichette. Restano nel riferimento
come casi aperti, senza forzare la classificazione. Le due Geniali storiche
sono invece confermate come Game Review Chess.com.
