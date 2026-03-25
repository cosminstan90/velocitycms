/**
 * Adds SpeakableSpecification and QAPage schema to an existing JSON-LD @graph.
 * Called after calculateGeoScore to enrich the schema with speakable data.
 */

interface SchemaNode {
  '@type'?: string | string[]
  [key: string]: unknown
}

interface GraphSchema {
  '@context': string
  '@graph': SchemaNode[]
}

/**
 * Merge speakable sections into the Article node of the schema,
 * and optionally upgrade FAQPage to QAPage when there are many items.
 *
 * @param existingSchema  The current JSON-LD schema object
 * @param speakableSections  Array of H2 text values to mark as speakable
 * @param faqItemCount  Number of FAQ items (if >7, upgrade to QAPage)
 * @returns  Updated schema object
 */
export function addSpeakableSchema(
  existingSchema: Record<string, unknown> | null | undefined,
  speakableSections: string[],
  faqItemCount = 0
): Record<string, unknown> {
  if (!existingSchema) return {}

  // Deep clone to avoid mutating the original
  const schema: GraphSchema = JSON.parse(JSON.stringify(existingSchema)) as GraphSchema

  if (!Array.isArray(schema['@graph'])) return schema as unknown as Record<string, unknown>

  // ── 1. Add SpeakableSpecification to Article node ──────────────────────────
  const articleNode = schema['@graph'].find((node) => {
    const t = node['@type']
    return t === 'Article' || (Array.isArray(t) && t.includes('Article'))
  })

  if (articleNode && speakableSections.length > 0) {
    // Build cssSelector list: "h2:nth-of-type(N)" for each speakable section
    const cssSelectors = speakableSections.map((_, i) => `h2:nth-of-type(${i + 1})`)

    articleNode['speakable'] = {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    }
  }

  // ── 2. Upgrade FAQPage → QAPage if >7 FAQ items ────────────────────────────
  if (faqItemCount > 7) {
    const faqNode = schema['@graph'].find((node) => {
      const t = node['@type']
      return t === 'FAQPage' || (Array.isArray(t) && t.includes('FAQPage'))
    })

    if (faqNode) {
      // QAPage uses the same mainEntity structure as FAQPage
      faqNode['@type'] = 'QAPage'

      // Wrap each acceptedAnswer in a proper Answer object with upvoteCount
      const entities = faqNode['mainEntity'] as Array<Record<string, unknown>> | undefined
      if (Array.isArray(entities)) {
        faqNode['mainEntity'] = entities.map((q) => {
          const answer = q['acceptedAnswer'] as Record<string, unknown> | undefined
          return {
            ...q,
            '@type': 'Question',
            acceptedAnswer: answer
              ? { ...answer, '@type': 'Answer', upvoteCount: 1 }
              : answer,
          }
        })
      }
    }
  }

  // ── 3. Add WebPage speakable if no Article node found ──────────────────────
  if (!articleNode && speakableSections.length > 0) {
    const webPageNode = schema['@graph'].find((node) => {
      const t = node['@type']
      return (
        t === 'WebPage' ||
        t === 'CollectionPage' ||
        (Array.isArray(t) && (t.includes('WebPage') || t.includes('CollectionPage')))
      )
    })

    if (webPageNode) {
      webPageNode['speakable'] = {
        '@type': 'SpeakableSpecification',
        cssSelector: speakableSections.map((_, i) => `h2:nth-of-type(${i + 1})`),
      }
    }
  }

  return schema as unknown as Record<string, unknown>
}

/**
 * Extract FAQ item count from a JSON-LD schema (to decide FAQPage vs QAPage).
 */
export function getFaqItemCount(schema: Record<string, unknown> | null | undefined): number {
  if (!schema) return 0
  const graph = (schema as unknown as GraphSchema)['@graph']
  if (!Array.isArray(graph)) return 0

  const faqNode = graph.find((node) => {
    const t = node['@type']
    return t === 'FAQPage' || t === 'QAPage' || (Array.isArray(t) && (t.includes('FAQPage') || t.includes('QAPage')))
  })

  if (!faqNode) return 0
  const entities = faqNode['mainEntity']
  return Array.isArray(entities) ? entities.length : 0
}
