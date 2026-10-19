'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DAYS, DAY_LABEL, LISTING_TYPES, TYPE_LABEL, parseOpeningHours, type Day, type ListingType } from '@/lib/listings'

type HoursRow = { closed: boolean; from: string; to: string }
type Service = { id: string; name: string }

type FormState = {
  type: ListingType
  name: string
  county: string
  city: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  status: 'DRAFT' | 'PUBLISHED'
  serviceIds: string[]
  hoursEnabled: boolean
  hours: Record<Day, HoursRow>
}

const defaultHours = (): Record<Day, HoursRow> =>
  Object.fromEntries(
    DAYS.map((d) => [d, { closed: d === 'sat' || d === 'sun', from: '09:00', to: '18:00' }]),
  ) as Record<Day, HoursRow>

const EMPTY: FormState = {
  type: 'VET',
  name: '',
  county: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  description: '',
  status: 'DRAFT',
  serviceIds: [],
  hoursEnabled: false,
  hours: defaultHours(),
}

const input =
  'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'
const label = 'mb-1 block text-xs font-medium text-slate-400'

export default function ListingForm({ id }: { id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  // Fisa existenta
  useEffect(() => {
    if (!id) return
    fetch(`/api/listings/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Fișa nu a fost găsită'))))
      .then(({ listing }) => {
        const parsed = parseOpeningHours(listing.openingHours)
        const hours = defaultHours()
        if (parsed.ok) {
          for (const d of DAYS) {
            const first = parsed.value[d][0]
            hours[d] = first ? { closed: false, from: first.from, to: first.to } : { closed: true, from: '09:00', to: '18:00' }
          }
        }
        setForm({
          type: listing.type,
          name: listing.name,
          county: listing.county,
          city: listing.city,
          address: listing.address ?? '',
          phone: listing.phone ?? '',
          email: listing.email ?? '',
          website: listing.website ?? '',
          description: listing.description ?? '',
          status: listing.status,
          serviceIds: listing.services.map((s: { serviceId: string }) => s.serviceId),
          hoursEnabled: parsed.ok,
          hours,
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  // Serviciile tipului ales
  useEffect(() => {
    fetch(`/api/listing-services?type=${form.type}`)
      .then((r) => r.json())
      .then(({ services }) => setServices(services ?? []))
      .catch(() => setServices([]))
  }, [form.type])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const openingHours = form.hoursEnabled
      ? Object.fromEntries(DAYS.map((d) => [d, form.hours[d].closed ? [] : [{ from: form.hours[d].from, to: form.hours[d].to }]]))
      : null
    const validServiceIds = form.serviceIds.filter((sid) => services.some((s) => s.id === sid))
    const res = await fetch(id ? `/api/listings/${id}` : '/api/listings', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, serviceIds: validServiceIds, openingHours }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Nu am putut salva fișa')
      return
    }
    router.push('/admin/director')
    router.refresh()
  }

  if (loading) return <p className="p-6 text-slate-400">Se încarcă…</p>

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-5 p-6">
      <h1 className="text-xl font-semibold text-white">{id ? 'Editează fișa' : 'Fișă nouă'}</h1>
      {error ? <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-200">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Tip</label>
          <select className={input} value={form.type} onChange={(e) => set('type', e.target.value as ListingType)}>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t].singular}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Status</label>
          <select className={input} value={form.status} onChange={(e) => set('status', e.target.value as FormState['status'])}>
            <option value="DRAFT">Ciornă (nu apare pe site)</option>
            <option value="PUBLISHED">Publicată</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Nume *</label>
          <input className={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className={label}>Județ *</label>
          <input className={input} value={form.county} onChange={(e) => set('county', e.target.value)} required />
        </div>
        <div>
          <label className={label}>Oraș *</label>
          <input className={input} value={form.city} onChange={(e) => set('city', e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Adresă</label>
          <input className={input} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div>
          <label className={label}>Telefon</label>
          <input className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0721 234 567" />
        </div>
        <div>
          <label className={label}>E-mail</label>
          <input className={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Site</label>
          <input className={input} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="exemplu.ro" />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Descriere (text simplu)</label>
          <textarea className={input} rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Servicii</legend>
        {services.length === 0 ? (
          <p className="text-sm text-slate-500">Nu există servicii pentru acest tip. Adaugă-le în „Servicii”.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.serviceIds.includes(s.id)}
                  onChange={(e) =>
                    set('serviceIds', e.target.checked ? [...form.serviceIds, s.id] : form.serviceIds.filter((x) => x !== s.id))
                  }
                />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className={label}>Program</legend>
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={form.hoursEnabled} onChange={(e) => set('hoursEnabled', e.target.checked)} />
          Specifică programul
        </label>
        {form.hoursEnabled ? (
          <div className="space-y-2">
            {DAYS.map((d) => (
              <div key={d} className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                <span className="w-24">{DAY_LABEL[d]}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.hours[d].closed}
                    onChange={(e) => set('hours', { ...form.hours, [d]: { ...form.hours[d], closed: e.target.checked } })}
                  />
                  Închis
                </label>
                {!form.hours[d].closed ? (
                  <>
                    <input
                      type="time"
                      className={`${input} w-28`}
                      value={form.hours[d].from}
                      onChange={(e) => set('hours', { ...form.hours, [d]: { ...form.hours[d], from: e.target.value } })}
                    />
                    <span>–</span>
                    <input
                      type="time"
                      className={`${input} w-28`}
                      value={form.hours[d].to}
                      onChange={(e) => set('hours', { ...form.hours, [d]: { ...form.hours[d], to: e.target.value } })}
                    />
                  </>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </fieldset>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
        <button type="button" onClick={() => router.push('/admin/director')} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
          Anulează
        </button>
      </div>
    </form>
  )
}
