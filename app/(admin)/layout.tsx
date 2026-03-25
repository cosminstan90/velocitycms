import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const allSites = await prisma.userSiteAccess.findMany({
    where: { userId: session.user.id },
    include: { site: { select: { id: true, name: true, domain: true, isActive: true, description: true } } },
    orderBy: { site: { name: 'asc' } },
  })

  const siteStats = await Promise.all(
    allSites.map(async (access) => {
      const siteId = access.site.id
      const [postCount, mediaCount] = await prisma.$transaction([
        prisma.post.count({ where: { siteId } }),
        prisma.media.count({ where: { siteId } }),
      ])
      return { siteId, postCount, mediaCount }
    })
  )

  const sites = allSites.map((access: any) => {
    const stats = siteStats.find((s: any) => s.siteId === access.site.id)
    return {
      ...access.site,
      accessRole: access.role,
      postCount: stats?.postCount ?? 0,
      mediaCount: stats?.mediaCount ?? 0,
    }
  })

  const activeSite = sites.find((s: any) => s.id === session.user.activeSiteId) ?? sites[0] ?? null

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
      <AdminSidebar
        user={session.user}
        sites={sites}
        activeSite={activeSite}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader user={session.user} activeSite={activeSite} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
