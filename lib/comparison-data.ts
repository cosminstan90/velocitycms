import { prisma } from '@/lib/prisma'
import { buildPostPath } from '@/lib/seo/canonical-builder'

export const COMPARISON_CATEGORY = 'comparatie'
export const COMPARISON_KEYS = { a: 'postA_slug', b: 'postB_slug' } as const

export type ComparedPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  featuredImageId: string | null
  href: string
  fieldValues: Array<{ value: string; fieldDefinition: { fieldKey: string; fieldLabel: string; sortOrder: number } }>
}

const select = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  featuredImageId: true,
  category: { select: { slug: true, parent: { select: { slug: true } } } },
  fieldValues: { select: { value: true, fieldDefinition: { select: { fieldKey: true, fieldLabel: true, sortOrder: true } } } },
} as const

/**
 * Cele doua fise comparate. Returneaza null daca oricare lipseste sau nu este PUBLICATA: o pagina de comparatie
 * nu se afiseaza (si nu linkeaza) niciodata spre o fisa inexistenta.
 */
export async function getComparisonPair(siteId: string, slugA: string | null, slugB: string | null) {
  if (!slugA || !slugB || slugA === slugB) return null
  const posts = await prisma.post.findMany({
    where: { siteId, status: 'PUBLISHED', slug: { in: [slugA, slugB] } },
    select,
  })
  const toCompared = (p: (typeof posts)[number]): ComparedPost => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    featuredImageId: p.featuredImageId,
    href: buildPostPath({ slug: p.slug }, p.category),
    fieldValues: p.fieldValues,
  })
  const a = posts.find((p) => p.slug === slugA)
  const b = posts.find((p) => p.slug === slugB)
  return a && b ? { a: toCompared(a), b: toCompared(b) } : null
}

/** Comparatiile publicate in care apare fisa cu slug-ul dat (pentru blocul „Compară cu…" de pe fise). Nu arunca. */
export async function getComparisonsFor(siteId: string, slug: string): Promise<Array<{ title: string; href: string }>> {
  try {
    const rows = await prisma.post.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
        category: { slug: COMPARISON_CATEGORY, parentId: null },
        fieldValues: {
          some: { value: slug, fieldDefinition: { fieldKey: { in: [COMPARISON_KEYS.a, COMPARISON_KEYS.b] } } },
        },
      },
      orderBy: { publishedAt: 'desc' },
      take: 6,
      select: { title: true, slug: true },
    })
    return rows.map((r) => ({ title: r.title, href: `/${COMPARISON_CATEGORY}/${r.slug}` }))
  } catch {
    return []
  }
}
