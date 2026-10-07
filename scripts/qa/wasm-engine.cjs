// UCI transport for the installed npm single-thread build. No engine binaries copied.
const path = require('node:path')
const readline = require('node:readline')
const filename = path.resolve(process.argv[2])
let engine
const queue = []
function send(command) {
  if (command === 'quit') process.exit(0)
  const result = engine.ccall('command', null, ['string'], [command], { async: command.startsWith('go ') })
  if (result?.catch) result.catch(error => { console.error(error.stack); process.exit(1) })
}
readline.createInterface({ input: process.stdin }).on('line', command => {
  if (engine) send(command)
  else queue.push(command)
})
require(filename)()({
  locateFile: file => file.includes('.wasm') ? filename.replace(/\.js$/, '.wasm') : filename,
  listener: line => process.stdout.write(line + '\n'),
}).then(instance => {
  engine = instance
  for (const command of queue) send(command)
}).catch(error => { console.error(error.stack); process.exit(1) })
