/**
 * Articole inrudite, calculate la randare (fara scriere in baza de date).
 *
 * Scorul este SIMETRIC (daca A il alege pe B, B il alege pe A, cu exceptia bonusului de recenta), ca legaturile
 * sa fie bidirectionale. Excluderile (articolul curent, nepublicate, comparatii) se fac in incarcatorul de date.
 */

export type RelatedSubject = {
  id: string
  /** Slug-ul grupului (radacina) si al subcategoriei. */
  groupSlug: string | null
  subSlug: string | null
  tagSlugs: string[]
  /** Valorile campurilor folosite la potrivire (talie, specie, habitat, dieta). */
  fields: Record<string, string | undefined>
  publishedAt: Date | string | null
}

export const RELATED_FIELD_KEYS = ['talie', 'specie', 'habitat', 'dieta'] as const

const W = {
  tag: 3,
  tagCap: 9,
  sameSub: 4,
  sameGroup: 1,
  field: 1,
  fieldCap: 3,
  recent: 0.5,
}
const RECENT_DAYS = 60

function norm(v: string | undefined): string {
  return (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()
}

export function relatedScore(current: RelatedSubject, other: RelatedSubject, now: Date = new Date()): number {
  if (current.id === other.id) return 0
  let score = 0

  const mine = new Set(current.tagSlugs)
  const sharedTags = other.tagSlugs.filter((t) => mine.has(t)).length
  score += Math.min(sharedTags * W.tag, W.tagCap)

  if (current.groupSlug && current.groupSlug === other.groupSlug) {
    score += W.sameGroup
    if (current.subSlug && current.subSlug === other.subSlug) score += W.sameSub
  }

  let sharedFields = 0
  for (const key of RELATED_FIELD_KEYS) {
    const a = norm(current.fields[key])
    if (a && a === norm(other.fields[key])) sharedFields++
  }
  score += Math.min(sharedFields * W.field, W.fieldCap)

  if (other.publishedAt) {
    const ageDays = (now.getTime() - new Date(other.publishedAt).getTime()) / 86_400_000
    if (ageDays >= 0 && ageDays <= RECENT_DAYS) score += W.recent
  }
  return score
}

export type RelatedPick<T extends RelatedSubject> = { item: T; score: number }

/**
 * Cele mai bune `limit` articole pentru `current`, cu scor strict pozitiv; egalitatile se rezolva dupa recenta,
 * apoi alfabetic (determinist).
 */
export function pickRelated<T extends RelatedSubject & { title: string }>(
  current: RelatedSubject,
  candidates: T[],
  limit = 6,
  now: Date = new Date(),
): RelatedPick<T>[] {
  return candidates
    .map((item) => ({ item, score: relatedScore(current, item, now) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const ta = a.item.publishedAt ? new Date(a.item.publishedAt).getTime() : 0
      const tb = b.item.publishedAt ? new Date(b.item.publishedAt).getTime() : 0
      if (tb !== ta) return tb - ta
      return a.item.title.localeCompare(b.item.title, 'ro')
    })
    .slice(0, limit)
}
