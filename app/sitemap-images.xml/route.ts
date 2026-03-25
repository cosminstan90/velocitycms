/**
 * GET /sitemap-images.xml
 * Google Image Sitemap — lists all published posts that have a featured image.
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'

export const dynamic = 'force-dynamic'

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET() {
  const seo = await prisma.seoSettings.findFirst()
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      noIndex: false,
      featuredImageId: { not: null },
    },
    select: {
      slug: true,
      title: true,
      canonicalUrl: true,
      featuredImageId: true,
      category: {
        select: {
          slug: true,
          parent: { select: { slug: true } },
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
  })

  // Fetch all featured images in one query
  const imageIds = posts.map((p) => p.featuredImageId).filter(Boolean) as string[]
  const images = await prisma.media.findMany({
    where: { id: { in: imageIds } },
    select: { id: true, url: true, altText: true, caption: true },
  })
  const imageMap = new Map(images.map((img) => [img.id, img]))

  const urlEntries = posts
    .map((post) => {
      const img = imageMap.get(post.featuredImageId!)
      if (!img) return ''

      const pageUrl = buildCanonicalUrl(post, { siteUrl }, post.category)
      const imgUrl = img.url.startsWith('http') ? img.url : `${siteUrl}${img.url}`
      const title = esc(img.altText ?? post.title)
      const caption = img.caption ? `\n      <image:caption>${esc(img.caption)}</image:caption>` : ''

      return `  <url>
    <loc>${esc(pageUrl)}</loc>
    <image:image>
      <image:loc>${esc(imgUrl)}</image:loc>
      <image:title>${title}</image:title>${caption}
    </image:image>
  </url>`
    })
    .filter(Boolean)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
