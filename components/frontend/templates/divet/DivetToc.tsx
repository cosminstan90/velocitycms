interface TocEntry {
  text: string
  id: string
}

export default function DivetToc({ entries }: { entries: TocEntry[] }) {
  if (entries.length === 0) return null

  return (
    <nav
      aria-label="Cuprins"
      className="rounded-[10px] border border-dv-border bg-dv-surface px-[22px] py-[19px]"
    >
      <p className="mb-3 text-dv-label font-semibold uppercase text-dv-ink-muted">Cuprins</p>
      <ol className="space-y-2">
        {entries.map((entry, i) => (
          <li key={entry.id} className="flex items-baseline gap-3">
            <span className="w-5 shrink-0 text-right text-dv-meta text-dv-ink-subtle">{i + 1}.</span>
            <a
              href={`#${entry.id}`}
              className="text-[14px] leading-snug text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
