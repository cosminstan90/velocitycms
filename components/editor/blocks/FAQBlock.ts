import { Node, mergeAttributes } from '@tiptap/core'

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQBlockAttrs {
  items: FAQItem[]
}

export const FAQBlock = Node.create({
  name: 'faqBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      items: {
        default: [{ question: '', answer: '' }],
        parseHTML: (el) => {
          try { return JSON.parse(el.getAttribute('data-items') ?? '[]') } catch { return [] }
        },
        renderHTML: (attrs) => ({ 'data-items': JSON.stringify(attrs.items) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="faq-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const items: FAQItem[] = HTMLAttributes['data-items']
      ? JSON.parse(HTMLAttributes['data-items'])
      : []
    const inner = items
      .map(
        (item) =>
          `<div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">` +
          `<h3 itemprop="name">${item.question}</h3>` +
          `<div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">` +
          `<p itemprop="text">${item.answer}</p></div></div>`
      )
      .join('')
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'faq-block',
        'data-faq': 'true',
        itemscope: '',
        itemtype: 'https://schema.org/FAQPage',
        class: 'faq-block',
      }),
      ['div', { innerHTML: inner }],
    ]
  },

  addCommands() {
    return {
      insertFAQBlock:
        () =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: 'faqBlock',
            attrs: { items: [{ question: '', answer: '' }] },
          })
        },
    } as any
  },
})

export function generateFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
