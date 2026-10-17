import Link from 'next/link'

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: { label: string; href: string }
}) {
  return (
    <div className="rounded-[10px] bg-dv-sunken px-6 py-14 text-center">
      <p className="m-0 font-dv-display text-dv-title font-semibold text-dv-ink">{title}</p>
      <p className="mx-auto mt-2 mb-0 max-w-[44ch] text-dv-body text-dv-ink-muted">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-[18px] inline-flex min-h-11 items-center rounded-md bg-dv-accent px-5 text-[14px] font-semibold text-dv-accent-on focus-visible:outline-2 focus-visible:outline-dv-accent"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
