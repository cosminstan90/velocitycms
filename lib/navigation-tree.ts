import { buildPostPath } from './seo/canonical-builder'
import { categoryTotals, isGroupInNav, isSubcategoryInNav } from './category-visibility'

export type CategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  showInNav: boolean
  /** Articole PUBLICATE direct in aceasta categorie (nu si in copii). */
  postCount: number
}

export type NavChild = { id: string; name: string; slug: string; href: string }
export type NavGroup = NavChild & { children: NavChild[] }

function byOrderThenName(a: CategoryRow, b: CategoryRow): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.name.localeCompare(b.name, 'ro')
}

/**
 * Meniul arata doar categorii cu continut suficient (praguri in lib/category-visibility.ts): o subcategorie apare
 * de la CATEGORY_NAV_MIN articole publicate direct in ea; un grup apare cand totalul lui (propriu + subcategorii)
 * ajunge la CATEGORY_INDEX_MIN, adica atunci cand pagina lui este indexabila.
 */
export function buildNavTree(rows: CategoryRow[]): NavGroup[] {
  const visible = rows.filter((r) => r.showInNav)
  const roots = visible.filter((r) => r.parentId === null).sort(byOrderThenName)

  const groups: NavGroup[] = roots.map((root) => ({
    id: root.id,
    name: root.name,
    slug: root.slug,
    href: `/${root.slug}`,
    children: visible
      .filter((r) => r.parentId === root.id && isSubcategoryInNav(r.postCount))
      .sort(byOrderThenName)
      .map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        href: `/${root.slug}/${child.slug}`,
      })),
  }))

  // Totalul unui grup include si subcategoriile ascunse din meniu (showInNav fals sau sub prag).
  const totals = categoryTotals(rows.map((r) => ({ id: r.id, parentId: r.parentId, directCount: r.postCount })))
  return groups.filter((g) => isGroupInNav(totals.get(g.id) ?? 0))
}

export type RecentPostRow = {
  title: string
  slug: string
  category: { slug: string; parent: { slug: string } | null } | null
}

export type GroupPost = { title: string; href: string }

export function toGroupPost(row: RecentPostRow): GroupPost {
  return { title: row.title, href: buildPostPath({ slug: row.slug }, row.category) }
}

