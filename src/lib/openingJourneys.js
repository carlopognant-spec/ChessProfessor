import {Chess} from 'chess.js'
import {OPENING_LESSONS} from './openingLessons.js'

// Authored teaching continuations, not engine recommendations or game records.
// Each family has one explicitly named route; it does not stand for every variation.
const routes = {
  italian: ['Italiana con c3 e d3', '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6 5. d3 d6 6. O-O O-O 7. Re1 a6 8. Bb3 Ba7 9. Nbd2 h6 10. Nf1 Re8 11. Ng3 Be6 12. Bc2 d5 13. exd5 Bxd5 14. Be3 Bxe3 15. Rxe3 Qd7 16. Qe2 Rad8 17. Re1 Qd6 18. a3 a5',
    'Il cavallo arriva da b1 a g3 passando per d2 e f1. La torre sostiene e4: osserva quando il Nero rompe con …d5 e come si apre il centro.',
    'Prepara …d5 con lo sviluppo e le torri al centro. Dopo il cambio in d5, attiva i pezzi sulle colonne centrali.'],
  spanish: ['Spagnola chiusa con Re1 e c3', '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Na5 10. Bc2 c5 11. d4 Qc7 12. Nbd2 cxd4 13. cxd4 Nc6 14. Nb3 a5 15. Be3 a4 16. Nbd2 Bd7',
    'Re1 sostiene e4 e c3 prepara d4. Dopo i cambi al centro, coordina cavalli e alfieri senza abbandonare i pedoni d4 ed e4.',
    'Allarga il gioco con …b5 e …c5. La pressione su d4 deve accompagnarsi allo sviluppo dell’alfiere c8.'],
  sicilian: ['Siciliana aperta con …e6 e …d6', '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 e6 6. Be2 Be7 7. O-O O-O 8. Be3 Nc6 9. f4 Qc7 10. Qe1 a6 11. Qg3 Bd7 12. Kh1 b5 13. a3 Rac8 14. Rae1 Na5 15. Bd3 Nc4 16. Bc1 Rfe8',
    'Il cambio del pedone d apre il gioco. Coordina f4 e la donna sul lato di re; il centro e4 e il cavallo d4 richiedono ancora attenzione.',
    'La colonna c è semiaperta per il Nero. …a6 e …b5 guadagnano spazio, mentre il cavallo può cercare c4.'],
  french: ['Francese, variante di avanzata', '1. e4 e6 2. d4 d5 3. e5 c5 4. c3 Nc6 5. Nf3 Qb6 6. a3 Nh6 7. b4 cxd4 8. cxd4 Nf5 9. Bb2 Bd7 10. Be2 Rc8 11. O-O Be7 12. Qd3 O-O 13. Nbd2 a6 14. Rac1 Na7 15. Nb3 Bb5 16. Qd2 Bxe2 17. Qxe2 Rxc1 18. Rxc1 Rc8',
    'La catena d4–e5 dà spazio. Sostieni d4 sotto la pressione di donna e cavallo e completa lo sviluppo prima di attaccare.',
    'Colpisci la base d4 con …c5, …Qb6 e …Nf5. Usa la colonna c e cerca attività per l’alfiere campochiaro.'],
  caro: ['Caro-Kann, struttura classica', '1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 5. Ng3 Bg6 6. h4 h6 7. Nf3 Nd7 8. h5 Bh7 9. Bd3 Bxd3 10. Qxd3 e6 11. Bf4 Ngf6 12. O-O-O Be7 13. Kb1 O-O 14. Ne4 Nxe4 15. Qxe4 Nf6 16. Qe2 Qa5',
    'Guadagni spazio sul lato di re ma arrocchi lungo. Dopo il cambio degli alfieri coordina donna e torri senza dimenticare la sicurezza sul lato di donna.',
    'L’alfiere esce prima di …e6. Completa lo sviluppo e usa …Qa5 per creare pressione sul lato dell’arrocco bianco.'],
  scandinavian: ['Scandinava con donna in a5', '1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5 7. Bd2 e6 8. Qe2 Bb4 9. O-O-O Nbd7 10. a3 Bxc3 11. Bxc3 Qc7 12. Ne5 O-O 13. f3 b5 14. Bb3 a5 15. g4 Bg6 16. h4 h6',
    'Sviluppa i pezzi guadagnando tempo sulla donna. Con gli arrocchi opposti, prepara le spinte sul lato di re e sorveglia …b5 e …a5.',
    'La donna torna in c7 e il re arrocca corto. I pedoni a e b cercano spazio contro il re bianco: calcola prima di aprire linee.'],
  pirc: ['Pirc con sviluppo classico', '1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Nf3 Bg7 5. Be2 O-O 6. O-O Nc6 7. d5 Nb8 8. Re1 e5 9. dxe6 Bxe6 10. Bf4 Nc6 11. Qd2 Re8 12. Rad1 Qe7 13. h3 Rad8 14. Bb5 Bd7 15. Bxc6 Bxc6 16. Nd5 Bxd5 17. exd5 Qd7',
    'Lo spazio centrale ti permette di svilupparti. Il cambio en passant apre il centro: porta le torri sulle colonne d ed e.',
    'Il centro bianco diventa un bersaglio dopo …e5. Sviluppa l’alfiere c8 e coordina le torri prima dei cambi centrali.'],
  alekhine: ['Alekhine con cambio centrale', '1. e4 Nf6 2. e5 Nd5 3. d4 d6 4. Nf3 Bg4 5. Be2 e6 6. O-O Be7 7. c4 Nb6 8. exd6 cxd6 9. Nc3 O-O 10. Be3 Nc6 11. Rc1 d5 12. cxd5 Nxd5 13. Nxd5 exd5 14. h3 Bh5 15. Qb3 Qd7 16. Rfe1 Rfe8',
    'Guadagni spazio ma poi scegli di cambiare in d6. Sviluppa i pezzi e usa la colonna c prima che il Nero completi la liberazione centrale.',
    'Dopo aver provocato l’avanzata dei pedoni, gioca contro il centro con …d5. I cambi lasciano un pedone d5 da sostenere con i pezzi.'],
  petrov: ['Petrov con centro aperto', '1. e4 e5 2. Nf3 Nf6 3. Nxe5 d6 4. Nf3 Nxe4 5. d4 d5 6. Bd3 Nc6 7. O-O Be7 8. c4 Nb4 9. Be2 O-O 10. Nc3 Nxc3 11. bxc3 Nc6 12. Re1 Bf5 13. Bf4 Re8 14. Qd2 Qd7 15. h3 Rad8 16. Bd3 Bxd3 17. Qxd3 Bf8',
    'Dopo le catture iniziali costruisci il centro con d4 e c4. Il cambio in c3 cambia la struttura: coordina le torri senza lasciare d4 debole.',
    'Riprendi e4 solo dopo aver scacciato il cavallo con …d6. Sviluppa i pezzi e aumenta la pressione sul centro bianco.'],
  scotch: ['Scozzese con …Bc5', '1. e4 e5 2. Nf3 Nc6 3. d4 exd4 4. Nxd4 Bc5 5. Be3 Qf6 6. c3 Nge7 7. Bc4 O-O 8. O-O Bb6 9. Nc2 d6 10. Bxb6 axb6 11. Ne3 Be6 12. Nd2 Rfe8 13. f4 Bxc4 14. Ndxc4 b5 15. Nd2 Qe6 16. Qf3 Rxa2',
    'Il centro aperto richiede sviluppo rapido. Dopo f4 controlla anche il lato di donna: il pedone a2 resta esposto alla torre sulla colonna a.',
    'La donna f6 aumenta la pressione centrale. La ripresa …axb6 apre la colonna a: osserva come la torre può entrare in a2.'],
  vienna: ['Viennese con fianchetto', '1. e4 e5 2. Nc3 Nf6 3. g3 d5 4. exd5 Nxd5 5. Bg2 Nxc3 6. bxc3 Bd6 7. Nf3 O-O 8. O-O Nc6 9. d3 Re8 10. Re1 Bf5 11. Rb1 Rb8 12. Be3 Qd7 13. Qd2 b6 14. Nh4 Be6 15. a4 Ne7 16. a5 Bd5',
    'L’alfiere g2 guarda il centro. Dopo bxc3, usa la colonna b e prepara lo sviluppo dell’alfiere c1; i pedoni doppiati influenzano il piano.',
    'La spinta …d5 contesta subito il centro. Sostieni e5 e coordina gli alfieri sulle diagonali centrali.'],
  'kings-gambit': ['Gambetto di Re accettato con …d5', '1. e4 e5 2. f4 exf4 3. Nf3 d5 4. exd5 Nf6 5. Bb5+ c6 6. dxc6 Nxc6 7. d4 Bd6 8. O-O O-O 9. Nc3 Bg4 10. Bxc6 bxc6 11. Qd3 Re8 12. Bd2 Qc7 13. Rae1 Rad8 14. Ne4 Nxe4 15. Rxe4 Rxe4 16. Qxe4 Be6',
    'Il pedone f offerto accelera il gioco ma espone il re. Arrocca e usa lo sviluppo per contestare le colonne aperte.',
    'Restituisci parte del materiale con …d5 per attivare i pezzi. Il pedone f4 limita il Bianco ma non sostituisce lo sviluppo.'],
  philidor: ['Philidor con sviluppo compatto', '1. e4 e5 2. Nf3 d6 3. d4 Nf6 4. Nc3 Nbd7 5. Bc4 Be7 6. O-O O-O 7. Re1 c6 8. a4 Qc7 9. h3 h6 10. Be3 Re8 11. Qd2 Bf8 12. Rad1 a6 13. Ba2 b5 14. dxe5 dxe5 15. Nh4 Nc5 16. f3 Be6',
    'Il vantaggio di spazio ti permette di preparare le torri. Prima di f3 e Nh4, osserva come il cambio in e5 apre la colonna d.',
    'La struttura compatta richiede un piano attivo: …c6 e …b5 danno spazio, mentre …Nc5 sviluppa il cavallo verso il centro.'],
  'queens-gambit': ['Gambetto di Donna rifiutato, cambio in d5', '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. cxd5 exd5 5. Bg5 Be7 6. e3 O-O 7. Bd3 Nbd7 8. Qc2 Re8 9. Nge2 Nf8 10. O-O c6 11. Rab1 a5 12. a3 Bd6 13. b4 axb4 14. axb4 b5 15. Bf4 Bxf4 16. Nxf4 Bd7 17. Ra1 Qe7 18. Rxa8 Rxa8',
    'Il cambio in d5 crea una struttura asimmetrica. La spinta b4 attacca la catena sul lato di donna; osserva la risposta …b5 prima di continuare.',
    'Sostieni d5 e prepara lo sviluppo dell’alfiere c8. …a5 e …b5 modificano i bersagli del piano bianco sul lato di donna.'],
  london: ['Londra con …c5 e sviluppo classico', '1. d4 d5 2. Nf3 Nf6 3. Bf4 e6 4. e3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. Bg3 O-O 8. Bd3 b6 9. Ne5 Bb7 10. f4 Ne7 11. Qf3 Nf5 12. Bf2 Be7 13. g4 Nd6 14. g5 Nfe4 15. O-O Rc8 16. Rad1 f6',
    'Sviluppa l’alfiere prima di e3. Ne5 e f4 preparano gioco sul lato di re, ma l’apertura del centro con …f6 obbliga a ricalcolare.',
    'Contesta d4 con …c5 e sviluppa l’alfiere in b7. Contro le spinte bianche, cerca controgioco centrale con …f6.'],
  'kings-indian': ['Est-Indiana con centro chiuso', '1. d4 Nf6 2. c4 g6 3. Nc3 Bg7 4. e4 d6 5. Nf3 O-O 6. Be2 e5 7. O-O Nc6 8. d5 Ne7 9. Ne1 Nd7 10. Nd3 f5 11. f3 f4 12. Bd2 g5 13. Rc1 Ng6 14. c5 Nf6 15. Nb5 Rf7 16. Ba5 b6',
    'Dopo d5 il centro è chiuso. Prepara c5 e l’attività sul lato di donna, tenendo conto dell’avanzata dei pedoni neri verso il tuo re.',
    'Il centro chiuso permette di preparare …f5 e …g5. Coordina l’attacco con i pezzi e controlla il controgioco bianco con c5.'],
  grunfeld: ['Grünfeld, variante di cambio', '1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. cxd5 Nxd5 5. e4 Nxc3 6. bxc3 Bg7 7. Bc4 c5 8. Ne2 Nc6 9. Be3 O-O 10. O-O Qc7 11. Rc1 Rd8 12. h3 b6 13. f4 Bb7 14. d5 Na5 15. Bd3 e6 16. c4 exd5 17. exd5 Re8',
    'I pedoni d4 ed e4 danno spazio ma sono bersagli. Sostieni il centro con i pezzi prima di trasformarlo con d5.',
    'Attacca d4 con …c5, l’alfiere g7 e le torri. Dopo d5 cerca di aprire il centro con …e6.'],
  nimzo: ['Nimzo-Indiana con e3 e Bd3', '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. e3 O-O 5. Bd3 d5 6. Nf3 c5 7. O-O Nc6 8. a3 Bxc3 9. bxc3 dxc4 10. Bxc4 Qc7 11. Bd3 e5 12. Qc2 Re8 13. Ng5 h6 14. Ne4 Nxe4 15. Bxe4 cxd4 16. cxd4 exd4 17. exd4 Qd6',
    'Ottieni la coppia degli alfieri ma accetti pedoni doppiati. Usa gli alfieri sulle diagonali aperte e osserva come i cambi trasformano il centro.',
    'Il cambio in c3 altera i pedoni bianchi. Combina …c5 ed …e5 con lo sviluppo per mettere il centro sotto pressione.'],
  'queens-indian': ['Ovest-Indiana con doppio fianchetto', '1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Ne4 8. Qc2 Nxc3 9. Qxc3 f5 10. b3 Bf6 11. Bb2 d6 12. Qd2 Nd7 13. Rad1 Qe7 14. Ne1 Bxg2 15. Nxg2 e5 16. dxe5 Nxe5',
    'Il fianchetto sostiene il centro. Dopo i cambi dei pezzi, coordina le torri e valuta come rispondere alla spinta …e5.',
    'Il controllo di e4 permette al cavallo di entrare al centro. Prepara …e5 con donna, cavallo e pedone d6.'],
  catalan: ['Catalana con centro mantenuto', '1. d4 Nf6 2. c4 e6 3. g3 d5 4. Bg2 Be7 5. Nf3 O-O 6. O-O Nbd7 7. Qc2 c6 8. Nbd2 b6 9. e4 Bb7 10. e5 Ne8 11. cxd5 cxd5 12. Re1 Rc8 13. Qd3 Nc7 14. Nf1 Ba6 15. Qd1 Bxf1 16. Bxf1 Nb8',
    'Il fianchetto accompagna l’occupazione del centro. Dopo e5, il cavallo d2 cerca nuove case attraverso f1; valuta il ruolo dell’alfiere g2 dietro la catena.',
    'Mantieni una struttura solida e riorganizza i cavalli dopo e5. La diagonale a6–f1 offre un cambio dell’alfiere.'],
  dutch: ['Olandese con fianchetto nero', '1. d4 f5 2. g3 Nf6 3. Bg2 g6 4. Nf3 Bg7 5. O-O O-O 6. c4 d6 7. Nc3 Qe8 8. d5 Na6 9. Nd4 Bd7 10. Rb1 c6 11. b4 Nc7 12. dxc6 bxc6 13. b5 cxb5 14. Ncxb5 Nxb5 15. Nxb5 Bc6 16. Bxc6 Qxc6',
    'Il centro e il fianchetto sostengono il gioco sul lato di donna. Rb1 e b4 preparano l’apertura di linee: segui le ricatture con precisione.',
    '…f5 controlla e4. Completa il fianchetto e contesta la catena bianca con …c6 prima di cercare altre spinte.'],
  benoni: ['Benoni moderna con e4', '1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. Nf3 Bg7 8. Be2 O-O 9. O-O Re8 10. Nd2 Na6 11. f3 Nc7 12. a4 b6 13. Nc4 Ba6 14. Bf4 Bxc4 15. Bxc4 a6 16. Qd3 Qd7',
    'Il pedone d5 dà spazio e limita il Nero. Sostieni e4 e sviluppa i pezzi prima di preparare una rottura con e5.',
    'Il pedone d6 richiede difesa, ma l’alfiere g7 e la colonna e danno attività. Prepara il controgioco sul lato di donna.'],
  budapest: ['Budapest con restituzione del pedone', '1. d4 Nf6 2. c4 e5 3. dxe5 Ng4 4. Bf4 Nc6 5. Nf3 Bb4+ 6. Nbd2 Qe7 7. e3 Ngxe5 8. Nxe5 Nxe5 9. Be2 O-O 10. O-O d6 11. Nb3 b6 12. a3 Bc5 13. Nxc5 bxc5 14. Qc2 Bb7 15. Rad1 Rae8 16. Rd2 Ng6',
    'Restituisci il pedone per completare lo sviluppo. Dopo i cambi, sfrutta la coppia degli alfieri e coordina le torri sulla colonna d.',
    'Recupera e5 senza affidarti a una trappola. Il cavallo e5 e l’alfiere b7 partecipano alla pressione centrale.'],
  english: ['Inglese con …e5 e fianchetto', '1. c4 e5 2. Nc3 Nf6 3. g3 d5 4. cxd5 Nxd5 5. Bg2 Nb6 6. Nf3 Nc6 7. O-O Be7 8. d3 O-O 9. Be3 Be6 10. Rc1 f5 11. Na4 Nxa4 12. Qxa4 Bd5 13. a3 a6 14. b4 Bd6 15. Bc5 Kh8 16. Qc2 Qe7',
    'L’alfiere g2 controlla il centro da lontano. Usa la colonna c e prepara b4, mantenendo il re al sicuro contro …f5.',
    'Il pedone e5 dà spazio e …f5 prepara attività. Coordina gli alfieri al centro e controlla l’avanzata bianca sul lato di donna.'],
  reti: ['Réti con doppio fianchetto', '1. Nf3 d5 2. c4 e6 3. g3 Nf6 4. Bg2 Be7 5. O-O O-O 6. b3 c5 7. Bb2 Nc6 8. e3 b6 9. Nc3 Bb7 10. Qe2 Rc8 11. Rfd1 Qc7 12. Rac1 Rfd8 13. d4 cxd4 14. exd4 dxc4 15. bxc4 Na5 16. Ne5 Bxg2 17. Kxg2 Bd6',
    'Sviluppi i pezzi prima di occupare il centro. La spinta d4 arriva quando le torri sono pronte: i cambi aprono nuove linee per gli alfieri.',
    'Occupa il centro senza lasciare i pedoni indifesi. Rispondi a d4 osservando le colonne che si aprono e il ruolo dei cavalli.'],
  'four-knights': ['Quattro Cavalli con centro aperto', '1. e4 e5 2. Nf3 Nc6 3. Nc3 Nf6 4. d4 exd4 5. Nxd4 Bb4 6. Nxc6 bxc6 7. Bd3 d5 8. exd5 cxd5 9. O-O O-O 10. Bg5 c6 11. Qf3 Be7 12. Rae1 Be6 13. Ne2 Rb8 14. b3 Qd7 15. Nd4 Rfe8 16. Nxe6 fxe6',
    'L’apertura del centro dà spazio agli alfieri. Sfrutta la colonna e e porta il cavallo verso d4, controllando le conseguenze dei cambi.',
    'Il pedone c sostiene d5 dopo i cambi iniziali. Sviluppa l’alfiere c8 e attiva le torri prima di cercare l’iniziativa.'],
  larsen: ['Larsen contro un centro con …e5', '1. b3 e5 2. Bb2 Nc6 3. e3 d5 4. Bb5 Bd6 5. f4 Qe7 6. Nf3 f6 7. O-O Bd7 8. Nc3 e4 9. Bxc6 bxc6 10. Nd4 Nh6 11. Qe1 O-O 12. Nce2 c5 13. Nb5 Bxb5 14. c4 Bc6 15. cxd5 Bxd5 16. Nc3 Bc6',
    'L’alfiere b2 preme sulla grande diagonale. La spinta f4 contesta e5; dopo …e4 devi trovare nuove case per i cavalli.',
    'Occupa il centro e sostienilo con i pezzi. Le spinte …e4 e …c5 guadagnano spazio ma lasciano case da controllare.'],
  bird: ['Bird con fianchetto sul lato di donna', '1. f4 d5 2. Nf3 Nf6 3. e3 g6 4. b3 Bg7 5. Bb2 O-O 6. Be2 c5 7. O-O Nc6 8. Ne5 Qc7 9. Nxc6 Qxc6 10. Bf3 b6 11. d3 Bb7 12. Nd2 Rad8 13. Qe1 Qc7 14. Be5 Qd7 15. Qh4 Ne8 16. Bxg7 Nxg7',
    'f4 controlla e5 ma lascia diagonali verso il re. Sviluppa e arrocca prima di portare la donna in h4.',
    'Il centro con d5 e c5 dà spazio. Coordina il fianchetto con le torri e rispondi alle minacce bianche sul lato di re.'],
  trompowsky: ['Trompowsky con cambio in f6', '1. d4 Nf6 2. Bg5 e6 3. e4 h6 4. Bxf6 Qxf6 5. Nc3 d6 6. Nf3 g6 7. Qd2 Bg7 8. O-O-O O-O 9. h4 Nc6 10. Kb1 e5 11. d5 Ne7 12. h5 g5 13. Nh2 Bd7 14. Be2 Rfc8 15. Bg4 Bxg4 16. Nxg4 Qf4',
    'Il cambio in f6 cede la coppia degli alfieri per costruire il centro. Con arrocchi opposti, prepara le spinte h4 e h5 senza trascurare il re in b1.',
    'La donna riprende in f6 e l’alfiere va in g7. Contesta il centro con …e5 e cerca attività sulla colonna c.'],
  colle: ['Colle con preparazione di e4', '1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 c5 5. c3 Nc6 6. Nbd2 Bd6 7. O-O O-O 8. dxc5 Bxc5 9. e4 Qc7 10. Qe2 Bd6 11. Re1 e5 12. exd5 Nxd5 13. Ne4 Be7 14. Bc4 Be6 15. Neg5 Bxg5 16. Nxg5 Rad8',
    'Il centro con e3 e c3 prepara e4. Libera il centro con dxc5 e porta la torre in e1 per partecipare alla lotta sulle colonne aperte.',
    'Non lasciare che il Bianco giochi lo schema senza pressione. …c5 ed …e5 contestano il centro e danno case ai pezzi.'],
  bogo: ['Bogo-Indiana con cambio degli alfieri', '1. d4 Nf6 2. c4 e6 3. Nf3 Bb4+ 4. Bd2 Bxd2+ 5. Qxd2 O-O 6. Nc3 d5 7. e3 b6 8. Bd3 Bb7 9. O-O Nbd7 10. Rac1 c5 11. cxd5 exd5 12. Rfd1 Re8 13. Bb1 Qe7 14. dxc5 bxc5 15. Qc2 Rad8 16. Ne2 Ne4',
    'Pari lo scacco sviluppando l’alfiere. Dopo il cambio, prepara le torri sulle colonne centrali e osserva la pressione sulla diagonale b1–h7.',
    'Lo scacco iniziale semplifica gli alfieri camposcuro. Contesta il centro con …c5 e cerca una casa attiva per il cavallo in e4.'],
  'old-indian': ['Vecchia Indiana con …e5', '1. d4 Nf6 2. c4 d6 3. Nc3 e5 4. Nf3 Nbd7 5. e4 Be7 6. Be2 O-O 7. O-O c6 8. Re1 Qc7 9. Bf1 Re8 10. h3 Bf8 11. Be3 a6 12. Rc1 b6 13. d5 Bb7 14. b4 cxd5 15. cxd5 Qd8 16. Nd2 Rc8',
    'Lo spazio permette di preparare le torri prima di d5. Dopo il cambio in d5, valuta come sfruttare la colonna c e l’avanzata b4.',
    'L’alfiere si sviluppa in e7 prima di tornare in f8. Prepara controgioco centrale e attività per l’alfiere c8.'],
  nimzowitsch: ['Nimzowitsch con centro chiuso', '1. e4 Nc6 2. d4 d5 3. e5 Bf5 4. Nf3 e6 5. Be2 Nge7 6. O-O h6 7. c3 g5 8. Ne1 Bg7 9. Nd3 O-O 10. f4 f6 11. exf6 Bxf6 12. fxg5 Bxg5 13. Bxg5 hxg5 14. Nd2 Ng6 15. Nf3 Qe7 16. Qd2 g4',
    'Il pedone e5 guadagna spazio. Dopo …f6, i cambi aprono linee verso i re: coordina cavalli e donna senza muovere automaticamente i pedoni.',
    'Il cavallo c6 accompagna …d5. Le spinte …g5 e …f6 cambiano la struttura e richiedono attenzione alla sicurezza del tuo re.'],
  owen: ['Owen con doppio fianchetto', '1. e4 b6 2. d4 Bb7 3. Bd3 e6 4. Nf3 Nf6 5. Qe2 d5 6. e5 Nfd7 7. O-O c5 8. c3 Nc6 9. a3 Be7 10. b4 O-O 11. Be3 Rc8 12. Nbd2 cxd4 13. cxd4 f6 14. exf6 Bxf6 15. Rac1 Qe7 16. Rfe1 e5',
    'Costruisci un centro ampio e sostieni d4 con i pezzi. Il Nero lo attacca con …c5 e …f6: prepara le torri prima che il centro si apra.',
    'Il fianchetto in b7 attacca il centro da lontano. Combina …c5 e …f6 con lo sviluppo per mettere in discussione i pedoni bianchi.'],
  'open-games': ['Apertura di Alfiere con d3', '1. e4 e5 2. Bc4 Nf6 3. d3 Nc6 4. Nf3 Bc5 5. O-O d6 6. c3 O-O 7. Bb3 a6 8. Nbd2 Ba7 9. Re1 h6 10. Nf1 Re8 11. Ng3 Be6 12. Bc2 d5 13. exd5 Bxd5 14. Be3 Bxe3 15. Rxe3 Qd7 16. Qe2 Rad8',
    'Lo sviluppo tranquillo prepara attività centrale. Il cavallo passa per f1 e g3; la torre e1 sostiene e4 prima della rottura …d5.',
    'Completa lo sviluppo e prepara …d5. Dopo i cambi cerca attività sulle colonne d ed e, controllando le minacce al re.'],
  'queens-pawn': ['Donna con sviluppo classico e c4', '1. d4 d5 2. Nf3 Nf6 3. e3 e6 4. Bd3 c5 5. O-O Nc6 6. b3 Bd6 7. Bb2 O-O 8. Nbd2 b6 9. c4 Bb7 10. Rc1 Qe7 11. Qe2 Rad8 12. Rfd1 Rfe8 13. cxd5 exd5 14. dxc5 bxc5 15. Ba6 Bxa6 16. Qxa6 Ne4',
    'Completa lo sviluppo e prepara c4. I cambi centrali aprono le colonne per le torri e modificano la diagonale dell’alfiere b2.',
    'Contesta d4 con …c5. Dopo i cambi coordina le torri e usa e4 come possibile avamposto del cavallo.'],
  other: ['Sviluppo flessibile da 1.Nc3', '1. Nc3 d5 2. e4 dxe4 3. Nxe4 Nf6 4. Nxf6+ exf6 5. d4 Bd6 6. Nf3 O-O 7. Be2 Re8 8. O-O Nc6 9. c3 Bf5 10. Be3 Qd7 11. Qd2 Rad8 12. Rfe1 Ne7 13. Bf4 Nd5 14. Bxd6 Qxd6 15. Bd3 Bxd3 16. Qxd3 Nf4',
    'Da un primo tratto flessibile passi a una struttura concreta. Sviluppa i pezzi e osserva come i cambi degli alfieri modificano le case disponibili ai cavalli.',
    'I pedoni f doppiati non impediscono lo sviluppo. Attiva le torri e porta il cavallo da e7 a d5 e f4.'],
}

