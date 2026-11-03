import { describe, it, expect } from 'vitest'
import { urgencyLevel, parseBreedList, matchBreeds, healthArticlesForBreed, type BreedCandidate } from './health'

const labrador: BreedCandidate = {
  title: 'Labrador Retriever: caracteristici, îngrijire și sănătate',
  slug: 'labrador-rasa-caini-caracteristici',
  href: '/caini/rase/labrador-rasa-caini-caracteristici',
}
const beagle: BreedCandidate = { title: 'Beagle', slug: 'beagle', href: '/caini/rase/beagle' }
const german: BreedCandidate = { title: 'Ciobănesc German', slug: 'ciobanesc-german', href: '/caini/rase/ciobanesc-german' }

describe('urgencyLevel', () => {
  it('maps the three seeded options, diacritics-insensitive', () => {
    expect(urgencyLevel('Monitorizare acasă')).toBe('low')
    expect(urgencyLevel('Consult veterinar în 24–48 h')).toBe('medium')
    expect(urgencyLevel('Urgență imediată')).toBe('high')
    expect(urgencyLevel('urgenta imediata')).toBe('high')
  })
  it('returns null for anything else', () => {
    expect(urgencyLevel('')).toBeNull()
    expect(urgencyLevel('Fierbinte')).toBeNull()
    expect(urgencyLevel(undefined)).toBeNull()
  })
})

describe('parseBreedList', () => {
  it('splits on commas, semicolons and dots, trims and de-duplicates', () => {
    expect(parseBreedList('Labrador, Beagle; labrador ,  Ciobănesc German')).toEqual(['Labrador', 'Beagle', 'Ciobănesc German'])
  })
  it('handles empty input', () => {
    expect(parseBreedList('')).toEqual([])
    expect(parseBreedList(null)).toEqual([])
  })
})

describe('matchBreeds', () => {
  const all = [labrador, beagle, german]
  it('matches by slug, short title and slug prefix, ignoring diacritics', () => {
    expect(matchBreeds(['Beagle'], all)).toEqual([{ title: 'Beagle', href: '/caini/rase/beagle' }])
    expect(matchBreeds(['ciobanesc german'], all)).toHaveLength(1)
    expect(matchBreeds(['Ciobănesc German'], all)).toHaveLength(1)
    expect(matchBreeds(['Labrador'], all)[0].href).toBe(labrador.href)
    expect(matchBreeds(['Labrador Retriever'], all)[0].href).toBe(labrador.href)
  })
  it('does not link names without a published breed article', () => {
    expect(matchBreeds(['Rottweiler'], all)).toEqual([])
  })
  it('does not match a partial word', () => {
    expect(matchBreeds(['Lab'], all)).toEqual([])
  })
  it('returns each breed once', () => {
    expect(matchBreeds(['Beagle', 'beagle'], all)).toHaveLength(1)
  })
})

describe('healthArticlesForBreed', () => {
  it('lists health articles that name the breed', () => {
    const articles = [
      { title: 'Displazia de șold', href: '/sanatate/boli/displazia-de-sold', breeds: ['Labrador', 'Ciobănesc German'] },
      { title: 'Otita externă', href: '/sanatate/boli/otita', breeds: ['Beagle'] },
    ]
    expect(healthArticlesForBreed(labrador, articles)).toEqual([{ title: 'Displazia de șold', href: '/sanatate/boli/displazia-de-sold' }])
    expect(healthArticlesForBreed(beagle, articles).map((a) => a.title)).toEqual(['Otita externă'])
  })
})
