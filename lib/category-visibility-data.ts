import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { isCategoryIndexable } from '@/lib/category-visibility'

/**
 * `robots` pentru o pagina de categorie: `noindex, follow` cand are sub CATEGORY_INDEX_MIN articole publicate
 * (grupul numara si subcategoriile). Nu arunca: la eroare de baza de date pagina ramane indexabila (comportamentul vechi).
 */
export async function categoryRobots(categoryId: string, isGroup: boolean): Promise<Metadata['robots'] | undefined> {
  try {
    const count = await prisma.post.count({
      where: {
        status: 'PUBLISHED',
        noIndex: false,
        category: isGroup ? { OR: [{ id: categoryId }, { parentId: categoryId }] } : { id: categoryId },
      },
    })
    return isCategoryIndexable(count) ? undefined : { index: false, follow: true }
  } catch {
    return undefined
  }
}
