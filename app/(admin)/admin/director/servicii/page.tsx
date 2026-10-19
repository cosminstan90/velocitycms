'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { LISTING_TYPES, TYPE_LABEL, type ListingType } from '@/lib/listings'

type Service = { id: string; name: string; slug: string; _count: { listings: number } }

const input = 'rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white'

export default function ListingServicesPage() {
  const [type, setType] = useState<ListingType>('VET')
  const [services, setServices] = useState<Service[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const [reload, setReload] = useState(0)

  useEffect(() => {
    fetch(`/api/listing-services?type=${type}`)
      .then((r) => (r.ok ? r.json() : { services: [] }))
      .then((d) => setServices(d.services ?? []))
      .catch(() => setServices([]))
  }, [type, reload])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/listing-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setError(data.error ?? 'Nu am putut adăuga serviciul')
    setName('')
    setReload((n) => n + 1)
  }

  async function remove(s: Service) {
    const warning = s._count.listings > 0 ? ` Este folosit de ${s._count.listings} fișe.` : ''
    if (!confirm(`Ștergi serviciul „${s.name}”?${warning}`)) return
    const res = await fetch(`/api/listing-services/${s.id}`, { method: 'DELETE' })
    if (res.ok) setReload((n) => n + 1)
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold text-white">Servicii director</h1>
        <Link href="/admin/director" className="text-sm text-slate-300 hover:text-white">Înapoi la fișe</Link>
      </div>

      <div className="mb-4 flex gap-2">
        {LISTING_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-lg px-3 py-1.5 text-sm ${type === t ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            {TYPE_LABEL[t].plural}
          </button>
        ))}
      </div>

      <form onSubmit={add} className="mb-4 flex gap-2">
        <input className={`${input} flex-1`} placeholder="Serviciu nou" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Adaugă</button>
      </form>
      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

      <ul className="divide-y divide-slate-700/50 rounded-xl border border-slate-700">
        {services.length === 0 ? (
          <li className="px-4 py-4 text-sm text-slate-400">Niciun serviciu.</li>
        ) : (
          services.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="flex-1 text-white">{s.name}</span>
              <span className="text-xs text-slate-500">{s._count.listings} fișe</span>
              <button onClick={() => remove(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400" title="Șterge">
                <Trash2 size={14} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
