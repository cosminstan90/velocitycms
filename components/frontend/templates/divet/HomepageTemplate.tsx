import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { StoryCard, type NavCategoryItem, type StoryPost, BrandMark, getPostUrl, resolveImageUrl, formatDate } from './utils'

interface HomepageTemplateProps {
  latestPosts: StoryPost[]
  categories: NavCategoryItem[]
  site: { siteName: string; siteUrl: string; defaultOgImage: string | null }
  seoSettings: { defaultMetaTitle: string | null; defaultMetaDesc: string | null } | null
}

const CATEGORY_TONES = [
  'linear-gradient(135deg, rgba(36, 88, 64, 0.18), rgba(255, 249, 240, 0.72))',
  'linear-gradient(135deg, rgba(199, 123, 45, 0.18), rgba(255, 249, 240, 0.72))',
  'linear-gradient(135deg, rgba(36, 88, 64, 0.1), rgba(199, 123, 45, 0.16))',
]

export default function DivetHomepageTemplate({
  latestPosts,
  categories,
  site,
  seoSettings,
}: HomepageTemplateProps) {
  const heroPost = latestPosts[0] ?? null
  const editorialPosts = latestPosts.slice(1, 4)
  const moreStories = latestPosts.slice(4, 6)
  const highlightedCategories = categories.slice(0, 6)

  return (
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>
      <section className="overflow-hidden border-b border-[color:var(--dv-border)]">
        <div className="mx-auto grid min-h-[calc(100svh-72px)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-14">
          <div className="max-w-2xl">
            <p className="divet-kicker text-xs font-semibold">Enciclopedia friendly despre animale</p>
            <h1 className="divet-display mt-4 text-6xl leading-[0.92] text-[color:var(--dv-contrast)] sm:text-7xl lg:text-[6.2rem]">
              {site.siteName}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[color:var(--dv-muted-strong)]">
              Un loc in care povestile despre rase, specii si comportamente sunt clare, elegante si suficient de bune incat sa iti vina
              sa deschizi inca un articol.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <form action="/cautare" method="get" className="flex flex-1 items-center gap-2 rounded-full border border-[color:var(--dv-border)] px-3 py-2"
                style={{ background: 'color-mix(in srgb, var(--dv-surface) 76%, transparent)' }}>
                <svg className="ml-2 h-4 w-4 shrink-0 text-[color:var(--dv-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m1.2-4.8a6 6 0 11-12 0 6 6 0 0112 0Z" />
                </svg>
                <input
                  type="search"
                  name="q"
                  placeholder="Cauta rase, animale, tipuri sau ingrijire"
                  className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-[color:var(--dv-text)] outline-none placeholder:text-[color:var(--dv-muted)]"
                />
                <button type="submit" className="divet-button rounded-full px-5 py-2.5 text-sm font-semibold">
                  Exploreaza
                </button>
              </form>
              <Link href="/blog" className="divet-button-ghost inline-flex items-center justify-center rounded-full px-5 py-4 text-sm font-semibold">
                Vezi toate articolele
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {highlightedCategories.map((category) => (
                <Link key={category.id} href={`/${category.slug}`} className="divet-chip rounded-full px-4 py-2 text-sm transition-transform hover:-translate-y-0.5">
                  {category.name}
                </Link>
              ))}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="divet-card-soft rounded-[24px] p-5">
                <p className="divet-kicker text-[11px] font-semibold">Pentru SEO, dar si pentru oameni</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                  Structura clara, categorii curate si subcategorii care ajuta la navigare, nu doar la indexare.
                </p>
              </div>
              <div className="divet-card-soft rounded-[24px] p-5">
                <p className="divet-kicker text-[11px] font-semibold">Design care nu oboseste</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                  Ton editorial cald, tipografie expresiva si un dark mode care pastreaza atmosfera naturala.
                </p>
              </div>
            </div>
          </div>

          {heroPost ? (
            <Link href={getPostUrl(heroPost)} className="group divet-card relative block overflow-hidden rounded-[34px]">
              <div className="relative min-h-[26rem] overflow-hidden sm:min-h-[32rem]">
                {heroPost.featuredImage ? (
                  <Image
                    src={resolveImageUrl(heroPost.featuredImage.url, site.siteUrl)}
                    fill
                    alt={heroPost.featuredImage.altText ?? heroPost.title}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                    sizes="(max-width: 1024px) 100vw, 56vw"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'radial-gradient(circle at top left, var(--dv-accent-soft), transparent 32%), radial-gradient(circle at bottom right, var(--dv-forest-soft), transparent 34%), linear-gradient(135deg, var(--dv-bg-strong), var(--dv-surface-strong))',
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BrandMark className="h-28 w-28 opacity-90" />
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute left-6 top-6 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white backdrop-blur"
                  style={{ background: 'color-mix(in srgb, var(--dv-forest) 68%, transparent)' }}>
                  {heroPost.category?.name ?? 'Articol vedeta'}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <p className="divet-kicker text-[11px] font-semibold text-white/78">Azi in prim plan</p>
                  <h2 className="divet-display mt-3 max-w-2xl text-4xl leading-tight text-white sm:text-5xl">
                    {heroPost.title}
                  </h2>
                  {heroPost.excerpt && (
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82 sm:text-base">
                      {heroPost.excerpt}
                    </p>
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/72">
                    {heroPost.author?.name && <span>{heroPost.author.name}</span>}
                    {heroPost.publishedAt && (
                      <time dateTime={new Date(heroPost.publishedAt).toISOString()}>{formatDate(heroPost.publishedAt)}</time>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="divet-card flex min-h-[30rem] items-center justify-center rounded-[34px] p-8">
              <div className="max-w-md text-center">
                <BrandMark className="mx-auto h-20 w-20" />
                <h2 className="divet-display mt-5 text-4xl text-[color:var(--dv-contrast)]">DiVet este gata de lansare</h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                  Cum apar primele articole, primul ecran devine o coperta editoriala plina de viata.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {editorialPosts.length > 0 && (
        <section className="border-b border-[color:var(--dv-border)] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="divet-kicker text-[11px] font-semibold">Incepe de aici</p>
                <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Lecturi care te trag mai departe</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                In loc de o grila rece, pagina de start pune accent pe cateva povesti bine alese si pe o navigare care te ajuta sa continui.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {editorialPosts.map((post) => (
                <StoryCard key={post.id} post={post} siteUrl={site.siteUrl} />
              ))}
            </div>
          </div>
        </section>
      )}

      {highlightedCategories.length > 0 && (
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="divet-kicker text-[11px] font-semibold">Atlasul DiVet</p>
                <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Categorii construite pentru explorare</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                Caini, pisici, pasari, reptile sau animale salbatice. Fiecare intrare trebuie sa arate ca un raft editorial, nu ca o arhiva arida.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {highlightedCategories.map((category, index) => (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className="group overflow-hidden rounded-[30px] border border-[color:var(--dv-border)] p-6 transition-transform duration-300 hover:-translate-y-1"
                  style={{ background: CATEGORY_TONES[index % CATEGORY_TONES.length] }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="divet-kicker text-[11px] font-semibold">Categorie</p>
                      <h3 className="divet-display mt-3 text-3xl text-[color:var(--dv-contrast)]">{category.name}</h3>
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs text-[color:var(--dv-muted-strong)]"
                      style={{ background: 'color-mix(in srgb, var(--dv-surface-strong) 82%, transparent)' }}>
                      {category._count?.posts ?? 0} articole
                    </span>
                  </div>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                    {category.description || 'Punct de plecare curat pentru rase, tipuri, comportamente si ingrijire.'}
                  </p>
                  <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--dv-contrast)]">
                    Intra in categorie
                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {moreStories.length > 0 && (
        <section className="border-t border-[color:var(--dv-border)] px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="divet-kicker text-[11px] font-semibold">Pastram ritmul</p>
                <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Mai multe povesti din aceeasi lume</h2>
              </div>
              <Link href="/blog" className="divet-button-ghost inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold">
                Rasfoieste arhiva
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {moreStories.map((post) => (
                <StoryCard key={post.id} post={post} siteUrl={site.siteUrl} variant="row" />
              ))}
            </div>
          </div>
        </section>
      )}
    </DivetLayout>
  )
}
