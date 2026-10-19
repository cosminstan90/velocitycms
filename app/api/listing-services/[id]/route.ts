import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSiteAccess } from '@/lib/site-access'
import { slugify } from '@/lib/slugify'

const isUniqueViolation = (e: unknown) => (e as { code?: string })?.code === 'P2002'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listingService.findUnique({ where: { id } })
  if (!existing || !(await hasSiteAccess(session.user.id, existing.siteId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'Numele trebuie să aibă între 2 și 100 de caractere' }, { status: 400 })
  }
  // Slug-ul ramane stabil: fisele publice nu il folosesc in URL, dar filtrul ?serviciu= da.
  const slug = body?.slug ? slugify(String(body.slug)) : existing.slug
  if (!slug || slug.length > 100) return NextResponse.json({ error: 'Slug invalid' }, { status: 400 })

  if (slug !== existing.slug) {
    const conflict = await prisma.listingService.findFirst({
      where: { siteId: existing.siteId, type: existing.type, slug, id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'Există deja un serviciu cu acest slug' }, { status: 409 })
  }

  try {
    const service = await prisma.listingService.update({ where: { id }, data: { name, slug } })
    return NextResponse.json({ service })
  } catch (e) {
    if (isUniqueViolation(e)) {
      return NextResponse.json({ error: 'Există deja un serviciu cu acest slug' }, { status: 409 })
    }
    throw e
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listingService.findUnique({ where: { id }, select: { id: true, siteId: true } })
  if (!existing || !(await hasSiteAccess(session.user.id, existing.siteId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Legaturile se sterg in cascada; fisele raman, doar fara acest serviciu.
  await prisma.listingService.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
