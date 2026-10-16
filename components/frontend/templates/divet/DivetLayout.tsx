import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getNavigation, getRecentPostsByGroup, type NavGroup, type GroupPost } from '@/lib/navigation'
import { findActiveGroupSlug } from '@/lib/navigation-tree'
import DivetHeader from './DivetHeader'
import DivetNav from './DivetNav'

// LEGACY: folosit de ArticleTemplate/CategoryTemplate pana la rescrierea lor (Tasks 15-16)
export const LEAF_PATTERN_SVG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 C20 15 10 25 15 35 C20 45 35 45 40 35 C45 25 35 15 30 5Z' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E")`

export interface DivetLayoutProps {
  site: { siteName: string; siteUrl: string }
  /** LEGACY: ignorat, navigatia vine din getNavigation (templateurile vechi inca il trimit). */
  categories?: unknown
  /** LEGACY: ignorat, pastrat doar pentru compatibilitatea apelurilor existente. */
  seoSettings?: unknown
  activeCategory?: string | null
  /** Slug de grup; are prioritate fata de activeCategory. */
  activeGroup?: string | null
  children: React.ReactNode
}

export default async function DivetLayout({
  site,
  activeCategory,
  activeGroup,
  children,
}: DivetLayoutProps) {
  let groups: NavGroup[] = []
  let recent: Record<string, GroupPost[]> = {}
  try {
    const activeSite = await prisma.site.findFirst({ where: { isActive: true } })
    if (activeSite) {
      groups = await getNavigation(activeSite.id)
      recent = await getRecentPostsByGroup(activeSite.id, groups.map((g) => g.id))
    }
  } catch {
    groups = []
    recent = {}
  }

  const activeSlug = activeGroup ?? findActiveGroupSlug(groups, activeCategory)

  return (
    <div className="min-h-screen flex flex-col font-dv-body bg-dv-bg text-dv-ink">
      <DivetHeader siteName={site.siteName} />
      <DivetNav groups={groups} recentByGroup={recent} activeSlug={activeSlug} />
      <main className="flex-1">{children}</main>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-dv-border px-4 py-6 text-dv-meta text-dv-ink-muted md:px-10">
        <span>{site.siteName} · Enciclopedia animalelor din România</span>
        <Link
          href="/index-a-z"
          className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
        >
          Index A–Z
        </Link>
      </footer>
    </div>
  )
}
