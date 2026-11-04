/**
 * Autolink spre glosar: la PRIMA aparitie a fiecarui termen marcat `autolink`, in text normal, devine link spre
 * /glosar#<slug>. Sigur pe HTML: nu atinge text din interiorul linkurilor, titlurilor, tabelelor, listelor de
 * intrebari (summary), codului sau al primului paragraf (raspunsul direct, citat de motoarele AI).
 */
import type { GlossaryTerm } from './glossary'

const SKIP_TAGS = new Set(['a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'script', 'style', 'pre', 'code', 'button', 'summary', 'figcaption', 'em'])
const MAX_LINKS = 4

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type Matcher = { term: GlossaryTerm; re: RegExp }

function buildMatchers(terms: readonly GlossaryTerm[]): Matcher[] {
  return terms
    .filter((t) => t.autolink)
    .map((term) => {
      const forms = [term.term, ...(term.variants ?? [])].sort((a, b) => b.length - a.length).map(escapeRe)
      // \b nu merge cu diacritice: delimitam cu "nu litera/cifra" (Unicode).
      return { term, re: new RegExp(`(?<![\\p{L}\\p{N}])(${forms.join('|')})(?![\\p{L}\\p{N}])`, 'iu') }
    })
}

/**
 * @param html          HTML-ul articolului (de incredere: provine din CMS).
 * @param terms         lista de termeni (implicit toti; se filtreaza dupa `autolink`).
 * @param maxLinks      cate linkuri maximum intr-un articol.
 */
export function autolinkGlossary(html: string, terms: readonly GlossaryTerm[], maxLinks = MAX_LINKS): string {
  const matchers = buildMatchers(terms)
  if (matchers.length === 0 || !html) return html

  const done = new Set<string>()
  let added = 0
  const stack: string[] = []
  let paragraphs = 0
  let inFirstParagraph = false

  const parts = html.split(/(<[^>]+>)/)
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (part.startsWith('<')) {
      const m = part.match(/^<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)/)
      if (m) {
        const tag = m[2].toLowerCase()
        const closing = !!m[1]
        const selfClosing = /\/\s*>$/.test(part) || ['br', 'img', 'hr', 'input', 'meta', 'link'].includes(tag)
        if (tag === 'p') {
          if (!closing) {
            paragraphs++
            inFirstParagraph = paragraphs === 1
          } else if (inFirstParagraph) {
            inFirstParagraph = false
          }
        }
        if (SKIP_TAGS.has(tag) && !selfClosing) {
          if (closing) {
            const idx = stack.lastIndexOf(tag)
            if (idx >= 0) stack.splice(idx, 1)
          } else {
            stack.push(tag)
          }
        }
      }
      continue
    }
    if (stack.length > 0 || inFirstParagraph || added >= maxLinks || part.trim() === '') continue

    // Prima aparitie a fiecarui termen nelinkat inca, in textul ORIGINAL al segmentului; se aplica in ordinea pozitiilor,
    // fara suprapuneri, pana la limita articolului. (Cautarea nu ruleaza pe textul deja modificat.)
    const hits: Array<{ slug: string; index: number; text: string }> = []
    for (const { term, re } of matchers) {
      if (done.has(term.slug)) continue
      const hit = re.exec(part)
      if (hit) hits.push({ slug: term.slug, index: hit.index, text: hit[0] })
    }
    if (hits.length === 0) continue
    hits.sort((a, b) => a.index - b.index)

    let out = ''
    let cursor = 0
    for (const h of hits) {
      if (added >= maxLinks) break
      if (h.index < cursor) continue // se suprapune cu un link deja pus
      out += part.slice(cursor, h.index) + `<a href="/glosar#${h.slug}" data-glossary="${h.slug}">${h.text}</a>`
      cursor = h.index + h.text.length
      done.add(h.slug)
      added++
    }
    parts[i] = out + part.slice(cursor)
  }
  return parts.join('')
}
