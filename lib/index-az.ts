export const INDEX_LETTERS: readonly string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export type IndexItem = { title: string; href: string }
export type IndexGroup<T extends IndexItem = IndexItem> = { letter: string; items: T[] }

const OTHER = '#'

export function initialOf(title: string): string {
  const first = Array.from(title.trim())[0]
  if (!first) return OTHER
  const base = first.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
  return INDEX_LETTERS.includes(base) ? base : OTHER
}

export function groupByInitial<T extends IndexItem>(items: T[]): IndexGroup<T>[] {
  const map = new Map<string, T[]>()
  for (const it of items) {
    const letter = initialOf(it.title)
    const list = map.get(letter)
    if (list) list.push(it)
    else map.set(letter, [it])
  }
  return [...INDEX_LETTERS, OTHER]
    .filter((letter) => map.has(letter))
    .map((letter) => ({
      letter,
      items: map.get(letter)!.sort((a, b) => a.title.localeCompare(b.title, 'ro')),
    }))
}
