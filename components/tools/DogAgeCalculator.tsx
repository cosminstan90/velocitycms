'use client'

import { useState } from 'react'
import { dogAgeInHumanYears, toDogYears, DOG_AGE_STUDY_MAX } from '@/lib/tools/dog-age'

const FIELD =
  'h-11 w-full rounded-md border border-dv-border bg-dv-surface px-3 text-dv-body text-dv-ink focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function DogAgeCalculator() {
  const [years, setYears] = useState('')
  const [months, setMonths] = useState('')

  const y = years === '' ? 0 : Number(years)
  const m = months === '' ? 0 : Number(months)
  const touched = years !== '' || months !== ''
  const valid = Number.isFinite(y) && Number.isFinite(m) && y >= 0 && m >= 0 && m < 12
  const result = touched && valid ? dogAgeInHumanYears(toDogYears(y, m)) : null

  return (
    <form onSubmit={(e) => e.preventDefault()} className="rounded-[10px] border border-dv-border bg-dv-surface p-5" aria-label="Calculator vârsta câinelui">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-dv-meta font-semibold text-dv-ink-muted">
          Ani
          <input className={FIELD} type="number" inputMode="numeric" min={0} max={25} step={1} value={years} onChange={(e) => setYears(e.target.value)} placeholder="ex. 4" />
        </label>
        <label className="flex flex-col gap-1 text-dv-meta font-semibold text-dv-ink-muted">
          Luni (0–11)
          <input className={FIELD} type="number" inputMode="numeric" min={0} max={11} step={1} value={months} onChange={(e) => setMonths(e.target.value)} placeholder="ex. 6" />
        </label>
      </div>

      <div className="mt-5 min-h-[88px]" aria-live="polite">
        {result ? (
          <>
            <p className="m-0 font-dv-display text-[32px] font-bold tracking-tight text-dv-accent">≈ {result.humanYears} de ani umani</p>
            <p className="mt-1 mb-0 text-dv-meta text-dv-ink-muted">
              Rezultat orientativ, calculat cu formula 16 · ln(vârsta) + 31.
              {result.extrapolated ? ` Studiul a inclus câini până la ${DOG_AGE_STUDY_MAX} ani; peste această vârstă valoarea este o extrapolare.` : ''}
            </p>
          </>
        ) : touched ? (
          <p className="m-0 text-dv-body text-dv-ink-muted">Introdu o vârstă între 3 luni și 25 de ani (luni: 0–11).</p>
        ) : (
          <p className="m-0 text-dv-body text-dv-ink-muted">Introdu vârsta câinelui ca să vezi echivalentul în ani umani.</p>
        )}
      </div>
    </form>
  )
}
