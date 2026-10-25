export type AuthorSchemaInput = {
  name: string | null
  slug: string | null
  title: string | null
  bio: string | null
  photo: string | null
  website: string | null
}

const META_DESC_MAX = 155

/** Taie textul la limita de cuvant, cu „…" daca a fost scurtat. */
export function truncateAtWord(text: string, max = META_DESC_MAX): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, '')}…`
}

function absolute(siteUrl: string, value: string): string {
  return /^https?:\/\//i.test(value) ? value : `${siteUrl}${value.startsWith('/') ? '' : '/'}${value}`
}

/** ProfilePage cu entitatea Person, pentru pagina /autor/[slug]. */
export function buildAuthorSchema(author: AuthorSchemaInput, siteUrl: string, siteName: string): Record<string, unknown> {
  const base = siteUrl.replace(/\/$/, '')
  const url = `${base}/autor/${author.slug}`
  const name = author.name ?? 'Autor'
  const sameAs = author.website && /^https?:\/\//i.test(author.website) ? [author.website] : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${url}/#profilepage`,
    url,
    name: `${name} | ${siteName}`,
    inLanguage: 'ro-RO',
    isPartOf: { '@id': `${base}/#website` },
    mainEntity: {
      '@type': 'Person',
      '@id': `${url}/#person`,
      name,
      url,
      ...(author.title && { jobTitle: author.title }),
      ...(author.bio && { description: author.bio }),
      ...(author.photo && { image: absolute(base, author.photo) }),
      ...(sameAs && { sameAs }),
      worksFor: { '@type': 'Organization', name: siteName, url: base },
    },
  }
}
