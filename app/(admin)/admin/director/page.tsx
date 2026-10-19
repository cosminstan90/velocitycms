'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { LISTING_TYPES, TYPE_LABEL, type ListingType } from '@/lib/listings'

type Row = {
  id: string
  name: string
  type: ListingType
  city: string
  county: string
  status: 'DRAFT' | 'PUBLISHED'
  services: Array<{ service: { name: string } }>
}

const select = 'rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white'

export default function DirectoryAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const [reload, setReload] = useState(0)

  useEffect(() => {
    const sp = new URLSearchParams({ page: String(page) })
    if (type) sp.set('type', type)
    if (status) sp.set('status', status)
    if (q.trim()) sp.set('q', q.trim())
    fetch(`/api/listings?${sp}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setRows(data.listings)
          setTotal(data.total)
          setPageSize(data.pageSize)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, type, status, q, reload])

  async function remove(row: Row) {
    if (!confirm(`Ștergi fișa „${row.name}”? Acțiunea nu poate fi anulată.`)) return
    const res = await fetch(`/api/listings/${row.id}`, { method: 'DELETE' })
    if (res.ok) setReload((n) => n + 1)
    else alert('Nu am putut șterge fișa')
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold text-white">Director</h1>
        <Link href="/admin/director/servicii" className="text-sm text-slate-300 hover:text-white">Servicii</Link>
        <Link href="/admin/director/new" className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">
          <Plus size={14} /> Fișă nouă
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className={select} value={type} onChange={(e) => { setPage(1); setType(e.target.value) }}>
          <option value="">Toate tipurile</option>
          {LISTING_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t].plural}</option>)}
        </select>
        <select className={select} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
          <option value="">Orice status</option>
          <option value="PUBLISHED">Publicate</option>
          <option value="DRAFT">Ciorne</option>
        </select>
        <input className={select} placeholder="Caută după nume sau oraș" value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Nume</th>
              <th className="px-3 py-3">Tip</th>
              <th className="px-3 py-3">Oraș</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-slate-400">Se încarcă…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-slate-400">Nicio fișă.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                  <td className="px-3 py-3 text-slate-300">{TYPE_LABEL[r.type].singular}</td>
                  <td className="px-3 py-3 text-slate-300">{r.city}, {r.county}</td>
                  <td className="px-3 py-3">
                    <span className={r.status === 'PUBLISHED' ? 'text-green-400' : 'text-slate-400'}>
                      {r.status === 'PUBLISHED' ? 'Publicată' : 'Ciornă'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/director/${r.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" title="Editează">
                        <Edit2 size={14} />
                      </Link>
                      <button onClick={() => remove(r)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400" title="Șterge">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40">Înapoi</button>
          <span>Pagina {page} din {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40">Înainte</button>
        </div>
      ) : null}
    </div>
  )
}
