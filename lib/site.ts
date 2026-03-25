import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromDomain } from '@/lib/redis/redirects'

export async function getSiteIdFromRequest(req: NextRequest): Promise<string | null> {
  const urlSiteId = req.nextUrl.searchParams.get('siteId')
  if (urlSiteId) return urlSiteId

  const cookieSiteId = req.cookies.get('activeSiteId')?.value
  if (cookieSiteId) return cookieSiteId

  const session = await auth()
  if (session?.user?.activeSiteId) return session.user.activeSiteId

  return null
}

export async function getSiteIdFromHostname(hostname: string): Promise<string | null> {
  const host = hostname.replace(/^www\./i, '').split(':')[0]

  if (host.startsWith('localhost') || host === '127.0.0.1') {
    const fallbackSite = await prisma.site.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })
    return fallbackSite?.id ?? null
  }

  return await getSiteIdFromDomain(host)
}
