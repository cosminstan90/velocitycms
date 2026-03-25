/**
 * POST /api/sitemap/rebuild
 * Clears Next.js cache for sitemap routes and records the rebuild timestamp.
 * @eslint data-isolation: siteId is injected via middleware and used for data isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Revalidate all sitemap-related paths
  revalidatePath('/sitemap.xml')
  revalidatePath('/sitemap-images.xml')
  revalidatePath('/robots.txt')
  // Also revalidate individual sitemap chunks (covers up to 20 chunks = 900K URLs)
  for (let i = 0; i <= 20; i++) {
    revalidatePath(`/sitemap/${i}`)
  }

  // Record rebuild timestamp
  await prisma.seoSettings.upsert({
    where: { siteId },
    update: { sitemapLastBuilt: new Date() },
    create: {
      siteId,
      siteName: 'VelocityCMS',
      siteUrl: 'http://localhost:3000',
      sitemapLastBuilt: new Date(),
    },
  })

  return NextResponse.json({ success: true, rebuiltAt: new Date().toISOString() })
}

// ─── GET /api/sitemap/stats — URL counts + last built ─────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const [postCount, pageCount, topCatCount, subCatCount, seo] = await Promise.all([
    prisma.post.count({ where: { siteId, status: 'PUBLISHED', noIndex: false } }),
    prisma.page.count({ where: { siteId, status: 'PUBLISHED', noIndex: false } }),
    prisma.category.count({ where: { siteId, parentId: null } }),
    prisma.category.count({ where: { siteId, parentId: { not: null } } }),
    prisma.seoSettings.findUnique({ where: { siteId }, select: { sitemapLastBuilt: true } }),
  ])

  // +1 for homepage
  const total = 1 + postCount + pageCount + topCatCount + subCatCount

  return NextResponse.json({
    total,
    breakdown: {
      homepage: 1,
      posts: postCount,
      pages: pageCount,
      topLevelCategories: topCatCount,
      subcategories: subCatCount,
    },
    chunksNeeded: Math.max(1, Math.ceil(postCount / 45_000) + 1),
    lastBuilt: seo?.sitemapLastBuilt ?? null,
  })
}
