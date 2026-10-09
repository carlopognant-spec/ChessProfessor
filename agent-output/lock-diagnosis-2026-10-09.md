# Ripresa della diagnosi del lock — 9 ottobre 2026

Base verificata: `main`, commit `6c9275f`.

## Risultato

Nel checkout Windows corrente tutte le **20 dipendenze** di
`specials-frozen-candidate-v1.json` coincidono byte per byte con gli SHA-256
del manifest. Nessun file protetto o hash di riferimento è stato modificato.
La discrepanza riportata l'8 ottobre non si riproduce in questa copia locale.

Per `src/lib/classification.js`, l'hash corrente è:

```text
2bdd4f56ad53f36d29d051a98debd66faeab5e396ad6a78b7d7d54a38f41c262
```

Il testo normalizzato coincide con il blob Git
`c7fe82e85cbfa032e1fb30c63b608965ed4174f9`, ma il file locale contiene
terminazioni miste. Sono LF le righe **2–3, 50, 54–57, 59, 61–82**;
tutte le altre terminazioni delle 92 righe sono CRLF. Questa disposizione
identifica una copia originale compatibile con il lock, senza differenze nel
testo rispetto al blob corrente. Spiega perché le sole conversioni uniformi
LF/CRLF non ricostruivano l'hash atteso.

Sono stati esaminati anche i cinque blob della cronologia e i 52 blob Git
non raggiungibili: uno di questi contiene una versione del classificatore,
ma non coincide con il lock nelle varianti uniformi esaminate.

## Riproduzione

```powershell
node scripts/diagnose-classification-lock.js
```

Il comando legge il manifest e le sue dipendenze, stampa hash, terminazioni
e confronti storici, ed esce con codice 1 se una dipendenza manca o non
corrisponde. Non avvia motori, non carica `.env`, non legge partite e non
scrive file. La corrispondenza degli hash riguarda questo checkout: una nuova
conversione automatica delle terminazioni può ancora romperla. Non è stata
modificata la politica del valutatore e non è stato eseguito il valutatore
congelato sui dati delle partite.

## Verifiche della versione aggiornata

- Test applicativi senza `.env`: 160 superati, 1 todo.
- Test Node degli script: 112 superati.
- Build senza `.env`: riuscita; resta l'avviso sul chunk del libro di apertura
  superiore a 500 kB.
- Diagnosi delle 20 dipendenze: tutte corrispondenti, uscita 0.

Non sono stati eseguiti nuovi esperimenti Stockfish, richieste LLM o test
browser. I report storici sono conservati. Lo script di diagnosi e questa
nota sono aggiunte locali; nessun commit o push effettuato.
