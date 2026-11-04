import { prisma } from '@/lib/prisma'
import { LISTS, listAvailability, type FieldMap, type ListAvailability, type ListDefinition, type ListGroup } from '@/lib/lists'
import type { PostListItem } from '@/lib/post-card'
import { CARD_META_KEYS } from '@/lib/fields'

export type ListMember = PostListItem & { fields: FieldMap }

export type ListOverview = {
  def: ListDefinition
  availability: ListAvailability
  members: ListMember[]
}

const GROUPS: ListGroup[] = ['caini', 'pisici']

// Categoriile si fisele cer aceleasi liste la fiecare cerere: cache scurt, in memorie, per proces.
// In teste (NODE_ENV=test) cache-ul este oprit.
const CACHE_TTL_MS = process.env.NODE_ENV === 'test' ? 0 : 60_000
const cache = new Map<string, { at: number; value: ListOverview[] }>()

async function loadGroupPosts(siteId: string, group: ListGroup): Promise<ListMember[]> {
  const posts = await prisma.post.findMany({
    where: { siteId, status: 'PUBLISHED', noIndex: false, category: { slug: 'rase', parent: { slug: group } } },
    orderBy: { title: 'asc' },
    select: {
      title: true,
      slug: true,
      featuredImageId: true,
      category: { select: { name: true, slug: true, parent: { select: { slug: true } } } },
      fieldValues: { select: { value: true, fieldDefinition: { select: { fieldKey: true } } } },
    },
  })

  const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const media = imageIds.length
    ? await prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true, altText: true } })
    : []
  const mediaById = new Map(media.map((m) => [m.id, m]))

  return posts.map((p) => {
    const fields: FieldMap = {}
    for (const v of p.fieldValues) fields[v.fieldDefinition.fieldKey] = v.value
    const image = p.featuredImageId ? mediaById.get(p.featuredImageId) : undefined
    return {
      title: p.title,
      slug: p.slug,
      category: p.category,
      featuredImage: image ? { url: image.url, altText: image.altText ?? null } : null,
      fieldValues: p.fieldValues.filter((v) => (CARD_META_KEYS as readonly string[]).includes(v.fieldDefinition.fieldKey)),
      fields,
    }
  })
}

/** Toate listele cu disponibilitate si membri. Nu arunca: la eroare de baza de date intoarce o lista goala. */
export async function getListsOverview(siteId: string | null): Promise<ListOverview[]> {
  if (!siteId) return []
  const hit = cache.get(siteId)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value
  const value = await computeListsOverview(siteId)
  if (CACHE_TTL_MS > 0 && value.length > 0) cache.set(siteId, { at: Date.now(), value })
  return value
}

export type ListLink = { title: string; href: string; count: number }

/** „Ghid rapid" pentru paginile de categorie: listele DISPONIBILE ale grupului. */
export async function getQuickGuide(siteId: string | null, groupSlug: string): Promise<ListLink[]> {
  const overview = await getListsOverview(siteId)
  return overview
    .filter((o) => o.availability.available && o.def.group === groupSlug)
    .map((o) => ({ title: o.def.title, href: `/liste/${o.def.slug}`, count: o.availability.count }))
}

/** „Apare in": listele disponibile care contin fisa cu slug-ul dat. */
export async function getListsForBreed(siteId: string | null, slug: string): Promise<ListLink[]> {
  const overview = await getListsOverview(siteId)
  return overview
    .filter((o) => o.availability.available && o.members.some((m) => m.slug === slug))
    .map((o) => ({ title: o.def.title, href: `/liste/${o.def.slug}`, count: o.availability.count }))
}

async function computeListsOverview(siteId: string): Promise<ListOverview[]> {
  try {
    const byGroup = new Map<ListGroup, ListMember[]>()
    for (const g of GROUPS) byGroup.set(g, await loadGroupPosts(siteId, g))
    return LISTS.map((def) => {
      const groupPosts = byGroup.get(def.group) ?? []
      const members = groupPosts.filter((p) => def.match(p.fields))
      return { def, availability: listAvailability(def, groupPosts.map((p) => ({ fields: p.fields }))), members }
    })
  } catch {
    return []
  }
}
