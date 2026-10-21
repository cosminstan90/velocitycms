/**
 * Redirects for legacy URLs (the old /{group}/{slug} structure, before
 * /{group}/{subgroup}/{slug}).
 */
import { prisma } from '@/lib/prisma'
import { buildPostPath } from '@/lib/seo/canonical-builder'

/**
 * Explicit alias map: old path -> new path. Easy to extend: add a line.
 * An alias is applied only when its target exists (published post or
 * category) in the active site; otherwise the request stays a 404.
 */
export const LEGACY_ALIASES: Readonly<Record<string, string>> = {
  '/caini/bichon-frise': '/caini/rase/bichon-frise-rasa-caini-caracteristici',
  '/caini/labrador-retriever': '/caini/rase/labrador-rasa-caini-caracteristici',
  '/caini/golden-retriever': '/caini/rase/golden-retriever-caracteristici-temperament',
  '/caini/ciobanesti': '/caini/rase',
  '/caini/caini-mari': '/caini/rase',
  '/caini/caini-mici': '/caini/rase',
  '/caini/caini-medii': '/caini/rase',
  '/caini/caini-de-paza': '/caini/rase',
  '/caini/caini-agresivi': '/caini/rase',
  '/caini/caini-de-lupta': '/caini/rase',
  '/caini/caini-inteligenti': '/caini/rase',
  '/caini/caini-de-vanatoare': '/caini/rase',
}

/** Pure lookup in the explicit alias map (trailing slash / case tolerant). */
export function legacyAliasFor(path: string): string | null {
  const key = path.replace(/\/+$/, '').toLowerCase() || '/'
  return Object.prototype.hasOwnProperty.call(LEGACY_ALIASES, key) ? LEGACY_ALIASES[key] : null
}

/** True when `path` (/group/sub or /group/sub/slug) is a live category or published post. */
async function targetExists(siteId: string, path: string): Promise<boolean> {
  const parts = path.split('/').filter(Boolean)
  if (parts.length === 2) {
    const [group, sub] = parts
    const cat = await prisma.category.findFirst({
      where: { siteId, slug: sub, parent: { slug: group, parentId: null } },
      select: { id: true },
    })
    if (cat) return true
    const post = await prisma.post.findFirst({
      where: { siteId, slug: sub, status: 'PUBLISHED', category: { slug: group, parentId: null } },
      select: { id: true },
    })
    return !!post
  }
  if (parts.length === 3) {
    const [group, sub, slug] = parts
    const post = await prisma.post.findFirst({
      where: { siteId, slug, status: 'PUBLISHED', category: { slug: sub, parent: { slug: group, parentId: null } } },
      select: { id: true },
    })
    return !!post
  }
  return false
}

/**
 * Returns the new path for a legacy /{group}/{slug}, or null (-> 404).
 * 1. exactly one published post with that slug in a subcategory of the group;
 * 2. otherwise the explicit alias, if its target exists.
 */
export async function findLegacyRedirect(args: {
  siteId: string
  group: string
  slug: string
}): Promise<string | null> {
  const { siteId, group, slug } = args

  const posts = await prisma.post.findMany({
    where: {
      siteId,
      slug,
      status: 'PUBLISHED',
      category: { parent: { slug: group, parentId: null } },
    },
    select: { slug: true, category: { select: { slug: true, parent: { select: { slug: true } } } } },
    take: 2,
  })
  if (posts.length === 1 && posts[0].category?.parent) {
    const c = posts[0].category
    return buildPostPath({ slug: posts[0].slug }, { slug: c.slug, parent: { slug: c.parent!.slug } })
  }
  if (posts.length > 1) return null

  const alias = legacyAliasFor(`/${group}/${slug}`)
  if (alias && (await targetExists(siteId, alias))) return alias
  return null
}
