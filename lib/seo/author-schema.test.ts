import { describe, it, expect } from 'vitest'
import { buildAuthorSchema, truncateAtWord } from './author-schema'

describe('truncateAtWord', () => {
  it('lasa neschimbat textul scurt', () => {
    expect(truncateAtWord('Scurt si bun.')).toBe('Scurt si bun.')
  })
  it('taie la limita de cuvant, sub 155 de caractere', () => {
    const text = 'cuvant '.repeat(60)
    const out = truncateAtWord(text)
    expect(out.length).toBeLessThanOrEqual(155)
    expect(out.endsWith('…')).toBe(true)
    expect(out).not.toMatch(/cuvan…$/)
  })
})

describe('buildAuthorSchema', () => {
  const author = { name: 'Redacția DiVet', slug: 'redactia', title: 'Echipa editorială DiVet', bio: 'Bio.', photo: null, website: null }

  it('produce ProfilePage cu Person ca mainEntity', () => {
    const s = buildAuthorSchema(author, 'https://divet.ro/', 'DiVet') as any
    expect(s['@type']).toBe('ProfilePage')
    expect(s.url).toBe('https://divet.ro/autor/redactia')
    expect(s.mainEntity['@type']).toBe('Person')
    expect(s.mainEntity.jobTitle).toBe('Echipa editorială DiVet')
    expect(s.mainEntity.sameAs).toBeUndefined()
  })

  it('accepta doar site-uri http(s) in sameAs', () => {
    const ok = buildAuthorSchema({ ...author, website: 'https://exemplu.ro' }, 'https://divet.ro', 'DiVet') as any
    const bad = buildAuthorSchema({ ...author, website: 'javascript:alert(1)' }, 'https://divet.ro', 'DiVet') as any
    expect(ok.mainEntity.sameAs).toEqual(['https://exemplu.ro'])
    expect(bad.mainEntity.sameAs).toBeUndefined()
  })
})
