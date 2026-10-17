import Link from 'next/link'

export type Crumb = { name: string; href: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null
  const lastIndex = items.length - 1

  return (
    <nav aria-label="Firimituri">
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0 text-[13px] text-dv-ink-muted">
        {items.map((item, i) => (
          <li key={`${item.href}-${i}`} className="flex min-w-0 items-center gap-x-2">
            {i === lastIndex ? (
              <span aria-current="page" className="break-words text-dv-ink">
                {item.name}
              </span>
            ) : (
              <>
                <Link
                  href={item.href}
                  className="break-words hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                >
                  {item.name}
                </Link>
                <span aria-hidden="true" className="text-dv-ink-subtle">
                  /
                </span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
