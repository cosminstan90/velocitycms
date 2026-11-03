/**
 * JSON-LD pentru pagini de lista (etichete, index A-Z): CollectionPage + ItemList + BreadcrumbList.
 * URL-urile din `items` sunt cai relative la site (ex. /caini/rase/beagle).
 */
export interface CollectionSchemaArgs {
  siteUrl: string
  siteName: string
  path: string
  name: string
  description: string
  items: Array<{ name: string; path: string }>
  crumbs?: Array<{ name: string; path: string }>
}

export function buildCollectionSchema(args: CollectionSchemaArgs): Record<string, unknown> {
  const base = args.siteUrl.replace(/\/+$/, '')
  const abs = (p: string) => (p.startsWith('http') ? p : `${base}${p.startsWith('/') ? '' : '/'}${p}`)
  const url = abs(args.path)
  const crumbs = [{ name: args.siteName, path: '/' }, ...(args.crumbs ?? []), { name: args.name, path: args.path }]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: c.name,
          item: abs(c.path),
        })),
      },
      {
        '@type': 'CollectionPage',
        '@id': `${url}#collectionpage`,
        url,
        name: args.name,
        description: args.description,
        inLanguage: 'ro-RO',
        isPartOf: { '@id': `${base}/#website` },
        ...(args.items.length
          ? {
              mainEntity: {
                '@type': 'ItemList',
                numberOfItems: args.items.length,
                itemListElement: args.items.map((it, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: it.name,
                  url: abs(it.path),
                })),
              },
            }
          : {}),
      },
    ],
  }
}
