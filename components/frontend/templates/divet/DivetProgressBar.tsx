'use client'

import { useEffect, useState } from 'react'

export default function DivetProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function update() {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)) : 0)
    }
    const frame = requestAnimationFrame(update)
    window.addEventListener('scroll', update, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
    }
  }, [])

  return (
    <div aria-hidden="true" className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-dv-border/60">
      <div
        className="h-full bg-dv-accent transition-[width] duration-100 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
