import { prisma } from '@/lib/prisma'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import { getCategoryContent } from '@/lib/category-content'

export type SiloCategoryRow = { id: string; name: string; slug: string; parentId: string | null; sortOrder: number; showInNav: boolean }
export type SiloPostRow = { title: string; slug: string; category: { slug: string; parent: { slug: string } | null } | null }

export type SiloLink = { title: string; href: string }

/** O subcategorie cu articole, prezentata in interiorul silo-ului grupului. */
export type SiloSub = { name: string; href: string; count: number; latest: SiloLink[] }

/** Alt grup (silo vecin), cu fraza de legatura si cateva subcategorii in care sa intri direct. */
export type SiloRelated = { name: string; href: string; count: number; blurb: string; subs: Array<{ name: string; href: string; count: number }> }

export type Silo = {
  /** Subcategoriile grupului (pe pagina de grup) sau surorile subcategoriei curente (pe pagina de subcategorie). */
  subs: SiloSub[]
  related: SiloRelated[]
}

function byOrder(a: SiloCategoryRow, b: SiloCategoryRow): number {
  return a.sortOrder !== b.sortOrder ? a.sortOrder - b.sortOrder : a.name.localeCompare(b.name, 'ro')
}

/** Titlul scurt al unui articol, fara sufixul descriptiv ("Labrador - Rasa de caini" -> "Labrador"). */
export function shortTitle(title: string): string {
  return title.split(/\s[-–—]\s/)[0]?.trim() || title
}

/**
 * Functie pura: construieste legaturile silo pentru un grup (groupSlug) sau o subcategorie (groupSlug + subSlug).
 * Nu returneaza niciodata un link catre o categorie fara articole publicate.
 */
export function buildSilo(
  categories: SiloCategoryRow[],
  countById: Map<string, number>,
  posts: SiloPostRow[],
  groupSlug: string,
  subSlug?: string,
): Silo {
  const visible = categories.filter((c) => c.showInNav)
  const roots = visible.filter((c) => c.parentId === null).sort(byOrder)
  const group = roots.find((r) => r.slug === groupSlug)
  const count = (id: string) => countById.get(id) ?? 0

  const kidsOf = (rootId: string) => visible.filter((c) => c.parentId === rootId).sort(byOrder)
  const latestFor = (rootSlug: string, subSlugValue: string, n: number): SiloLink[] =>
    posts
      .filter((p) => p.category?.slug === subSlugValue && p.category.parent?.slug === rootSlug)
      .slice(0, n)
      .map((p) => ({ title: shortTitle(p.title), href: buildPostPath({ slug: p.slug }, p.category) }))

  let subs: SiloSub[] = []
  if (group) {
    subs = kidsOf(group.id)
      .filter((k) => count(k.id) > 0 && k.slug !== subSlug)
      .map((k) => ({ name: k.name, href: `/${group.slug}/${k.slug}`, count: count(k.id), latest: latestFor(group.slug, k.slug, subSlug ? 2 : 3) }))
  }

  const groupTotal = (rootId: string) => count(rootId) + kidsOf(rootId).reduce((s, k) => s + count(k.id), 0)
  const contentKey = subSlug ? `${groupSlug}/${subSlug}` : groupSlug
  const declared = getCategoryContent(contentKey)?.related ?? []

  const toRelated = (root: SiloCategoryRow, blurb: string): SiloRelated => ({
    name: root.name,
    href: `/${root.slug}`,
    count: groupTotal(root.id),
    blurb,
    subs: kidsOf(root.id)
      .filter((k) => count(k.id) > 0)
      .slice(0, 3)
      .map((k) => ({ name: k.name, href: `/${root.slug}/${k.slug}`, count: count(k.id) })),
  })

  const related: SiloRelated[] = []
  for (const r of declared) {
    const root = roots.find((x) => x.slug === r.group)
    if (root && root.slug !== groupSlug && groupTotal(root.id) > 0) related.push(toRelated(root, r.blurb))
  }
  // Fara continut definit (sau cu legaturi inca goale): completeaza cu cele mai bogate grupuri vecine.
  if (related.length < 2) {
    const rest = roots
      .filter((x) => x.slug !== groupSlug && !related.some((r) => r.href === `/${x.slug}`) && groupTotal(x.id) > 0)
      .sort((a, b) => groupTotal(b.id) - groupTotal(a.id))
    for (const root of rest) {
      if (related.length >= 3) break
      related.push(toRelated(root, `Mai multe articole despre ${root.name.toLowerCase()}.`))
    }
  }

  return { subs, related: related.slice(0, 3) }
}

export async function getSilo(siteId: string, groupSlug: string, subSlug?: string): Promise<Silo> {
  try {
    const [categories, counts, posts] = await Promise.all([
      prisma.category.findMany({ where: { siteId }, select: { id: true, name: true, slug: true, parentId: true, sortOrder: true, showInNav: true } }),
      prisma.post.groupBy({ by: ['categoryId'], where: { siteId, status: 'PUBLISHED', categoryId: { not: null } }, _count: { _all: true } }),
      prisma.post.findMany({
        where: { siteId, status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 200,
        select: { title: true, slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
      }),
    ])
    return buildSilo(categories, new Map(counts.map((c) => [c.categoryId as string, c._count._all])), posts, groupSlug, subSlug)
  } catch {
    return { subs: [], related: [] }
  }
}
