import { useId } from 'react'
import { ratingToPercent, type FieldItem } from '@/lib/fields'

export default function BehaviorProfile({
  items,
  heading = 'Profil comportamental',
}: {
  items: FieldItem[]
  heading?: string
}) {
  const id = useId()
  const rows = items
    .map((i) => ({ ...i, percent: ratingToPercent(i.value) }))
    .filter((r): r is FieldItem & { percent: number } => r.percent !== null)
  if (rows.length === 0) return null

  return (
    <section aria-labelledby={id} className="rounded-[10px] border border-dv-border bg-dv-surface px-[22px] py-[19px]">
      <h2 id={id} className="mb-[13px] font-dv-display text-[15px] font-semibold tracking-[-0.01em]">
        {heading}
      </h2>
      <div className="flex flex-col gap-[14px]">
        {rows.map((row) => (
          <div key={row.key}>
            <div className="mb-[6px] flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-dv-ink">{row.label}</span>
              <span className="text-[13px] font-semibold text-dv-accent">{row.value}</span>
            </div>
            <div aria-hidden="true" className="h-1.5 rounded-[3px] bg-dv-sunken">
              <div className="h-1.5 rounded-[3px] bg-dv-accent" style={{ width: `${row.percent}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
