// Picks the right language for one story line. English is the source (data/dialogue.ts);
// Telugu/Hindi come from i18n/content/dialogue.ts, keyed "<script>.<lineId>".
// Only TEXT is translated: line ids, branching and choice effects stay the same in every language,
// so switching language mid-conversation keeps the player on exactly the same line.
import type { DialogueLine, Lang } from '../types.ts'
import { DIALOGUE_HI, DIALOGUE_TE, type LineTr } from './content/dialogue.ts'

export interface LocalLine { text: string; terms: string[]; choices: string[]; notes: (string | null)[] }

const TABLE: Partial<Record<Lang, Record<string, LineTr>>> = { te: DIALOGUE_TE, hi: DIALOGUE_HI }

export function localLine(lang: Lang, scriptId: string, line: DialogueLine): LocalLine {
  const en: LocalLine = {
    text: line.text,
    terms: line.highlightedTerms ?? [],
    choices: line.choices?.map(c => c.label) ?? [],
    notes: line.choices?.map(c => c.note ?? null) ?? [],
  }
  const tr = TABLE[lang]?.[`${scriptId}.${line.id}`]
  if (!tr) return en
  return {
    text: tr.text,
    terms: tr.terms ?? [],
    choices: en.choices.map((c, i) => tr.choices?.[i] ?? c),
    notes: en.notes.map((n, i) => (n ? tr.notes?.[i] ?? n : null)),
  }
}
