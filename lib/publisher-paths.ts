export type PublicPathInput = {
  categorySlug?: string | null
  subCategorySlug?: string | null
  postSlug: string
}

/**
 * Calea publica a unui articol. Reflecta rutele din app/(frontend):
 *   /blog/[slug]                      fara categorie
 *   /[slug]/[subSlug]                 categorie radacina
 *   /[slug]/[subSlug]/[articleSlug]   categorie radacina + subcategorie
 */
export function buildPublicPath({ categorySlug, subCategorySlug, postSlug }: PublicPathInput): string {
  if (!categorySlug) return `/blog/${postSlug}`
  if (!subCategorySlug) return `/${categorySlug}/${postSlug}`
  return `/${categorySlug}/${subCategorySlug}/${postSlug}`
}

/** Numele afisat al unei categorii create automat dintr-un slug. */
export function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
