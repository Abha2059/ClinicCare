// Fast syntax + suspicious-character gate for all source files.
// Uses Vite's own transform pipeline so JSX is parsed exactly as the build will parse it.
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, extname, resolve } from 'path'
import { transformWithOxc } from 'vite'

const roots = process.argv.slice(2)
let bad = 0
let count = 0

// Characters that look like ASCII but are not — the class of typo that silently breaks a build.
const SUSPECT = /[\u00A0\u200B-\u200D\uFEFF\uFF00-\uFFEF\u3000-\u303F\u0400-\u04FF]/g

const files = []
const walk = (d) => {
  let entries
  try {
    entries = readdirSync(d)
  } catch {
    return
  }
  for (const e of entries) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue
    const p = join(d, e)
    if (statSync(p).isDirectory()) {
      walk(p)
      continue
    }
    if (!['.js', '.jsx', '.mjs'].includes(extname(p))) continue
    files.push(p)
  }
}
roots.forEach((r) => walk(resolve(r)))

for (const p of files) {
  count += 1
  const src = readFileSync(p, 'utf8')

  const weird = src.match(SUSPECT)
  if (weird) {
    console.log(`NON-ASCII  ${p}  ->  ${[...new Set(weird)].map((c) => JSON.stringify(c)).join(' ')}`)
    bad += 1
  }

  try {
    await transformWithOxc(src, p, { lang: extname(p) === '.jsx' ? 'jsx' : 'js' })
  } catch (err) {
    console.log(`SYNTAX     ${p}  ->  ${String(err.message).split('\n')[0]}`)
    bad += 1
  }
}

console.log(`\nchecked ${count} files, ${bad} problem(s)`)
process.exit(bad ? 1 : 0)
