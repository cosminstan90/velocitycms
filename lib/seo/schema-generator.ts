/**
 * JSON-LD Schema Generator for VelocityCMS
 * Generates structured data for Articles, Pages, Categories, FAQs, HowTo, Reviews.
 */

// ─── Input types (subset of Prisma models + relations) ────────────────────────

export interface SchemaPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  contentJson: Record<string, unknown>
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: Date | string | null
  updatedAt: Date | string
  createdAt: Date | string
  author: { name: string | null; email: string } | null
  featuredImage: { url: string; altText: string | null } | null
  category: { name: string; slug: string } | null
  noIndex: boolean
  canonicalUrl: string | null
}

export interface SchemaPage {
  id: string
  title: string
  slug: string
  metaTitle: string | null
  metaDescription: string | null
  publishedAt: Date | string | null
  updatedAt: Date | string
  canonicalUrl: string | null
}

export interface SchemaCategory {
  id: string
  name: string
  slug: string
  description: string | null
  metaTitle: string | null
  metaDesc: string | null
}

export interface SchemaSite {
  siteName: string
  siteUrl: string
  defaultOgImage: string | null
}

export interface SchemaFieldValue {
  fieldDefinition: {
    fieldKey: string
    fieldLabel: string
    showInSchema: boolean
    schemaProperty: string | null
  }
  value: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined
  return new Date(d).toISOString()
}

function resolveUrl(site: SchemaSite, path: string): string {
  const base = site.siteUrl.replace(/\/$/, '')
  return path.startsWith('http') ? path : `${base}/${path.replace(/^\//, '')}`
}

// ─── Tiptap JSON block traversal ─────────────────────────────────────────────

interface TiptapNode {
  type?: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  text?: string
}

function findBlocksOfType(doc: TiptapNode, type: string): TiptapNode[] {
  const results: TiptapNode[] = []
  function walk(node: TiptapNode) {
    if (node.type === type) results.push(node)
    node.content?.forEach(walk)
  }
  walk(doc)
  return results
}

function extractFirstParagraphText(doc: TiptapNode): string {
  let text = ''
  function walk(node: TiptapNode) {
    if (text) return
    if (node.type === 'paragraph' && node.content) {
      text = node.content.map((n) => n.text ?? '').join('')
    }
    node.content?.forEach(walk)
  }
  walk(doc)
  return text
}

// ─── Individual schema builders ───────────────────────────────────────────────

function buildWebSiteSchema(site: SchemaSite) {
  return {
    '@type': 'WebSite',
    '@id': `${site.siteUrl}/#website`,
    url: site.siteUrl,
    name: site.siteName,
    inLanguage: 'ro-RO',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${site.siteUrl}/?s={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
}

function buildBreadcrumbSchema(
  site: SchemaSite,
  crumbs: Array<{ name: string; url: string }>
) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.siteName, item: site.siteUrl },
      ...crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: c.name,
        item: c.url,
      })),
    ],
  }
}

function buildArticleSchema(
  post: SchemaPost,
  site: SchemaSite,
  fieldValues?: SchemaFieldValue[]
) {
  const url = post.canonicalUrl ?? resolveUrl(site, `/${post.slug}`)
  const imageUrl = post.featuredImage?.url ?? site.defaultOgImage

  const isAnimalPost = fieldValues?.some(
    (fv) => ['breed', 'species'].includes(fv.fieldDefinition.fieldKey)
  )

  const article: Record<string, unknown> = {
    '@type': isAnimalPost ? 'Pet' : 'Article',
    '@id': `${url}/#article`,
    ...(isAnimalPost && { additionalType: 'https://schema.org/Pet' }),
    headline: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    url,
    inLanguage: 'ro-RO',
    isPartOf: { '@id': `${site.siteUrl}/#website` },
    ...(imageUrl && {
      image: { '@type': 'ImageObject', url: imageUrl, ...(post.featuredImage?.altText && { caption: post.featuredImage.altText }) },
    }),
    ...(post.author && {
      author: {
        '@type': 'Person',
        name: post.author.name ?? post.author.email,
        url: resolveUrl(site, `/author/${post.author.email}`),
      },
    }),
    publisher: {
      '@type': 'Organization',
      name: site.siteName,
      url: site.siteUrl,
      ...(site.defaultOgImage && { logo: { '@type': 'ImageObject', url: site.defaultOgImage } }),
    },
    ...(post.publishedAt && { datePublished: isoDate(post.publishedAt) }),
    dateModified: isoDate(post.updatedAt),
    ...(post.category && {
      articleSection: post.category.name,
    }),
  }

  // Additional properties from custom fields
  const schemaFields = fieldValues?.filter(
    (fv) => fv.fieldDefinition.showInSchema && fv.fieldDefinition.schemaProperty
  )
  if (schemaFields?.length) {
    article.additionalProperty = schemaFields.map((fv) => ({
      '@type': 'PropertyValue',
      name: fv.fieldDefinition.schemaProperty,
      value: fv.value,
    }))
  }

  return article
}

