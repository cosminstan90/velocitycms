import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { siteId } = await req.json()

  const access = await prisma.userSiteAccess.findFirst({
    where: { userId: session.user.id, siteId },
    include: { site: true },
  })

  if (!access) {
    return NextResponse.json({ error: 'Site access denied' }, { status: 403 })
  }

  // Persist active site selection in a cookie so UI and API routes can honor it.
  const response = NextResponse.json({ success: true, site: access.site })
  response.cookies.set('activeSiteId', access.site.id, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })

  return response
}
