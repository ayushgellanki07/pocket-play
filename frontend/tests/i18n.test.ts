// Localization checks: run with  node --experimental-strip-types tests/i18n.test.ts
//  1. every English key exists in Telugu and Hindi (no silent English fallback)
//  2. every {placeholder} in English also appears in the translation (and no extra ones)
//  3. every literal t('key') used in the source exists in the English dictionary
//  4. every story dialogue line has a Telugu and Hindi translation with matching choice counts
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { DICTS } from '../src/i18n/strings.ts'
import { DIALOGUE } from '../src/data/dialogue.ts'
import { DIALOGUE_TE, DIALOGUE_HI } from '../src/i18n/content/dialogue.ts'

let fails = 0
const fail = (msg: string) => { fails++; console.error('✗ ' + msg) }
const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',')

// 1 + 2: dictionary parity
const en = DICTS.en
for (const lang of ['te', 'hi'] as const) {
  const d = DICTS[lang]
  for (const k of Object.keys(en)) {
    if (k === 'app.title') continue // brand name, same in every language
    if (!(k in d)) { fail(`${lang}: missing key ${k}`); continue }
    if (vars(en[k]) !== vars(d[k])) fail(`${lang}: placeholder mismatch in ${k}: en {${vars(en[k])}} vs {${vars(d[k])}}`)
  }
}

// 3: keys used in code exist
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(p) ? [p] : [] })
}
for (const file of walk('src')) {
  if (file.includes('/i18n/')) continue
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/\bt\(\s*'([a-zA-Z0-9_.-]+)'/g)) if (!(m[1] in en)) fail(`${file}: unknown key '${m[1]}'`)
}

// 4: dialogue coverage
for (const [script, lines] of Object.entries(DIALOGUE)) {
  for (const line of lines) {
    for (const [lang, table] of [['te', DIALOGUE_TE], ['hi', DIALOGUE_HI]] as const) {
      const tr = table[`${script}.${line.id}`]
      if (!tr) { fail(`${lang}: dialogue ${script}.${line.id} not translated`); continue }
      if ((line.choices?.length ?? 0) !== (tr.choices?.length ?? 0)) fail(`${lang}: dialogue ${script}.${line.id} has ${tr.choices?.length ?? 0} choices, English has ${line.choices?.length ?? 0}`)
      for (const term of tr.terms ?? []) if (!tr.text.includes(term)) fail(`${lang}: highlighted term "${term}" not in ${script}.${line.id}`)
      if (vars(line.text) !== vars(tr.text)) fail(`${lang}: placeholder mismatch in dialogue ${script}.${line.id}`)
    }
  }
}

const total = Object.keys(en).length
console.log(fails ? `\n${fails} localization problem(s).` : `✓ ${total} keys × 3 languages, all code keys defined, all dialogue translated.`)
process.exit(fails ? 1 : 0)
