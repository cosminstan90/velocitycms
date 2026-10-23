import { HOME_FAQ } from '@/lib/home-content'

type SchemaPost = { title: string; url: string; imageUrl?: string | null }

/**
 * JSON-LD pentru homepage: Organization, WebSite (cu SearchAction), CollectionPage cu ItemList
 * si FAQPage. FAQPage foloseste exact aceleasi texte ca blocul vizibil (HOME_FAQ).
 */
export function buildHomeSchema(args: {
  base: string
  siteName: string
  description: string
  logoUrl?: string | null
  posts: SchemaPost[]
}) {
  const { base, siteName, description, logoUrl, posts } = args
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: siteName,
        url: base,
        ...(logoUrl ? { logo: { '@type': 'ImageObject', url: logoUrl } } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: siteName,
        description,
        inLanguage: 'ro-RO',
        publisher: { '@id': `${base}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${base}/cautare?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'CollectionPage',
        '@id': `${base}/#webpage`,
        url: base,
        name: `${siteName} — Enciclopedia animalelor din România`,
        description,
        inLanguage: 'ro-RO',
        isPartOf: { '@id': `${base}/#website` },
        about: { '@type': 'Thing', name: 'Animale' },
        ...(posts.length
          ? {
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: posts.map((p, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  url: p.url,
                  name: p.title,
                  ...(p.imageUrl ? { image: p.imageUrl } : {}),
                })),
              },
            }
          : {}),
      },
      {
        '@type': 'FAQPage',
        '@id': `${base}/#faq`,
        mainEntity: HOME_FAQ.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  }
}
