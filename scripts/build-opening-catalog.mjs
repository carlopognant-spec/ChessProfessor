import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {Chess} from 'chess.js'
import {openingCatalogSourceFamily} from '../src/lib/openingLessons.js'

const metadata=JSON.parse(await fs.readFile('src/data/openingPositions.json','utf8'))
const entries=[]
for(const file of metadata.sourceFiles){
  let text
  try{text=await fs.readFile(`.cache/opening-library-source/${file.name}`,'utf8')}
  catch(error){
    if(error.code!=='ENOENT')throw error
    const response=await fetch(`https://raw.githubusercontent.com/JeffML/eco.json/${metadata.revision}/${file.name}`)
    if(!response.ok)throw Error(`${file.name}: HTTP ${response.status}`)
    text=await response.text()
  }
  if(createHash('sha256').update(text).digest('hex')!==file.sha256)throw Error(`Fonte modificata: ${file.name}`)
  for(const [key,record]of Object.entries(JSON.parse(text))){
    const game=new Chess();game.loadPgn(record.moves)
    const moves=game.history()
    if(!moves.length||!/^[A-E]\d{2}$/.test(record.eco))throw Error(`Record non valido: ${key}`)
    const aliases=[...new Set(Object.values(record.aliases??{}))]
    entries.push({id:createHash('sha256').update(`${file.name}:${key}`).digest('hex').slice(0,16),
      eco:record.eco,name:record.name,moves,aliases,family:openingCatalogSourceFamily(record.name,record.eco).id})
  }
  console.log(`Validate ${file.name}`)
}
entries.sort((a,b)=>a.eco.localeCompare(b.eco)||a.moves.length-b.moves.length||a.name.localeCompare(b.name))
if(new Set(entries.map(e=>e.id)).size!==entries.length||new Set(entries.map(e=>e.eco)).size!==500)throw Error('Copertura o ID non validi')
await fs.writeFile('src/data/openingCatalog.json',JSON.stringify({schema:1,source:metadata.source,revision:metadata.revision,
  license:'MIT; openingBook.LICENSE.txt',entries})+'\n')
console.log(`Catalogo completo: ${entries.length} linee, 500 codici ECO.`)
