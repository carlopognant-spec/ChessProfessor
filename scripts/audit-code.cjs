const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default

// Read first-party code only; do not execute app/QA code, env loaders or generators.
const root = path.resolve(__dirname, '..')
const names = [...new Set(execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/))]
const files = names.filter(name => fs.existsSync(path.join(root, name)) && /\.(jsx?|cjs)$/.test(name) &&
  (/^(src|scripts|tests)\//.test(name) && !name.includes('/fixtures/') || ['vite.config.js', 'vitest.config.js', 'playwright.config.js', 'playwright-check.spec.js', 'public/engine-cache-sw.js'].includes(name)))
const unusedBindings = [], exportRecords = [], imports = [], clones = new Map(), sources = new Map()
const resolve = (from, reference) => {
  if (!reference?.startsWith('.')) return null
  const relative = path.posix.normalize(path.posix.join(path.posix.dirname(from), reference))
  return [relative, relative + '.js', relative + '.jsx', relative + '.cjs'].find(file => files.includes(file)) ?? null
}
for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8')
  sources.set(file, source)
  const ast = parser.parse(source, { sourceType: 'unambiguous', plugins: ['jsx'], errorRecovery: false })
  const addImport = (reference, names) => {
    const target = resolve(file, reference)
    if (target) imports.push({ file, target, names })
  }
  traverse(ast, {
    Scope(scope) {
      for (const binding of Object.values(scope.scope.bindings)) {
        if (binding.scope !== scope.scope || binding.referenced) continue
        const name = binding.identifier.name
        unusedBindings.push({ file, line: binding.identifier.loc.start.line, name, kind: binding.kind,
          intentionalDiscard: name.startsWith('_') })
      }
    },
    ImportDeclaration(p) {
      addImport(p.node.source.value, p.node.specifiers.map(s => s.type === 'ImportNamespaceSpecifier' ? '*' : s.type === 'ImportDefaultSpecifier' ? 'default' : s.imported.name))
    },
    CallExpression(p) {
      if (p.node.callee.type === 'Import') addImport(p.node.arguments[0]?.value, ['*'])
      if (p.node.callee.name === 'require') addImport(p.node.arguments[0]?.value, ['*'])
    },
    ExportNamedDeclaration(p) {
      const d = p.node.declaration
      const names = d?.id?.name ? [d.id.name] : d?.declarations?.map(v => v.id.name).filter(Boolean) ?? p.node.specifiers.map(s => s.exported.name)
      for (const name of names) exportRecords.push({ file, line: p.node.loc.start.line, name })
      if (p.node.source) addImport(p.node.source.value, p.node.specifiers.map(s => s.local.name))
    },
    Function(p) {
      const body = p.node.body
      if (body.type !== 'BlockStatement' || body.body.length < 4 || body.end - body.start < 200) return
      const normalized = JSON.stringify(body, (key, value) => ['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments'].includes(key) ? undefined : value)
      const hash = crypto.createHash('sha256').update(normalized).digest('hex')
      const group = clones.get(hash) ?? []
      group.push({ file, line: body.loc.start.line, name: p.node.id?.name ?? p.parent.id?.name ?? '(callback)', characters: body.end - body.start })
      clones.set(hash, group)
    },
  })
}
const runtime = new Set()
const visit = file => {
  if (runtime.has(file)) return
  runtime.add(file)
  imports.filter(i => i.file === file).forEach(i => visit(i.target))
}
visit('src/main.jsx')
const exportUsage = exportRecords.filter(e => e.file.startsWith('src/')).map(e => {
  const consumers = imports.filter(i => i.target === e.file && (i.names.includes(e.name) || i.names.includes('*'))).map(i => i.file)
  return { ...e, consumers, runtimeImported: consumers.some(file => runtime.has(file)), onlyTests: consumers.length > 0 && consumers.every(file => file.startsWith('tests/')), noImports: consumers.length === 0 }
})
const output = { scannedFiles: files.length, files, runtimeModules: [...runtime],
  orphanSourceModules: files.filter(file => file.startsWith('src/') && !runtime.has(file)),
  unusedBindings: [...new Map(unusedBindings.map(item => [`${item.file}:${item.line}:${item.name}`, item])).values()],
  exportUsage, exactFunctionClones: [...clones.values()].filter(group => group.length > 1),
  limitations: ['Static references only; intentional exports, CLI entrypoints and test doubles require review.', 'Normalized AST detects exact substantial function bodies, not all semantic duplication.', 'Vendor binaries, data JSON and forbidden env/Partite are excluded. CSS/HTML/workflow reviewed separately.'] }
const destination = path.join(root, process.argv[2] ?? 'agent-output/code-audit-static.json')
fs.writeFileSync(destination, JSON.stringify(output, null, 2) + '\n', { flag: 'wx' })
console.log(JSON.stringify({ scannedFiles: output.scannedFiles, orphanSourceModules: output.orphanSourceModules,
  unusedBindings: output.unusedBindings, exportsWithNoImports: exportUsage.filter(e => e.noImports), exportsOnlyUsedByTests: exportUsage.filter(e => e.onlyTests), exactCloneGroups: output.exactFunctionClones.length }, null, 2))
