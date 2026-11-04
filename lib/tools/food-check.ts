/**
 * „E periculos pentru animalul meu?": căutare printre substanțele documentate în articolele DiVet de sănătate.
 * Conține DOAR substanțe periculoase, cu rezumat și link spre articolul cu surse. Lipsa unei substanțe din listă
 * nu înseamnă că este sigură: rezultatul „negăsit” trimite la medicul veterinar, nu spune „este sigur".
 */

export type Species = 'caine' | 'pisica'

export type FoodEntry = {
  id: string
  label: string
  /** Termeni de căutare, fără diacritice, minuscule. */
  terms: string[]
  species: Species[]
  summary: string
  /** Slug-ul articolului din /sanatate/substante-toxice/. */
  articleSlug: string
}

export const FOOD_ENTRIES: readonly FoodEntry[] = [
  {
    id: 'ciocolata',
    label: 'Ciocolata',
    terms: ['ciocolata', 'cacao', 'bomboane de ciocolata', 'praji', 'napolitane', 'nutella'],
    species: ['caine'],
    summary:
      'Conține teobromină și cafeină, care îi pot intoxica pe câini. Cu cât ciocolata este mai închisă, cu atât riscul este mai mare. Sună imediat la veterinar, chiar dacă animalul pare în regulă.',
    articleSlug: 'ciocolata-si-cainii',
  },
  {
    id: 'struguri',
    label: 'Struguri și stafide',
    terms: ['struguri', 'strugure', 'stafide', 'stafida', 'uva'],
    species: ['caine'],
    summary:
      'Pot fi toxici pentru câini, iar mecanismul nu este pe deplin elucidat. Orice ingestie se tratează ca potențială urgență; sună la veterinar.',
    articleSlug: 'strugurii-si-stafidele-la-caini',
  },
  {
    id: 'xilitol',
    label: 'Xilitol (îndulcitor)',
    terms: ['xilitol', 'guma', 'guma de mestecat', 'indulcitor', 'fara zahar', 'unt de arahide'],
    species: ['caine'],
    summary:
      'Îndulcitor din gumă de mestecat, dulciuri fără zahăr și unele produse; periculos pentru câini. Sună imediat la veterinar dacă a mâncat produse care îl conțin.',
    articleSlug: 'xilitolul-si-cainii',
  },
  {
    id: 'ceapa-usturoi',
    label: 'Ceapă și usturoi',
    terms: ['ceapa', 'usturoi', 'praz', 'arpagic', 'ceapa verde'],
    species: ['caine', 'pisica'],
    summary:
      'Pot afecta globulele roșii la câini și la pisici, inclusiv când sunt gătite sau în alimente procesate. Discută cu medicul veterinar după orice ingestie.',
    articleSlug: 'ceapa-si-usturoiul-la-caini-si-pisici',
  },
  {
    id: 'crini',
    label: 'Crini',
    terms: ['crin', 'crini', 'crinul', 'lilium'],
    species: ['pisica'],
    summary:
      'Foarte periculoși pentru pisici: chiar polenul sau apa din vază pot fi un risc. Este o urgență, sună imediat la veterinar.',
    articleSlug: 'crinii-si-pisicile',
  },
]

export function normalizeQuery(q: string): string {
  return q
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Intrările care se potrivesc cu textul căutat pentru specia aleasă. Interogările sub 3 caractere nu returnează nimic.
 * `species: null` înseamnă ambele specii.
 */
export function searchFood(query: string, species: Species | null): FoodEntry[] {
  const q = normalizeQuery(query)
  if (q.length < 3) return []
  return FOOD_ENTRIES.filter(
    (e) =>
      (species === null || e.species.includes(species)) &&
      e.terms.some((t) => t.includes(q) || (q.length >= 4 && q.includes(t))),
  )
}
