import { prisma } from '@/lib/prisma'

/** True when the user has a UserSiteAccess row for the site (any row = may work on it). */
export async function hasSiteAccess(userId: string, siteId: string): Promise<boolean> {
  const row = await prisma.userSiteAccess.findUnique({
    where: { userId_siteId: { userId, siteId } },
    select: { id: true },
  })
  return !!row
}
