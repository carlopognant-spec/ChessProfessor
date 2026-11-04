// Read-only audit through the installed Codex app-server. No model generation,
// API key, auth-file access, provider change or configuration mutation.
import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawn,spawnSync} from 'node:child_process'
import readline from 'node:readline'
import assert from 'node:assert/strict'
import os from 'node:os'
import {createHash} from 'node:crypto'

const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2)
let binary='codex',save=false,globalScope=false
while(args.length){const arg=args.shift();if(arg==='--binary'){binary=args.shift();assert(binary,'Missing binary')}
  else if(arg==='--write')save=true;else if(arg==='--global')globalScope=true;else throw Error('Unknown option: '+arg)}
const auditCwd=globalScope?os.homedir():root
const configDir=globalScope?path.join(os.homedir(),'.codex'):path.join(root,'.codex')
const expected={luna:{model:'gpt-6-luna',effort:'high',file:'luna.toml'},
  sol:{model:'gpt-6.1-sol',effort:'medium',file:'sol.toml'},
  astra:{model:'gpt-6-astra',effort:'medium',file:'astra.toml'},
  astra_high:{model:'gpt-6-astra',effort:'high',file:'astra-high.toml'}}
const child=spawn(binary,['app-server','--stdio','--strict-config'],{cwd:auditCwd,windowsHide:true,stdio:['pipe','pipe','pipe']})
const pending=new Map();let id=0
const input=readline.createInterface({input:child.stdout})
function failAll(error){for(const p of pending.values())p.reject(error);pending.clear()}
child.on('error',failAll);child.on('exit',code=>failAll(Error('Codex app-server exited: '+code)))
child.stderr.resume() // Diagnostics can contain local account/provider details; do not print.
input.on('line',line=>{let response;try{response=JSON.parse(line)}catch{return}
  const p=pending.get(response.id);if(!p)return;pending.delete(response.id)
  if(response.error)p.reject(Error('Codex request failed: '+response.error.message));else p.resolve(response.result)})
