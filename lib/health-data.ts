import { prisma } from '@/lib/prisma'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import {
  HEALTH_GROUP,
  HEALTH_KEYS,
  healthArticlesForBreed,
  matchBreeds,
  parseBreedList,
  type HealthLink,
} from '@/lib/health'

export type HealthLinks = {
  /** Pe un articol de sanatate: rasele predispuse care au articol publicat. */
  breeds: HealthLink[]
  /** Pe un articol-rasa: articolele de sanatate care mentioneaza rasa. */
  articles: HealthLink[]
  /** Comparatii publicate in care apare fisa (blocul „Compară cu…"). */
  comparisons?: HealthLink[]
  /** Listele filtrate in care apare fisa (blocul „Apare în"). */
  lists?: HealthLink[]
}

const EMPTY: HealthLinks = { breeds: [], articles: [] }

/** Grupurile ale caror subcategorie `rase` contine articole-rasa. */
const BREED_GROUPS = ['caini', 'pisici']

/**
 * Legaturile rasa <-> boala pentru un articol. Nu arunca: la orice eroare de baza de date pagina se
 * randeaza fara aceste legaturi.
 */
export async function getHealthLinks(args: {
  siteId: string
  postSlug: string
  postTitle: string
  groupSlug: string
  subSlug: string
  /** Valoarea campului `rase_predispuse` al articolului curent (doar pentru articolele de sanatate). */
  breedsValue?: string | null
}): Promise<HealthLinks> {
  const { siteId, groupSlug, subSlug } = args
  try {
    if (groupSlug === HEALTH_GROUP) {
      const names = parseBreedList(args.breedsValue)
      if (names.length === 0) return EMPTY
      const breeds = await prisma.post.findMany({
        where: { siteId, status: 'PUBLISHED', category: { slug: 'rase', parent: { slug: { in: BREED_GROUPS } } } },
        select: { title: true, slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
      })
      const candidates = breeds.map((b) => ({ title: b.title, slug: b.slug, href: buildPostPath({ slug: b.slug }, b.category) }))
      return { breeds: matchBreeds(names, candidates), articles: [] }
    }

    if (subSlug === 'rase' && BREED_GROUPS.includes(groupSlug)) {
      const health = await prisma.post.findMany({
        where: {
          siteId,
          status: 'PUBLISHED',
          category: { parent: { slug: HEALTH_GROUP } },
          fieldValues: { some: { fieldDefinition: { fieldKey: HEALTH_KEYS.breeds } } },
        },
        select: {
          title: true,
          slug: true,
          category: { select: { slug: true, parent: { select: { slug: true } } } },
          fieldValues: {
            where: { fieldDefinition: { fieldKey: HEALTH_KEYS.breeds } },
            select: { value: true },
          },
        },
      })
      const articles = health.map((h) => ({
        title: h.title,
        href: buildPostPath({ slug: h.slug }, h.category),
        breeds: parseBreedList(h.fieldValues[0]?.value),
      }))
      const breed = { title: args.postTitle, slug: args.postSlug, href: buildPostPath({ slug: args.postSlug }, { slug: subSlug, parent: { slug: groupSlug } }) }
      return { breeds: [], articles: healthArticlesForBreed(breed, articles) }
    }
  } catch {
    // fara legaturi
  }
  return EMPTY
}
