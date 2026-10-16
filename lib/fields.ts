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

export type FieldItem = { key: string; label: string; value: string }

export type FieldValueLike = {
  value: string
  fieldDefinition: { fieldKey: string; fieldLabel: string; sortOrder: number }
}

export type SplitFields = {
  tldr: string | null
  specs: FieldItem[]
  behavior: FieldItem[]
  conservation: FieldItem[]
}

/** Blocuri de sortOrder: 10 = tldr; 100-199 specificatii; 200-299 comportament; 300-399 conservare. */
export function splitFieldValues(values: FieldValueLike[]): SplitFields {
  const out: SplitFields = { tldr: null, specs: [], behavior: [], conservation: [] }
  const sorted = [...values].sort((a, b) => a.fieldDefinition.sortOrder - b.fieldDefinition.sortOrder)

  for (const v of sorted) {
    const value = v.value.trim()
    if (!value) continue
    const { fieldKey, fieldLabel, sortOrder } = v.fieldDefinition
    const item: FieldItem = { key: fieldKey, label: fieldLabel, value }

    if (fieldKey === 'tldr') out.tldr = value
    else if (sortOrder >= 100 && sortOrder < 200) out.specs.push(item)
    else if (sortOrder >= 200 && sortOrder < 300) out.behavior.push(item)
    else if (sortOrder >= 300 && sortOrder < 400) out.conservation.push(item)
    // orice alt camp custom, in afara blocurilor, e ignorat deliberat
  }
  return out
}
