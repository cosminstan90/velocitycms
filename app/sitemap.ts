/**
 * Dynamic sitemap for VelocityCMS.
 * Uses generateSitemaps() to split into chunks of 45,000 URLs (below Google's 50K limit).
 *   id = 0  → homepage + all categories + all pages
 *   id ≥ 1  → posts batch (45K each)
 */

import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'

export const dynamic = 'force-dynamic'

const POSTS_PER_CHUNK = 45_000

// ─── How many sitemap chunks do we need? ─────────────────────────────────────
export async function generateSitemaps() {
  try {
    const postCount = await prisma.post.count({
      where: { status: 'PUBLISHED', noIndex: false },
    })
    if (postCount === 0) return [{ id: 0 }]
    const postChunks = Math.ceil(postCount / POSTS_PER_CHUNK)
    // id=0 is static items; ids 1..N are post batches
    return Array.from({ length: 1 + postChunks }, (_, id) => ({ id }))
  } catch {
    return [{ id: 0 }]
  }
}

// ─── Build each chunk ─────────────────────────────────────────────────────────
export default async function sitemap({
  id,
}: {
  id: number
}): Promise<MetadataRoute.Sitemap> {
  const seo = await prisma.seoSettings.findFirst()
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  // ── id = 0: homepage + categories + pages ────────────────────────────────
  if (id === 0) {
    const entries: MetadataRoute.Sitemap = [
      {
        url: `${siteUrl}/`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]

    // Top-level categories (priority 0.8)
    const topCategories = await prisma.category.findMany({
      where: { parentId: null },
      select: { slug: true },
    })
    for (const cat of topCategories) {
      entries.push({
        url: `${siteUrl}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      })
    }

    // Subcategories (priority 0.7)
    const subCategories = await prisma.category.findMany({
      where: { parentId: { not: null } },
      select: { slug: true, parent: { select: { slug: true } } },
    })
    for (const cat of subCategories) {
      if (!cat.parent) continue
      entries.push({
        url: `${siteUrl}/${cat.parent.slug}/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }

    // Published pages (priority 0.5)
    const pages = await prisma.page.findMany({
      where: { status: 'PUBLISHED', noIndex: false },
      select: { slug: true, updatedAt: true },
    })
    for (const page of pages) {
      entries.push({
        url: `${siteUrl}/${page.slug}`,
        lastModified: page.updatedAt,
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    }

    // Tag pages (priority 0.5)
    const tags = await prisma.tag.findMany({ select: { slug: true } })
    for (const tag of tags) {
      entries.push({
        url: `${siteUrl}/eticheta/${tag.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }

    // Author pages (priority 0.6 — EEAT value)
    const authors = await prisma.user.findMany({
      where: { slug: { not: null } },
      select: { slug: true },
    })
    for (const author of authors) {
      if (!author.slug) continue
      entries.push({
        url: `${siteUrl}/autor/${author.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }

    return entries
  }

  // ── id ≥ 1: post batch ────────────────────────────────────────────────────
  const skip = (id - 1) * POSTS_PER_CHUNK

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED', noIndex: false },
    select: {
      slug: true,
      updatedAt: true,
      canonicalUrl: true,
      category: {
        select: {
          slug: true,
          parent: { select: { slug: true } },
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    skip,
    take: POSTS_PER_CHUNK,
  })

  return posts.map((post) => ({
    url: buildCanonicalUrl(post, { siteUrl }, post.category),
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
}
