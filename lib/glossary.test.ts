import { describe, it, expect } from 'vitest'
import { GLOSSARY, sortedGlossary, initialOf, glossaryAnchor } from './glossary'
import { autolinkGlossary } from './glossary-autolink'

describe('glossary data', () => {
  it('has unique slugs and terms', () => {
    expect(new Set(GLOSSARY.map((t) => t.slug)).size).toBe(GLOSSARY.length)
    expect(new Set(GLOSSARY.map((t) => t.term.toLowerCase())).size).toBe(GLOSSARY.length)
    for (const t of GLOSSARY) expect(t.slug, t.term).toMatch(/^[a-z0-9-]+$/)
  })

  it('keeps definitions short, in Romanian prose, without doses or absolute claims', () => {
    for (const t of GLOSSARY) {
      const words = t.definition.split(/\s+/).length
      expect(words, t.term).toBeGreaterThanOrEqual(10)
      expect(words, t.term).toBeLessThanOrEqual(60)
      expect(t.definition, t.term).not.toMatch(/\b\d+\s?(mg|ml|g|kg)\b|\bsigur\b|\bgarantat|\b100\s?%/i)
    }
  })

  it('only cites https sources', () => {
    for (const t of GLOSSARY) if (t.source) expect(t.source.href, t.term).toMatch(/^https:\/\//)
  })

  it('sorts alphabetically in Romanian and groups by an ASCII initial', () => {
    const sorted = sortedGlossary()
    expect(sorted[0].term.localeCompare(sorted[1].term, 'ro')).toBeLessThanOrEqual(0)
    expect(initialOf('Ștefan')).toBe('S')
    expect(initialOf('Ectoparaziți')).toBe('E')
    expect(initialOf('9x')).toBe('#')
    expect(glossaryAnchor({ slug: 'zoonoza' })).toBe('/glosar#zoonoza')
  })
})

describe('autolinkGlossary', () => {
  const terms = GLOSSARY
  const intro = '<p>Introducere fără termeni speciali.</p>'

  it('links the FIRST occurrence of a term in normal text, once', () => {
    const out = autolinkGlossary(`${intro}<p>O zoonoză este o boală. Altă zoonoză apare rar.</p>`, terms)
    expect(out.match(/<a href="\/glosar#zoonoza"/g)).toHaveLength(1)
    expect(out).toContain('O <a href="/glosar#zoonoza" data-glossary="zoonoza">zoonoză</a> este')
  })

  it('matches inflected forms and keeps the original casing', () => {
    const out = autolinkGlossary(`${intro}<p>Căpușele sunt Ectoparaziții cei mai frecvenți.</p>`, terms)
    expect(out).toContain('data-glossary="ectoparaziti">Ectoparaziții</a>')
  })

  it('does not link inside the first paragraph, headings, links, tables, emphasis or FAQ summaries', () => {
    const html =
      '<p>Primul paragraf cu zoonoză.</p>' +
      '<h2>Zoonoză în titlu</h2>' +
      '<p><a href="/x">zoonoză deja link</a></p>' +
      '<table><tr><td>zoonoză în tabel</td></tr></table>' +
      '<p><em>zoonoză</em> în italic</p>' +
      '<details><summary>zoonoză în întrebare</summary></details>'
    expect(autolinkGlossary(html, terms)).toBe(html)
  })

  it('only matches whole words (no partial matches inside longer words)', () => {
    const html = `${intro}<p>Termenul superendemicitate nu este un cuvânt-cheie, la fel ca antiendemic.</p>`
    expect(autolinkGlossary(html, terms)).toBe(html)
  })

  it('does not link terms that are not marked autolink', () => {
    const html = `${intro}<p>Un omnivor mănâncă de toate.</p>`
    expect(autolinkGlossary(html, terms)).toBe(html)
  })

  it('stops at the maximum number of links', () => {
    const html = `${intro}<p>zoonoză.</p><p>endemic.</p><p>hibernare.</p><p>bioluminescență.</p><p>brahicefalic.</p><p>teobromină.</p>`
    const out = autolinkGlossary(html, terms, 3)
    expect(out.match(/data-glossary=/g)).toHaveLength(3)
  })

  it('leaves HTML untouched when there is nothing to link or the input is empty', () => {
    expect(autolinkGlossary('', terms)).toBe('')
    expect(autolinkGlossary(`${intro}<p>Text obișnuit.</p>`, terms)).toBe(`${intro}<p>Text obișnuit.</p>`)
  })

  it('keeps the markup valid: one added <a> per link, same text content', () => {
    const html = `${intro}<p>Vaccinurile core și vaccinurile non-core diferă.</p>`
    const out = autolinkGlossary(html, terms)
    expect(out.replace(/<[^>]+>/g, '')).toBe(html.replace(/<[^>]+>/g, ''))
    expect((out.match(/<a /g) ?? []).length).toBe((out.match(/<\/a>/g) ?? []).length)
  })
})

describe('autolinkGlossary: several terms in one text segment', () => {
  const intro = '<p>Introducere fără termeni.</p>'

  it('links each distinct term once, in order, without overlapping', () => {
    const out = autolinkGlossary(`${intro}<p>O zoonoză, apoi ectoparaziții și vaccinurile core; altă zoonoză.</p>`, GLOSSARY)
    expect(out.match(/data-glossary="[^"]+"/g)).toEqual(['data-glossary="zoonoza"', 'data-glossary="ectoparaziti"', 'data-glossary="vaccin-core"'])
    expect(out.replace(/<[^>]+>/g, '')).toBe(`Introducere fără termeni.O zoonoză, apoi ectoparaziții și vaccinurile core; altă zoonoză.`)
  })

  it('does not exceed the limit inside one segment', () => {
    const out = autolinkGlossary(`${intro}<p>zoonoză, endemic, hibernare, bioluminescență, brahicefalic.</p>`, GLOSSARY, 2)
    expect(out.match(/data-glossary=/g)).toHaveLength(2)
  })
})
