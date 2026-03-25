'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console in dev; swap for a real error service in production
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-gray-200 select-none">500</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Ceva a mers prost</h1>
        <p className="mt-3 text-gray-500 text-sm leading-relaxed">
          A apărut o eroare neașteptată. Te rugăm să încerci din nou sau să revii pe pagina principală.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-gray-400 font-mono">
            ID eroare: {error.digest}
          </p>
        )}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Încearcă din nou
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            ← Acasă
          </Link>
        </div>
      </div>
    </div>
  )
}
