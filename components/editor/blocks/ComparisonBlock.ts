import { Node, mergeAttributes } from '@tiptap/core'

export interface ComparisonRow {
  label: string
  values: string[]
  highlight: boolean
}

export interface ComparisonBlockAttrs {
  title: string
  headers: string[]
  rows: ComparisonRow[]
}

export const ComparisonBlock = Node.create({
  name: 'comparisonBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: { default: '' },
      headers: {
        default: ['Opțiunea A', 'Opțiunea B'],
        parseHTML: (el) => { try { return JSON.parse(el.getAttribute('data-headers') ?? '[]') } catch { return [] } },
        renderHTML: (attrs) => ({ 'data-headers': JSON.stringify(attrs.headers) }),
      },
      rows: {
        default: [{ label: '', values: ['', ''], highlight: false }],
        parseHTML: (el) => { try { return JSON.parse(el.getAttribute('data-rows') ?? '[]') } catch { return [] } },
        renderHTML: (attrs) => ({ 'data-rows': JSON.stringify(attrs.rows) }),
      },
    }
  },

  parseHTML() { return [{ tag: 'div[data-type="comparison-block"]' }] },

  renderHTML({ HTMLAttributes }) {
    const headers: string[] = HTMLAttributes['data-headers']
      ? JSON.parse(HTMLAttributes['data-headers']) : []
    const rows: ComparisonRow[] = HTMLAttributes['data-rows']
      ? JSON.parse(HTMLAttributes['data-rows']) : []

    const thead = `<thead><tr><th></th>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>`
    const tbody = `<tbody>${rows.map((row) => {
      const rowStyle = row.highlight ? 'background:rgba(34,197,94,0.1);font-weight:600;' : ''
      const cells = row.values.map((v) => `<td>${v}</td>`).join('')
      return `<tr style="${rowStyle}"><td><strong>${row.label}</strong></td>${cells}</tr>`
    }).join('')}</tbody>`

    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'comparison-block', class: 'comparison-block' }),
      ['div', { innerHTML:
        `<p><strong>${HTMLAttributes.title}</strong></p>` +
        `<table style="width:100%;border-collapse:collapse;">${thead}${tbody}</table>`
      }],
    ]
  },

  addCommands() {
    return {
      insertComparison: () => ({ commands }: any) =>
        commands.insertContent({
          type: 'comparisonBlock',
          attrs: { title: '', headers: ['Opțiunea A', 'Opțiunea B'], rows: [{ label: '', values: ['', ''], highlight: false }] },
        }),
    } as any
  },
})
