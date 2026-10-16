import { describe, it, expect } from 'vitest'
import { extractToc, addHeadingIds, readingTimeMinutes } from './article-html'

describe('extractToc', () => {
  it('extrage H2 si construieste id-ul din text', () => {
    expect(extractToc('<h2>Istoric și origine</h2><p>x</p>')).toEqual([
      { text: 'Istoric și origine', id: 'istoric-si-origine' },
    ])
  })

  it('taie tag-urile interioare din text', () => {
    expect(extractToc('<h2>Aspect <em>fizic</em></h2>')).toEqual([{ text: 'Aspect fizic', id: 'aspect-fizic' }])
  })

  it('suporta un H2 pe mai multe linii', () => {
    expect(extractToc('<h2>\n  Îngrijire\n</h2>')).toEqual([{ text: 'Îngrijire', id: 'ingrijire' }])
  })

  it('normalizeaza diacriticele, atat cu virgula (ș ț) cat si cu sedila (ş ţ)', () => {
    expect(extractToc('<h2>Ținută și Şcoală Ţară</h2>')[0].id).toBe('tinuta-si-scoala-tara')
  })

  it('decodeaza entitatile in text', () => {
    expect(extractToc('<h2>Câini &amp; pisici</h2>')).toEqual([{ text: 'Câini & pisici', id: 'caini-pisici' }])
  })

  it('foloseste id-ul existent al H2', () => {
    expect(extractToc('<h2 id="custom">Titlu</h2>')).toEqual([{ text: 'Titlu', id: 'custom' }])
  })

  it('accepta id cu ghilimele simple', () => {
    expect(extractToc("<h2 class=\"a\" id='alt'>Titlu</h2>")[0].id).toBe('alt')
  })

  it('H2 cu acelasi text primesc sufix numeric', () => {
    const toc = extractToc('<h2>Hrană</h2><h2>Hrană</h2><h2>Hrană</h2>')
    expect(toc.map((e) => e.id)).toEqual(['hrana', 'hrana-2', 'hrana-3'])
  })

  it('sare peste H2 fara text sau fara caractere utilizabile in id', () => {
    expect(extractToc('<h2></h2><h2>???</h2><h2>  </h2>')).toEqual([])
  })

  it('ignora H3 si alte taguri', () => {
    expect(extractToc('<h3>Sub</h3><h1>Mare</h1>')).toEqual([])
  })
})

describe('addHeadingIds', () => {
  it('adauga id pe H2 fara id', () => {
    expect(addHeadingIds('<h2>Istoric</h2>')).toBe('<h2 id="istoric">Istoric</h2>')
  })

  it('pastreaza un id existent si celelalte atribute', () => {
    const html = '<h2 class="x" id="a">Titlu</h2>'
    expect(addHeadingIds(html)).toBe(html)
  })

  it('produce aceleasi id-uri ca extractToc, inclusiv la dubluri', () => {
    const html = '<h2>Hrană</h2><p>a</p><h2 id="fix">Altceva</h2><h2>Hrană</h2>'
    const toc = extractToc(html).map((e) => e.id)
    const withIds = addHeadingIds(html)
    const found = [...withIds.matchAll(/<h2[^>]*\sid="([^"]+)"/g)].map((m) => m[1])
    expect(found).toEqual(toc)
  })

  it('suporta un H2 pe mai multe linii', () => {
    expect(addHeadingIds('<h2>\n Îngrijire\n</h2>')).toBe('<h2 id="ingrijire">\n Îngrijire\n</h2>')
  })

  it('nu modifica alte taguri si lasa un H2 fara id utilizabil neschimbat', () => {
    expect(addHeadingIds('<h3>Sub</h3><h2>???</h2>')).toBe('<h3>Sub</h3><h2>???</h2>')
  })
})

describe('readingTimeMinutes', () => {
  const words = (n: number) => `<p>${Array.from({ length: n }, () => 'cuvant').join(' ')}</p>`

  it('200 de cuvinte = 1 minut, 201 = 2', () => {
    expect(readingTimeMinutes(words(200))).toBe(1)
    expect(readingTimeMinutes(words(201))).toBe(2)
  })

  it('minim 1, inclusiv pentru gol', () => {
    expect(readingTimeMinutes('')).toBe(1)
    expect(readingTimeMinutes('<p></p>')).toBe(1)
  })

  it('ignora tag-urile la numarare', () => {
    expect(readingTimeMinutes('<p><strong>unu</strong> <em>doi</em></p>')).toBe(1)
  })
})
