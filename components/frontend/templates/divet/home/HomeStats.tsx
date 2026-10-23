import type { HomeData } from '@/lib/home'

function formatDate(value: Date | string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Banda de incredere de sub hero: cifre reale, nu sloganuri. */
export default function HomeStats({ home }: { home: HomeData }) {
  const updated = formatDate(home.updatedAt)
  const items: Array<{ value: string; label: string }> = [
    { value: String(home.totalPosts), label: home.totalPosts === 1 ? 'fișă publicată' : 'fișe publicate' },
    { value: String(home.groups.length), label: home.groups.length === 1 ? 'grup de animale' : 'grupuri de animale' },
    { value: String(home.groups.reduce((n, g) => n + g.children.length, 0)), label: 'categorii și subcategorii' },
  ]
  if (updated) items.push({ value: updated, label: 'ultima actualizare' })

  return (
    <section aria-label="DiVet în cifre" className="border-y border-dv-border bg-dv-surface">
      <dl className="m-0 mx-auto grid w-full max-w-[1100px] grid-cols-2 gap-y-5 px-4 py-6 sm:grid-cols-4 md:px-10">
        {items.map((it, i) => (
          <div key={it.label} className={`flex flex-col-reverse justify-end gap-0.5 px-1 sm:px-6 ${i > 0 ? 'sm:border-l sm:border-dv-border' : 'sm:pl-0'}`}>
            <dt className="text-[12px] font-medium text-dv-ink-muted">{it.label}</dt>
            <dd className="m-0 font-dv-display text-[26px] leading-tight font-bold tracking-[-0.02em] text-dv-ink">{it.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
