import { prisma } from '@/lib/prisma'
import { HomepageDispatcher } from '@/components/frontend/TemplateDispatcher'
import type { Metadata } from 'next'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await prisma.seoSettings.findFirst({ include: { site: true } })
    if (!seo) return { title: 'Acasă' }
    return {
      title: seo.defaultMetaTitle ?? seo.siteName,
      description: seo.defaultMetaDesc ?? undefined,
      openGraph: {
        title: seo.defaultMetaTitle ?? seo.siteName,
        description: seo.defaultMetaDesc ?? undefined,
        url: seo.siteUrl,
        images: seo.defaultOgImage ? [{ url: seo.defaultOgImage }] : [],
      },
      alternates: { canonical: seo.siteUrl },
    }
  } catch {
    return { title: 'Acasă' }
  }
}

export default async function HomePage() {
  let site = null
  let seo = null
  let posts: any[] = []
  let categories: any[] = []

  try {
    site = await prisma.site.findFirst({ where: { isActive: true } })
    seo = site
      ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } })
      : null

    posts = await prisma.post.findMany({
      where: { status: 'PUBLISHED', siteId: site?.id },
      take: 6,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { name: true, email: true } },
        category: { select: { name: true, slug: true } },
      },
    })

    categories = await prisma.category.findMany({
      where: { siteId: site?.id, parentId: null },
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
  } catch {
    // DB unavailable at build time — ISR will populate on first runtime request
  }

  // featuredImageId is a bare String? field — no Prisma relation. Fetch images separately.
  const imageIds = posts.map((p: any) => p.featuredImageId).filter((id): id is string => !!id)
  let mediaItems: any[] = []
  try {
    mediaItems =
      imageIds.length > 0
        ? await prisma.media.findMany({
            where: { id: { in: imageIds } },
            select: { id: true, url: true, altText: true, width: true, height: true },
          })
        : []
  } catch {
    // no-op
  }
  const mediaMap = new Map(mediaItems.map((m: any) => [m.id, m]))

  const siteData = {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    defaultOgImage: seo?.defaultOgImage ?? null,
  }

  const mappedPosts = posts.map((p) => {
    const media = p.featuredImageId ? (mediaMap.get(p.featuredImageId) ?? null) : null
    return {
      ...p,
      featuredImage: media
        ? { url: media.url, altText: media.altText ?? null, width: media.width ?? null, height: media.height ?? null }
        : null,
      author: p.author ?? null,
      category: p.category ?? null,
    }
  })

  const base = siteData.siteUrl.replace(/\/$/, '')

  function postUrl(p: { slug: string; category: { slug: string } | null }) {
    return p.category ? `${base}/${p.category.slug}/${p.slug}` : `${base}/blog/${p.slug}`
  }

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: siteData.siteName,
        inLanguage: 'ro-RO',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${base}/cautare?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
      ...(mappedPosts.length > 0
        ? [{
            '@type': 'ItemList',
            '@id': `${base}/#itemlist`,
            name: 'Articole recente',
            itemListElement: mappedPosts.map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: postUrl(p),
              name: p.title,
            })),
          }]
        : []),
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <HomepageDispatcher
        template={site?.template ?? 'default'}
        latestPosts={mappedPosts}
        categories={categories}
        site={siteData}
        seoSettings={seo ?? null}
      />
    </>
  )
}
