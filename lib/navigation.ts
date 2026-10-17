import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { buildNavTree, toGroupPost, type GroupPost, type NavGroup, type RecentPostRow } from '@/lib/navigation-tree'

export type { NavGroup, NavChild, GroupPost } from '@/lib/navigation-tree'

export const NAVIGATION_TAG = 'navigation'

export function getNavigation(siteId: string): Promise<NavGroup[]> {
  return unstable_cache(
    async () => {
      const rows = await prisma.category.findMany({
        where: { siteId },
        select: { id: true, name: true, slug: true, parentId: true, sortOrder: true, showInNav: true },
      })
      return buildNavTree(rows)
    },
    ['divet-nav', siteId],
    { revalidate: 1800, tags: [NAVIGATION_TAG] },
  )()
}

export const POSTS_TAG = 'posts'
const RECENT_PER_GROUP = 6

/** Cele mai recente articole publicate din fiecare grup (radacina + subcategoriile ei), fara cache. */
export async function fetchRecentPostsByGroup(
  siteId: string,
  groupIds: string[],
): Promise<Record<string, GroupPost[]>> {
  const entries = await Promise.all(
    groupIds.map(async (groupId) => {
      const rows: RecentPostRow[] = await prisma.post.findMany({
        where: {
          siteId,
          status: 'PUBLISHED',
          category: { OR: [{ id: groupId }, { parentId: groupId }] },
        },
        orderBy: { publishedAt: 'desc' },
        take: RECENT_PER_GROUP,
        select: {
          title: true,
          slug: true,
          category: { select: { slug: true, parent: { select: { slug: true } } } },
        },
      })
      return [groupId, rows.map(toGroupPost)] as const
    }),
  )
  return Object.fromEntries(entries)
}

/** Aceeasi lista, cu cache; se invalideaza la modificarea categoriilor si la publicarea articolelor. */
export function getRecentPostsByGroup(siteId: string, groupIds: string[]): Promise<Record<string, GroupPost[]>> {
  return unstable_cache(
    () => fetchRecentPostsByGroup(siteId, groupIds),
    ['divet-nav-recent', siteId, ...groupIds],
    { revalidate: 1800, tags: [NAVIGATION_TAG, POSTS_TAG] },
  )()
}

/** Navigatia + articolele recente pe grup pentru site-ul activ; null daca nu exista site sau baza nu raspunde. */
export async function getActiveNavigation(): Promise<{
  groups: NavGroup[]
  recentByGroup: Record<string, GroupPost[]>
} | null> {
  try {
    const site = await prisma.site.findFirst({ where: { isActive: true }, select: { id: true } })
    if (!site) return null
    const groups = await getNavigation(site.id)
    const recentByGroup = await getRecentPostsByGroup(site.id, groups.map((g) => g.id))
    return { groups, recentByGroup }
  } catch {
    return null
  }
}
