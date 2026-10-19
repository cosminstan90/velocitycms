import { NextRequest, NextResponse } from 'next/server'
import { Prisma, type ListingStatus } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSiteAccess } from '@/lib/site-access'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import { parsePageParam } from '@/lib/pagination'
import { LISTING_TYPES, nextFreeSlug, parseListingInput, pickCanonicalSpelling } from '@/lib/listings'

const PAGE_SIZE = 20
const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!(await hasSiteAccess(session.user.id, siteId))) return NextResponse.json({ error: 'Site access denied' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const type = LISTING_TYPES.find((t) => t === sp.get('type'))
  const rawStatus = sp.get('status')
  const status: ListingStatus | undefined =
    rawStatus === 'DRAFT' || rawStatus === 'PUBLISHED' ? rawStatus : undefined
  const q = sp.get('q')?.trim()
  const page = parsePageParam(sp.get('page'))

  const where = {
    siteId,
    ...(type && { type }),
    ...(status && { status }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { city: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { services: { include: { service: { select: { name: true } } } } },
    }),
    prisma.listing.count({ where }),
  ])
  return NextResponse.json({ listings, total, page, pageSize: PAGE_SIZE })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!(await hasSiteAccess(session.user.id, siteId))) return NextResponse.json({ error: 'Site access denied' }, { status: 403 })

  const parsed = parseListingInput(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { serviceIds, slug: requestedSlug, openingHours, ...data } = parsed.data

  const citySlug = slugify(data.city)
  if (!citySlug) return NextResponse.json({ error: 'Orașul nu poate fi folosit în URL' }, { status: 400 })
  if (citySlug.length > 100) return NextResponse.json({ error: 'Orașul este prea lung pentru URL' }, { status: 400 })

  // O singura scriere pe oras/judet in site: refolosim cea deja salvata.
  const [sameCity] = await prisma.listing.findMany({ where: { siteId, citySlug }, select: { city: true }, take: 1 })
  if (sameCity) data.city = sameCity.city
  const knownCounties = await prisma.listing.findMany({ where: { siteId }, distinct: ['county'], select: { county: true } })
  data.county = pickCanonicalSpelling(data.county, knownCounties.map((c) => c.county))

  if (serviceIds.length > 0) {
    const found = await prisma.listingService.findMany({
      where: { id: { in: serviceIds }, siteId, type: data.type },
      select: { id: true },
    })
    if (found.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Serviciu invalid pentru acest tip' }, { status: 400 })
    }
  }

  const taken = async (slug: string) =>
    !!(await prisma.listing.findFirst({ where: { siteId, type: data.type, citySlug, slug }, select: { id: true } }))

  let slug: string
  if (requestedSlug) {
    if (await taken(requestedSlug)) {
      return NextResponse.json({ error: 'Există deja o fișă cu acest slug în oraș' }, { status: 409 })
    }
    slug = requestedSlug
  } else {
    slug = await nextFreeSlug(taken, slugify(data.name).slice(0, 240) || 'fisa')
  }

  try {
    const listing = await prisma.listing.create({
      data: {
        ...data,
        siteId,
        slug,
        citySlug,
        ...(openingHours && { openingHours: openingHours as Prisma.InputJsonValue }),
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        services: { create: serviceIds.map((serviceId) => ({ serviceId })) },
      },
    })
    return NextResponse.json({ listing }, { status: 201 })
  } catch (e) {
    // cursa pe cheia unica (tip, oras, slug)
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: 'Există deja o fișă cu acest slug în oraș' }, { status: 409 })
    }
    throw e
  }
}
