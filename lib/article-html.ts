export type TocEntry = { text: string; id: string }

const H2_RE = /<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi
const ID_ATTR_RE = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)')/i

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeEntities(s: string): string {
  return s.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z]+));/g, (whole, dec, hex, name) => {
    if (dec || hex) {
      const code = dec ? parseInt(dec, 10) : parseInt(hex, 16)
      try {
        return String.fromCodePoint(code)
      } catch {
        return whole
      }
    }
    return NAMED_ENTITIES[name.toLowerCase()] ?? whole
  })
}

function visibleText(innerHtml: string): string {
  return decodeEntities(innerHtml.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim()
}

function toSlug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type HeadingInfo = {
  start: number
  end: number
  attrs: string
  text: string
  id: string
  hadId: boolean
}

// Single pass over the H2 headings: both public functions use it, so ids cannot diverge.
function scanHeadings(html: string): HeadingInfo[] {
  const used = new Set<string>()
  const result: HeadingInfo[] = []

  for (const m of html.matchAll(H2_RE)) {
    const attrs = m[1] ?? ''
    const text = visibleText(m[2])
    const idMatch = ID_ATTR_RE.exec(attrs)
    const existing = idMatch ? (idMatch[1] ?? idMatch[2] ?? '') : ''

    let id: string
    let hadId = false
    if (existing) {
      id = existing
      hadId = true
      used.add(id)
    } else {
      const base = toSlug(text)
      if (!base) continue
      id = base
      for (let n = 2; used.has(id); n++) id = `${base}-${n}`
      used.add(id)
    }

    if (!text) continue
    result.push({ start: m.index!, end: m.index! + m[0].length, attrs, text, id, hadId })
  }
  return result
}

export function extractToc(html: string): TocEntry[] {
  return scanHeadings(html).map(({ text, id }) => ({ text, id }))
}

export function addHeadingIds(html: string): string {
  let out = ''
  let last = 0
  for (const h of scanHeadings(html)) {
    if (h.hadId) continue
    out += html.slice(last, h.start)
    const original = html.slice(h.start, h.end)
    const afterOpen = original.indexOf('>', 3 + h.attrs.length)
    out += `<h2${h.attrs} id="${h.id}"` + original.slice(afterOpen)
    last = h.end
  }
  return out + html.slice(last)
}

export function readingTimeMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
