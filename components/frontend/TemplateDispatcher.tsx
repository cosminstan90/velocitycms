/**
 * Template dispatchers — pick the right template component based on site.template.
 * Add a new import + case here whenever a new template is created.
 *
 * NavCategories: All dispatchers accept an optional `categories` prop for
 * templates that render their own navigation (e.g. Fauna). Templates that
 * don't need it simply ignore the prop via rest-spreading.
 */

import DefaultHomepage from './templates/default/HomepageTemplate'
import MinimalHomepage from './templates/minimal/HomepageTemplate'

import DefaultArticle from './templates/default/ArticleTemplate'
import MinimalArticle from './templates/minimal/ArticleTemplate'

import DefaultCategory from './templates/default/CategoryTemplate'
import MinimalCategory from './templates/minimal/CategoryTemplate'
import FaunaHomepage    from './templates/fauna/HomepageTemplate'
import FaunaArticle     from './templates/fauna/ArticleTemplate'
import FaunaCategory    from './templates/fauna/CategoryTemplate'
import FaunaComparison  from './templates/fauna/ComparisonTemplate'
import FaunaAuthor      from './templates/fauna/AuthorTemplate'
import FaunaTag         from './templates/fauna/TagTemplate'
import FaunaSearch      from './templates/fauna/SearchTemplate'

import AuthorShared from './shared/AuthorPageTemplate'
import TagShared    from './shared/TagPageTemplate'

// Shared extra props that templates with their own nav layout can use
type NavCategoryItem = { id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }

// ── Homepage ──────────────────────────────────────────────────────────────────

type HomepageProps = React.ComponentProps<typeof DefaultHomepage>

export function HomepageDispatcher({ template, ...props }: HomepageProps & { template: string }) {
  switch (template) {
    case 'minimal': return <MinimalHomepage {...props} />
    case 'fauna':   return <FaunaHomepage   {...props} />
    default:        return <DefaultHomepage {...props} />
  }
}

// ── Article ───────────────────────────────────────────────────────────────────

type ArticleProps = React.ComponentProps<typeof DefaultArticle>
type ArticleDispatcherProps = ArticleProps & {
  template: string
  categories?: NavCategoryItem[]
}

export function ArticleDispatcher({ template, categories, ...props }: ArticleDispatcherProps) {
  switch (template) {
    case 'minimal': return <MinimalArticle {...props} />
    case 'fauna':   return <FaunaArticle   {...props} categories={categories} />
    default:        return <DefaultArticle {...props} />
  }
}

// ── Category ──────────────────────────────────────────────────────────────────

type CategoryProps = React.ComponentProps<typeof DefaultCategory>
type CategoryDispatcherProps = CategoryProps & {
  template: string
  categories?: NavCategoryItem[]
}

export function CategoryDispatcher({ template, categories, ...props }: CategoryDispatcherProps) {
  switch (template) {
    case 'minimal': return <MinimalCategory {...props} />
    case 'fauna':   return <FaunaCategory   {...props} categories={categories} />
    default:        return <DefaultCategory {...props} />
  }
}

// ── Comparison ─────────────────────────────────────────────────────────────

type ComparisonProps = React.ComponentProps<typeof FaunaComparison>

export function ComparisonDispatcher({ template, ...props }: ComparisonProps & { template: string }) {
  switch (template) {
    case 'fauna':   return <FaunaComparison {...props} />
    default:        return <FaunaComparison {...props} />
  }
}

// ── Author ────────────────────────────────────────────────────────────────────

type AuthorFaunaProps = React.ComponentProps<typeof FaunaAuthor>
type AuthorDispatcherProps = Omit<AuthorFaunaProps, 'categories'> & {
  template: string
  categories?: NavCategoryItem[]
}

export function AuthorDispatcher({ template, categories, ...props }: AuthorDispatcherProps) {
  switch (template) {
    case 'fauna': return <FaunaAuthor {...props} categories={categories} />
    default:      return <AuthorShared template={template} {...props} />
  }
}

// ── Tag ───────────────────────────────────────────────────────────────────────

type TagFaunaProps = React.ComponentProps<typeof FaunaTag>
type TagDispatcherProps = Omit<TagFaunaProps, 'categories'> & {
  template: string
  categories?: NavCategoryItem[]
}

export function TagDispatcher({ template, categories, ...props }: TagDispatcherProps) {
  switch (template) {
    case 'fauna': return <FaunaTag {...props} categories={categories} />
    default:      return <TagShared template={template} {...props} />
  }
}

// ── Search ────────────────────────────────────────────────────────────────────

type SearchFaunaProps = React.ComponentProps<typeof FaunaSearch>
type SearchDispatcherProps = Omit<SearchFaunaProps, 'categories'> & {
  template: string
  categories?: NavCategoryItem[]
}

export function SearchDispatcher({ template, categories, ...props }: SearchDispatcherProps) {
  // Search always uses the fauna template (no default/minimal variant yet)
  return <FaunaSearch {...props} categories={categories} />
}
