# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playwright-check.spec.js >> Stockfish local engine renders eval and arrows after 1.e4
- Location: playwright-check.spec.js:3:1

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.engine-arrow-overlay line')
Expected: 1
Received: 5
Timeout:  5000ms

Call log:
  - Expect "toHaveCount" locator('.engine-arrow-overlay line') with timeout 5000ms
  - waiting for locator('.engine-arrow-overlay line')
    14 × locator resolved to 5 elements
       - unexpected value "5"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - paragraph [ref=e5]: Lichess Explorer richiede un token valido. Configura VITE_LICHESS_TOKEN nel file .env.
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e9]:
          - generic: "8"
          - button [ref=e12]
        - button [ref=e25]
        - button [ref=e37]
        - button [ref=e49]
        - button [ref=e70]
        - button [ref=e81]
        - button [ref=e93]
        - button [ref=e105]
        - generic [ref=e116]:
          - generic: "7"
          - button [ref=e119]
        - button [ref=e126]
        - button [ref=e133]
        - button [ref=e140]
        - button [ref=e147]
        - button [ref=e154]
        - button [ref=e161]
        - button [ref=e168]
        - generic [ref=e172]: "6"
        - generic [ref=e197]: "5"
        - generic [ref=e222]: "4"
        - button [ref=e238]
        - generic [ref=e251]: "3"
        - generic [ref=e277]:
          - generic: "2"
          - button [ref=e280]
        - button [ref=e287]
        - button [ref=e294]
        - button [ref=e301]
        - button [ref=e311]
        - button [ref=e318]
        - button [ref=e325]
        - generic [ref=e330]:
          - generic:
            - generic [ref=e331]: a
            - generic [ref=e332]: "1"
          - button [ref=e334]
        - generic [ref=e345]:
          - generic: b
          - button [ref=e348]
        - generic [ref=e357]:
          - generic: c
          - button [ref=e360]
        - generic [ref=e370]:
          - generic: d
          - button [ref=e373]
        - generic [ref=e387]:
          - generic: e
          - button [ref=e390]
        - generic [ref=e400]:
          - generic: f
          - button [ref=e403]
        - generic [ref=e413]:
          - generic: g
          - button [ref=e416]
        - generic [ref=e425]:
          - generic: h
          - button [ref=e428]
      - status [ref=e438]
      - img "Linee migliori di Stockfish"
      - generic: 5 frecce Stockfish
    - region "Editor posizione FEN" [ref=e439]:
      - generic [ref=e440]:
        - heading "Editor posizione" [level=2] [ref=e441]
        - button "Copia FEN" [ref=e442] [cursor=pointer]
      - textbox "FEN" [ref=e443]: rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1
      - generic [ref=e444]:
        - generic [ref=e445]:
          - text: Lato al tratto
          - combobox "Lato al tratto" [ref=e446]:
            - option "Bianco"
            - option "Nero" [selected]
        - generic [ref=e447]:
          - text: En passant
          - textbox "En passant" [ref=e448]: "-"
      - generic "Arrocchi" [ref=e449]:
        - generic [ref=e450]:
          - checkbox "K" [checked] [ref=e451]
          - text: K
        - generic [ref=e452]:
          - checkbox "Q" [checked] [ref=e453]
          - text: Q
        - generic [ref=e454]:
          - checkbox "k" [checked] [ref=e455]
          - text: k
        - generic [ref=e456]:
          - checkbox "q" [checked] [ref=e457]
          - text: q
      - generic "Palette pezzi" [ref=e458]:
        - button "K" [ref=e459] [cursor=pointer]
        - button "Q" [ref=e460] [cursor=pointer]
        - button "R" [ref=e461] [cursor=pointer]
        - button "B" [ref=e462] [cursor=pointer]
        - button "N" [ref=e463] [cursor=pointer]
        - button "P" [ref=e464] [cursor=pointer]
        - button "k" [ref=e465] [cursor=pointer]
        - button "q" [ref=e466] [cursor=pointer]
        - button "r" [ref=e467] [cursor=pointer]
        - button "b" [ref=e468] [cursor=pointer]
        - button "n" [ref=e469] [cursor=pointer]
        - button "p" [ref=e470] [cursor=pointer]
        - button "Cancella" [ref=e471] [cursor=pointer]
      - button "Applica posizione" [ref=e472] [cursor=pointer]
    - paragraph [ref=e476]: "5 linee MultiPV disponibili. Valutazione: -0.31"
    - region "Resoconto analisi" [ref=e477]:
      - heading "Resoconto partita" [level=2] [ref=e478]
      - table "Conteggi classificazioni" [ref=e479]:
        - row "Categoria Bianco Nero" [ref=e480]:
          - generic [ref=e481]: Categoria
          - generic [ref=e482]: Bianco
          - generic [ref=e483]: Nero
        - row "Libro 0 0" [ref=e484]:
          - generic [ref=e485]: Libro
          - generic [ref=e486]: "0"
          - generic [ref=e487]: "0"
        - row "Geniale 0 0" [ref=e488]:
          - generic [ref=e489]: Geniale
          - generic [ref=e490]: "0"
          - generic [ref=e491]: "0"
        - row "Grande 0 0" [ref=e492]:
          - generic [ref=e493]: Grande
          - generic [ref=e494]: "0"
          - generic [ref=e495]: "0"
        - row "Migliore 0 0" [ref=e496]:
          - generic [ref=e497]: Migliore
          - generic [ref=e498]: "0"
          - generic [ref=e499]: "0"
        - row "Ottima 0 0" [ref=e500]:
          - generic [ref=e501]: Ottima
          - generic [ref=e502]: "0"
          - generic [ref=e503]: "0"
        - row "Buona 0 0" [ref=e504]:
          - generic [ref=e505]: Buona
          - generic [ref=e506]: "0"
          - generic [ref=e507]: "0"
        - row "Imprecisione 1 0" [ref=e508]:
          - generic [ref=e509]: Imprecisione
          - generic [ref=e510]: "1"
          - generic [ref=e511]: "0"
        - row "Errore 0 0" [ref=e512]:
          - generic [ref=e513]: Errore
          - generic [ref=e514]: "0"
          - generic [ref=e515]: "0"
        - row "Errore grave 0 0" [ref=e516]:
          - generic [ref=e517]: Errore grave
          - generic [ref=e518]: "0"
          - generic [ref=e519]: "0"
        - row "Mossa mancata 0 0" [ref=e520]:
          - generic [ref=e521]: Mossa mancata
          - generic [ref=e522]: "0"
          - generic [ref=e523]: "0"
      - generic "Semimosse analizzate" [ref=e524]:
        - button "1. e4 Imprecisione Eval 0.31 / Best 0.26" [ref=e525] [cursor=pointer]:
          - generic [ref=e526]: 1. e4
          - generic [ref=e527]: Imprecisione
          - generic [ref=e528]: Eval 0.31 / Best 0.26
    - button "1. e4" [ref=e530] [cursor=pointer]
    - generic [ref=e531]:
      - button "← Torna indietro" [disabled] [ref=e532]
      - button "Reset partita" [ref=e533] [cursor=pointer]
    - generic [ref=e534]:
      - 'textbox "Incolla un PGN, ad esempio: 1. e4 e5 2. Nf3 Nc6" [ref=e535]'
      - button "Importa PGN" [ref=e536] [cursor=pointer]
  - generic [ref=e537]:
    - generic [ref=e538]:
      - heading "Chiedi al maestro" [level=2] [ref=e539]
      - combobox [ref=e540]:
        - option "Groq" [selected]
        - option "Gemini"
    - paragraph [ref=e542]: "Fai una domanda su questa posizione: es. \"Perché è meglio Cf3 di Ac4 qui?\""
    - generic [ref=e543]:
      - textbox "Scrivi una domanda sugli scacchi…" [ref=e544]
      - button "Invia" [disabled] [ref=e545]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Stockfish local engine renders eval and arrows after 1.e4', async ({ page }) => {
  4  |   const errors = [];
  5  |   page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  6  |   page.on('console', (msg) => {
  7  |     if (msg.type() === 'error') {
  8  |       errors.push(`console:error: ${msg.text()}`);
  9  |     }
  10 |   });
  11 | 
  12 |   const wasmResponsePromise = page.waitForResponse((response) =>
  13 |     response.url().includes('stockfish-19-lite-single.wasm') && response.status() === 200,
  14 |   );
  15 | 
  16 |   await page.goto('http://localhost:4173/ChessProfessor/', { waitUntil: 'networkidle' });
  17 |   await wasmResponsePromise;
  18 | 
  19 |   await page.locator('[data-square="e2"]').click();
  20 |   await page.locator('[data-square="e4"]').click();
  21 | 
  22 |   await expect(page.locator('.engine-eval-label')).toContainText('Valutazione:');
  23 |   await expect(page.locator('.engine-arrow-overlay')).toHaveCount(1);
> 24 |   await expect(page.locator('.engine-arrow-overlay line')).toHaveCount(1);
     |                                                            ^ Error: expect(locator).toHaveCount(expected) failed
  25 |   expect(errors).toEqual([]);
  26 | });
  27 | 
```