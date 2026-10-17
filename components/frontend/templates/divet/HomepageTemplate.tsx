import Link from 'next/link'
import DivetLayout from './DivetLayout'
import PostGrid from './PostGrid'
import EmptyState from './EmptyState'
import SearchForm from './SearchForm'
import { getActiveNavigation } from '@/lib/navigation'

interface HomepageTemplateProps {
  latestPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: { url: string; altText: string | null; width: number | null; height: number | null } | null
    author: { name: string | null } | null
    category: { name: string; slug: string; parent?: { name: string; slug: string } | null } | null
    fieldValues?: Array<{ value: string; fieldDefinition: { fieldKey: string } }>
  }>
  // LEGACY: ignorat, navigatia vine din getActiveNavigation
  categories?: unknown
  site: { siteName: string; siteUrl: string; defaultOgImage: string | null }
  seoSettings: { defaultMetaTitle: string | null; defaultMetaDesc: string | null } | null
}

export default async function DivetHomepage({ latestPosts, site, seoSettings }: HomepageTemplateProps) {
  const nav = await getActiveNavigation()
  const groups = nav ? nav.groups.filter((g) => (nav.recentByGroup[g.id] ?? []).length > 0) : []

  return (
    <DivetLayout site={{ siteName: site.siteName, siteUrl: site.siteUrl }}>
      <div className="mx-auto w-full max-w-[1100px] px-4 md:px-10">
        <section className="py-10 lg:py-14">
          <h1 className="m-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-dv-ink sm:text-[52px]">
            Enciclopedia animalelor din România
          </h1>
          <p className="mt-4 mb-6 max-w-[60ch] text-dv-body text-dv-ink-muted">
            {seoSettings?.defaultMetaDesc || 'Fișe structurate despre rase, specii și îngrijire.'}
          </p>
          <SearchForm size="lg" inputId="dv-home-q" />
        </section>

        {nav && groups.length > 0 ? (
          <section aria-labelledby="dv-home-groups" className="mt-10 lg:mt-14">
            <h2 id="dv-home-groups" className="m-0 mb-5 font-dv-display text-[22px] font-semibold text-dv-ink">
              Explorează după grup
            </h2>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.id} className="rounded-[10px] border border-dv-border bg-dv-surface p-5">
                  <Link
                    href={g.href}
                    className="font-dv-display text-[18px] font-semibold text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                  >
                    {g.name}
                  </Link>
                  {g.children.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {g.children.slice(0, 5).map((c) => (
                        <Link
                          key={c.id}
                          href={c.href}
                          className="rounded-full border border-dv-border px-2.5 py-0.5 text-[12px] text-dv-ink-muted hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-4 mb-2 text-dv-label font-semibold uppercase text-dv-ink-muted">Cele mai noi</div>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {(nav.recentByGroup[g.id] ?? []).slice(0, 3).map((p) => (
                      <li key={p.href}>
                        <Link
                          href={p.href}
                          className="text-[14px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                        >
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={g.href}
                    className="mt-4 inline-block text-[13px] font-semibold text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent"
                  >
                    Toate din {g.name} →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="dv-home-latest" className="mt-10 pb-12 lg:mt-14">
          {latestPosts.length > 0 ? (
            <>
              <h2 id="dv-home-latest" className="m-0 mb-5 font-dv-display text-[22px] font-semibold text-dv-ink">
                Cele mai noi fișe
              </h2>
              <PostGrid posts={latestPosts} siteUrl={site.siteUrl} />
            </>
          ) : (
            <EmptyState
              title="Enciclopedia e în construcție"
              description="Primele fișe apar în curând. Între timp, răsfoiește grupurile din meniu."
            />
          )}
        </section>
      </div>
    </DivetLayout>
  )
}
