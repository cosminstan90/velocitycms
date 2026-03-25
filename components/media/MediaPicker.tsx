'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Search, Upload, X, Check, Image as ImageIcon, FileText } from 'lucide-react'

export interface MediaItem {
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

interface Props {
  onSelect: (item: MediaItem) => void
  onClose: () => void
  /** If set, only show items whose mimeType matches (e.g. 'image') */
  filterType?: 'image' | 'pdf'
  title?: string
}

const LIMIT = 40

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaPicker({ onSelect, onClose, filterType = 'image', title = 'Alege imagine' }: Props) {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [items, setItems] = useState<MediaItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [highlighted, setHighlighted] = useState<MediaItem | null>(null)

  // Upload state
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const load = useCallback(async (pg: number, q: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pg), limit: String(LIMIT) })
      if (q) params.set('search', q)
      if (filterType) params.set('type', filterType)
      const res = await fetch(`/api/media?${params}`)
      const data = await res.json()
      setItems(data.media ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [filterType])

  useEffect(() => {
    if (tab !== 'library') return
    const t = setTimeout(() => { setPage(1); load(1, search) }, 300)
    return () => clearTimeout(t)
  }, [search, tab, load])

  useEffect(() => {
    if (tab === 'library') load(page, search)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadFile(file: File) {
    setUploading(true)
    setUploadError('')
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/media/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      // Switch to library and select the new item
      setItems((prev) => [data.media, ...prev])
      setHighlighted(data.media)
      setTab('library')
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload eșuat')
    } finally {
      setUploading(false)
    }
  }

  function handleSelect() {
    if (highlighted) onSelect(highlighted)
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl w-full max-w-4xl mx-4 flex flex-col shadow-2xl"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="text-white font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 flex-shrink-0">
          {(['library', 'upload'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {t === 'library' ? 'Bibliotecă' : 'Încarcă'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {tab === 'upload' ? (
            /* ── Upload tab ── */
            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f) }}
                onClick={() => inputRef.current?.click()}
                className="w-full max-w-md border-2 border-dashed border-gray-600 hover:border-indigo-400 rounded-xl p-12 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
                />
                {uploading ? (
                  <p className="text-gray-400">Se încarcă...</p>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-300 font-medium">Trage fișierul sau <span className="text-indigo-400">navighează</span></p>
                    <p className="text-gray-500 text-sm mt-1">JPG, PNG, GIF, WebP, SVG, PDF — max 20 MB</p>
                  </>
                )}
              </div>
              {uploadError && <p className="text-red-400 text-sm">{uploadError}</p>}
            </div>
          ) : (
            /* ── Library tab ── */
            <>
              {/* Search */}
              <div className="px-4 py-3 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Caută după nume..."
                    className="w-full bg-gray-800 text-gray-200 pl-9 pr-4 py-2 rounded-lg text-sm border border-gray-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                {loading ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-gray-800 rounded animate-pulse" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-40" />
                    <p className="text-sm">Nicio imagine găsită</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setHighlighted((h) => h?.id === item.id ? null : item)}
                        onDoubleClick={() => { setHighlighted(item); setTimeout(() => onSelect(item), 0) }}
                        className={`aspect-square rounded overflow-hidden relative group transition-all ${
                          highlighted?.id === item.id
                            ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-gray-900'
                            : 'hover:ring-2 hover:ring-gray-500'
                        }`}
                      >
                        {item.mimeType.startsWith('image/') ? (
                          <img
                            src={item.url}
                            alt={item.altText ?? item.originalName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400">
                            <FileText className="w-6 h-6" />
                            <span className="text-xs">PDF</span>
                          </div>
                        )}
                        {highlighted?.id === item.id && (
                          <div className="absolute top-1 right-1 bg-indigo-500 rounded-full p-0.5">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-1 mt-4">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        onClick={() => setPage(pg)}
                        className={`w-8 h-8 rounded text-sm ${
                          pg === page ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected preview strip */}
              {highlighted && (
                <div className="border-t border-gray-700 px-4 py-3 flex-shrink-0 flex items-center gap-4">
                  <div className="w-12 h-12 rounded overflow-hidden bg-gray-700 flex-shrink-0">
                    {highlighted.mimeType.startsWith('image/') ? (
                      <img src={highlighted.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 text-sm truncate">{highlighted.originalName}</p>
                    <p className="text-gray-500 text-xs">
                      {highlighted.mimeType} · {formatBytes(highlighted.size)}
                      {highlighted.width && highlighted.height ? ` · ${highlighted.width}×${highlighted.height}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg">
            Anulează
          </button>
          <button
            onClick={handleSelect}
            disabled={!highlighted}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg"
          >
            Inserează
          </button>
        </div>
      </div>
    </div>
  )
}
