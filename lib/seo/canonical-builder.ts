/**
 * Canonical URL builder for VelocityCMS.
 * Centralizes URL construction and respects post.canonicalUrl for cross-posting.
 */

export interface CanonicalPost {
  slug: string
  canonicalUrl?: string | null
}

export interface CanonicalCategory {
  slug: string
  parent?: { slug: string } | null
}

export interface CanonicalSite {
  siteUrl: string
}

/**
 * Build the canonical URL for a post.
 * - If post.canonicalUrl is set, return it as-is (supports cross-posting / syndication).
 * - Posts without a category are under /blog/[slug].
 * - Posts with a top-level category: /[categorySlug]/[postSlug].
 * - Posts with a subcategory: /[parentSlug]/[categorySlug]/[postSlug].
 */
export function buildCanonicalUrl(
  post: CanonicalPost,
  site: CanonicalSite,
  category?: CanonicalCategory | null
): string {
  if (post.canonicalUrl) return post.canonicalUrl

  const base = site.siteUrl.replace(/\/$/, '')

  if (!category) return `${base}/blog/${post.slug}`
  if (category.parent) return `${base}/${category.parent.slug}/${category.slug}/${post.slug}`
  return `${base}/${category.slug}/${post.slug}`
}

/**
 * Build the canonical URL for a category listing page.
 */
export function buildCategoryUrl(
  category: CanonicalCategory,
  siteUrl: string
): string {
  const base = siteUrl.replace(/\/$/, '')
  if (category.parent) return `${base}/${category.parent.slug}/${category.slug}`
  return `${base}/${category.slug}`
}

/**
 * Build the canonical URL for a static page.
 */
export function buildPageUrl(slug: string, siteUrl: string): string {
  return `${siteUrl.replace(/\/$/, '')}/${slug}`
}
