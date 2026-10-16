'use client'

import { useState } from 'react'

const FOREST     = '#1a2e1c'
const MOSS       = '#4a8a4a'
const CREAM_WARM = '#ede6d3'
const TEXT       = '#1a1e16'
const TEXT_MUTED = '#6b7a65'

interface TocEntry { text: string; id: string }

export default function DivetToc({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string | null>(null)

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.pageYOffset - 80
    window.scrollTo({ top, behavior: 'smooth' })
    setActive(id)
  }

  return (
    <nav
      className="mb-10 p-5 rounded-2xl"
      style={{ backgroundColor: CREAM_WARM, border: `1px solid rgba(26,46,28,0.08)` }}
      aria-label="Cuprins"
    >
      <p
        className="text-xs font-bold uppercase tracking-widest mb-3"
        style={{ color: TEXT_MUTED }}
      >
        Cuprins
      </p>
      <ol className="space-y-2">
        {entries.map((entry, i) => (
          <li key={entry.id} className="flex items-baseline gap-3">
            <span className="text-xs font-semibold flex-shrink-0 w-5 text-right" style={{ color: TEXT_MUTED }}>
              {i + 1}.
            </span>
            <button
              onClick={() => scrollTo(entry.id)}
              className="text-sm text-left transition-colors leading-snug"
              style={{
                color: active === entry.id ? FOREST : TEXT_MUTED,
                fontWeight: active === entry.id ? 600 : 400,
                fontFamily: '"DM Sans", sans-serif',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {entry.text}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
