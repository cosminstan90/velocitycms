import { buildPostPath } from './seo/canonical-builder'

export type CategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  showInNav: boolean
}

export type NavChild = { id: string; name: string; slug: string; href: string }
export type NavGroup = NavChild & { children: NavChild[] }

function byOrderThenName(a: CategoryRow, b: CategoryRow): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.name.localeCompare(b.name, 'ro')
}

export function buildNavTree(rows: CategoryRow[]): NavGroup[] {
  const visible = rows.filter((r) => r.showInNav)
  const roots = visible.filter((r) => r.parentId === null).sort(byOrderThenName)

  return roots.map((root) => ({
    id: root.id,
    name: root.name,
    slug: root.slug,
    href: `/${root.slug}`,
    children: visible
      .filter((r) => r.parentId === root.id)
      .sort(byOrderThenName)
      .map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        href: `/${root.slug}/${child.slug}`,
      })),
  }))
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

/** Grupul activ pentru o categorie data prin slug (grup sau subcategorie). Un slug de subcategorie
 *  repetat in mai multe grupuri se rezolva la primul grup; paginile noi trimit direct grupul. */
export function findActiveGroupSlug(groups: NavGroup[], activeCategory?: string | null): string | null {
  if (!activeCategory) return null
  const root = groups.find((g) => g.slug === activeCategory)
  if (root) return root.slug
  const parent = groups.find((g) => g.children.some((c) => c.slug === activeCategory))
  return parent ? parent.slug : null
}
