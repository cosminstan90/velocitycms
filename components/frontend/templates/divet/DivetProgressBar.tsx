'use client'

import { useEffect, useState } from 'react'

const MOSS = '#4a8a4a'
const GOLD = '#c4893a'

export default function DivetProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const scrollTop  = window.scrollY
      const docHeight  = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) setProgress(Math.min(100, (scrollTop / docHeight) * 100))
    }
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <div
      className="fixed left-0 right-0 z-40"
      style={{ top: '52px', height: '3px', backgroundColor: 'rgba(26,46,28,0.1)' }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progres citire"
    >
      <div
        className="h-full transition-[width] duration-100 ease-out"
        style={{
          width: `${progress}%`,
          background: `linear-gradient(to right, ${MOSS}, ${GOLD})`,
        }}
      />
    </div>
  )
}
