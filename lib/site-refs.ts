import { prisma } from '@/lib/prisma'

export type SiteRefs = {
  categoryId?: unknown
  tagIds?: unknown
  featuredImageId?: unknown
  ogImageId?: unknown
}

/**
 * Checks that every related entity referenced in a request body belongs to `siteId`.
 * Returns the name of the first offending field (e.g. 'categoryId'), or null when all are valid.
 * Empty/null values are ignored (they clear the relation).
 */
export async function findInvalidSiteRef(siteId: string, refs: SiteRefs): Promise<string | null> {
  if (refs.categoryId) {
    const category = await prisma.category.findFirst({ where: { id: String(refs.categoryId), siteId }, select: { id: true } })
    if (!category) return 'categoryId'
  }
  if (refs.tagIds !== undefined && refs.tagIds !== null && !Array.isArray(refs.tagIds)) return 'tagIds'
  if (Array.isArray(refs.tagIds) && refs.tagIds.length > 0) {
    const ids = [...new Set(refs.tagIds.map(String))]
    const count = await prisma.tag.count({ where: { id: { in: ids }, siteId } })
    if (count !== ids.length) return 'tagIds'
  }
  for (const field of ['featuredImageId', 'ogImageId'] as const) {
    const value = refs[field]
    if (value) {
      const media = await prisma.media.findFirst({ where: { id: String(value), siteId }, select: { id: true } })
      if (!media) return field
    }
  }
  return null
}