function buildFAQSchema(faqBlocks: TiptapNode[]) {
  interface FAQItem { question: string; answer: string }
  const items: FAQItem[] = faqBlocks.flatMap((block) => {
    const raw = block.attrs?.['items']
    if (!raw) return []
    try {
      const parsed: FAQItem[] = typeof raw === 'string' ? JSON.parse(raw) : (raw as FAQItem[])
      return parsed.filter((i) => i.question && i.answer)
    } catch { return [] }
  })

  if (!items.length) return null

  return {
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

function buildHowToSchema(howToBlocks: TiptapNode[]) {
  if (!howToBlocks.length) return null
  const block = howToBlocks[0]
  const steps: Array<{ name: string; text: string; image?: string }> = (() => {
    try {
      const raw = block.attrs?.['steps']
      return typeof raw === 'string' ? JSON.parse(raw) : (raw as typeof steps) ?? []
    } catch { return [] }
  })()

  const toolsValue = block.attrs?.['tools']
  const toolsArray = toolsValue
    ? String(toolsValue).split(',').map((t) => ({ '@type': 'HowToTool', name: t.trim() }))
    : undefined

  return {
    '@type': 'HowTo',
    name: block.attrs?.['title'] ?? '',
    description: block.attrs?.['description'] ?? undefined,
    ...(toolsArray && { tool: toolsArray }),
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.image && { image: s.image }),
    })),
  }
}

function buildReviewSchema(reviewBlocks: TiptapNode[]) {
  if (!reviewBlocks.length) return null
  const block = reviewBlocks[0]
  const attrs = block.attrs ?? {}
  const pros: string[] = (() => { try { const r = attrs['pros']; return typeof r === 'string' ? JSON.parse(r) : (r as string[]) ?? [] } catch { return [] } })()
  const cons: string[] = (() => { try { const r = attrs['cons']; return typeof r === 'string' ? JSON.parse(r) : (r as string[]) ?? [] } catch { return [] } })()

  return {
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Thing',
      name: attrs['itemName'] ?? '',
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: attrs['rating'] ?? 5,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: attrs['reviewerName'] ?? '',
    },
    reviewBody: attrs['reviewText'] ?? '',
    ...(pros.length && { positiveNotes: { '@type': 'ItemList', itemListElement: pros.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p })) } }),
    ...(cons.length && { negativeNotes: { '@type': 'ItemList', itemListElement: cons.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c })) } }),
  }
}

// ─── Main exports ─────────────────────────────────────────────────────────────

export function generatePostSchema(
  post: SchemaPost,
  site: SchemaSite,
  fieldValues?: SchemaFieldValue[]
): Record<string, unknown> {
  const doc = post.contentJson as TiptapNode

  const faqBlocks = findBlocksOfType(doc, 'faqBlock')
  const howToBlocks = findBlocksOfType(doc, 'howToBlock')
  const reviewBlocks = findBlocksOfType(doc, 'reviewBlock')

  const crumbs: Array<{ name: string; url: string }> = []
  if (post.category) {
    crumbs.push({
      name: post.category.name,
      url: resolveUrl(site, `/categorie/${post.category.slug}`),
    })
  }
  crumbs.push({ name: post.title, url: post.canonicalUrl ?? resolveUrl(site, `/${post.slug}`) })

  const graph: unknown[] = [
    buildWebSiteSchema(site),
    buildBreadcrumbSchema(site, crumbs),
    buildArticleSchema(post, site, fieldValues),
  ]

  const faq = buildFAQSchema(faqBlocks)
  if (faq) graph.push(faq)

  const howTo = buildHowToSchema(howToBlocks)
  if (howTo) graph.push(howTo)

  const review = buildReviewSchema(reviewBlocks)
  if (review) graph.push(review)

  return { '@context': 'https://schema.org', '@graph': graph }
}

export function generatePageSchema(page: SchemaPage, site: SchemaSite): Record<string, unknown> {
  const url = page.canonicalUrl ?? resolveUrl(site, `/${page.slug}`)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebSiteSchema(site),
      buildBreadcrumbSchema(site, [{ name: page.title, url }]),
      {
        '@type': 'WebPage',
        '@id': `${url}/#webpage`,
        url,
        name: page.metaTitle ?? page.title,
        description: page.metaDescription ?? undefined,
        isPartOf: { '@id': `${site.siteUrl}/#website` },
        inLanguage: 'ro-RO',
        ...(page.publishedAt && { datePublished: isoDate(page.publishedAt) }),
        dateModified: isoDate(page.updatedAt),
      },
    ],
  }
}

export function generateCategorySchema(
  category: SchemaCategory,
  site: SchemaSite
): Record<string, unknown> {
  const url = resolveUrl(site, `/categorie/${category.slug}`)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildWebSiteSchema(site),
      buildBreadcrumbSchema(site, [{ name: category.name, url }]),
      {
        '@type': 'CollectionPage',
        '@id': `${url}/#collectionpage`,
        url,
        name: category.metaTitle ?? category.name,
        description: category.metaDesc ?? category.description ?? undefined,
        isPartOf: { '@id': `${site.siteUrl}/#website` },
        inLanguage: 'ro-RO',
      },
    ],
  }
}

/** Serialize schema to an inline <script type="application/ld+json"> string */
export function schemaToScriptTag(schema: Record<string, unknown>): string {
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
}

/** Detect which schema blocks are present in contentJson */
export function detectContentBlocks(contentJson: Record<string, unknown>) {
  const doc = contentJson as TiptapNode
  return {
    hasFAQ: findBlocksOfType(doc, 'faqBlock').length > 0,
    hasHowTo: findBlocksOfType(doc, 'howToBlock').length > 0,
    hasReview: findBlocksOfType(doc, 'reviewBlock').length > 0,
    hasComparison: findBlocksOfType(doc, 'comparisonBlock').length > 0,
    hasCallout: findBlocksOfType(doc, 'calloutBlock').length > 0,
    firstParagraph: extractFirstParagraphText(doc),
  }
}
