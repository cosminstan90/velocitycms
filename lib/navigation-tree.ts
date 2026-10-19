import { buildPostPath } from './seo/canonical-builder'

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
 * Meniul arata doar categorii cu continut: o subcategorie apare daca are >= 1 articol
 * publicat direct in ea; un grup apare daca are articole proprii sau cel putin o
 * subcategorie vizibila.
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
      .filter((r) => r.parentId === root.id && r.postCount > 0)
      .sort(byOrderThenName)
      .map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        href: `/${root.slug}/${child.slug}`,
      })),
  }))

  const postCountById = new Map(roots.map((r) => [r.id, r.postCount]))
  return groups.filter((g) => (postCountById.get(g.id) ?? 0) > 0 || g.children.length > 0)
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

