import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'
import { categoryLastModified } from '@/lib/sitemap-categories'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await prisma.seoSettings.findFirst()
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  // Posts (also used for the /index-a-z lastModified)
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED', noIndex: false },
    select: {
      slug: true,
      updatedAt: true,
      canonicalUrl: true,
      category: { select: { slug: true, parent: { select: { slug: true } } } },
    },
    orderBy: { publishedAt: 'desc' },
  })
  const newestPostUpdate = posts.reduce<Date | null>(
    (max, p) => (!max || p.updatedAt > max ? p.updatedAt : max),
    null,
  )

  const entries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    {
      url: `${siteUrl}/index-a-z`,
      lastModified: newestPostUpdate ?? new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },
  ]

  // Categories: only those with at least one published article
  const stats = await prisma.post.groupBy({
    by: ['categoryId'],
    where: { status: 'PUBLISHED', noIndex: false, categoryId: { not: null } },
    _max: { updatedAt: true },
  })
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true, parentId: true, parent: { select: { slug: true } } },
  })
  const lastMod = categoryLastModified(
    categories,
    stats.map((s) => ({ categoryId: s.categoryId, maxUpdatedAt: s._max.updatedAt })),
  )
  for (const cat of categories) {
    const lastModified = lastMod.get(cat.id)
    if (!lastModified) continue
    if (cat.parentId === null) {
      entries.push({ url: `${siteUrl}/${cat.slug}`, lastModified, changeFrequency: 'weekly', priority: 0.8 })
    } else if (cat.parent) {
      entries.push({ url: `${siteUrl}/${cat.parent.slug}/${cat.slug}`, lastModified, changeFrequency: 'weekly', priority: 0.7 })
    }
  }

  // Published pages
  const pages = await prisma.page.findMany({
    where: { status: 'PUBLISHED', noIndex: false },
    select: { slug: true, updatedAt: true },
  })
  for (const page of pages) {
    entries.push({ url: `${siteUrl}/${page.slug}`, lastModified: page.updatedAt, changeFrequency: 'monthly', priority: 0.5 })
  }

  // Tag pages: only tags with at least one published post
  const tags = await prisma.tag.findMany({
    where: { posts: { some: { post: { status: 'PUBLISHED', noIndex: false } } } },
    select: { slug: true },
  })
  for (const tag of tags) {
    entries.push({ url: `${siteUrl}/eticheta/${tag.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 })
  }

  // Author pages: only authors with at least one published post
  const authors = await prisma.user.findMany({
    where: { slug: { not: null }, posts: { some: { status: 'PUBLISHED', noIndex: false } } },
    select: { slug: true },
  })
  for (const author of authors) {
    if (!author.slug) continue
    entries.push({ url: `${siteUrl}/autor/${author.slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 })
  }

  for (const post of posts) {
    entries.push({
      url: buildCanonicalUrl(post, { siteUrl }, post.category),
      lastModified: post.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  return entries
}
