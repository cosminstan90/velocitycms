/**
 * DiVet — AuthorTemplate (/autor/[slug])
 *
 * Breadcrumbs, antet cu avatar, nume, titlu, bio, site, numar articole,
 * grila PostGrid si paginare. Server component, doar token-uri dv-*.
 */

import Image from 'next/image'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import PostGrid from './PostGrid'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import { resolveImageUrl } from '../fauna/utils'
import { buildAuthorSchema } from '@/lib/seo/author-schema'

interface PostItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  featuredImage: { url: string; altText: string | null } | null
  author: { name: string | null } | null
  category: { name: string; slug: string; parent?: { name: string; slug: string } | null } | null
  fieldValues?: Array<{ value: string; fieldDefinition: { fieldKey: string } }>
}

interface DivetAuthorTemplateProps {
  author: {
    name: string | null
    slug: string | null
    title: string | null
    bio: string | null
    photo: string | null
    website: string | null
  }
  posts: PostItem[]
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  // LEGACY — ignorat, pastrat pentru compatibilitatea cu dispatcher-ul
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  // LEGACY — ignorat
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

function initials(name: string): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => Array.from(w)[0] ?? '')
    .join('')
  return letters.toUpperCase() || '?'
}

/** Site-ul autorului e text introdus de utilizator: acceptam doar http(s). */
function safeWebsite(raw: string | null): { href: string; host: string } | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return { href: u.href, host: u.hostname }
  } catch {
    return null
  }
}

export default function DivetAuthor({ author, posts, pagination, site }: DivetAuthorTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const name = author.name ?? 'Autor'
  const website = safeWebsite(author.website)

  return (
    <DivetLayout site={{ siteName: site.siteName, siteUrl: site.siteUrl }}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs
          items={[
            { name: 'Acasă', href: '/' },
            { name, href: author.slug ? `/autor/${author.slug}` : '/autor' },
          ]}
        />

        <header className="mt-6 flex flex-col items-start gap-5 sm:flex-row sm:gap-6">
          {author.photo ? (
            <Image
              src={resolveImageUrl(author.photo, site.siteUrl)}
              alt={name}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-dv-accent font-dv-display text-[28px] font-bold text-dv-accent-on"
            >
              {initials(name)}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="m-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
              {name}
            </h1>
            {author.title ? <p className="mt-2 mb-0 text-dv-body text-dv-ink-muted">{author.title}</p> : null}
            {author.bio ? <p className="mt-3 mb-0 max-w-[70ch] text-dv-body text-dv-ink-muted">{author.bio}</p> : null}
            {website ? (
              <p className="mt-3 mb-0 text-dv-meta">
                <a
                  href={website.href}
                  rel="noopener noreferrer nofollow"
                  target="_blank"
                  className="text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent"
                >
                  {website.host}
                </a>
              </p>
            ) : null}
            <p className="mt-3 mb-0 text-dv-meta text-dv-ink-subtle">
              {totalCount === 1 ? '1 articol' : `${totalCount} articole`}
            </p>
          </div>
        </header>

        <div className="mt-8">
          {posts.length === 0 ? (
            <EmptyState
              title="Încă nu avem articole publicate de acest autor."
              description="Revino curând sau caută în restul enciclopediei."
            />
          ) : (
            <PostGrid posts={posts} siteUrl={site.siteUrl} />
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          basePath={author.slug ? `/autor/${author.slug}` : '/autor'}
        />
      </div>
      {author.slug ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildAuthorSchema(author, site.siteUrl, site.siteName)).replace(/</g, '\\u003c') }}
        />
      ) : null}
    </DivetLayout>
  )
}
