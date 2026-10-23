import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getNavigation, getRecentPostsByGroup, type NavGroup, type GroupPost } from '@/lib/navigation'
import DivetHeader from './DivetHeader'
import DivetNav from './DivetNav'

export interface DivetLayoutProps {
  site: { siteName: string; siteUrl: string }
  /** Slug-ul grupului radacina activ (subliniat in navigatie). */
  activeGroup?: string | null
  /** Cautarea din header (ascunsa pe homepage, unde exista cea din hero). */
  headerSearch?: boolean
  children: React.ReactNode
}

export default async function DivetLayout({ site, activeGroup, headerSearch = true, children }: DivetLayoutProps) {
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
      <DivetHeader siteName={site.siteName} showSearch={headerSearch} />
      <DivetNav groups={groups} recentByGroup={recent} activeSlug={activeGroup} extraLinks={hasDirectory ? [{ label: 'Director', href: '/director' }] : []} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-dv-border bg-dv-surface">
        <div className="mx-auto grid w-full max-w-[1100px] gap-8 px-4 py-10 md:px-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="font-dv-display text-[22px] font-bold tracking-tight text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
              {site.siteName}
            </Link>
            <p className="mt-3 mb-0 max-w-[40ch] text-[14px] leading-[1.65] text-dv-ink-muted">
              Enciclopedia animalelor din România. Informațiile au rol orientativ și nu înlocuiesc sfatul medicului veterinar.
            </p>
          </div>
          <nav aria-label="Secțiuni" className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {groups.slice(0, 6).map((g) => (
              <div key={g.id}>
                <Link href={g.href} className="text-[13px] font-semibold text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                  {g.name}
                </Link>
                <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
                  {g.children.slice(0, 4).map((c) => (
                    <li key={c.id}>
                      <Link href={c.href} className="text-[13px] text-dv-ink-muted hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="border-t border-dv-border">
          <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-4 text-dv-meta text-dv-ink-muted md:px-10">
            <span>© {new Date().getFullYear()} {site.siteName}</span>
            <span className="flex gap-4">
              <Link href="/index-a-z" className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">Index A–Z</Link>
              {hasDirectory ? (
                <Link href="/director" className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">Director</Link>
              ) : null}
              <a href="/sitemap.xml" className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">Sitemap</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
