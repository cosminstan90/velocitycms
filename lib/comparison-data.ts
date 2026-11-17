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

type PairCandidate = {
  slug: string
  publishedAt: Date | null
  fieldValues: Array<{ value: string; fieldDefinition: { fieldKey: string } }>
}

/**
 * Pura: dintre comparatiile care compara ACEEASI pereche (in orice ordine: a-vs-b sau b-vs-a), slug-ul celei publicate
 * prima (la egalitate, alfabetic). Celelalte devin duplicate si primesc canonical spre ea. null daca nu e niciuna.
 */
export function pickPrimaryComparison(candidates: PairCandidate[], slugA: string, slugB: string): string | null {
  const want = [slugA, slugB].sort().join('|')
  const same = candidates.filter((c) => {
    const get = (k: string) => c.fieldValues.find((f) => f.fieldDefinition.fieldKey === k)?.value ?? ''
    return [get(COMPARISON_KEYS.a), get(COMPARISON_KEYS.b)].sort().join('|') === want
  })
  same.sort(
    (x, y) =>
      (x.publishedAt?.getTime() ?? Infinity) - (y.publishedAt?.getTime() ?? Infinity) || x.slug.localeCompare(y.slug),
  )
  return same[0]?.slug ?? null
}

/** Slug-ul comparatiei „principale" pentru perechea data (vezi pickPrimaryComparison). Nu arunca. */
export async function getPrimaryComparisonSlug(siteId: string, slugA: string, slugB: string): Promise<string | null> {
  try {
    const rows = await prisma.post.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
        category: { slug: COMPARISON_CATEGORY, parentId: null },
        fieldValues: {
          some: { value: { in: [slugA, slugB] }, fieldDefinition: { fieldKey: { in: [COMPARISON_KEYS.a, COMPARISON_KEYS.b] } } },
        },
      },
      select: {
        slug: true,
        publishedAt: true,
        fieldValues: {
          where: { fieldDefinition: { fieldKey: { in: [COMPARISON_KEYS.a, COMPARISON_KEYS.b] } } },
          select: { value: true, fieldDefinition: { select: { fieldKey: true } } },
        },
      },
    })
    return pickPrimaryComparison(rows, slugA, slugB)
  } catch {
    return null
  }
}
