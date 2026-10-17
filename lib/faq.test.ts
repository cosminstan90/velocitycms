import { describe, it, expect } from 'vitest'
import { extractFaqItems } from './faq'

const block = (items: unknown) => ({ type: 'faqBlock', attrs: { items } })
const doc = (...content: unknown[]) => ({ type: 'doc', content })

describe('extractFaqItems', () => {
  it('intrari invalide -> lista goala', () => {
    expect(extractFaqItems(null)).toEqual([])
    expect(extractFaqItems(undefined)).toEqual([])
    expect(extractFaqItems('text')).toEqual([])
    expect(extractFaqItems(42)).toEqual([])
    expect(extractFaqItems({})).toEqual([])
  })

  it('un faqBlock cu items ca array', () => {
    const out = extractFaqItems(doc(block([{ question: 'Cât trăiește?', answer: '10–12 ani.' }])))
    expect(out).toEqual([{ question: 'Cât trăiește?', answer: '10–12 ani.' }])
  })

  it('items ca sir JSON', () => {
    const out = extractFaqItems(doc(block(JSON.stringify([{ question: 'A?', answer: 'B.' }]))))
    expect(out).toEqual([{ question: 'A?', answer: 'B.' }])
  })

  it('JSON invalid -> lista goala, fara exceptie', () => {
    expect(extractFaqItems(doc(block('{nu e json')))).toEqual([])
  })

  it('elimina intrarile fara intrebare sau fara raspuns si taie spatiile', () => {
    const out = extractFaqItems(
      doc(block([{ question: '  Q1?  ', answer: ' A1 ' }, { question: '', answer: 'x' }, { question: 'y', answer: '  ' }])),
    )
    expect(out).toEqual([{ question: 'Q1?', answer: 'A1' }])
  })

  it('ignora valorile care nu sunt text', () => {
    expect(extractFaqItems(doc(block([{ question: 5, answer: 'x' }, { question: 'ok?', answer: 'da' }])))).toEqual([
      { question: 'ok?', answer: 'da' },
    ])
  })

  it('gaseste blocuri imbricate si le concateneaza in ordinea documentului', () => {
    const nested = { type: 'blockquote', content: [block([{ question: 'Imbricat?', answer: 'Da.' }])] }
    const out = extractFaqItems(doc(block([{ question: 'Primul?', answer: '1' }]), nested, block([{ question: 'Ultimul?', answer: '3' }])))
    expect(out.map((i) => i.question)).toEqual(['Primul?', 'Imbricat?', 'Ultimul?'])
  })

  it('documente fara faqBlock -> lista goala', () => {
    expect(extractFaqItems(doc({ type: 'paragraph', content: [{ type: 'text', text: 'salut' }] }))).toEqual([])
  })
})
