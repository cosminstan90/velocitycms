import { buildPostPath } from '@/lib/seo/canonical-builder'
import { cardMeta } from '@/lib/fields'
import type { ArticleCardProps } from '@/components/frontend/templates/divet/ArticleCard'

export type PostListItem = {
  title: string
  slug: string
  category: { name: string; slug: string; parent?: { slug: string } | null } | null
  featuredImage: { url: string; altText: string | null } | null
  fieldValues?: Array<{ value: string; fieldDefinition: { fieldKey: string } }>
}

/** Face absolut un URL de media relativ (/media/...); uploadurile sunt servite de aplicatie la runtime. */
export function resolveMediaUrl(url: string, siteUrl: string): string {
  if (url.startsWith('/')) return `${siteUrl.replace(/\/$/, '')}${url}`
  return url
}

/** Proprietatile cardului unui articol din liste: link, kicker, linia de metadate, imagine. */
export function toCardProps(post: PostListItem, siteUrl: string): ArticleCardProps {
  return {
    href: buildPostPath({ slug: post.slug }, post.category),
    title: post.title,
    kicker: post.category?.name ?? null,
    meta: cardMeta(post.fieldValues ?? []),
    image: post.featuredImage
      ? { url: resolveMediaUrl(post.featuredImage.url, siteUrl), alt: post.featuredImage.altText ?? post.title }
      : null,
  }
}
