'use client'

import Link from 'next/link'
import { useState } from 'react'
import { searchFood, normalizeQuery, type Species } from '@/lib/tools/food-check'

const FIELD =
  'h-11 w-full rounded-md border border-dv-border bg-dv-surface px-3 text-dv-body text-dv-ink focus-visible:outline-2 focus-visible:outline-dv-accent'

type Props = {
  /** Slug-urile articolelor publicate; un rezultat are link doar daca articolul exista. */
  availableSlugs: string[]
}

export default function FoodCheck({ availableSlugs }: Props) {
  const [query, setQuery] = useState('')
  const [species, setSpecies] = useState<Species | ''>('')
  const available = new Set(availableSlugs)

  const typed = normalizeQuery(query).length >= 3
  const results = searchFood(query, species === '' ? null : species)

  return (
    <div className="rounded-[10px] border border-dv-border bg-dv-surface p-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <label className="flex flex-col gap-1 text-dv-meta font-semibold text-dv-ink-muted">
          Aliment sau substanță
          <input className={FIELD} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ex. ciocolată, struguri, crini" autoComplete="off" />
        </label>
        <label className="flex flex-col gap-1 text-dv-meta font-semibold text-dv-ink-muted">
          Animal
          <select className={FIELD} value={species} onChange={(e) => setSpecies(e.target.value as Species | '')}>
            <option value="">Câine sau pisică</option>
            <option value="caine">Câine</option>
            <option value="pisica">Pisică</option>
          </select>
        </label>
      </div>

      <div className="mt-5 min-h-[96px]" aria-live="polite">
        {!typed ? (
          <p className="m-0 text-dv-body text-dv-ink-muted">Scrie cel puțin 3 litere ca să cauți.</p>
        ) : results.length > 0 ? (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {results.map((r) => (
              <li key={r.id} className="rounded-lg border border-dv-alert/40 bg-dv-alert-soft p-4">
                <p className="m-0 text-dv-label font-semibold uppercase text-dv-alert">Periculos</p>
                <p className="mt-1 mb-0 font-dv-display text-[18px] font-semibold text-dv-ink">{r.label}</p>
                <p className="mt-1 mb-0 text-dv-body text-dv-ink">{r.summary}</p>
                {available.has(r.articleSlug) ? (
                  <p className="mt-2 mb-0">
                    <Link href={`/sanatate/substante-toxice/${r.articleSlug}`} className="font-semibold text-dv-accent underline">
                      Citește articolul cu surse
                    </Link>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 rounded-lg border border-dv-border bg-dv-sunken p-4 text-dv-body text-dv-ink">
            Nu avem încă o intrare pentru „{query.trim()}”. <strong>Asta nu înseamnă că este sigur.</strong> Întreabă medicul veterinar înainte să dai animalului alimente noi sau dacă a mâncat deja ceva neobișnuit.
          </p>
        )}
      </div>
    </div>
  )
}