export const OPENING_JOURNEYS = OPENING_LESSONS.map(guide => {
  const [title,pgn,whitePlan,blackPlan]=routes[guide.id]
  const board=new Chess();board.loadPgn(pgn)
  return {id:guide.id,title,moves:board.history(),whitePlan,blackPlan}
})

export const JOURNEY_STAGES = [
  {id:'opening',title:'1 · Le basi dell’apertura',goal:'Occupa il centro, sviluppa i primi pezzi e osserva la risposta avversaria.'},
  {id:'development',title:'2 · Sviluppo e sicurezza del re',goal:'Collega i pezzi, prepara l’arrocco e individua la rottura centrale.'},
  {id:'middlegame',title:'3 · Entriamo nel mediogioco',goal:'Collega ogni mossa alla struttura: colonne, diagonali, cambi e bersagli.'},
]

const keyIdeas = {
  italian: {
    '1w':'e4 occupa il centro e libera la diagonale dell’alfiere f1. La prima priorità è far partecipare i pezzi.',
    '1b':'e5 risponde al centro con un pedone e libera l’alfiere f8. Entrambi i giocatori preparano lo sviluppo.',
    '2w':'Il cavallo f3 attacca e5 e controlla d4. Sviluppi un pezzo facendo una domanda concreta al Nero.',
    '2b':'Il cavallo c6 difende e5. Non serve muovere la donna per proteggere il pedone centrale.',
    '3w':'Da c4 l’alfiere guarda f7 e controlla d5. La pressione su f7 non è ancora un attacco vincente: mancano pezzi sviluppati.',
    '3b':'L’alfiere c5 guarda f2 e controlla d4. Il Nero sviluppa mantenendo una presenza al centro.',
    '4w':'c3 controlla d4 e prepara una futura spinta del pedone d. Il cavallo b1 dovrà cercare un’altra strada, perché c3 è occupata.',
    '4b':'Il cavallo f6 attacca e4. Prima di preparare un attacco sul re, il Bianco deve decidere come sostenere il proprio centro.',
    '5w':'d3 sostiene e4 e libera l’alfiere c1. Scegli un centro stabile prima di cercare la spinta d4.',
    '5b':'d6 sostiene e5 e libera l’alfiere c8. Il Nero prepara l’arrocco senza aprire subito il centro.',
    '6w':'L’arrocco porta il re in g1 e la torre in f1. Le mosse preparatorie ora possono servire a organizzare il centro.',
    '6b':'Anche il Nero mette il re in g8 e porta la torre in f8. Entrambi hanno completato lo sviluppo del lato di re.',
    '7w':'La torre e1 sostiene e4. Liberare f1 permette in seguito al cavallo b1 di riorganizzarsi attraverso d2 e f1.',
    '7b':'a6 controlla b5 e rende disponibile a7 come casa di ritirata per l’alfiere c5.',
    '8w':'L’alfiere si ritira in b3 mantenendo la diagonale verso f7. Lascia c4 senza rinunciare al proprio ruolo.',
    '8b':'L’alfiere a7 mantiene la diagonale verso f2 e lascia libera c5. Non tutti i miglioramenti dei pezzi sono mosse in avanti.',
    '9w':'Il cavallo b1 passa per d2: c3 è occupata dal pedone. La destinazione del percorso sarà g3 attraverso f1.',
    '9b':'h6 toglie g5 al cavallo f3 e all’alfiere c1. Il Nero limita le possibilità avversarie prima di agire al centro.',
    '10w':'Il cavallo arriva in f1, una casa liberata dalla torre. Da qui può raggiungere g3 senza intralciare il pedone d3.',
    '10b':'La torre e8 sostiene e5. Il Nero prepara il gioco centrale mentre il Bianco riorganizza il cavallo.',
    '11w':'Da g3 il cavallo controlla f5 ed e4. Hai trasformato il pezzo b1, inizialmente chiuso, in un partecipante al gioco sul lato di re.',
    '11b':'L’alfiere e6 si oppone all’alfiere b3 sulla diagonale e prepara lo sviluppo completo del lato di donna.',
    '12w':'L’alfiere torna in c2 e sostiene e4 lungo la diagonale c2–d3–e4. Per il momento il pedone d3 ne limita il raggio.',
    '12b':'d5 rompe la simmetria e attacca e4. Il centro cambia: adesso la priorità è calcolare i cambi, non continuare lo schema a memoria.',
    '13w':'La cattura exd5 elimina il pedone arrivato da d6 e apre la colonna e. Nota come la torre e1 riceve nuove linee.',
    '13b':'L’alfiere riprende in d5 e controlla la diagonale verso g2. Il Nero sostituisce un pedone centrale con un pezzo attivo.',
    '14w':'L’alfiere c1 entra in e3 e si oppone all’alfiere d5. Il Bianco mette in gioco l’ultimo alfiere e offre un cambio.',
    '14b':'Il cambio in e3 elimina l’alfiere avversario ma consente alla torre bianca di salire sulla terza traversa.',
    '15w':'La torre riprende in e3. Da questa casa sostiene il cavallo f3 lungo la traversa e resta sulla colonna e.',
    '15b':'La donna d7 libera d8 per una torre e collega il gioco della donna a quello dei pezzi centrali.',
    '16w':'La donna e2 collega le torri e sostiene la colonna e. Hai raggiunto un mediogioco in cui conta la coordinazione, oltre allo sviluppo.',
    '16b':'La torre a8 arriva in d8 sulla colonna aperta. Il pedone bianco d3 diventa un bersaglio da osservare.',
    '17w':'La seconda torre arriva in e1: le due torri si coordinano sulla colonna e, dove si trova ancora il pedone nero e5.',
    '17b':'La donna d6 sostiene e5 e resta sulla colonna d. Prima di cercare iniziativa, entrambi devono controllare i pedoni centrali.',
    '18w':'a3 controlla b4. È una mossa di contenimento: chiediti quali ingressi dei pezzi avversari stai limitando.',
    '18b':'a5 guadagna spazio sul lato di donna e controlla b4. Il percorso si ferma qui: i prossimi piani dipendono dalle scelte di entrambi.',
  },
  spanish: {'8w':'c3 prepara d4 e lascia c2 all’alfiere b3. Il piano nasce dalla coordinazione tra centro e ritirata dell’alfiere.', '11w':'d4 contesta e5: la preparazione con Re1 e c3 si trasforma finalmente in azione centrale.', '12b':'Il cambio in d4 libera la colonna c per il Nero, ma permette al Bianco di mantenere un pedone in d4 con cxd4.', '16w':'Il cavallo si allontana da b3, attaccata dal pedone a4. Prima del tuo piano viene la risposta alle minacce.'},
  sicilian: {'3w':'d4 apre il centro: scambi il pedone d con il pedone c nero e prepari una casa centrale per il cavallo.', '9w':'f4 sostiene e5 e prepara attività sul lato di re, ma modifica la copertura del re bianco.', '13b':'La torre arriva in c8 sulla colonna semiaperta: davanti a lei resta il pedone bianco c2.', '15b':'Il cavallo entra in c4, dove attacca l’alfiere e3 e il pedone b2. Il Bianco deve tenerne conto.'},
  french: {'3w':'e5 chiude il centro. Il piano cambia: sostegno della catena e attacchi alle sue basi contano più delle colonne aperte.', '3b':'c5 colpisce d4, la base della catena bianca. Questa è la rottura da riconoscere nella Francese.', '8w':'cxd4 ripristina il pedone d4, ma apre la colonna c. La struttura e le colonne cambiano insieme.', '15b':'L’alfiere trova attività in b5 e attacca e2 lungo la diagonale. Il problema dell’alfiere c8 è diventato un piano concreto.'},
  caro: {'4b':'L’alfiere c8 esce prima della spinta …e6. In questo modo il Nero evita di chiuderlo dietro i propri pedoni.', '9w':'Bd3 offre il cambio dell’alfiere h7: osserva quali diagonali restano disponibili dopo il cambio.', '12w':'L’arrocco lungo porta il re in c1 e la torre in d1. Le spinte h4 e h5 ora appartengono al lato opposto al tuo re.', '16b':'La donna a5 guarda verso il lato di donna e attacca a2: gli arrocchi opposti danno direzioni diverse al gioco.'},
  'queens-gambit': {'4w':'Il cambio in d5 lascia al Bianco i pedoni e ed f e al Nero i pedoni c e d: la struttura prepara piani diversi sui due lati.', '11w':'La torre va in b1 per sostenere la futura spinta b4. Stai preparando un piano sui pedoni del lato di donna.', '13w':'b4 mette in moto i pedoni sul lato di donna. Osserva i cambi e la risposta …b5 prima di pensare di avanzare ancora.', '14b':'b5 blocca l’avanzata b4–b5. Un piano non si esegue automaticamente: deve adattarsi alla risposta avversaria.'},
  london: {'9w':'Ne5 colloca un pezzo al centro, sostenuto dal pedone d4. La futura spinta f4 aggiungerà sostegno.', '12w':'L’alfiere abbandona g3 perché il cavallo f5 lo attacca. Una minaccia concreta modifica il piano di sviluppo.', '16b':'f6 attacca il cavallo e5 e prepara l’apertura del centro mentre i pedoni bianchi sono avanzati sul lato di re.'},
  'kings-indian': {'8w':'d5 chiude il centro. I piani si spostano sui lati: il Bianco preparerà c5 e il Nero …f5.', '10b':'f5 è la rottura sul lato di re. Il cavallo ha liberato f6 proprio per rendere disponibile questa spinta.', '14w':'c5 avvia il controgioco sul lato di donna. Non ignorare l’attacco nero, ma riconosci dove hai spazio per creare minacce.', '16b':'b6 attacca l’alfiere a5: anche durante un attacco sul re possono servire risposte sul lato opposto.'},
  grunfeld: {'6w':'bxc3 costruisce un centro con c3, d4 ed e4. Il vantaggio di spazio comporta anche pedoni che il Nero può attaccare.', '7b':'c5 mette subito in discussione d4. Il Nero non lascia consolidare il grande centro bianco senza reagire.', '14w':'d5 guadagna spazio e attacca il cavallo c6. Lasciando d4, il pedone libera anche una casa sulla grande diagonale dell’alfiere g7.', '15b':'e6 attacca il pedone d5 e prepara l’apertura di linee al centro.'},
  nimzo: {'8b':'Il cambio in c3 cede la coppia degli alfieri e provoca pedoni doppiati. Materiale uguale, struttura diversa.', '11b':'e5 contesta d4 e apre la strada all’alfiere c8. È il momento di collegare i pezzi alla rottura centrale.', '16w':'cxd4 riunisce un pedone al centro, ma la successiva …exd4 ne cambierà ancora la struttura.'},
  catalan: {'9w':'e4 è l’espansione centrale preparata dallo sviluppo. L’alfiere g2 accompagna il centro anche se la diagonale non è completamente aperta.', '10w':'e5 attacca il cavallo f6 ma chiude la diagonale dell’alfiere g2. Lo spazio ha un costo nella mobilità dei pezzi.', '14w':'Il cavallo d2 va in f1 per cercare nuove case senza bloccare la colonna d.'},
  benoni: {'5w':'La ripresa cxd5 mantiene un pedone avanzato in d5. Il Bianco ha spazio centrale, mentre il Nero cercherà attività sui lati.', '9b':'La torre e8 arriva sulla colonna semiaperta verso e4. La pressione dei pezzi deve compensare il minor spazio.', '13w':'Il cavallo c4 controlla d6 e b6: il piano usa le case lasciate dalla struttura dei pedoni.'},
  colle: {'8w':'dxc5 libera d4 e prepara e4. Lo schema iniziale serve a questa trasformazione del centro.', '9w':'e4 libera l’alfiere c1 e contesta il centro. Hai raggiunto lo scopo della preparazione con Bd3 e Nbd2.', '13w':'Il cavallo e4 attacca l’alfiere d6. Nei centri aperti lo sviluppo deve creare anche pressioni concrete.'},
  scandinavian: {'3w':'Sviluppi il cavallo attaccando la donna d5. Un tempo utile migliora anche la tua posizione.', '5b':'c6 controlla d5 e prepara un rifugio per la donna in c7.', '10w':'a3 attacca l’alfiere b4. Prima di attaccare sull’altro lato, chiarisci la pressione sul cavallo c3.', '13b':'b5 guadagna spazio e attacca l’alfiere c4. Il controgioco nero avanza verso il re bianco.'},
  pirc: {'7w':'d5 guadagna spazio attaccando il cavallo c6. Il Nero deve decidere dove riorganizzarlo.', '9w':'La presa en passant elimina il pedone appena arrivato in e5. Il centro si apre e l’alfiere c8 potrà riprendere in e6.', '11w':'La donna d2 collega il gioco sull’ala di donna e prepara la torre a1 per la colonna d.', '17w':'La ripresa exd5 apre la colonna e e lascia un pedone bianco avanzato in d5.'},
  alekhine: {'3w':'d4 sostiene e5 e costruisce un centro ampio. Più spazio significa anche più pedoni da difendere.', '7w':'c4 attacca il cavallo d5, ma il Bianco dovrà poi completare lo sviluppo del lato di donna.', '11b':'d5 attacca il pedone c4 e contesta il centro. Il Nero mette alla prova lo spazio guadagnato dal Bianco.', '13b':'exd5 lascia al Nero un pedone d5 isolato: nessun altro pedone nero si trova sulle colonne c ed e.'},
  petrov: {'3b':'d6 scaccia il cavallo e5 prima di riprendere e4. L’ordine delle catture è parte essenziale della posizione.', '11w':'bxc3 porta un pedone in c3 a sostegno di d4 e apre la colonna b.', '12w':'La torre arriva sulla colonna e aperta. Il centro aperto rende utile mettere le torri in gioco.', '16w':'Bd3 offre il cambio dell’alfiere f5. Guarda quale pezzo potrà riprendere e come cambierà la coordinazione.'},
  scotch: {'3w':'d4 attacca e5 e apre il centro prima di completare lo sviluppo. Il seguito deve dare priorità ai pezzi e al re.', '6w':'c3 sostiene il cavallo d4 contro la pressione della donna f6 e dell’alfiere c5.', '10b':'La ripresa axb6 apre la colonna a alla torre a8. Questo dettaglio tornerà utile nel mediogioco.', '16b':'La torre entra in a2 e cattura il pedone rimasto indifeso. Il piano centrale del Bianco non doveva far dimenticare il lato di donna.'},
  vienna: {'3w':'g3 prepara il fianchetto. L’alfiere g2 darà una direzione concreta allo sviluppo bianco.', '6w':'bxc3 accetta pedoni doppiati e apre la colonna b per la torre.', '11w':'La torre b1 usa la colonna semiaperta per attaccare b7. Il Nero risponde difendendolo con la torre.', '14w':'Nh4 attacca l’alfiere f5: migliori il ruolo del cavallo e imponi una scelta all’avversario.'},
  'kings-gambit': {'2w':'f4 offre un pedone per contestare e5. Il re resta esposto sulla diagonale h4–e1: lo sviluppo è urgente.', '3b':'d5 colpisce e4 invece di difendere soltanto il pedone f4. Il Nero cerca attività centrale.', '10b':'bxc6 apre la colonna b, ma lascia pedoni neri in c6 e c7: attività e struttura vanno considerate insieme.', '14w':'Il cavallo e4 attacca l’alfiere d6. Segui i cambi che si preparano sulla colonna e.'},
  philidor: {'4b':'Il cavallo d7 sostiene e5, ma occupa una casa davanti all’alfiere c8. Il Nero dovrà organizzare lo sviluppo di quel pezzo.', '12w':'La torre d1 si allinea con la donna d2 sulla colonna d. I cambi centrali potrebbero aprire quella colonna.', '14w':'dxe5 elimina il pedone centrale nero e prepara una struttura diversa dopo …dxe5.', '15b':'Il cavallo c5 attacca e4 e l’alfiere a2. Il Nero sta trovando attività fuori dalla struttura compatta.'},
  'queens-indian': {'7b':'Il cavallo e4 occupa una casa centrale e attacca c3. Il controllo di e4 è uno dei temi dell’impianto.', '10w':'b3 prepara Bb2. Il Bianco vuole sviluppare entrambi gli alfieri sulle grandi diagonali.', '15b':'e5 attacca d4. La preparazione dei pezzi si trasforma in una rottura centrale.'},
  dutch: {'1b':'f5 controlla e4 ma libera la diagonale e8–h5 verso il re. Lo sviluppo dovrà tenerne conto.', '10b':'c6 attacca il pedone d5 e prepara l’apertura del lato di donna.', '12w':'dxc6 modifica la struttura: dopo …bxc6 il Nero avrà pedoni in c6 e d6.', '13w':'b5 attacca c6. Le spinte sul lato di donna si collegano ai bersagli creati dai cambi.'},
  budapest: {'3w':'dxe5 accetta il pedone ma non completa lo sviluppo. Il Nero guadagnerà tempi attaccando e5.', '7w':'e3 libera l’alfiere f1 e sceglie lo sviluppo invece di una difesa a tutti i costi del pedone e5.', '13b':'bxc5 modifica i pedoni e apre la colonna b. Il Bianco mantiene i due alfieri.', '16b':'Ng6 attacca l’alfiere f4. Il cavallo cerca attività prima che il Bianco sfrutti completamente i propri alfieri.'},
  english: {'4w':'cxd5 apre la colonna c per il Bianco. Il cavallo nero riprenderà al centro.', '10w':'La torre c1 usa la colonna semiaperta verso c7. Una caratteristica della struttura diventa una casa per la torre.', '11w':'Na4 offre un cambio del cavallo b6; dopo la ripresa della donna cambiano i rapporti sul lato di donna.', '14w':'b4 guadagna spazio e controlla c5. Prepara un piano sul lato di donna mentre il Nero dispone del pedone f5.'},
  reti: {'6w':'b3 prepara il secondo fianchetto. Il Bianco sviluppa i pezzi prima di scegliere la struttura centrale.', '13w':'d4 occupa il centro quando donna e torri sono già sviluppate. Segui le catture per capire quali colonne si aprono.', '15w':'bxc4 lascia un pedone in c4 e apre la colonna b. Il centro è diverso da quello dell’apertura.'},
  'four-knights': {'4w':'d4 rompe la simmetria e apre il centro. Non è più sufficiente imitare lo sviluppo avversario.', '8b':'cxd5 ricostruisce un pedone in d5 e apre la colonna c. La struttura dà al Nero un centro da sostenere.', '12w':'La torre e1 usa una colonna aperta. Il re è già al sicuro e le torri possono partecipare al gioco.', '16b':'fxe6 lascia pedoni in e6 e d5 e apre la colonna f. Un cambio di cavalli ha cambiato il piano dei pedoni.'},
  larsen: {'2w':'Bb2 guarda e5 lungo la grande diagonale. Il Nero deve tenerne conto mentre costruisce il centro.', '8b':'e4 attacca il cavallo f3. Il vantaggio di spazio nero costringe il Bianco a riorganizzare i pezzi.', '12b':'c5 attacca il cavallo d4. I pedoni centrali guadagnano tempi, ma modificano anche le case disponibili.', '14w':'c4 contesta il pedone d5 e attacca l’alfiere b5. Cerchi controgioco invece di lasciare avanzare indisturbato il centro nero.'},
  bird: {'1w':'f4 controlla e5 e libera la diagonale verso il re e1. Prima di attaccare devi sviluppare e arroccare.', '8w':'Il cavallo e5 usa una casa sostenuta da f4. La prima spinta dell’apertura ora trova un legame con lo sviluppo.', '14w':'Be5 mette pressione sul cavallo f6 e sostiene f4. Riconosci quali pezzi partecipano al controllo del centro e del lato di re.'},
  trompowsky: {'4w':'Bxf6 cede l’alfiere per il cavallo. La donna nera riprende, mentre il Bianco mantiene i pedoni d4 ed e4.', '10w':'Kb1 allontana il re dalla colonna c. Con gli arrocchi opposti, anche una mossa di sicurezza sostiene il piano d’attacco.', '11w':'d5 chiude il centro e attacca il cavallo c6. Le spinte sul lato di re avverranno con un centro meno aperto.', '16b':'Qf4 offre un cambio delle donne e attacca il cavallo g4. La sicurezza del re può cambiare se le donne vengono scambiate.'},
  bogo: {'4w':'Bd2 para lo scacco e sviluppa un pezzo. Il Nero può cambiare gli alfieri o conservare la tensione.', '11b':'exd5 sostituisce il pedone d con il pedone e. Il pedone in d5 controlla c4 ed e4.', '14w':'dxc5 cambia la struttura centrale. Dopo …bxc5 il Nero avrà pedoni in c5 e d5.', '16b':'Il cavallo e4 attacca la donna c2. Il centro offre case attive, ma ogni minaccia concreta va verificata.'},
  'old-indian': {'9w':'L’alfiere f1 lascia la colonna e alla torre e sostiene g2. Una ritirata può migliorare la coordinazione.', '13w':'d5 attacca il pedone c6 e chiude la tensione con e5. Il gioco si sposta verso le colonne che possono aprirsi.', '14b':'cxd5 cambia la struttura: dopo cxd5 si apre la colonna c per le torri.', '16b':'La torre c8 si oppone alla torre c1 sulla colonna aperta. I cambi dei pedoni hanno deciso dove collocare le torri.'},
  nimzowitsch: {'3w':'e5 chiude la tensione con d5 e guadagna spazio. Il Nero dovrà colpire la catena con altre spinte.', '10b':'f6 attacca e5. L’apertura del centro è delicata perché entrambi i re hanno arroccato sul lato di re.', '13b':'hxg5 porta il pedone h sulla colonna g. Le linee verso il re nero sono cambiate dopo tre catture.', '16b':'g4 attacca il cavallo f3. Il pedone avanzato crea una minaccia, ma lascia altre case dietro di sé.'},
  owen: {'3w':'Bd3 sostiene e4 contro la pressione dell’alfiere b7. Lo sviluppo protegge anche il centro.', '6w':'e5 attacca il cavallo f6 e chiude la diagonale dell’alfiere b7. Il Nero cercherà di riaprirla attaccando la catena.', '13b':'f6 attacca e5. Il Nero prova a liberare spazio per i propri pezzi.', '16b':'e5 attacca il pedone d4. Dopo l’apertura della colonna f, una nuova spinta contesta il centro bianco.'},
  'open-games': {'6w':'c3 controlla d4 ma occupa la casa naturale del cavallo b1: prepara per quel pezzo un percorso attraverso d2.', '10w':'Il cavallo passa per f1 per raggiungere g3. Lo sviluppo comprende anche il miglioramento dei pezzi già usciti.', '12b':'d5 attacca e4 e apre il centro. Da questo momento devi seguire i cambi invece di continuare lo schema a memoria.'},
  'queens-pawn': {'9w':'c4 contesta il centro d5 dopo aver sviluppato e arroccato. La struttura iniziale era una preparazione, non un piano da ripetere per sempre.', '13w':'cxd5 avvia i cambi centrali. La risposta …exd5 mantiene un pedone nero in d5.', '14b':'bxc5 crea una coppia di pedoni neri in c5 e d5. Il Bianco dovrà organizzare i pezzi rispetto a questa struttura.'},
  other: {'4b':'exf6 accetta pedoni doppiati sulla colonna f e apre la diagonale all’alfiere f8.', '12w':'Bf4 offre il cambio dell’alfiere d6. Prima di cambiare, osserva quale pezzo avversario stai eliminando.', '13b':'Il cavallo d5 attacca l’alfiere f4: la riorganizzazione dal lato di donna crea una minaccia concreta.', '16b':'Il cavallo f4 attacca la donna d3. Il mediogioco richiede risposte alle minacce, anche dopo aver completato lo sviluppo.'},
}

