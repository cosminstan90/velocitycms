import { prisma } from '@/lib/prisma'

/** True when the user has a UserSiteAccess row for the site (any row = may work on it). */
export async function hasSiteAccess(userId: string, siteId: string): Promise<boolean> {
  const row = await prisma.userSiteAccess.findUnique({
    where: { userId_siteId: { userId, siteId } },
    select: { id: true },
  })
  return !!row
}

export type SiteRole = 'ADMIN' | 'EDITOR' | 'AUTHOR'

/** The user's role on the site (UserSiteAccess.role), or null when they have no access row. */
export async function getSiteRole(userId: string, siteId: string): Promise<SiteRole | null> {
  const row = await prisma.userSiteAccess.findUnique({
    where: { userId_siteId: { userId, siteId } },
    select: { role: true },
  })
  return row?.role ?? null
}

/** True only when the user's per-site role is ADMIN. */
export async function isSiteAdmin(userId: string, siteId: string): Promise<boolean> {
  return (await getSiteRole(userId, siteId)) === 'ADMIN'
}
