import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { nextFreeSlug, parseListingInput } from '@/lib/listings'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { services: { select: { serviceId: true } } },
  })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ listing })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listing.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = parseListingInput(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { serviceIds, slug: requestedSlug, openingHours, ...data } = parsed.data

  const citySlug = slugify(data.city)
  if (!citySlug) return NextResponse.json({ error: 'Orașul nu poate fi folosit în URL' }, { status: 400 })

  if (serviceIds.length > 0) {
    const found = await prisma.listingService.findMany({
      where: { id: { in: serviceIds }, siteId: existing.siteId, type: data.type },
      select: { id: true },
    })
    if (found.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Serviciu invalid pentru acest tip' }, { status: 400 })
    }
  }

  // Cheia (tip, oras, slug) se verifica doar daca s-a schimbat vreuna dintre componente.
  let slug = requestedSlug ?? existing.slug
  const keyChanged = data.type !== existing.type || citySlug !== existing.citySlug || slug !== existing.slug
  if (keyChanged) {
    const taken = async (s: string) =>
      !!(await prisma.listing.findFirst({
        where: { siteId: existing.siteId, type: data.type, citySlug, slug: s, id: { not: id } },
        select: { id: true },
      }))
    if (requestedSlug) {
      if (await taken(slug)) {
        return NextResponse.json({ error: 'Există deja o fișă cu acest slug în oraș' }, { status: 409 })
      }
    } else {
      // slug-ul vine din fisa existenta: ramane acelasi daca e liber in noua cheie, altfel primeste sufix
      slug = await nextFreeSlug(taken, existing.slug)
    }
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...data,
      slug,
      citySlug,
      openingHours: openingHours ? (openingHours as Prisma.InputJsonValue) : Prisma.DbNull,
      publishedAt: data.status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null,
      services: { deleteMany: {}, create: serviceIds.map((serviceId) => ({ serviceId })) },
    },
  })
  return NextResponse.json({ listing })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listing.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.listing.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