const names={p:'pedone',n:'cavallo',b:'alfiere',r:'torre',q:'donna',k:'re'}
function moveReason(journey,index,board,move){
  const authored=keyIdeas[journey.id]?.[`${Math.floor(index/2)+1}${move.color}`]
  if(authored)return authored
  const center=['d4','e4','d5','e5'].filter(square=>board.attackers(square,move.color).includes(move.to))
  const targets=board.board().flat().filter(p=>p&&p.color!==move.color&&p.type!=='k'&&board.attackers(p.square,move.color).includes(move.to))
  const facts=[]
  if(center.length)facts.push(`Da ${move.to}, ${move.piece==='q'?'la donna':`il ${names[move.piece]}`} controlla ${center.join(' e ')}.`)
  if(targets.length)facts.push(`Attacca ${targets.map(p=>`${names[p.type]} in ${p.square}`).join(', ')}: controlla le difese prima di considerare una cattura.`)
  if(move.isKingsideCastle()||move.isQueensideCastle())facts.push(`Il re ora è in ${move.to} e la torre è in ${move.isKingsideCastle()?'f':'d'}${move.color==='w'?'1':'8'}.`)
  if(move.piece==='p'&&!move.isCapture()){
    const rank=Number(move.to[1])+(move.color==='w'?1:-1),file=move.to.charCodeAt(0)
    const squares=[file-1,file+1].filter(f=>f>=97&&f<=104&&rank>=1&&rank<=8).map(f=>String.fromCharCode(f)+rank)
    if(squares.length)facts.push(`Il pedone ora controlla ${squares.join(' e ')}. Queste case contano per i prossimi movimenti dei pezzi.`)
  }
  if(!facts.length)facts.push(`${move.piece==='q'?'La donna':`Il ${names[move.piece]}`} lascia ${move.from} e raggiunge ${move.to}${move.isCapture()?' dopo il cambio':''}. Confronta il suo nuovo ruolo con il piano del tuo colore qui sotto.`)
  return facts.join(' ')
}

