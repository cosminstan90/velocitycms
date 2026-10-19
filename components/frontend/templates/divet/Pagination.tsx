import Link from 'next/link'
import { buildPaginationItems } from '../fauna/utils'

function pageHref(basePath: string, page: number): string {
  if (page === 1) return basePath
  return `${basePath}${basePath.includes('?') ? '&' : '?'}page=${page}`
}

const ITEM =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-[9px] border border-dv-border bg-dv-surface px-3 text-dv-meta text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function Pagination({
  currentPage,
  totalPages,
  basePath,
}: {
  currentPage: number
  totalPages: number
  basePath: string
}) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginare" className="mt-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {currentPage > 1 ? (
          <Link href={pageHref(basePath, currentPage - 1)} className={ITEM}>
            Înapoi
          </Link>
        ) : null}
        {buildPaginationItems(currentPage, totalPages).map((item, i) =>
          item === '...' ? (
            <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-dv-ink-subtle">
              …
            </span>
          ) : item === currentPage ? (
            <span
              key={item}
              aria-current="page"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[9px] border border-dv-accent bg-dv-accent px-3 text-dv-meta font-semibold text-dv-accent-on"
            >
              {item}
            </span>
          ) : (
            <Link key={item} href={pageHref(basePath, item)} className={ITEM}>
              {item}
            </Link>
          ),
        )}
        {currentPage < totalPages ? (
          <Link href={pageHref(basePath, currentPage + 1)} className={ITEM}>
            Înainte
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
