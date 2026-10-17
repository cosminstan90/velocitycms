/**
 * Extrage intrebarile frecvente din documentul TipTap (nodurile `faqBlock`).
 * Acelasi contract ca buildFAQSchema / parseFAQItems: `attrs.items` poate fi
 * array sau sir JSON; raman doar intrarile cu intrebare si raspuns nevide.
 */

export type FaqItem = { question: string; answer: string }

const MAX_DEPTH = 50

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function readItems(raw: unknown): FaqItem[] {
  let items: unknown = raw
  if (typeof raw === 'string') {
    try {
      items = JSON.parse(raw)
    } catch {
      return []
    }
  }
  if (!Array.isArray(items)) return []
  const out: FaqItem[] = []
  for (const entry of items) {
    if (!isRecord(entry)) continue
    const { question, answer } = entry
    if (typeof question !== 'string' || typeof answer !== 'string') continue
    const q = question.trim()
    const a = answer.trim()
    if (q && a) out.push({ question: q, answer: a })
  }
  return out
}

function walk(node: unknown, depth: number, out: FaqItem[]): void {
  if (depth > MAX_DEPTH || !isRecord(node)) return
  if (node.type === 'faqBlock') {
    const attrs = node.attrs
    if (isRecord(attrs)) out.push(...readItems(attrs.items))
  }
  const content = node.content
  if (Array.isArray(content)) {
    for (const child of content) walk(child, depth + 1, out)
  }
}

export function extractFaqItems(doc: unknown): FaqItem[] {
  const out: FaqItem[] = []
  walk(doc, 0, out)
  return out
}
