import type { FieldItem, SplitFields } from '@/lib/fields'

export type CompareRowKind = 'spec' | 'behavior'

export type CompareRow = {
  key: string
  label: string
  kind: CompareRowKind
  a: string | null
  b: string | null
  /** True cand ambele au valoare si sunt egale (dupa normalizare): randul nu aduce o diferenta. */
  same: boolean
}

function norm(v: string): string {
  return v.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

function merge(kind: CompareRowKind, listA: FieldItem[], listB: FieldItem[]): CompareRow[] {
  const bByKey = new Map(listB.map((i) => [i.key, i]))
  const seen = new Set<string>()
  const rows: CompareRow[] = []
  // Ordinea: mai intai campurile fisei A (deja sortate dupa sortOrder), apoi cele doar din B.
  for (const item of [...listA, ...listB]) {
    if (seen.has(item.key)) continue
    seen.add(item.key)
    const a = listA.find((i) => i.key === item.key)?.value ?? null
    const b = bByKey.get(item.key)?.value ?? null
    rows.push({ key: item.key, label: item.label, kind, a, b, same: a !== null && b !== null && norm(a) === norm(b) })
  }
  return rows
}

/** Randurile tabelului comparativ, generate din specificatiile si profilul comportamental al celor doua fise. */
export function buildComparisonRows(a: SplitFields, b: SplitFields): CompareRow[] {
  return [...merge('spec', a.specs, b.specs), ...merge('behavior', a.behavior, b.behavior)]
}

/** Randurile in care valorile difera sau lipsesc la unul dintre animale: pe acestea se bazeaza „Diferențe care contează". */
export function differingRows(rows: CompareRow[]): CompareRow[] {
  return rows.filter((r) => !r.same && (r.a !== null || r.b !== null))
}
