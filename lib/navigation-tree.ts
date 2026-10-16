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