// Every instruction is grounded in the actual move and board. Plans are authored
// for this route, not inferred from a generic opening label or an engine score.
export function journeyCoach(journey,index,side){
  const stage=JOURNEY_STAGES[index<8?0:index<18?1:2]
  const board=new Chess()
  for(const san of journey.moves.slice(0,index))board.move(san)
  const san=journey.moves[index]
  if(!san)return {stage,plan:side==='w'?journey.whitePlan:journey.blackPlan}
  const before=board.fen(),move=board.move(san)
  let advice
  if(move.isKingsideCastle()||move.isQueensideCastle())advice=`Arrocca ${move.isKingsideCastle()?'corto':'lungo'}: sposta il re da ${move.from} a ${move.to} e porta la torre verso il centro.`
  else if(move.isCapture())advice=move.isEnPassant()?`Con il pedone in ${move.from}, cattura en passant verso ${move.to}. La presa rimuove il pedone avversario appena avanzato di due case.`:`Con ${move.piece==='q'?'la donna':`il ${names[move.piece]}`} in ${move.from}, cattura ${move.captured==='q'?'la donna':`il ${names[move.captured]}`} in ${move.to}. Osserva quali linee apre questo cambio.`
  else if(move.piece==='p')advice=`Spingi il pedone da ${move.from} a ${move.to}. Prima di muovere, guarda le case che lascia e le linee che libera.`
  else advice=`Porta ${move.piece==='q'?'la donna':`il ${names[move.piece]}`} da ${move.from} a ${move.to}. Guarda come cambiano i suoi collegamenti con il centro e con gli altri pezzi.`
  if(board.isCheck())advice+=' Questa mossa dà scacco: l’avversario deve rispondere alla minaccia al re.'
  return {stage,advice,reason:moveReason(journey,index,board,move),san,from:move.from,to:move.to,before,plan:side==='w'?journey.whitePlan:journey.blackPlan}
}
