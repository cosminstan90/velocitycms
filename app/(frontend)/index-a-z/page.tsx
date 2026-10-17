import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import { groupByInitial, INDEX_LETTERS, type IndexGroup, type IndexItem } from '@/lib/index-az'
import DivetLayout from '@/components/frontend/templates/divet/DivetLayout'
import Breadcrumbs from '@/components/frontend/templates/divet/Breadcrumbs'
import EmptyState from '@/components/frontend/templates/divet/EmptyState'

export const dynamic = 'force-dynamic'

type Entry = IndexItem & { group: string | null }

const OTHER = '#'
const anchorOf = (letter: string) => (letter === OTHER ? 'litera-altele' : `litera-${letter.toLowerCase()}`)

async function loadSiteData() {
  const site = await prisma.site.findFirst({ where: { isActive: true } })
  const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
  return { site, seo }
}

function toSiteData(
  site: { name: string; domain: string } | null,
  seo: { siteName: string; siteUrl: string } | null,
) {
  return {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
  }
}

export async function generateMetadata(): Promise<Metadata> {
  let siteName = 'Site'
  let siteUrl = 'http://localhost'
  try {
    const { site, seo } = await loadSiteData()
    const data = toSiteData(site, seo)
    siteName = data.siteName
    siteUrl = data.siteUrl
  } catch {
    // DB unavailable — fallback
  }
  return {
    title: `Index A–Z | ${siteName}`,
    description: 'Toate fișele din enciclopedie, în ordine alfabetică.',
    alternates: { canonical: `${siteUrl.replace(/\/$/, '')}/index-a-z` },
  }
}

export default async function IndexAzPage() {
  let site: Awaited<ReturnType<typeof loadSiteData>>['site'] = null
  let seo: Awaited<ReturnType<typeof loadSiteData>>['seo'] = null
  let groups: IndexGroup<Entry>[] = []
  let total = 0

  try {
    ;({ site, seo } = await loadSiteData())
    if (site) {
      const posts = await prisma.post.findMany({
        where: { status: 'PUBLISHED', siteId: site.id },
        select: {
          title: true,
          slug: true,
          category: {
            select: { slug: true, name: true, parent: { select: { slug: true, name: true } } },
          },
        },
        take: 5000,
      })
      const entries: Entry[] = posts.map((p) => ({
        title: p.title,
        href: buildPostPath({ slug: p.slug }, p.category),
        group: p.category?.parent?.name ?? p.category?.name ?? null,
      }))
      total = entries.length
      groups = groupByInitial(entries)
    }
  } catch {
    // DB unavailable at build time — ISR will populate on first runtime request
  }

  const siteData = toSiteData(site, seo)
  const present = new Set(groups.map((g) => g.letter))
  const barLetters = present.has(OTHER) ? [...INDEX_LETTERS, OTHER] : [...INDEX_LETTERS]

  return (
    <DivetLayout site={siteData}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs
          items={[
            { name: 'Acasă', href: '/' },
            { name: 'Index A–Z', href: '/index-a-z' },
          ]}
        />

        <h1 className="mt-4 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] sm:text-[44px]">
          Index A–Z
        </h1>

        {total === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Încă nu avem fișe"
              description="Primele fișe apar în curând. Între timp, răsfoiește grupurile din meniu."
            />
          </div>
        ) : (
          <>
            <p className="mt-2 mb-0 text-dv-meta text-dv-ink-subtle">
              {total === 1 ? '1 fișă' : `${total} fișe`}
            </p>

            <nav aria-label="Litere" className="mt-6">
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {barLetters.map((letter) => (
                  <li key={letter}>
                    {present.has(letter) ? (
                      <a
                        href={`#${anchorOf(letter)}`}
                        className="inline-flex size-9 items-center justify-center rounded-md border border-dv-border bg-dv-surface font-semibold hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                      >
                        {letter}
                      </a>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex size-9 items-center justify-center text-dv-ink-subtle"
                      >
                        {letter}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {groups.map((g) => (
              <section key={g.letter} id={anchorOf(g.letter)} aria-labelledby={`${anchorOf(g.letter)}-titlu`}>
                <h2
                  id={`${anchorOf(g.letter)}-titlu`}
                  className="mt-8 mb-3 scroll-mt-6 border-b border-dv-border pb-2 font-dv-display text-[28px] font-bold"
                >
                  {g.letter}
                </h2>
                <ul className="m-0 list-none columns-1 gap-x-8 p-0 sm:columns-2 lg:columns-3 [&>li]:break-inside-avoid">
                  {g.items.map((it) => (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className="inline-flex min-h-10 flex-wrap items-baseline gap-x-2 py-1 text-[15px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                      >
                        <span>{it.title}</span>
                        {it.group ? <span className="text-[12px] text-dv-ink-subtle">{it.group}</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </DivetLayout>
  )
}
