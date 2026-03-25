/**
 * GET /feed.xml — RSS 2.0 feed for VelocityCMS.
 * Returns the last 20 published posts with full metadata.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'

export const dynamic = 'force-dynamic'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function rssDate(date: Date | string): string {
  return new Date(date).toUTCString()
}

export async function GET() {
  const seo = await prisma.seoSettings.findFirst({ include: { site: true } })
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')
  const siteName = seo?.siteName ?? seo?.site?.name ?? 'VelocityCMS'
  const siteDesc = seo?.defaultMetaDesc ?? ''
  const language = seo?.site?.language ?? 'ro'

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED', noIndex: false },
    orderBy: { publishedAt: 'desc' },
    take: 20,
    select: {
      slug: true,
      title: true,
      excerpt: true,
      metaDescription: true,
      publishedAt: true,
      canonicalUrl: true,
      featuredImageId: true,
      category: {
        select: {
          name: true,
          slug: true,
          parent: { select: { slug: true } },
        },
      },
      author: { select: { name: true } },
    },
  })

  const lastBuildDate = posts[0]?.publishedAt ? rssDate(posts[0].publishedAt) : rssDate(new Date())

  // Fetch featured images in one query
  const imageIds = posts.map((p) => p.featuredImageId).filter(Boolean) as string[]
  const images = await prisma.media.findMany({
    where: { id: { in: imageIds } },
    select: { id: true, url: true, size: true },
  })
  const imageMap = new Map(images.map((img) => [img.id, img]))

  const items = posts
    .map((post) => {
      const url = buildCanonicalUrl(post, { siteUrl }, post.category)
      const description = esc(post.excerpt ?? post.metaDescription ?? '')
      const pubDate = post.publishedAt ? rssDate(post.publishedAt) : rssDate(new Date())
      const categoryEl = post.category
        ? `\n        <category>${esc(post.category.name)}</category>`
        : ''
      const img = post.featuredImageId ? imageMap.get(post.featuredImageId) : null
      const imgUrl = img?.url
        ? img.url.startsWith('http')
          ? img.url
          : `${siteUrl}${img.url}`
        : null
      const enclosureEl = imgUrl
        ? `\n        <enclosure url="${esc(imgUrl)}" type="image/webp" length="${img?.size ?? 0}"/>`
        : ''

      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${esc(url)}</guid>${categoryEl}${enclosureEl}
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(siteName)}</title>
    <link>${esc(siteUrl)}</link>
    <description>${esc(siteDesc)}</description>
    <language>${language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${esc(siteUrl)}/feed.xml" rel="self" type="application/rss+xml"/>
    <generator>VelocityCMS</generator>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
