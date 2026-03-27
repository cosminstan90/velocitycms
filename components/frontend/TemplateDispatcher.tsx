/**
 * Template dispatchers — pick the right template component based on site.template.
 * Add a new import + case here whenever a new template is created.
 */

import DefaultHomepage from './templates/default/HomepageTemplate'
import MinimalHomepage from './templates/minimal/HomepageTemplate'

import DefaultArticle from './templates/default/ArticleTemplate'
import MinimalArticle from './templates/minimal/ArticleTemplate'

import DefaultCategory from './templates/default/CategoryTemplate'
import MinimalCategory from './templates/minimal/CategoryTemplate'
import FaunaHomepage  from './templates/fauna/HomepageTemplate'
import FaunaArticle   from './templates/fauna/ArticleTemplate'
import FaunaCategory  from './templates/fauna/CategoryTemplate'

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

export function ArticleDispatcher({ template, ...props }: ArticleProps & { template: string }) {
  switch (template) {
    case 'minimal': return <MinimalArticle {...props} />
    case 'fauna':   return <FaunaArticle   {...props} />
    default:        return <DefaultArticle {...props} />
  }
}

// ── Category ──────────────────────────────────────────────────────────────────

type CategoryProps = React.ComponentProps<typeof DefaultCategory>

export function CategoryDispatcher({ template, ...props }: CategoryProps & { template: string }) {
  switch (template) {
    case 'minimal': return <MinimalCategory {...props} />
    case 'fauna':   return <FaunaCategory   {...props} />
    default:        return <DefaultCategory {...props} />
  }
}
