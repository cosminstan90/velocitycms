import { Node, mergeAttributes } from '@tiptap/core'

export interface ReviewBlockAttrs {
  itemName: string
  rating: number
  reviewerName: string
  reviewText: string
  pros: string[]
  cons: string[]
  verdict: string
}

function starHtml(rating: number) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty)
}

export const ReviewBlock = Node.create({
  name: 'reviewBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      itemName:     { default: '' },
      rating:       { default: 5 },
      reviewerName: { default: '' },
      reviewText:   { default: '' },
      pros: {
        default: [],
        parseHTML: (el) => { try { return JSON.parse(el.getAttribute('data-pros') ?? '[]') } catch { return [] } },
        renderHTML: (attrs) => ({ 'data-pros': JSON.stringify(attrs.pros) }),
      },
      cons: {
        default: [],
        parseHTML: (el) => { try { return JSON.parse(el.getAttribute('data-cons') ?? '[]') } catch { return [] } },
        renderHTML: (attrs) => ({ 'data-cons': JSON.stringify(attrs.cons) }),
      },
      verdict: { default: '' },
    }
  },

  parseHTML() { return [{ tag: 'div[data-type="review-block"]' }] },

  renderHTML({ HTMLAttributes }) {
    const pros: string[] = HTMLAttributes['data-pros'] ? JSON.parse(HTMLAttributes['data-pros']) : []
    const cons: string[] = HTMLAttributes['data-cons'] ? JSON.parse(HTMLAttributes['data-cons']) : []
    const rating = HTMLAttributes.rating ?? 5

    const prosHtml = pros.length
      ? `<div><strong>✅ Pro:</strong><ul>${pros.map((p) => `<li>${p}</li>`).join('')}</ul></div>` : ''
    const consHtml = cons.length
      ? `<div><strong>❌ Contra:</strong><ul>${cons.map((c) => `<li>${c}</li>`).join('')}</ul></div>` : ''

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'review-block',
        itemscope: '', itemtype: 'https://schema.org/Review',
        class: 'review-block',
        style: 'border:1px solid #334155;border-radius:8px;padding:20px;margin:16px 0;',
      }),
      ['div', { innerHTML:
        `<h3 itemprop="name">${HTMLAttributes.itemName}</h3>` +
        `<div itemprop="reviewRating" itemscope itemtype="https://schema.org/Rating">` +
        `<meta itemprop="ratingValue" content="${rating}" />` +
        `<meta itemprop="bestRating" content="5" />` +
        `<span style="font-size:1.4em;color:#f59e0b;">${starHtml(rating)}</span> ` +
        `<strong>${rating}/5</strong></div>` +
        `<p itemprop="reviewBody">${HTMLAttributes.reviewText}</p>` +
        prosHtml + consHtml +
        (HTMLAttributes.verdict ? `<p><strong>Verdict:</strong> ${HTMLAttributes.verdict}</p>` : '') +
        `<p><small itemprop="author" itemscope itemtype="https://schema.org/Person">` +
        `<span itemprop="name">${HTMLAttributes.reviewerName}</span></small></p>`
      }],
    ]
  },

  addCommands() {
    return {
      insertReview: () => ({ commands }: any) =>
        commands.insertContent({
          type: 'reviewBlock',
          attrs: { itemName: '', rating: 5, reviewerName: '', reviewText: '', pros: [], cons: [], verdict: '' },
        }),
    } as any
  },
})

export function generateReviewSchema(attrs: ReviewBlockAttrs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: { '@type': 'Thing', name: attrs.itemName },
    reviewRating: { '@type': 'Rating', ratingValue: attrs.rating, bestRating: 5 },
    author: { '@type': 'Person', name: attrs.reviewerName },
    reviewBody: attrs.reviewText,
  }
}
