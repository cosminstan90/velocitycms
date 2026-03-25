'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  Upload, Search, Trash2, Copy, Check, X, Edit2, Filter,
  Image as ImageIcon, FileText, Grid3X3, List, ChevronLeft, ChevronRight,
} from 'lucide-react'

interface MediaItem {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  url: string
  urlOriginal: string | null
  altText: string | null
  caption: string | null
  uploadedAt: string
}

interface MediaListResponse {
  media: MediaItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(item: MediaItem): boolean {
  return item.mimeType.startsWith('image/')
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function MediaDetailModal({
  item,
  onClose,
  onDelete,
  onUpdated,
}: {
  item: MediaItem
  onClose: () => void
  onDelete: (id: string) => void
  onUpdated: (item: MediaItem) => void
}) {
  const [altText, setAltText] = useState(item.altText ?? '')
  const [caption, setCaption] = useState(item.caption ?? '')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/media/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: altText || null, caption: caption || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      onUpdated(data.media)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      const res = await fetch(`/api/media/${item.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Delete failed')
      onDelete(item.id)
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  function copyUrl() {
    navigator.clipboard.writeText(item.url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl w-full max-w-3xl mx-4 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-white font-semibold truncate">{item.originalName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Preview */}
          <div className="md:w-1/2 bg-gray-800 flex items-center justify-center p-4 min-h-48">
            {isImage(item) ? (
              <img
                src={item.url}
                alt={item.altText ?? item.originalName}
                className="max-w-full max-h-64 object-contain rounded"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <FileText className="w-16 h-16" />
                <span className="text-sm">{item.mimeType}</span>
              </div>
            )}
          </div>

          {/* Info + Edit */}
          <div className="md:w-1/2 p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-400">Tip</span>
              <span className="text-gray-200">{item.mimeType}</span>
              <span className="text-gray-400">Dimensiune</span>
              <span className="text-gray-200">{formatBytes(item.size)}</span>
              {item.width && item.height && (
                <>
                  <span className="text-gray-400">Rezoluție</span>
                  <span className="text-gray-200">{item.width} × {item.height}</span>
                </>
              )}
              <span className="text-gray-400">Încărcat</span>
              <span className="text-gray-200">{new Date(item.uploadedAt).toLocaleDateString('ro-RO')}</span>
            </div>

            {/* URL copy */}
            <div className="flex gap-2">
              <input
                readOnly
                value={item.url}
                className="flex-1 bg-gray-800 text-gray-300 text-xs rounded px-3 py-2 truncate border border-gray-700"
              />
              <button
                onClick={copyUrl}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded flex items-center gap-1 text-sm"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Alt text */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Text alternativ (SEO)</label>
              <input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Descriere imagine..."
                className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Legendă</label>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Legendă opțională..."
                className="w-full bg-gray-800 text-gray-200 text-sm rounded px-3 py-2 border border-gray-700 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-2 mt-auto pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium py-2 rounded"
              >
                {saving ? 'Se salvează...' : 'Salvează'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  confirmDelete
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {deleting ? '...' : confirmDelete ? 'Confirmi?' : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
function UploadZone({ onUploaded }: { onUploaded: (item: MediaItem) => void }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(file: File) {
    setUploading(true)
    setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/media/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      onUploaded(data.media)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    for (const file of Array.from(files)) {
      await uploadFile(file)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragging ? 'border-indigo-400 bg-indigo-900/20' : 'border-gray-600 hover:border-gray-500'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <p className="text-gray-400 text-sm">Se încarcă...</p>
      ) : (
        <>
          <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Trage fișiere aici sau <span className="text-indigo-400">navighează</span></p>
          <p className="text-gray-500 text-xs mt-1">JPG, PNG, GIF, WebP, SVG, PDF — max 20 MB</p>
        </>
      )}
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'pdf'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const LIMIT = 40

  const load = useCallback(async (pg: number, q: string, type: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) })
      if (q) params.set('search', q)
      if (type !== 'all') params.set('type', type)
      const res = await fetch(`/api/media?${params}`)
      const data: MediaListResponse = await res.json()
      setItems(data.media)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1)
      load(1, search, typeFilter)
    }, 300)
    return () => clearTimeout(t)
  }, [search, typeFilter, load])

  useEffect(() => {
    load(page, search, typeFilter)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleUploaded(item: MediaItem) {
    setItems((prev) => [item, ...prev])
    setTotal((t) => t + 1)
  }

  function handleDeleted(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setTotal((t) => t - 1)
  }

  function handleUpdated(updated: MediaItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    setSelected(updated)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Biblioteca media</h1>
          <p className="text-gray-400 text-sm mt-1">{total} fișiere</p>
        </div>
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm"
        >
          <Upload className="w-4 h-4" />
          Încarcă
        </button>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <div className="mb-6">
          <UploadZone onUploaded={handleUploaded} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută după nume..."
            className="w-full bg-gray-800 text-gray-200 pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          {(['all', 'image', 'pdf'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                typeFilter === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'Toate' : t === 'image' ? 'Imagini' : 'PDF'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 border border-gray-700">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid view */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Nicio imagine găsită</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="aspect-square bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all group relative"
            >
              {isImage(item) ? (
                <img
                  src={item.url}
                  alt={item.altText ?? item.originalName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400">
                  <FileText className="w-8 h-8" />
                  <span className="text-xs uppercase">{item.mimeType.split('/')[1]}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                <p className="w-full px-1 pb-1 text-white text-xs truncate opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.originalName}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="w-full flex items-center gap-4 bg-gray-800 hover:bg-gray-750 rounded-lg px-4 py-3 text-left transition-colors"
            >
              <div className="w-12 h-12 flex-shrink-0 bg-gray-700 rounded overflow-hidden">
                {isImage(item) ? (
                  <img src={item.url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-200 text-sm truncate">{item.originalName}</p>
                <p className="text-gray-500 text-xs">{item.mimeType} · {formatBytes(item.size)}</p>
              </div>
              {item.width && item.height && (
                <span className="text-gray-500 text-xs hidden sm:block">{item.width}×{item.height}</span>
              )}
              <span className="text-gray-500 text-xs hidden md:block">
                {new Date(item.uploadedAt).toLocaleDateString('ro-RO')}
              </span>
              <Edit2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-gray-400 text-sm">
            Pagina {page} din {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <MediaDetailModal
          item={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDeleted}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
