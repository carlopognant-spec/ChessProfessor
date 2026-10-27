# Pipeline comune e SIC-06: esiti del 27 ottobre 2026

Realizzati gli strumenti comuni descritti nella [guida](OPENING-PIPELINE.md) e applicati a SIC-06. Il risultato distingue l'ottimizzazione del processo dall'espansione dei contenuti.

## Automazioni consegnate

- Un CLI per verifica, preparazione del manifest, raccolta esplicita, generazione, rapporti, inventari e stato/ripresa.
- Selettore dei gruppi mancanti per primo prefisso non giocabile e guadagno marginale di posizioni distinte; alias e trasposizioni non vengono sommati due volte.
- Selettore QA con fallback completo per modifiche runtime o non riconosciute. L'eccezione per i due aggregatori richiede il ripristino esatto degli hash precedenti annullando soltanto gli import e gli inserimenti dichiarati.
- Checkpoint e log con firma degli input, controllata anche alla fine dei comandi; riuso dei PASS solo per la stessa firma. Status e proiezioni non avviano ricerche.
- Rapporti JSON/Markdown e inventari ricavati dai corsi effettivi, senza un nuovo elenco di import per ogni gruppo.
- Controllo UTF-8, JSON e collegamenti locali. Gli anchor Markdown e gli URL esterni sono esclusi da questo controllo.

Il [registro](data/opening-pipeline/lots.json) conserva SIC-05 come caso storico di sola lettura e SIC-06 come primo lotto corrente. Il confronto offline ricostruisce byte per byte i due moduli e la prova degli esercizi SIC-05, senza nuova raccolta. I 169 file congelati e gli otto hash protetti sono verificati dal caricamento del lotto.

## Osservazioni sull'efficienza

La prima selezione dedicata agli strumenti ha completato test, preflight, confronto storico, inventari e documenti in circa 30 secondi. La ripetizione sugli stessi input ha impiegato 1,43 secondi, riusando i cinque esiti senza rilanciare test o motore. Sono misure di questo controllo, non un confronto con la verifica completa di un'applicazione modificata.

Il backlog aggiornato dopo SIC-06 individua 2.977 gruppi candidati; i primi dodici comprendono 1.102 posizioni assenti distinte, ancora da progettare e implementare. Nella Siciliana, il primo gruppo candidato riguarda 122 posizioni dopo il prefisso Taimanov con Cc3. La quantità non sostituisce la revisione didattica e non dimostra che un solo corso sia sufficiente.

La cache non rende riutilizzabile una prova dopo una modifica rilevante; in quel caso si forma una nuova firma. Le modifiche narrative della roadmap non invalidano i controlli applicativi, mentre i documenti hanno una propria copertura dei file Markdown. Nessuna riduzione del perimetro A, dei limiti del motore o dei criteri materiali.

## SIC-06 integrato

Tre corsi/esercizi: g6 con Ac4, a6 con Cc3/Cf6 e e5 con Cb3/Cf6. 30 semimosse documentate, quattro didattiche scritte e otto note specifiche. Tutti i 290 corsi/esercizi precedenti sono preservati. [Rapporto automatico](OPENING-SICILIAN-EARLY-P022-RESULTS.md), [prove](data/opening-sicilian-early-p022-practical-verification.json), [manifest](data/opening-sicilian-early-p022-engine/manifest.json).

Dodici ricerche primarie, zero conferme: 2.400.000 nodi richiesti e 2.401.653 riportati. Perdite dei quattro confronti 13/0/35/4 cp, entro 100; variazioni degli esercizi 437/416/366 cp, oltre 200. Tutte le 113 repliche immediate verificate, saldi minimi 2/2/2. Nessuna ricerca storica ripetuta.

Totali: **293 corsi e 293 esercizi**, 32 siciliani. Copertura: **1.956 esatte, 202 solo trasposte, 10.164 assenti**. Quattro posizioni nuove con ordine esatto e una nuova posizione soltanto trasposta. Commenti: 9.118 semimosse spiegate, 2.050 coppie scritte su 4.586, 66 corsi interamente commentati per coppia. Questi numeri non dichiarano completa P02 o P03.

## Verifiche

| Controllo | Risultato |
| --- | --- |
| Contratto della pipeline | 15 PASS |
| Confronto SIC-05 | Tre artefatti identici, solo lettura |
| Test dei contenuti e percorsi | 114 PASS, prima del nuovo controllo sugli aggregatori |
| Suite completa finale no-env | 82 file, 771 PASS e un TODO preesistente, 249,47 s |
| Firma degli input a fine suite | Invariata, verificata dal runner |
| Build no-env | PASS, 142 moduli, 4,93 s |
| Browser selezionato | 62 casi distinti PASS: 61 al primo giro e uno nella ripetizione mirata |
| Builder, rapporto e inventari in `--check` | PASS |

Il primo gruppo mirato ha rilevato un timeout a 5 secondi nel nuovo test offline di ricostruzione degli artefatti sotto carico parallelo. Il limite locale del test è ora 30 secondi; ripetizione dedicata e suite completa finale passano. Nessun aumento dei timeout browser o del budget motore. La build conserva il precedente avviso sui chunk oltre 500 kB.

La raccolta iniziale dei nuovi test browser ha mostrato che il ciclo copiato puntava ancora alla vecchia lista di coppie. La lista è stata corretta prima di eseguire scenari; sono disponibili tutti i 141 casi previsti, senza titoli duplicati. La selezione revisionata esegue tutti i 54 casi nuovi più otto regressioni (prosecuzioni, destinazioni contenute, checkpoint Zaitsev e bivio bianco a6). I 79 casi esclusi restano disponibili nella modalità completa e non vengono dichiarati rieseguiti.

La prova browser usa Explorer simulato e Worker disabilitato. Le prove sono di interfaccia, persistenza e navigazione; non aggiungono ricerche motore o misure di apprendimento.

Il primo caso ha superato il timeout iniziale durante l'attesa della famiglia nel catalogo, prima di entrare nel corso; gli altri 61 passano in 6,9 minuti. Verificata l'identità degli input, `--last-failed` ha eseguito soltanto il caso mancante: PASS, 29,9 s complessivi. Nessun cambiamento a codice o timeout; i 61 casi già superati non sono stati ripetuti. Il registro iniziale conserva l'errore e il riepilogo distingue la ripetizione, senza sommare due volte lo stesso caso. [Esiti leggibili dalla macchina](data/opening-pipeline-validation.json).

## Ripresa

Pipeline e SIC-06 completati e verificati. Il prossimo lavoro di progettazione usa **GPT-6 Astra / High**, dopo il cambio manuale di Carlo: scegliere dal backlog un gruppo più ampio e coerente, valutando il candidato Taimanov da 122 posizioni. I due ingressi Ac4/Ad3 del vecchio puntatore restano nel perimetro A; nessuna loro esclusione. Nessun commit, push o deploy eseguito.
