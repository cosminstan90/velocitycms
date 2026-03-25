import { Node, mergeAttributes } from '@tiptap/core'

export interface HowToStep {
  name: string
  text: string
  image?: string
}

export interface HowToBlockAttrs {
  title: string
  description: string
  tools: string
  steps: HowToStep[]
}

export const HowToBlock = Node.create({
  name: 'howToBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title:       { default: '' },
      description: { default: '' },
      tools:       { default: '' },
      steps: {
        default: [{ name: '', text: '' }],
        parseHTML: (el) => { try { return JSON.parse(el.getAttribute('data-steps') ?? '[]') } catch { return [] } },
        renderHTML: (attrs) => ({ 'data-steps': JSON.stringify(attrs.steps) }),
      },
    }
  },

  parseHTML() { return [{ tag: 'div[data-type="howto-block"]' }] },

  renderHTML({ HTMLAttributes }) {
    const steps: HowToStep[] = HTMLAttributes['data-steps']
      ? JSON.parse(HTMLAttributes['data-steps']) : []

    const stepsHtml = steps
      .map((s, i) =>
        `<li itemscope itemprop="step" itemtype="https://schema.org/HowToStep">` +
        `<strong itemprop="name">${i + 1}. ${s.name}</strong>` +
        `<span itemprop="text"> — ${s.text}</span>` +
        (s.image ? `<img src="${s.image}" alt="${s.name}" itemprop="image" />` : '') +
        `</li>`
      )
      .join('')

    const toolsHtml = HTMLAttributes.tools
      ? `<p><strong>Instrumente necesare:</strong> ${HTMLAttributes.tools}</p>` : ''

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'howto-block',
        itemscope: '', itemtype: 'https://schema.org/HowTo',
        class: 'howto-block',
      }),
      ['div', { innerHTML:
        `<h3 itemprop="name">${HTMLAttributes.title}</h3>` +
        `<p itemprop="description">${HTMLAttributes.description}</p>` +
        toolsHtml +
        `<ol itemprop="step">${stepsHtml}</ol>`
      }],
    ]
  },

  addCommands() {
    return {
      insertHowTo: () => ({ commands }: any) =>
        commands.insertContent({
          type: 'howToBlock',
          attrs: { title: '', description: '', tools: '', steps: [{ name: '', text: '' }] },
        }),
    } as any
  },
})

export function generateHowToSchema(attrs: HowToBlockAttrs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: attrs.title,
    description: attrs.description,
    ...(attrs.tools && { tool: attrs.tools.split(',').map((t) => ({ '@type': 'HowToTool', name: t.trim() })) }),
    step: attrs.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image && { image: s.image }),
    })),
  }
}
