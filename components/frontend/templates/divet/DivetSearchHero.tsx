'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MOSS   = '#4a8a4a'
const CREAM  = '#f6f1e6'
const FOREST = '#1a2e1c'

const PLACEHOLDERS = [
  'Labrador Retriever...', 'Leu african...', 'Bufniță de zăpadă...',
  'Delfin cu bot sticlos...', 'Vulpe arctică...', 'Girafă...', 'Rechin alb...',
]

export default function DivetSearchHero() {
  const router  = useRouter()
  const [query, setQuery]   = useState('')
  const [phIdx, setPhIdx]   = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPhIdx((i) => (i + 1) % PLACEHOLDERS.length), 2600)
    return () => clearInterval(id)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/cautare?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-0 w-full max-w-[540px]">
      <div className="flex-1 relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={PLACEHOLDERS[phIdx]}
          className="w-full h-[52px] px-5 text-sm outline-none"
          style={{
            backgroundColor: 'white',
            color: FOREST,
            borderRadius: '50px 0 0 50px',
            fontFamily: '"DM Sans", sans-serif',
            border: 'none',
          }}
          aria-label="Caută animale"
        />
      </div>
      <button
        type="submit"
        className="h-[52px] px-7 font-semibold text-sm transition-opacity hover:opacity-90"
        style={{
          backgroundColor: MOSS,
          color: CREAM,
          borderRadius: '0 50px 50px 0',
          fontFamily: '"DM Sans", sans-serif',
          whiteSpace: 'nowrap',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Caută
      </button>
    </form>
  )
}
