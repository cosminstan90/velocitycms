/**
 * Server-side HTML → Tiptap JSON converter.
 * No DOM or browser APIs required — works in Node.js API routes.
 * Handles the common HTML subset produced by SEO Publisher.
 */

type Mark = { type: string; attrs?: Record<string, unknown> }
type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: Mark[]
  text?: string
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, '\u00a0')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
}

function tagToMark(tag: string, attrsStr: string): Mark | null {
  switch (tag) {
    case 'strong':
    case 'b':
      return { type: 'bold' }
    case 'em':
    case 'i':
      return { type: 'italic' }
    case 'code':
      return { type: 'code' }
    case 'u':
      return { type: 'underline' }
    case 's':
    case 'del':
    case 'strike':
      return { type: 'strike' }
    case 'a': {
      const m = attrsStr.match(/href=["']([^"']+)["']/i)
      if (m) return { type: 'link', attrs: { href: m[1], target: '_blank' } }
      return null
    }
    default:
      return null
  }
}

/**
 * Parse inline HTML into Tiptap text/hardBreak nodes with marks.
 * Handles nesting like <strong><em>text</em></strong>.
 */
function parseInline(html: string, parentMarks: Mark[] = []): TiptapNode[] {
  const result: TiptapNode[] = []
  // Match: known inline tags | <br> | plain text runs
  const re =
    /<(strong|em|b|i|code|u|s|del|strike|a)\b([^>]*)>([\s\S]*?)<\/\1>|<br\s*\/?>|([^<]+)/gi

  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const [full, tagName, attrsStr, inner, text] = m
    if (text !== undefined) {
      const decoded = decodeEntities(text)
      if (decoded) {
        const node: TiptapNode = { type: 'text', text: decoded }
        if (parentMarks.length > 0) node.marks = [...parentMarks]
        result.push(node)
      }
    } else if (/^<br/i.test(full)) {
      result.push({ type: 'hardBreak' })
    } else if (tagName) {
      const mark = tagToMark(tagName.toLowerCase(), attrsStr || '')
      const childMarks = mark ? [...parentMarks, mark] : [...parentMarks]
      result.push(...parseInline(inner || '', childMarks))
    }
  }
  return result
}

function parseListItems(html: string): TiptapNode[] {
  const items: TiptapNode[] = []
  const re = /<li\b[^>]*>([\s\S]*?)<\/li>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const inner = m[1]
    // Check for nested lists
    const hasNestedList = /<(ul|ol)\b/i.test(inner)
    let content: TiptapNode[]
    if (hasNestedList) {
      content = parseBlocks(inner)
    } else {
      const inline = parseInline(inner)
      content = [{ type: 'paragraph', content: inline.length ? inline : [] }]
    }
    items.push({ type: 'listItem', content })
  }
  return items
}

function parseBlocks(html: string): TiptapNode[] {
  const nodes: TiptapNode[] = []

  // Matches block-level tags; uses non-greedy [\s\S]*? which works for non-self-nested tags
  const re =
    /<(h[1-6]|p|ul|ol|blockquote|pre|figure)\b([^>]*)>([\s\S]*?)<\/\1>|<hr\s*\/?>/gi

  let lastIndex = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(html)) !== null) {
    // Loose text/inline elements before this block
    if (m.index > lastIndex) {
      const fragment = html.slice(lastIndex, m.index).trim()
      if (fragment) {
        const inline = parseInline(fragment)
        if (inline.length > 0) nodes.push({ type: 'paragraph', content: inline })
      }
    }
    lastIndex = m.index + m[0].length

    if (/^<hr/i.test(m[0])) {
      nodes.push({ type: 'horizontalRule' })
      continue
    }

    const [, tagName, , inner] = m
    const tag = tagName.toLowerCase()

    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1], 10)
      const content = parseInline(inner)
      if (content.length > 0) nodes.push({ type: 'heading', attrs: { level }, content })
    } else if (tag === 'p') {
      const content = parseInline(inner)
      if (content.length > 0) nodes.push({ type: 'paragraph', content })
    } else if (tag === 'ul' || tag === 'ol') {
      const items = parseListItems(inner)
      if (items.length > 0) {
        nodes.push({ type: tag === 'ul' ? 'bulletList' : 'orderedList', content: items })
      }
    } else if (tag === 'blockquote') {
      const innerTrimmed = inner.trim()
      const hasBlocks = /<(p|h[1-6])\b/i.test(innerTrimmed)
      const content = hasBlocks
        ? parseBlocks(innerTrimmed)
        : [{ type: 'paragraph', content: parseInline(innerTrimmed) }]
      nodes.push({ type: 'blockquote', content })
    } else if (tag === 'pre') {
      const codeMatch = inner.match(/<code[^>]*>([\s\S]*?)<\/code>/i)
      const raw = codeMatch ? codeMatch[1] : inner
      const code = decodeEntities(raw.replace(/<[^>]+>/g, ''))
      nodes.push({
        type: 'codeBlock',
        attrs: { language: null },
        content: [{ type: 'text', text: code }],
      })
    }
    // figure, div — skip
  }

  // Remaining content after last block
  const remaining = html.slice(lastIndex).trim()
  if (remaining) {
    const inline = parseInline(remaining)
    if (inline.length > 0) nodes.push({ type: 'paragraph', content: inline })
  }

  return nodes
}

/**
 * Convert an HTML string to a Tiptap-compatible JSON document.
 * No DOM required — pure Node.js compatible.
 */
export function serverHtmlToTiptapJson(html: string): Record<string, unknown> {
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, '').trim()
  const blocks = parseBlocks(cleaned)
  return {
    type: 'doc',
    content: blocks.length > 0 ? blocks : [{ type: 'paragraph', content: [] }],
  }
}
