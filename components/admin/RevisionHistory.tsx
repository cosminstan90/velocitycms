'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Clock, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'

export interface Revision {
  version: number
  savedAt: string
  savedBy: string
  title: string
  contentHtml: string
  contentJson: unknown
  metaTitle: string | null
  metaDescription: string | null
  status: string
}

interface Props {
  entityType: 'posts' | 'pages'
  entityId: string
  currentTitle: string
  currentContentHtml: string
  onRestore: (revision: Revision) => void
  onClose: () => void
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400',
  REVIEW: 'bg-yellow-500/20 text-yellow-300',
  PUBLISHED: 'bg-green-500/20 text-green-300',
  ARCHIVED: 'bg-slate-700/30 text-slate-500',
}

function diffHtml(oldHtml: string, newHtml: string): string {
  // Simple paragraph-level diff — highlight paragraphs that changed
  const oldParas = oldHtml.split(/<\/?p[^>]*>/).filter((s) => s.trim())
  const newParas = newHtml.split(/<\/?p[^>]*>/).filter((s) => s.trim())

  return newParas
    .map((para) => {
      const changed = !oldParas.includes(para)
      if (changed) {
        return `<p style="background:rgba(59,130,246,0.12);border-left:3px solid #3b82f6;padding:4px 8px;margin:4px 0;">${para}</p>`
      }
      return `<p style="margin:4px 0;">${para}</p>`
    })
    .join('')
}

export default function RevisionHistory({
  entityType,
  entityId,
  currentTitle,
  currentContentHtml,
  onRestore,
  onClose,
}: Props) {
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Revision | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [confirmRestore, setConfirmRestore] = useState<Revision | null>(null)

  const fetchRevisions = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/${entityType}/${entityId}/revisions`)
    const data = await res.json()
    setRevisions(data.revisions ?? [])
    setLoading(false)
  }, [entityType, entityId])

  useEffect(() => { fetchRevisions() }, [fetchRevisions])

  async function handleRestore(rev: Revision) {
    setRestoring(true)
    const res = await fetch(`/api/${entityType}/${entityId}/restore/${rev.version}`, {
      method: 'POST',
    })
    const data = await res.json()
    setRestoring(false)
    setConfirmRestore(null)

    if (res.ok) {
      onRestore(rev)
      onClose()
    }
  }

  const diffed = selected
    ? diffHtml(currentContentHtml, selected.contentHtml)
    : ''

  return (
    <>
      {/* Drawer backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl flex flex-col shadow-2xl border-l border-slate-700"
        style={{ backgroundColor: '#1e293b' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-400" />
            <h2 className="font-semibold text-white text-sm">Istoric versiuni</h2>
            {!loading && (
              <span className="text-xs text-slate-500">({revisions.length} versiuni)</span>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Revision list */}
          <div className="w-56 shrink-0 border-r border-slate-700 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-slate-500 text-xs">Se încarcă...</div>
            ) : revisions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs px-4">
                Nicio versiune salvată încă.
              </div>
            ) : (
              <div className="py-2">
                {revisions.map((rev) => (
                  <button
                    key={rev.version}
                    onClick={() => { setSelected(rev); setShowDiff(false) }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-700/50 hover:bg-slate-700/40 transition ${
                      selected?.version === rev.version ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white">v{rev.version}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_STYLES[rev.status] ?? ''}`}>
                        {rev.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-0.5">{rev.title}</p>
                    <p className="text-[10px] text-slate-600">
                      {new Date(rev.savedAt).toLocaleString('ro-RO', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="flex-1 overflow-y-auto flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Selectează o versiune pentru preview
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Version meta */}
                <div className="px-5 py-4 border-b border-slate-700 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white text-sm line-clamp-2">{selected.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Salvat: {new Date(selected.savedAt).toLocaleString('ro-RO')}
                      </p>
                      {selected.metaTitle && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Meta: {selected.metaTitle}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmRestore(selected)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition"
                    >
                      <RotateCcw size={12} />
                      Restaurează
                    </button>
                  </div>

                  {/* Diff toggle */}
                  <button
                    onClick={() => setShowDiff((v) => !v)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
                  >
                    {showDiff ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {showDiff ? 'Ascunde diferențele' : 'Arată diferențele față de versiunea curentă'}
                  </button>
                </div>

                {/* Content preview / diff */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {showDiff ? (
                    <div>
                      <p className="text-[11px] text-slate-500 mb-3 flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded" style={{ background: 'rgba(59,130,246,0.3)', border: '1px solid #3b82f6' }} />
                        Paragraf modificat față de versiunea curentă
                      </p>
                      <div
                        className="prose prose-invert prose-sm max-w-none text-slate-300 text-xs leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: diffed }}
                      />
                    </div>
                  ) : (
                    <div
                      className="prose prose-invert prose-sm max-w-none text-slate-300 text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selected.contentHtml || '<p class="text-slate-600">Conținut gol</p>' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restore confirm */}
      {confirmRestore && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
          <div
            className="w-full max-w-sm p-6 rounded-2xl shadow-2xl border border-slate-700"
            style={{ backgroundColor: '#1e293b' }}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Restaurează versiunea v{confirmRestore.version}?</h3>
            <p className="text-sm text-slate-400 mb-1">
              Titlu: <strong className="text-white">{confirmRestore.title}</strong>
            </p>
            <p className="text-sm text-slate-400 mb-5">
              Versiunea curentă va fi salvată automat înainte de restaurare.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmRestore(null)}
                className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition"
              >
                Anulează
              </button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                disabled={restoring}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
              >
                <RotateCcw size={14} />
                {restoring ? 'Se restaurează...' : 'Restaurează'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
