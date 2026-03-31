'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus, Trash2, Edit2, Check, X, Search, Upload, Download,
  ArrowUpDown, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight,
  ExternalLink, ToggleLeft, ToggleRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Redirect {
  id: string
  fromPath: string
  toPath: string
  statusCode: number
  isActive: boolean
  hits: number
  createdAt: string
}

interface NotFoundLog {
  id: string
  path: string
  referer: string | null
  hits: number
  firstSeen: string
  lastSeen: string
}

interface Stats {
  total: number
  active: number
  totalHits: number
}

// ─── Code badge ───────────────────────────────────────────────────────────────
function CodeBadge({ code }: { code: number }) {
  const color =
    code === 301 ? 'bg-green-900/40 text-green-400 border-green-700' :
    code === 302 ? 'bg-yellow-900/40 text-yellow-400 border-yellow-700' :
    'bg-blue-900/40 text-blue-400 border-blue-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold border ${color}`}>
      {code}
    </span>
  )
}

// ─── Edit modal ───────────────────────────────────────────────────────────────
function EditModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<Redirect>
  onSave: (data: { fromPath: string; toPath: string; statusCode: number }) => Promise<void>
  onClose: () => void
}) {
  const [fromPath, setFromPath]   = useState(initial?.fromPath ?? '/')
  const [toPath, setToPath]       = useState(initial?.toPath ?? '/')
  const [statusCode, setStatusCode] = useState(initial?.statusCode ?? 301)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSave({ fromPath, toPath, statusCode })
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">{initial?.id ? 'Editează redirect' : 'Redirect nou'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">De la (From Path)</label>
            <input
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="/vechea-pagina"
              required
              className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-gray-700 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Spre (To Path / URL)</label>
            <input
              value={toPath}
              onChange={(e) => setToPath(e.target.value)}
              placeholder="/noua-pagina sau https://example.com"
              required
              className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-gray-700 focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cod status</label>
            <select
              value={statusCode}
              onChange={(e) => setStatusCode(Number(e.target.value))}
              className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-gray-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value={301}>301 — Permanent</option>
              <option value={302}>302 — Temporar</option>
              <option value={307}>307 — Temporary (preserve method)</option>
              <option value={308}>308 — Permanent (preserve method)</option>
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
            >
              {saving ? 'Se salvează...' : 'Salvează'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm">
              Anulează
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── CSV Import modal ─────────────────────────────────────────────────────────
function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [csv, setCsv]           = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult]     = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)

  const preview = csv
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .slice(0, 5)

  async function handleImport() {
    setImporting(true)
    try {
      const res = await fetch('/api/redirects/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv }),
      })
      const data = await res.json()
      setResult(data)
      if (data.imported > 0) onImported()
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl w-full max-w-2xl mx-4 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Import CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-gray-400 text-sm mb-3">
          Format: <code className="text-indigo-400">/from,/to,301</code> — un redirect per linie. Codul status este opțional (implicit 301).
        </p>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          placeholder={`/old-page,/new-page,301\n/another-old,/another-new\n/external,https://example.com,302`}
          rows={8}
          className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-gray-700 focus:border-indigo-500 focus:outline-none font-mono resize-none"
        />

        {preview.length > 0 && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-700">
            <p className="text-xs text-gray-500 px-3 py-2 bg-gray-800">Preview primele {preview.length} rânduri:</p>
            {preview.map((line, i) => {
              const [from, to, code] = line.split(',').map((s) => s.trim())
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs font-mono border-t border-gray-700">
                  <span className="text-red-400 flex-1">{from}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-green-400 flex-1">{to}</span>
                  <CodeBadge code={Number(code) || 301} />
                </div>
              )
            })}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 rounded-lg bg-gray-800 border border-gray-700 space-y-1">
            <p className="text-green-400 text-sm">✓ {result.imported} importate</p>
            {result.skipped > 0 && <p className="text-yellow-400 text-sm">⚠ {result.skipped} sărite</p>}
            {result.errors.slice(0, 5).map((e, i) => (
              <p key={i} className="text-red-400 text-xs font-mono">{e}</p>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleImport}
            disabled={importing || !csv.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium"
          >
            {importing ? 'Se importă...' : 'Importă'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm">
            {result ? 'Închide' : 'Anulează'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 404 Monitor Tab ──────────────────────────────────────────────────────────

type UrlStatus = { status: number | null; redirected: boolean; finalUrl: string | null }

function StatusBadge({ info, checking }: { info?: UrlStatus; checking?: boolean }) {
  if (checking) return <span className="text-xs text-gray-500 animate-pulse">verifică...</span>
  if (!info) return <span className="text-xs text-gray-600">—</span>
  if (info.status === null) return <span className="text-xs text-gray-500">timeout</span>
  if (info.status === 200) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-900/40 text-green-400 border border-green-700">
      ✓ Live ({info.status})
    </span>
  )
  if (info.status === 404) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-900/40 text-red-400 border border-red-700">
      ✗ 404
    </span>
  )
  if (info.status >= 300 && info.status < 400) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-900/40 text-amber-400 border border-amber-700">
      → {info.status}
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-gray-700 text-gray-400 border border-gray-600">
      {info.status}
    </span>
  )
}

function NotFoundTab({ onCreateRedirect }: { onCreateRedirect: (path: string) => void }) {
  const [logs, setLogs]       = useState<NotFoundLog[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [statuses, setStatuses] = useState<Record<string, UrlStatus>>({})
  const [checking, setChecking] = useState<Set<string>>(new Set())

  const loadLogs = useCallback(async (pg: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/not-found-log?page=${pg}&limit=50`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setStatuses({})
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLogs(page) }, [page, loadLogs])

  const totalPages = Math.ceil(total / 50)

  async function clearAll() {
    if (!confirm('Ștergi toate intrările din Monitor 404?')) return
    await fetch('/api/not-found-log', { method: 'DELETE' })
    loadLogs(1)
  }

  async function checkAll() {
    if (logs.length === 0) return
    const paths = logs.map((l) => l.path)
    setChecking(new Set(paths))
    try {
      const res = await fetch('/api/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      })
      const data = await res.json()
      const map: Record<string, UrlStatus> = {}
      for (const r of data.results) map[r.path] = r
      setStatuses(map)
    } finally {
      setChecking(new Set())
    }
  }

  async function checkOne(path: string) {
    setChecking((s) => new Set(s).add(path))
    try {
      const res = await fetch('/api/check-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [path] }),
      })
      const data = await res.json()
      if (data.results?.[0]) {
        setStatuses((s) => ({ ...s, [path]: data.results[0] }))
      }
    } finally {
      setChecking((s) => { const n = new Set(s); n.delete(path); return n })
    }
  }

  const liveCount = Object.values(statuses).filter((s) => s.status === 200).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Monitor 404</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {total} URL-uri înregistrate
            {liveCount > 0 && (
              <span className="ml-2 text-green-400 font-semibold">{liveCount} sunt live acum!</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {logs.length > 0 && (
            <button
              onClick={checkAll}
              disabled={checking.size > 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-700/30 hover:bg-indigo-700/50 text-indigo-300 border border-indigo-700/50 rounded-lg text-sm disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {checking.size > 0 ? 'Verifică...' : 'Verifică toate'}
            </button>
          )}
          <button
            onClick={() => loadLogs(page)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Reîncarcă
          </button>
          {total > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 rounded-lg text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Șterge tot
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Check className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
          <p>Nu există erori 404 înregistrate. Felicitări!</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">URL (404)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Status real</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Referer</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">Cereri</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Ultima</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {logs.map((log) => {
                const status = statuses[log.path]
                const isLive = status?.status === 200
                return (
                  <tr key={log.id} className={`transition-colors ${isLive ? 'bg-green-900/10 hover:bg-green-900/20' : 'hover:bg-gray-800/30'}`}>
                    <td className="px-4 py-3">
                      <a
                        href={log.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-400 text-sm font-mono hover:text-red-300 hover:underline inline-flex items-center gap-1"
                      >
                        {log.path}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => checkOne(log.path)}
                        className="flex items-center gap-1.5"
                        title="Verifică acum"
                      >
                        <StatusBadge info={status} checking={checking.has(log.path)} />
                      </button>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs truncate max-w-xs block">{log.referer ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-mono font-bold ${log.hits > 10 ? 'text-red-400' : log.hits > 3 ? 'text-amber-400' : 'text-gray-300'}`}>
                        {log.hits}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <span className="text-gray-500 text-xs">{new Date(log.lastSeen).toLocaleDateString('ro-RO')}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onCreateRedirect(log.path)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-700/50 rounded-lg text-xs font-medium whitespace-nowrap"
                      >
                        <Plus className="w-3 h-3" />
                        Redirect
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-gray-400 text-sm">Pagina {page} din {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RedirectsPage() {
  const [tab, setTab] = useState<'redirects' | '404'>('redirects')

  // Redirects state
  const [redirects, setRedirects]   = useState<Redirect[]>([])
  const [stats, setStats]           = useState<Stats>({ total: 0, active: 0, totalHits: 0 })
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')

  // Selection + bulk actions
  const [selected, setSelected]     = useState<Set<string>>(new Set())

  // Modals
  const [editModal, setEditModal]   = useState<Partial<Redirect> | null>(null)
  const [showImport, setShowImport] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId]     = useState<string | null>(null)

  const LIMIT = 50

  const load = useCallback(async (pg: number, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) })
      if (q) params.set('search', q)
      const res = await fetch(`/api/redirects?${params}`)
      const data = await res.json()
      setRedirects(data.redirects ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      if (data.stats) setStats(data.stats)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load(1, search) }, 300)
    return () => clearTimeout(t)
  }, [search, load])

  useEffect(() => { load(page, search) }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD helpers ────────────────────────────────────────────────────────────
  async function handleCreate(data: { fromPath: string; toPath: string; statusCode: number }) {
    const res = await fetch('/api/redirects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Eroare la creare')
    }
    load(page, search)
  }

  async function handleUpdate(id: string, data: { fromPath: string; toPath: string; statusCode: number }) {
    const res = await fetch(`/api/redirects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error ?? 'Eroare la actualizare')
    }
    load(page, search)
  }

  async function handleToggle(id: string) {
    await fetch(`/api/redirects/${id}/toggle`, { method: 'PUT' })
    load(page, search)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/redirects/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    setSelected((s) => { const n = new Set(s); n.delete(id); return n })
    load(page, search)
  }

  // ── Bulk actions ─────────────────────────────────────────────────────────
  async function bulkToggle(active: boolean) {
    await Promise.all(
      [...selected].map((id) =>
        fetch(`/api/redirects/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: active }),
        })
      )
    )
    setSelected(new Set())
    load(page, search)
  }

  async function bulkDelete() {
    if (!confirm(`Ștergi ${selected.size} redirect(uri) selectate?`)) return
    await Promise.all([...selected].map((id) => fetch(`/api/redirects/${id}`, { method: 'DELETE' })))
    setSelected(new Set())
    load(page, search)
  }

  function toggleSelectAll() {
    if (selected.size === redirects.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(redirects.map((r) => r.id)))
    }
  }

  // Open edit modal with pre-filled fromPath (from 404 monitor)
  function openCreateFromPath(path: string) {
    setTab('redirects')
    setEditModal({ fromPath: path, toPath: '/', statusCode: 301 })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Redirecturi 301/302</h1>
          <p className="text-gray-400 text-sm mt-1">Gestionare redirecturi și monitorizare erori 404</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setEditModal({})}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Redirect nou
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total redirecturi', value: stats.total },
          { label: 'Active', value: stats.active },
          { label: 'Total hit-uri', value: stats.totalHits.toLocaleString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-gray-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        {(['redirects', '404'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t === 'redirects' ? 'Redirecturi' : 'Monitor 404'}
            {t === '404' && (
              <span className="ml-2 px-1.5 py-0.5 bg-red-900/40 text-red-400 text-xs rounded">!</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Redirects tab ── */}
      {tab === 'redirects' && (
        <div className="space-y-4">
          {/* Search + bulk bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Caută după from / to path..."
                className="w-full bg-gray-800 text-gray-200 pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 bg-indigo-900/30 border border-indigo-700/50 px-3 py-2 rounded-lg text-sm">
                <span className="text-indigo-300">{selected.size} selectate</span>
                <button onClick={() => bulkToggle(true)} className="text-green-400 hover:text-green-300 text-xs">Activează</button>
                <span className="text-gray-600">|</span>
                <button onClick={() => bulkToggle(false)} className="text-yellow-400 hover:text-yellow-300 text-xs">Dezactivează</button>
                <span className="text-gray-600">|</span>
                <button onClick={bulkDelete} className="text-red-400 hover:text-red-300 text-xs">Șterge</button>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-800/50">
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.size === redirects.length && redirects.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-600 bg-gray-700"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">De la</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Spre</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase">Cod</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">Hits</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-400 uppercase hidden sm:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase hidden md:table-cell">Creat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : redirects.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      Nicio redirecție găsită. Adaugă prima redirecție!
                    </td>
                  </tr>
                ) : (
                  redirects.map((r) => (
                    <tr key={r.id} className={`hover:bg-gray-800/30 transition-colors ${!r.isActive ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={(e) => {
                            const n = new Set(selected)
                            e.target.checked ? n.add(r.id) : n.delete(r.id)
                            setSelected(n)
                          }}
                          className="rounded border-gray-600 bg-gray-700"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-400 text-sm font-mono">{r.fromPath}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-400 text-sm font-mono">{r.toPath}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CodeBadge code={r.statusCode} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-mono font-bold ${r.hits > 100 ? 'text-amber-400' : 'text-gray-300'}`}>
                          {r.hits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <button
                          onClick={() => handleToggle(r.id)}
                          className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                            r.isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'
                          }`}
                        >
                          {r.isActive
                            ? <><ToggleRight className="w-4 h-4" /> Activ</>
                            : <><ToggleLeft className="w-4 h-4" /> Inactiv</>
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-gray-500 text-xs">
                          {new Date(r.createdAt).toLocaleDateString('ro-RO')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setEditModal(r)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition"
                            title="Editează"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteId(r.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition"
                            title="Șterge"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-gray-400 text-sm">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} din {total}
              </span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 404 Monitor tab ── */}
      {tab === '404' && <NotFoundTab onCreateRedirect={openCreateFromPath} />}

      {/* ── Edit / Create modal ── */}
      {editModal !== null && (
        <EditModal
          initial={editModal}
          onClose={() => setEditModal(null)}
          onSave={(data) =>
            editModal.id
              ? handleUpdate(editModal.id, data)
              : handleCreate(data)
          }
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-gray-900 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl border border-gray-700">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold text-center mb-2">Confirmi ștergerea?</h3>
            <p className="text-gray-400 text-sm text-center mb-5">Această acțiune nu poate fi anulată.</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg text-sm font-medium"
              >
                Șterge
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2.5 rounded-lg text-sm"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Import modal ── */}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={() => load(1, search)}
        />
      )}
    </div>
  )
}
