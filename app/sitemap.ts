import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await prisma.seoSettings.findFirst()
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  const entries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
  ]

  // Top-level categories
  const topCategories = await prisma.category.findMany({
    where: { parentId: null },
    select: { slug: true },
  })
  for (const cat of topCategories) {
    entries.push({ url: `${siteUrl}/${cat.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 })
  }

  // Subcategories
  const subCategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { slug: true, parent: { select: { slug: true } } },
  })
  for (const cat of subCategories) {
    if (!cat.parent) continue
    entries.push({ url: `${siteUrl}/${cat.parent.slug}/${cat.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 })
  }

  // Published pages
  const pages = await prisma.page.findMany({
    where: { status: 'PUBLISHED', noIndex: false },
    select: { slug: true, updatedAt: true },
  })
  for (const page of pages) {
    entries.push({ url: `${siteUrl}/${page.slug}`, lastModified: page.updatedAt, changeFrequency: 'monthly', priority: 0.5 })
  }

  // Tag pages
  const tags = await prisma.tag.findMany({ select: { slug: true } })
  for (const tag of tags) {
    entries.push({ url: `${siteUrl}/eticheta/${tag.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 })
  }

  // Author pages
  const authors = await prisma.user.findMany({
    where: { slug: { not: null } },
    select: { slug: true },
  })
  for (const author of authors) {
    if (!author.slug) continue
    entries.push({ url: `${siteUrl}/autor/${author.slug}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 })
  }

  // Posts
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
