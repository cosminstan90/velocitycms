import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSiteAccess } from '@/lib/site-access'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import { isListingType, LISTING_TYPES } from '@/lib/listings'

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!(await hasSiteAccess(session.user.id, siteId))) return NextResponse.json({ error: 'Site access denied' }, { status: 403 })

  const type = LISTING_TYPES.find((t) => t === req.nextUrl.searchParams.get('type'))
  const services = await prisma.listingService.findMany({
    where: { siteId, ...(type && { type }) },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { listings: true } } },
  })
  return NextResponse.json({ services })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!(await hasSiteAccess(session.user.id, siteId))) return NextResponse.json({ error: 'Site access denied' }, { status: 403 })

  const body = await req.json().catch(() => null)
  const type = body?.type
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!isListingType(type)) return NextResponse.json({ error: 'Tip invalid' }, { status: 400 })
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'Numele trebuie să aibă între 2 și 100 de caractere' }, { status: 400 })
  }
  const slug = slugify(body?.slug ? String(body.slug) : name)
  if (!slug || slug.length > 100) return NextResponse.json({ error: 'Slug invalid' }, { status: 400 })

  const existing = await prisma.listingService.findFirst({ where: { siteId, type, slug } })
  if (existing) return NextResponse.json({ error: 'Există deja un serviciu cu acest slug' }, { status: 409 })

  try {
    const service = await prisma.listingService.create({ data: { siteId, type, name, slug } })
    return NextResponse.json({ service }, { status: 201 })
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: 'Există deja un serviciu cu acest slug' }, { status: 409 })
    }
    throw e
  }
}
