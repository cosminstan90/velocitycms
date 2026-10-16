export const RATING_SCALE = [
  'Foarte scăzut',
  'Scăzut',
  'Mediu',
  'Ridicat',
  'Foarte ridicat',
] as const

export type Rating = (typeof RATING_SCALE)[number]

/** Normalizeaza pentru comparare: fara diacritice, fara spatii in plus, minuscule. */
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

const LOOKUP = new Map<string, number>(RATING_SCALE.map((label, i) => [normalize(label), (i + 1) * 20]))

/**
 * Converteste o valoare de rating in procentul de umplere a barei.
 * Continutul e generat de AI si poate pierde diacriticele, deci comparam normalizat.
 * Returneaza null pentru orice valoare care nu e pe scala — bara nu se afiseaza.
 */
export function ratingToPercent(value: string): number | null {
  return LOOKUP.get(normalize(value)) ?? null
}
