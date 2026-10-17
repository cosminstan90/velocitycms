export type CategoryNode = { id: string; parentId: string | null }
export type CategoryStat = { categoryId: string | null; maxUpdatedAt: Date | null }

/**
 * Data ultimei modificari per categorie, doar pentru categoriile cu continut.
 * Un grup radacina primeste si datele copiilor sai directi.
 */
export function categoryLastModified(
  categories: CategoryNode[],
  stats: CategoryStat[],
): Map<string, Date> {
  const known = new Set(categories.map((c) => c.id))
  const out = new Map<string, Date>()

  const fold = (id: string, date: Date) => {
    const cur = out.get(id)
    if (!cur || date > cur) out.set(id, date)
  }

  for (const s of stats) {
    if (s.categoryId === null || s.maxUpdatedAt === null) continue
    if (!known.has(s.categoryId)) continue
    fold(s.categoryId, s.maxUpdatedAt)
  }

  const ownDates = new Map(out)
  for (const c of categories) {
    if (c.parentId === null || !known.has(c.parentId)) continue
    const d = ownDates.get(c.id)
    if (d) fold(c.parentId, d)
  }

  return out
}
