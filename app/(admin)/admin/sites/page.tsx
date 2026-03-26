'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Users, Globe, Type, CheckCircle2, XCircle } from 'lucide-react'

interface SiteCard {
  id: string
  name: string
  domain: string
  description?: string
  timezone: string
  language: string
  isActive: boolean
  postCount: number
  mediaCount: number
  lastPublishedAt: string | null
  accessRole: string
}

function formatDate(value: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function SitesPage() {
  const [sites, setSites] = useState<SiteCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editSite, setEditSite] = useState<SiteCard | null>(null)
  const [form, setForm] = useState({ name: '', domain: '', timezone: 'Europe/Bucharest', language: 'ro', description: '' })

  const isCreate = editSite === null

  useEffect(() => {
    loadSites()
  }, [])

  async function loadSites() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/sites')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setSites(data.sites || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare la încărcare')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditSite(null)
    setForm({ name: '', domain: '', timezone: 'Europe/Bucharest', language: 'ro', description: '' })
    setIsModalOpen(true)
  }

  function openEdit(site: SiteCard) {
    setEditSite(site)
    setForm({
      name: site.name,
      domain: site.domain,
      timezone: site.timezone ?? 'Europe/Bucharest',
      language: site.language ?? 'ro',
      description: site.description ?? '',
    })
    setIsModalOpen(true)
  }

  async function submit() {
    if (!form.name || !form.domain) {
      alert('Numele și domeniul sunt obligatorii')
      return
    }

    try {
      const url = editSite ? `/api/sites/${editSite.id}` : '/api/sites'
      const method = editSite ? 'PUT' : 'POST'
      const body: any = {
        name: form.name,
        domain: form.domain,
        timezone: form.timezone,
        language: form.language,
        description: form.description,
      }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())

      setIsModalOpen(false)
      await loadSites()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la salvare')
    }
  }

  async function deleteSite(site: SiteCard) {
    if (!confirm(`Șterge site-ul ${site.name}?`) ) return
    try {
      const res = await fetch(`/api/sites/${site.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      await loadSites()
      setIsModalOpen(false)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la ștergere')
    }
  }

  const activeCount = useMemo(() => sites.filter((s) => s.isActive).length, [sites])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestionare site-uri</h1>
          <p className="text-sm text-slate-400">Administrează site-uri multi-tenant și roluri de utilizator.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white">
          <Plus size={14} /> Site nou
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-700 p-4 bg-slate-800">
          <p className="text-xs text-slate-400 mb-1">Site-uri active</p>
          <p className="text-2xl font-semibold">{activeCount}/{sites.length}</p>
        </div>
        <div className="rounded-lg border border-slate-700 p-4 bg-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total articole</p>
          <p className="text-2xl font-semibold">{sites.reduce((sum, s) => sum + s.postCount, 0)}</p>
        </div>
        <div className="rounded-lg border border-slate-700 p-4 bg-slate-800">
          <p className="text-xs text-slate-400 mb-1">Total media</p>
          <p className="text-2xl font-semibold">{sites.reduce((sum, s) => sum + s.mediaCount, 0)}</p>
        </div>
      </div>

      {loading ? (
        <p>Se încarcă...</p>
      ) : error ? (
        <p className="text-rose-400">{error}</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sites.map((site) => (
            <div key={site.id} className="rounded-xl border border-slate-700 p-5 bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-lg text-white">{site.name}</h2>
                  <p className="text-xs text-slate-400 truncate"><a href={`https://${site.domain}`} target="_blank" rel="noreferrer" className="hover:text-indigo-300 underline">{site.domain}</a></p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${site.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {site.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <p>Articole</p>
                  <p className="font-semibold">{site.postCount}</p>
                </div>
                <div className="p-2 bg-slate-800 rounded-lg">
                  <p>Media</p>
                  <p className="font-semibold">{site.mediaCount}</p>
                </div>
                <div className="p-2 bg-slate-800 rounded-lg col-span-2">
                  <p>Ultima activitate</p>
                  <p className="font-semibold">{formatDate(site.lastPublishedAt)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => openEdit(site)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-600 text-xs"> <Pencil size={12} /> Editare</button>
                <button onClick={() => window.open(`/admin/sites/${site.id}/users`, '_blank')} className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-600 text-xs"> <Users size={12} /> Utilizatori</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">{isCreate ? 'Creează site nou' : 'Editează site'}</h3>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Nume</label>
              <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" />
              <label className="block text-xs font-medium text-slate-300">Domeniu</label>
              <input value={form.domain} onChange={(e) => setForm((prev) => ({ ...prev, domain: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" />
              <label className="block text-xs font-medium text-slate-300">Timp</label>
              <input value={form.timezone} onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" />
              <label className="block text-xs font-medium text-slate-300">Limbă</label>
              <input value={form.language} onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" />
              <label className="block text-xs font-medium text-slate-300">Descriere</label>
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" rows={3} />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button onClick={submit} className="px-4 py-2 rounded bg-indigo-600 text-white">Salvează</button>
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded border border-slate-700 text-slate-300">Anulează</button>
            </div>

            {!isCreate && (
              <div className="mt-5 border-t border-slate-700 pt-4">
                <p className="text-xs text-slate-400 mb-2">Zona periculoasă</p>
                <button onClick={() => deleteSite(editSite!)} className="inline-flex items-center gap-1 px-3 py-2 rounded bg-rose-600 text-white text-sm">
                  <Trash2 size={14} /> Șterge site-ul (doar dacă nu are articole/pagini)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
