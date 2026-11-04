import { prisma } from '@/lib/prisma'
import { pickRelated, RELATED_FIELD_KEYS, type RelatedSubject } from '@/lib/related'

/** Articolele din aceasta categorie radacina nu sunt „inrudite" cu fisele (au blocuri proprii). */
const EXCLUDED_ROOT = 'comparatie'
/** Cate articole recente intra in calcul; suficient pentru sute de fise. */
const CANDIDATE_POOL = 300

export type RelatedPost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | null
  featuredImageId: string | null
  featuredImage: { url: string; altText: string | null } | null
  author: null
  category: { name: string; slug: string; parent: { name: string; slug: string } | null } | null
}

/**
 * Articolele inrudite pentru `current`, alese dupa scorul din lib/related.ts. Nu arunca: la eroare de baza de date
 * intoarce o lista goala, iar pagina se randeaza fara bloc.
 */
export async function getRelatedPosts(siteId: string, current: RelatedSubject, limit = 6): Promise<RelatedPost[]> {
  try {
    const rows = await prisma.post.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
        noIndex: false,
        id: { not: current.id },
        NOT: { category: { slug: EXCLUDED_ROOT, parentId: null } },
      },
      orderBy: { publishedAt: 'desc' },
      take: CANDIDATE_POOL,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        publishedAt: true,
        featuredImageId: true,
        category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
        tags: { select: { tag: { select: { slug: true } } } },
        fieldValues: {
          where: { fieldDefinition: { fieldKey: { in: [...RELATED_FIELD_KEYS] } } },
          select: { value: true, fieldDefinition: { select: { fieldKey: true } } },
        },
      },
    })

    const candidates = rows.map((r) => ({
      row: r,
      id: r.id,
      title: r.title,
      groupSlug: r.category?.parent?.slug ?? r.category?.slug ?? null,
      subSlug: r.category?.parent ? r.category.slug : null,
      tagSlugs: r.tags.map((t) => t.tag.slug),
      fields: Object.fromEntries(r.fieldValues.map((v) => [v.fieldDefinition.fieldKey, v.value])),
      publishedAt: r.publishedAt,
    }))

    const picked = pickRelated(current, candidates, limit).map((p) => p.item.row)

    const imageIds = picked.map((p) => p.featuredImageId).filter((id): id is string => !!id)
    const media = imageIds.length
      ? await prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true, altText: true } })
      : []
    const mediaById = new Map(media.map((m) => [m.id, m]))

    return picked.map((p) => {
      const image = p.featuredImageId ? mediaById.get(p.featuredImageId) : undefined
      return {
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        publishedAt: p.publishedAt,
        featuredImageId: p.featuredImageId,
        featuredImage: image ? { url: image.url, altText: image.altText ?? null } : null,
        author: null,
        category: p.category ? { name: p.category.name, slug: p.category.slug, parent: p.category.parent ?? null } : null,
      }
    })
  } catch {
    return []
  }
}
