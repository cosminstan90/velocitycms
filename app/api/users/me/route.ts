import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, slug: true, title: true, bio: true, photo: true, website: true, role: true, createdAt: true },
  })

  const allSites = await prisma.userSiteAccess.findMany({
    where: { userId: session.user.id },
    include: {
      site: {
        select: { id: true, name: true, domain: true, isActive: true },
      },
    },
    orderBy: { site: { name: 'asc' } },
  })

  const activeSite = session.user.activeSiteId
    ? allSites.find((a: { siteId: string }) => a.siteId === session.user.activeSiteId)?.site ?? null
    : null

  return NextResponse.json({
    user,
    activeSite,
    allSites: allSites.map((a: { site: { id: string; name: string; domain: string; isActive: boolean }; role: string }) => ({ ...a.site, accessRole: a.role })),
  })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, slug, title, bio, photo, website } = body

  // Validate slug format if provided
  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug invalid — folosiți doar litere mici, cifre și cratime.' }, { status: 400 })
  }

  // Check slug uniqueness (excluding current user)
  if (slug) {
    const existing = await prisma.user.findFirst({
      where: { slug, id: { not: session.user.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Acest slug este deja folosit.' }, { status: 400 })
    }
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name ?? undefined,
      slug: slug || null,
      title: title || null,
      bio: bio || null,
      photo: photo || null,
      website: website || null,
    },
    select: { id: true, email: true, name: true, slug: true, title: true, bio: true, photo: true, website: true, role: true, createdAt: true },
  })

  return NextResponse.json({ user: updated })
}
