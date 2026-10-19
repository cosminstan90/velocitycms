import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getNavigation, getRecentPostsByGroup, type NavGroup, type GroupPost } from '@/lib/navigation'
import DivetHeader from './DivetHeader'
import DivetNav from './DivetNav'

export interface DivetLayoutProps {
  site: { siteName: string; siteUrl: string }
  /** Slug-ul grupului radacina activ (subliniat in navigatie). */
  activeGroup?: string | null
  children: React.ReactNode
}

export default async function DivetLayout({ site, activeGroup, children }: DivetLayoutProps) {
  let groups: NavGroup[] = []
  let recent: Record<string, GroupPost[]> = {}
  let hasDirectory = false
  try {
    const activeSite = await prisma.site.findFirst({ where: { isActive: true } })
    if (activeSite) {
      groups = await getNavigation(activeSite.id)
      recent = await getRecentPostsByGroup(activeSite.id, groups.map((g) => g.id))
      hasDirectory = (await prisma.listing.count({ where: { siteId: activeSite.id, status: 'PUBLISHED' } })) > 0
    }
  } catch {
    groups = []
    recent = {}
  }

  return (
    <div className="min-h-screen flex flex-col font-dv-body bg-dv-bg text-dv-ink">
      <DivetHeader siteName={site.siteName} />
      <DivetNav groups={groups} recentByGroup={recent} activeSlug={activeGroup} extraLinks={hasDirectory ? [{ label: 'Director', href: '/director' }] : []} />
      <main className="flex-1">{children}</main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dv-border px-4 py-6 text-dv-meta text-dv-ink-muted md:px-10">
        <span>{site.siteName} · Enciclopedia animalelor din România</span>
        <span className="flex gap-4">
          <Link
            href="/index-a-z"
            className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
          >
            Index A–Z
          </Link>
          {hasDirectory ? (
            <Link
              href="/director"
              className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
            >
              Director
            </Link>
          ) : null}
        </span>
      </footer>
    </div>
  )
}
