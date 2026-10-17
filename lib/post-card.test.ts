import { describe, it, expect } from 'vitest'
import { toCardProps, resolveMediaUrl } from './post-card'

const base = { title: 'Labrador Retriever', slug: 'labrador-retriever' }

describe('resolveMediaUrl', () => {
  it('face absolut un URL relativ', () => {
    expect(resolveMediaUrl('/media/uploads/a.jpg', 'https://divet.ro')).toBe('https://divet.ro/media/uploads/a.jpg')
  })

  it('lasa neschimbat un URL absolut', () => {
    expect(resolveMediaUrl('https://cdn.exemplu.ro/a.jpg', 'https://divet.ro')).toBe('https://cdn.exemplu.ro/a.jpg')
  })

  it('taie slash-ul final din siteUrl', () => {
    expect(resolveMediaUrl('/media/a.jpg', 'https://divet.ro/')).toBe('https://divet.ro/media/a.jpg')
  })
})

describe('toCardProps', () => {
  it('articol intr-o subcategorie: href pe trei niveluri, kicker = numele categoriei', () => {
    const out = toCardProps(
      { ...base, category: { name: 'Rase de câini', slug: 'rase', parent: { slug: 'caini' } }, featuredImage: null },
      'https://divet.ro',
    )
    expect(out.href).toBe('/caini/rase/labrador-retriever')
    expect(out.kicker).toBe('Rase de câini')
    expect(out.title).toBe('Labrador Retriever')
  })

  it('fara categorie: /blog si fara kicker', () => {
    const out = toCardProps({ ...base, category: null, featuredImage: null }, 'https://divet.ro')
    expect(out.href).toBe('/blog/labrador-retriever')
    expect(out.kicker).toBeNull()
  })

  it('meta din campurile talie, greutate, speranta_viata', () => {
    const out = toCardProps(
      {
        ...base,
        category: null,
        featuredImage: null,
        fieldValues: [
          { value: 'Mare', fieldDefinition: { fieldKey: 'talie' } },
          { value: '10–12 ani', fieldDefinition: { fieldKey: 'speranta_viata' } },
        ],
      },
      'https://divet.ro',
    )
    expect(out.meta).toBe('Mare · 10–12 ani')
  })

  it('imaginea: URL rezolvat si alt din altText, cu titlul ca rezerva', () => {
    const withAlt = toCardProps(
      { ...base, category: null, featuredImage: { url: '/media/a.jpg', altText: 'Un labrador' } },
      'https://divet.ro',
    )
    expect(withAlt.image).toEqual({ url: 'https://divet.ro/media/a.jpg', alt: 'Un labrador' })
    const noAlt = toCardProps(
      { ...base, category: null, featuredImage: { url: '/media/a.jpg', altText: null } },
      'https://divet.ro',
    )
    expect(noAlt.image?.alt).toBe('Labrador Retriever')
  })

  it('fara imagine: image null; fara valori: meta null', () => {
    const out = toCardProps({ ...base, category: null, featuredImage: null }, 'https://divet.ro')
    expect(out.image).toBeNull()
    expect(out.meta).toBeNull()
  })
})
