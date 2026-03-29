'use client'

import { useState, useRef } from 'react'

export default function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = inputRef.current?.value.trim() ?? ''
    if (!email) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        setStatus('success')
      } else {
        setErrorMsg(data.message ?? 'A apărut o eroare. Încearcă din nou.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Nu m-am putut conecta. Încearcă din nou.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-white font-bold text-lg">Mulțumim!</p>
        <p className="text-amber-100 text-sm">Te-am adăugat pe lista noastră. Abia așteptăm să-ți trimitem noutăți!</p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
      noValidate
    >
      <label htmlFor="newsletter-email" className="sr-only">Adresă email</label>
      <input
        id="newsletter-email"
        ref={inputRef}
        type="email"
        required
        placeholder="adresa@email.com"
        disabled={status === 'loading'}
        className="flex-1 px-5 py-3.5 rounded-xl bg-white/90 text-gray-900 placeholder:text-gray-400 text-sm font-medium outline-none focus:ring-2 focus:ring-white shadow-sm disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-3.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
      >
        {status === 'loading' ? 'Se procesează...' : 'Abonează-te'}
      </button>
      {status === 'error' && (
        <p className="sm:col-span-2 text-amber-100 text-xs mt-1 text-center" role="alert">
          {errorMsg}
        </p>
      )}
    </form>
  )
}
