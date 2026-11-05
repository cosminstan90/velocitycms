/**
 * Cand o categorie (grup sau subcategorie) este „vizibila":
 *  - sub INDEX_MIN articole publicate: pagina ramane accesibila, dar `noindex, follow` si nu apare in sitemap
 *    (o pagina de categorie cu 1-2 articole este continut subtire);
 *  - de la INDEX_MIN: indexabila si in sitemap;
 *  - in meniu: un GRUP apare de la INDEX_MIN (nu linkam din meniul principal spre o pagina noindex); o
 *    SUBCATEGORIE apare de la NAV_MIN, ca mega-meniul sa aiba subcategorii cu substanta.
 * Numaratoarea unui grup include articolele subcategoriilor lui; a unei subcategorii, doar ale ei.
 */

export const CATEGORY_INDEX_MIN = 3
export const CATEGORY_NAV_MIN = 6

export function isCategoryIndexable(articleCount: number): boolean {
  return articleCount >= CATEGORY_INDEX_MIN
}

export function isGroupInNav(totalArticles: number): boolean {
  return totalArticles >= CATEGORY_INDEX_MIN
}

export function isSubcategoryInNav(articleCount: number): boolean {
  return articleCount >= CATEGORY_NAV_MIN
}

export type CountedCategory = { id: string; parentId: string | null; directCount: number }

/** Totalul pe categorie: subcategoria = numarul ei direct; grupul = al lui + al copiilor directi. */
export function categoryTotals(categories: CountedCategory[]): Map<string, number> {
  const totals = new Map<string, number>(categories.map((c) => [c.id, c.directCount]))
  for (const c of categories) {
    if (c.parentId && totals.has(c.parentId)) totals.set(c.parentId, (totals.get(c.parentId) ?? 0) + c.directCount)
  }
  return totals
}
