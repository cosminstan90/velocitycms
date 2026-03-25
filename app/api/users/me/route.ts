import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
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
