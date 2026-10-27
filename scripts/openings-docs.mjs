import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {ROOT,resolve,json,encode,exists} from './openings/common.mjs'

export async function checkDocuments(files){
  let links=0,jsonFiles=0
  for(const file of [...new Set(files)]){
    const text=new TextDecoder('utf-8',{fatal:true}).decode(await fs.readFile(resolve(file)))
    assert(!text.includes('\uFFFD'),`Replacement character: ${file}`)
    if(file.endsWith('.json')){JSON.parse(text);jsonFiles++}
    if(file.endsWith('.md'))for(const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
      const target=match[1].trim().replace(/^<|>$/g,'').split('#')[0]
      if(!target||/^(https?:|app:|mailto:)/i.test(target))continue
      const relative=path.relative(ROOT,path.resolve(path.dirname(resolve(file)),decodeURIComponent(target))).replaceAll('\\','/')
      assert(await exists(relative),`Missing local link: ${file} -> ${target}`);links++
    }
  }
  return {status:'PASS',files:new Set(files).size,jsonFiles,localLinks:links,
    scope:'UTF-8, JSON and local file targets. External URLs and Markdown anchors are not fetched.'}
}
export async function lotDocuments(id){
  const registry=await json('docs/data/opening-pipeline/lots.json'),c=registry.lots[id??registry.activeLot]
  assert(c,'Unknown lot');const p=await json(c.plan)
  const files=[c.plan,c.design,'docs/OPENING-PIPELINE.md','docs/ROADMAP-E-PROMPT-OPERATIVI.md',c.designDocument]
  if(await exists(p.plannedFiles.resultDocument))files.push(p.plannedFiles.resultDocument)
  return files
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  process.chdir(ROOT)
  try{
    const args=process.argv.slice(2)
    let files
    if(!args.length)files=['docs/OPENING-PIPELINE.md','docs/ROADMAP-E-PROMPT-OPERATIVI.md','docs/data/opening-pipeline/lots.json']
    else if(args[0]==='--lot'){
      assert(args.length===2)
      files=await lotDocuments(args[1])
    }else {assert(args.every(a=>!a.startsWith('--')));files=args}
    console.log(encode(await checkDocuments(files)))
  }catch(e){console.error(e.stack);process.exitCode=1}
}
