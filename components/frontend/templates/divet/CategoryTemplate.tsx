import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { StoryCard, type NavCategoryItem, type StoryPost, formatDate, getPostUrl, resolveImageUrl } from './utils'

interface CategoryTemplateProps {
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  subcategories: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    _count: { posts: number }
  }>
  posts: StoryPost[]
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  categories?: NavCategoryItem[]
  parentCategory?: { name: string; slug: string } | null
  seoSettings?: { siteName?: string; defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

function paginationUrl(page: number, categorySlug: string, parentCategory?: { slug: string } | null) {
  const basePath = parentCategory ? `/${parentCategory.slug}/${categorySlug}` : categorySlug === 'blog' ? '/blog' : `/${categorySlug}`
  if (page <= 1) return basePath
  return `${basePath}?page=${page}`
}

export default function DivetCategoryTemplate({
  category,
  subcategories,
  posts,
  pagination,
  site,
  categories = [],
  parentCategory,
  seoSettings,
}: CategoryTemplateProps) {
  const leadPost = posts[0] ?? null
  const listPosts = posts.slice(1)
  const pageTitle = category.metaTitle ?? category.name
  const pageDescription =
    category.metaDesc ??
    category.description ??
    (category.slug === 'blog'
      ? 'Articole noi, clare si usor de parcurs, gandite pentru cautare si pentru lectura reala.'
      : `O selectie de articole, subcategorii si directii utile din ${category.name}.`)

  return (
    <DivetLayout site={site} categories={categories} activeCategory={parentCategory?.slug ?? category.slug} seoSettings={seoSettings}>
      <section className="border-b border-[color:var(--dv-border)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--dv-muted)]">
              <li><Link href="/" className="transition-colors hover:text-[color:var(--dv-contrast)]">{site.siteName}</Link></li>
              {parentCategory && (
                <>
                  <li aria-hidden="true">/</li>
                  <li><Link href={`/${parentCategory.slug}`} className="transition-colors hover:text-[color:var(--dv-contrast)]">{parentCategory.name}</Link></li>
                </>
              )}
              <li aria-hidden="true">/</li>
              <li className="text-[color:var(--dv-muted-strong)]" aria-current="page">{category.name}</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="divet-kicker text-[11px] font-semibold">
                {parentCategory ? `Subcategorie din ${parentCategory.name}` : category.slug === 'blog' ? 'Arhiva editoriala' : 'Categorie DiVet'}
              </p>
              <h1 className="divet-display mt-4 text-5xl leading-[0.94] text-[color:var(--dv-contrast)] sm:text-6xl lg:text-[4.7rem]">
                {pageTitle}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[color:var(--dv-muted-strong)] sm:text-lg">
                {pageDescription}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="divet-chip rounded-full px-4 py-2 text-sm">{pagination.totalCount} articole</span>
                {subcategories.length > 0 && (
                  <span className="divet-chip rounded-full px-4 py-2 text-sm">{subcategories.length} subcategorii</span>
                )}
                <Link href="/cautare" className="divet-button-ghost rounded-full px-4 py-2 text-sm font-semibold">
                  Cauta in DiVet
                </Link>
              </div>
            </div>

            {leadPost ? (
              <Link href={getPostUrl(leadPost)} className="group divet-card overflow-hidden rounded-[32px]">
                <div className="grid gap-0 md:grid-cols-[minmax(0,1.12fr)_minmax(260px,0.88fr)]">
                  <div className="relative min-h-[280px] overflow-hidden">
                    {leadPost.featuredImage ? (
                      <Image
                        src={resolveImageUrl(leadPost.featuredImage.url, site.siteUrl)}
                        fill
                        alt={leadPost.featuredImage.altText ?? leadPost.title}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 54vw"
                        priority
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'radial-gradient(circle at top left, var(--dv-accent-soft), transparent 30%), radial-gradient(circle at bottom right, var(--dv-forest-soft), transparent 34%), linear-gradient(135deg, var(--dv-bg-strong), var(--dv-surface-strong))',
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                  </div>
                  <div className="flex flex-col justify-between gap-5 p-6 sm:p-8">
                    <div>
                      <p className="divet-kicker text-[11px] font-semibold">Articol de intrare</p>
                      <h2 className="divet-display mt-3 text-3xl leading-tight text-[color:var(--dv-contrast)]">
                        {leadPost.title}
                      </h2>
                      {leadPost.excerpt && (
                        <p className="mt-4 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                          {leadPost.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[color:var(--dv-muted)]">
                      {leadPost.author?.name && <span>{leadPost.author.name}</span>}
                      {leadPost.publishedAt && (
                        <time dateTime={new Date(leadPost.publishedAt).toISOString()}>{formatDate(leadPost.publishedAt)}</time>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="divet-card flex min-h-[320px] items-center justify-center rounded-[32px] p-8 text-center">
                <div className="max-w-md">
                  <p className="divet-kicker text-[11px] font-semibold">Spatiu pregatit pentru continut</p>
                  <h2 className="divet-display mt-4 text-4xl text-[color:var(--dv-contrast)]">Categoria este gata sa creasca</h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                    Cum apar primele materiale, sectiunea aceasta devine un punct editorial de intrare in universul categoriei.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {subcategories.length > 0 && (
        <section className="border-b border-[color:var(--dv-border)] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="divet-kicker text-[11px] font-semibold">Tipuri si directii</p>
                <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">
                  {parentCategory ? `Intra mai adanc in ${category.name}` : `Subcategorii din ${category.name}`}
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                Pentru DiVet, subcategoriile trebuie sa functioneze ca rafturi editoriale clare: mici, de vanatoare, de paza, de familie si mai departe.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {subcategories.map((subCategory, index) => (
                <Link
                  key={subCategory.id}
                  href={parentCategory ? `/${parentCategory.slug}/${category.slug}/${subCategory.slug}` : `/${category.slug}/${subCategory.slug}`}
                  className="group overflow-hidden rounded-[28px] border border-[color:var(--dv-border)] p-6 transition-transform duration-300 hover:-translate-y-1"
                  style={{
                    background:
                      index % 2 === 0
                        ? 'linear-gradient(135deg, rgba(36, 88, 64, 0.14), rgba(255, 249, 240, 0.72))'
                        : 'linear-gradient(135deg, rgba(199, 123, 45, 0.16), rgba(255, 249, 240, 0.72))',
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="divet-display text-3xl text-[color:var(--dv-contrast)]">{subCategory.name}</h3>
                    <span className="rounded-full px-3 py-1 text-xs text-[color:var(--dv-muted-strong)]"
                      style={{ background: 'color-mix(in srgb, var(--dv-surface-strong) 84%, transparent)' }}>
                      {subCategory._count.posts}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                    {subCategory.description || 'Subcategorie gandita pentru navigare clara si pagini de intrare mai usor de parcurs.'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="divet-kicker text-[11px] font-semibold">Selectie curenta</p>
              <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Articole din {category.name}</h2>
            </div>
            <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">
              Pagina trebuie sa ramana curata si buna de citit chiar si cand inventarul creste.
            </p>
          </div>

          {listPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listPosts.map((post) => (
                <StoryCard key={post.id} post={post} siteUrl={site.siteUrl} />
              ))}
            </div>
          ) : leadPost ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              <StoryCard post={leadPost} siteUrl={site.siteUrl} />
            </div>
          ) : (
            <div className="divet-card-soft rounded-[30px] p-8 text-center">
              <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                Inca nu exista articole publicate in aceasta categorie.
              </p>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Paginare articole">
              {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => {
                const active = page === pagination.currentPage
                return (
                  <Link
                    key={page}
                    href={paginationUrl(page, category.slug, parentCategory)}
                    className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
                      active ? 'text-white' : 'text-[color:var(--dv-muted-strong)]'
                    }`}
                    style={active ? { background: 'var(--dv-accent-strong)' } : { background: 'color-mix(in srgb, var(--dv-surface) 78%, transparent)', border: '1px solid var(--dv-border)' }}
                  >
                    {page}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
      </section>
    </DivetLayout>
  )
}
