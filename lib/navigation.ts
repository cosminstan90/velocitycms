import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { buildNavTree, type NavGroup } from '@/lib/navigation-tree'

export type { NavGroup, NavChild } from '@/lib/navigation-tree'

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
