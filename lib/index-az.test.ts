import { describe, it, expect } from 'vitest'
import { initialOf, groupByInitial, INDEX_LETTERS } from './index-az'

const item = (title: string, href = '/x') => ({ title, href })

describe('initialOf', () => {
  it('prima litera, majuscula', () => {
    expect(initialOf('bichon maltez')).toBe('B')
  })

  it('diacriticele merg sub litera de baza (virgula si sedila)', () => {
    expect(initialOf('Ștefan cel Mare')).toBe('S')
    expect(initialOf('Şoim')).toBe('S')
    expect(initialOf('Țestoasă')).toBe('T')
    expect(initialOf('Ţap')).toBe('T')
    expect(initialOf('Ăst')).toBe('A')
    expect(initialOf('Îngrijire')).toBe('I')
    expect(initialOf('Câine')).toBe('C')
  })

  it('ignora spatiile de la inceput', () => {
    expect(initialOf('  Labrador')).toBe('L')
  })

  it('cifre, simboluri sau text gol merg sub #', () => {
    expect(initialOf('3 pisici')).toBe('#')
    expect(initialOf('"Citat"')).toBe('#')
    expect(initialOf('')).toBe('#')
    expect(initialOf('   ')).toBe('#')
  })
})

describe('groupByInitial', () => {
  it('grupeaza pe litera si sorteaza literele A-Z', () => {
    const groups = groupByInitial([item('Pisică'), item('Bichon'), item('Maine Coon')])
    expect(groups.map((g) => g.letter)).toEqual(['B', 'M', 'P'])
  })

  it('sorteaza articolele din grup dupa titlu, cu colatie romaneasca', () => {
    const groups = groupByInitial([item('Cum alegi'), item('Ciobănesc German'), item('Calendar'), item('Câine')])
    const titles = groups.find((g) => g.letter === 'C')!.items.map((i) => i.title)
    expect(titles).toEqual(['Calendar', 'Câine', 'Ciobănesc German', 'Cum alegi'])
  })

  it('pune # la sfarsit', () => {
    const groups = groupByInitial([item('3 pisici'), item('Zebra'), item('Albina')])
    expect(groups.map((g) => g.letter)).toEqual(['A', 'Z', '#'])
  })

  it('diacriticele raman in grupul literei de baza, laolalta cu restul', () => {
    const groups = groupByInitial([item('Șarpe'), item('Soare'), item('Țap')])
    expect(groups.map((g) => g.letter)).toEqual(['S', 'T'])
    expect(groups[0].items).toHaveLength(2)
  })

  it('intrare goala -> lista goala', () => {
    expect(groupByInitial([])).toEqual([])
  })

  it('INDEX_LETTERS are cele 26 de litere', () => {
    expect(INDEX_LETTERS).toHaveLength(26)
    expect(INDEX_LETTERS[0]).toBe('A')
    expect(INDEX_LETTERS[25]).toBe('Z')
  })
})
