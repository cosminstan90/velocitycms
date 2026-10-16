import { useId } from 'react'
import Link from 'next/link'
import ArticleCard, { type ArticleCardProps } from './ArticleCard'

export default function RelatedArticles({
  categoryName,
  categoryHref,
  posts,
}: {
  categoryName: string
  categoryHref: string
  posts: ArticleCardProps[]
}) {
  const id = useId()
  // Deliberate: with fewer than 3 posts, no section beats one lonely card.
  if (posts.length < 3) return null

  return (
    <section aria-labelledby={id} className="border-t border-dv-border pt-[22px]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="m-0 font-dv-display text-[22px] font-semibold tracking-tight text-dv-ink">
          Mai multe din {categoryName}
        </h2>
        <Link
          href={categoryHref}
          className="text-[14px] font-semibold text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent"
        >
          Vezi toată categoria
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {posts.slice(0, 6).map((post) => (
          <ArticleCard key={post.href} {...post} />
        ))}
      </div>
    </section>
  )
}
