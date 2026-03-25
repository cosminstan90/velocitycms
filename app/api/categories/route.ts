import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'

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

  const existing = await prisma.category.findFirst({ where: { siteId, slug } })
  if (existing) return NextResponse.json({ error: 'Slug already exists for this site' }, { status: 409 })

  const category = await prisma.category.create({
    data: { siteId, name, slug, description, metaTitle, metaDesc, parentId: parentId ?? null },
  })

  return NextResponse.json({ category }, { status: 201 })
}
