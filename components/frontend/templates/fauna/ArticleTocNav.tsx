'use client'

import { useEffect, useState } from 'react'

interface TocEntry { text: string; id: string }

export default function ArticleTocNav({
  toc,
  variant,
}: {
  toc: TocEntry[]
  variant: 'mobile' | 'desktop'
}) {
  const [activeTocId, setActiveTocId] = useState<string>('')

  useEffect(() => {
    const OFFSET = 96
    function update() {
      const scrollY = window.scrollY + OFFSET
      let current = toc[0]?.id ?? ''
      for (const { id } of toc) {
        const el = document.getElementById(id)
        if (el && el.offsetTop <= scrollY) current = id
      }
      setActiveTocId(current)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [toc])

  if (variant === 'mobile') {
    return (
      <nav
        aria-label="Cuprins"
        className="mb-8 p-5 bg-white border border-gray-200 rounded-2xl lg:hidden shadow-sm"
      >
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Cuprins</h2>
        <ol className="space-y-2">
          {toc.map((entry, i) => {
            const isActive = activeTocId === entry.id
            return (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-baseline gap-2.5 text-sm transition-colors group ${
                    isActive ? 'text-amber-700 font-semibold' : 'text-gray-600 hover:text-amber-700'
                  }`}
                >
                  <span className={`text-xs tabular-nums w-5 text-right flex-shrink-0 font-mono ${
                    isActive ? 'text-amber-500' : 'text-gray-400 group-hover:text-amber-500'
                  }`}>
                    {i + 1}.
                  </span>
                  <span className="hover:underline leading-snug">{entry.text}</span>
                </a>
              </li>
            )
          })}
        </ol>
      </nav>
    )
  }

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Cuprins</h2>
      <ol className="space-y-1">
        {toc.map((entry, i) => {
          const isActive = activeTocId === entry.id
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-baseline gap-2.5 text-sm transition-colors group rounded-lg px-2 py-1.5 -mx-2 ${
                  isActive
                    ? 'text-amber-700 font-semibold bg-amber-50'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-gray-50'
                }`}
              >
                <span className={`text-[11px] tabular-nums w-5 text-right flex-shrink-0 font-mono ${
                  isActive ? 'text-amber-500' : 'text-gray-400 group-hover:text-amber-500'
                }`}>
                  {i + 1}.
                </span>
                <span className="leading-snug">{entry.text}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
