import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { auth } from '@/auth'
import { NAVIGATION_TAG } from '@/lib/navigation'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import { isReservedRootSlug } from '@/lib/listings'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const categories = await prisma.category.findMany({
    where: { siteId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { posts: true } },
      children: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { posts: true } } },
      },
    },
  })

  // Return only top-level (no parent), children are nested
  const topLevel = categories
    .filter((c) => !c.parentId)
    .map((c: typeof categories[0]) => ({
      ...c,
      postCount: c._count.posts,
      children: c.children.map((child: typeof c.children[0]) => ({
        ...child,
        postCount: child._count.posts,
        children: [],
      })),
    }))

  return NextResponse.json({ categories: topLevel })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, metaTitle, metaDesc, parentId } = body
  const siteId = (await getSiteIdFromRequest(req)) ?? body.siteId ?? session.user.activeSiteId

  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const slug = body.slug ? slugify(body.slug) : slugify(name)
  if (!parentId && isReservedRootSlug(slug)) {
    return NextResponse.json({ error: `Slug-ul "${slug}" este rezervat` }, { status: 400 })
  }

  const existing = await prisma.category.findFirst({ where: { siteId, slug, parentId: parentId || null } })
  if (existing) return NextResponse.json({ error: 'Slug already exists in this category level' }, { status: 409 })

  const category = await prisma.category.create({
    data: { siteId, name, slug, description, metaTitle, metaDesc, parentId: parentId || null },
  })

  try {
    revalidateTag(NAVIGATION_TAG, { expire: 0 })
  } catch {
    // ignore in dev
  }

  return NextResponse.json({ category }, { status: 201 })
}