const request=(method,params={})=>new Promise((resolve,reject)=>{const n=++id;pending.set(n,{resolve,reject});child.stdin.write(JSON.stringify({id:n,method,params})+'\n')})
const timer=setTimeout(()=>{failAll(Error('Codex audit timed out'));child.kill()},25000)
try{
  const init=await request('initialize',{clientInfo:{name:'chessprofessor-routing-audit',version:'1.0.0'},capabilities:{experimentalApi:true}})
  child.stdin.write(JSON.stringify({method:'initialized'})+'\n')
  const account=await request('account/read',{refreshToken:false})
  assert.equal(account.account?.type,'chatgpt','ChatGPT login required; no API fallback will be used')
  const configResponse=await request('config/read',{cwd:auditCwd,includeLayers:true}),config=configResponse.config
  const models=[];let cursor
  do{const r=await request('model/list',{limit:100,includeHidden:false,...(cursor?{cursor}:{})});models.push(...r.data);cursor=r.nextCursor}while(cursor)
  assert.equal(config.model,'gpt-6.1-sol');assert.equal(config.model_reasoning_effort,'medium')
  if(!globalScope)assert(configResponse.layers?.some(l=>l.name?.type==='project'&&path.resolve(l.name.dotCodexFolder).toLowerCase()===configDir.toLowerCase()),'Project config not loaded; check workspace trust')
  else assert(!configResponse.layers?.some(l=>l.name?.type==='project'),'Global audit must not load a project override')
  assert.equal(config.agents?.enabled,true);assert.equal(config.agents.default_subagent_model,'gpt-6-luna')
  assert.equal(config.agents.default_subagent_reasoning_effort,'high')
  const python=spawnSync('python',['-c',
    'import json,pathlib,tomllib; p=pathlib.Path(".codex"); print(json.dumps({"root":tomllib.loads((p/"config.toml").read_text(encoding="utf-8")),"roles":{f.name:tomllib.loads(f.read_text(encoding="utf-8")) for f in (p/"agents").glob("*.toml")}}))'],
    {cwd:auditCwd,encoding:'utf8',windowsHide:true,maxBuffer:1000000})
  assert.equal(python.status,0,'Python 3.11+ with tomllib is required for role-file validation')
  const parsed=JSON.parse(python.stdout)
  if(!globalScope)assert.deepEqual(Object.keys(parsed.root).sort(),['agents','model','model_reasoning_effort'],'Project must not override authentication or permissions')
  const roleResults={}
  for(const [name,target] of Object.entries(expected)){
    const role=config.agents[name],p=parsed.roles[target.file]
    assert(role,'Role not registered: '+name);assert(p,'Missing role file: '+target.file)
    assert.equal(path.resolve(role.config_file).toLowerCase(),path.resolve(configDir,'agents',target.file).toLowerCase())
    assert.deepEqual(Object.keys(p).sort(),['developer_instructions','model','model_reasoning_effort'])
    assert.equal(p.model,target.model);assert.equal(p.model_reasoning_effort,target.effort);assert(p.developer_instructions?.trim())
    const model=models.find(m=>m.model===target.model||m.id===target.model)
    assert(model,'Model not listed for signed-in account: '+target.model)
    assert(model.supportedReasoningEfforts.some(r=>r.reasoningEffort===target.effort),'Unsupported reasoning effort: '+name)
    roleResults[name]={model:p.model,reasoning:p.model_reasoning_effort,registered:true,file:path.join(configDir,'agents',target.file)}
  }
  const sol=models.find(m=>m.model==='gpt-6.1-sol'||m.id==='gpt-6.1-sol')
  assert(sol?.supportedReasoningEfforts.some(r=>r.reasoningEffort==='medium'))
  const flags=spawnSync(binary,['features','list'],{cwd:auditCwd,encoding:'utf8',windowsHide:true})
  assert.equal(flags.status,0)
  const feature=name=>flags.stdout.split(/\r?\n/).find(l=>l.trim().startsWith(name+' '))?.trim()??null
  const version=spawnSync(binary,['--version'],{cwd:auditCwd,encoding:'utf8',windowsHide:true})
  assert.equal(version.status,0)
  const hashes={}
  for(const file of [path.join(configDir,'config.toml'),...Object.values(roleResults).map(r=>r.file),path.join(globalScope?configDir:root,'AGENTS.md')])
    hashes[path.relative(globalScope?auditCwd:root,file).replaceAll('\\','/')]=createHash('sha256').update(await fs.readFile(file)).digest('hex')
  const result={schema:1,status:'PASS',checkedAt:new Date().toISOString(),binaryVersion:version.stdout.trim(),server:init.userAgent,
    account:{type:account.account.type,plan:account.account.planType},primary:{model:config.model,reasoning:config.model_reasoning_effort},roles:roleResults,
    scope:globalScope?'personal':'project',projectConfigLoaded:!globalScope,maximumConcurrentSubagents:config.agents.max_concurrent_threads_per_session,
    features:{multiAgent:feature('multi_agent'),stepModelSwitching:feature('step_model_switching')},
    permissions:'Inherited; routing configuration does not change existing permission/authentication/provider settings',
    validation:'Strict app-server config/read, account/read, paginated model/list, role TOML values and account-supported efforts. No model-generation request.',
    inputHashes:hashes,limits:['Existing conversation/UI overrides can take precedence; reload VS Code and start a new Codex conversation to use project defaults.',
      'Routing is discretionary delegation by the primary, not an automatic in-place switch of the primary model.',
      'Account catalog availability is verified; this audit does not perform inference smoke tests for every role.',
      'No project-only enforcement of login method: authentication remains owned by the installed client. No API fallback was configured.',
      'No guaranteed Plus quota savings; additional agents also consume quota.']}
  const report='docs/data/codex-routing'+(globalScope?'-global':'')+'-validation.json'
  if(save){await fs.mkdir(path.join(root,'docs/data'),{recursive:true});await fs.writeFile(path.join(root,report),JSON.stringify(result,null,2)+'\n')}
  console.log(JSON.stringify({status:result.status,binaryVersion:result.binaryVersion,account:result.account,primary:result.primary,
    roles:result.roles,maximumConcurrentSubagents:result.maximumConcurrentSubagents,scope:result.scope,projectConfigLoaded:result.projectConfigLoaded,modelGenerationRequests:0,
    ...(save?{report}:{})},null,2))
}catch(e){console.error(JSON.stringify({status:'FAIL',error:e.message}));process.exitCode=1}
finally{clearTimeout(timer);input.close();child.stdin.end();child.kill()}
