import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Ensure siteId is always in where clause for data isolation

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const tags = await prisma.tag.findMany({
    where: { siteId },
    orderBy: { name: 'asc' },
    include: { _count: { select: { posts: true } } },
  })

  return NextResponse.json({
    tags: tags.map((t: typeof tags[0]) => ({ ...t, postCount: t._count.posts })),
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name } = body
  const siteId = (await getSiteIdFromRequest(req)) ?? body.siteId ?? session.user.activeSiteId

  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const slug = body.slug ? slugify(body.slug) : slugify(name)

  const existing = await prisma.tag.findFirst({ where: { siteId, slug } })
  if (existing) return NextResponse.json({ error: 'Tag already exists' }, { status: 409 })

  const tag = await prisma.tag.create({ data: { siteId, name, slug } })
  return NextResponse.json({ tag }, { status: 201 })
}
