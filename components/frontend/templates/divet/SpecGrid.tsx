import { useId } from 'react'
import type { FieldItem } from '@/lib/fields'

export default function SpecGrid({
  items,
  heading = 'Caracteristicile rasei',
}: {
  items: FieldItem[]
  heading?: string
}) {
  const id = useId()
  if (items.length === 0) return null

  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-[13px] font-dv-display text-[15px] font-semibold tracking-[-0.01em]">
        {heading}
      </h2>
      <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.key} className="rounded-lg border border-dv-border bg-dv-surface px-[17px] py-[14px]">
            <dt className="mb-[6px] text-dv-label font-semibold uppercase text-dv-ink-muted">{item.label}</dt>
            <dd
              className={
                item.value.length <= 24
                  ? 'm-0 font-dv-display text-[20px] font-semibold tracking-[-0.02em] text-dv-ink'
                  : 'm-0 font-dv-display text-[15px] font-semibold leading-snug tracking-[-0.02em] text-dv-ink'
              }
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
