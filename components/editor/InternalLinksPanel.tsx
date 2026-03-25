'use client'

/**
 * InternalLinksPanel
 *
 * Right-sidebar panel for the post editor that shows:
 *  1. Links already in the article (internal + external, scanned from contentHtml)
 *  2. AI-generated internal link suggestions via Claude Haiku
 *
 * Link insertion: dispatches a `tiptap:insert-link` CustomEvent.
 * TiptapEditor listens for it and tries to find the anchorText in the document,
 * then wraps it with the link mark. If context not found, shows copy-to-clipboard fallback.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Link2, ExternalLink, Sparkles, Loader2, Copy, Check,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExistingLink {
  href: string
  text: string
}

interface LinkSuggestion {
  anchorText: string
  targetSlug: string
  targetTitle: string
  relevanceScore: number
  insertionContext: string
}

interface Props {
  postId: string
  contentHtml: string
  /** Badge count controlled by parent (from background pre-fetch) */
  newSuggestionsCount?: number
  onBadgeSeen?: () => void
}

// ─── Score badge color ────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'bg-green-500/20 text-green-300 border-green-700' :
    score >= 50 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-700' :
                  'bg-red-500/20 text-red-300 border-red-700'
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${color}`}>
      {score}
    </span>
  )
}

// ─── Highlight anchor text inside context sentence ────────────────────────────

function HighlightedContext({ context, anchor }: { context: string; anchor: string }) {
  if (!anchor || !context.includes(anchor)) {
    return <span className="text-slate-400 italic text-[11px]">&ldquo;{context}&rdquo;</span>
  }
  const idx = context.indexOf(anchor)
  return (
    <span className="text-slate-400 italic text-[11px]">
      &ldquo;
      {context.slice(0, idx)}
      <mark className="bg-blue-500/30 text-blue-200 not-italic rounded px-0.5">{anchor}</mark>
      {context.slice(idx + anchor.length)}
      &rdquo;
    </span>
  )
}

// ─── Single suggestion card ───────────────────────────────────────────────────

function SuggestionCard({
  suggestion,
  onInsert,
}: {
  suggestion: LinkSuggestion
  onInsert: (s: LinkSuggestion) => void
}) {
  const [state, setState] = useState<'idle' | 'inserted' | 'not-found' | 'copied'>('idle')

  function handleInsert() {
    // Dispatch event to TiptapEditor
    const event = new CustomEvent('tiptap:insert-link', {
      detail: {
        anchorText: suggestion.anchorText,
        href: `/${suggestion.targetSlug}`,
        context: suggestion.insertionContext,
      },
    })
    document.dispatchEvent(event)

    // Listen for result
    const resultHandler = (e: Event) => {
      const { success } = (e as CustomEvent).detail as { success: boolean }
      setState(success ? 'inserted' : 'not-found')
      document.removeEventListener('tiptap:insert-link-result', resultHandler)
      if (success) onInsert(suggestion)
    }
    document.addEventListener('tiptap:insert-link-result', resultHandler)

    // Timeout fallback
    setTimeout(() => {
      document.removeEventListener('tiptap:insert-link-result', resultHandler)
      // If still idle, editor might not be mounted — fall back
      setState((prev) => (prev === 'idle' ? 'not-found' : prev))
    }, 1000)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(
      `<a href="/${suggestion.targetSlug}">${suggestion.anchorText}</a>`
    )
    setState('copied')
    setTimeout(() => setState('not-found'), 2000)
  }

  return (
    <div className="rounded-lg border border-slate-700 p-3 space-y-2" style={{ backgroundColor: '#0f172a' }}>
      {/* Target + score */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-white leading-snug flex-1">
          {suggestion.targetTitle}
        </span>
        <ScoreBadge score={suggestion.relevanceScore} />
      </div>

      {/* Anchor text */}
      <div className="flex items-center gap-1">
        <Link2 size={10} className="text-blue-400 shrink-0" />
        <span className="text-[11px] text-blue-300 font-mono">&ldquo;{suggestion.anchorText}&rdquo;</span>
      </div>

      {/* Context */}
      <HighlightedContext context={suggestion.insertionContext} anchor={suggestion.anchorText} />

      {/* Action button */}
      {state === 'idle' && (
        <button
          type="button"
          onClick={handleInsert}
          className="w-full py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-1.5"
        >
          <Link2 size={11} />
          Inserează link
        </button>
      )}
      {state === 'inserted' && (
        <div className="flex items-center gap-1.5 text-xs text-green-400 justify-center">
          <Check size={12} /> Link inserat!
        </div>
      )}
      {(state === 'not-found' || state === 'copied') && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-yellow-400 flex items-center gap-1">
            <AlertCircle size={10} /> Textul nu a fost găsit în editor.
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-1.5 rounded-lg text-xs font-medium border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition flex items-center justify-center gap-1.5"
          >
            {state === 'copied' ? <><Check size={11} /> Copiat!</> : <><Copy size={11} /> Copiază pentru inserare manuală</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function InternalLinksPanel({
  postId,
  contentHtml,
  newSuggestionsCount = 0,
  onBadgeSeen,
}: Props) {
  const [internalLinks, setInternalLinks] = useState<ExistingLink[]>([])
  const [externalLinks, setExternalLinks] = useState<ExistingLink[]>([])
  const [suggestions, setSuggestions] = useState<LinkSuggestion[]>([])
  const [loadingLinks, setLoadingLinks] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [showInternal, setShowInternal] = useState(true)
  const [showExternal, setShowExternal] = useState(false)
  const lastHtmlRef = useRef('')

  // ── Load current links whenever contentHtml changes (debounced 800ms) ───────
  useEffect(() => {
    if (!postId || postId === 'new') return

    const timer = setTimeout(async () => {
      if (contentHtml === lastHtmlRef.current) return
      lastHtmlRef.current = contentHtml
      setLoadingLinks(true)
      try {
        const res = await fetch(`/api/posts/${postId}/links`)
        if (res.ok) {
          const data = await res.json()
          setInternalLinks(data.internal ?? [])
          setExternalLinks(data.external ?? [])
        }
      } finally {
        setLoadingLinks(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [postId, contentHtml])

  // ── Notify parent badge was seen when suggestions are viewed ─────────────
  useEffect(() => {
    if (newSuggestionsCount > 0 && suggestions.length > 0 && onBadgeSeen) {
      onBadgeSeen()
    }
  }, [suggestions, newSuggestionsCount, onBadgeSeen])

  // ── Generate suggestions ─────────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (force = false) => {
    if (!postId || postId === 'new') return
    setLoadingSuggestions(true)
    setSuggestionError(null)
    try {
      const url = `/api/posts/${postId}/suggest-links${force ? '?force=true' : ''}`
      const res = await fetch(url, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSuggestionError((err as { error?: string }).error ?? 'Eroare la generare.')
        return
      }
      const data = await res.json()
      setSuggestions(data.suggestions ?? [])
      if (onBadgeSeen) onBadgeSeen()
    } catch {
      setSuggestionError('Eroare de rețea.')
    } finally {
      setLoadingSuggestions(false)
    }
  }, [postId, onBadgeSeen])

  function handleInserted(inserted: LinkSuggestion) {
    // Remove inserted suggestion from list
    setSuggestions((prev) => prev.filter((s) => s.targetSlug !== inserted.targetSlug))
  }

  return (
    <div className="space-y-3">

      {/* ── Existing links section ── */}
      <div className="space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
          Linkuri prezente în articol
        </p>

        {loadingLinks && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Loader2 size={12} className="animate-spin" /> Se scanează...
          </div>
        )}

        {/* Internal links */}
        {!loadingLinks && (
          <div>
            <button
              type="button"
              onClick={() => setShowInternal((v) => !v)}
              className="flex items-center gap-2 w-full text-left"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-300">
                <Link2 size={11} />
                Interne
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 border border-green-700 text-green-300">
                  {internalLinks.length}
                </span>
              </span>
              {showInternal
                ? <ChevronUp size={11} className="text-slate-500 ml-auto" />
                : <ChevronDown size={11} className="text-slate-500 ml-auto" />}
            </button>

            {showInternal && (
              <div className="mt-1.5 space-y-1 pl-1">
                {internalLinks.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">Niciun link intern.</p>
                ) : (
                  internalLinks.map((lnk, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-0.5">
                      <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/15 border border-green-800 text-green-400 shrink-0">intern</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-white truncate block">{lnk.text || '—'}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate block">{lnk.href}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* External links */}
        {!loadingLinks && (
          <div>
            <button
              type="button"
              onClick={() => setShowExternal((v) => !v)}
              className="flex items-center gap-2 w-full text-left"
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-blue-300">
                <ExternalLink size={11} />
                Externe
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-700 text-blue-300">
                  {externalLinks.length}
                </span>
              </span>
              {showExternal
                ? <ChevronUp size={11} className="text-slate-500 ml-auto" />
                : <ChevronDown size={11} className="text-slate-500 ml-auto" />}
            </button>

            {showExternal && (
              <div className="mt-1.5 space-y-1 pl-1">
                {externalLinks.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic">Niciun link extern.</p>
                ) : (
                  externalLinks.map((lnk, i) => (
                    <div key={i} className="flex items-center gap-1.5 py-0.5">
                      <span className="text-[10px] px-1 py-0.5 rounded bg-blue-500/15 border border-blue-800 text-blue-400 shrink-0">extern</span>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-white truncate block">{lnk.text || '—'}</span>
                        <span className="text-[10px] text-slate-500 font-mono truncate block">{lnk.href}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700" />

      {/* ── AI Suggestions section ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles size={11} className="text-violet-400" />
            Sugestii AI
            {newSuggestionsCount > 0 && suggestions.length === 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-700 text-violet-300">
                {newSuggestionsCount} noi
              </span>
            )}
          </p>
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={() => fetchSuggestions(true)}
              className="text-[10px] text-slate-500 hover:text-slate-300 transition"
            >
              Regenerează
            </button>
          )}
        </div>

        {/* Generate button */}
        {suggestions.length === 0 && !loadingSuggestions && (
          <button
            type="button"
            onClick={() => fetchSuggestions(false)}
            className="w-full py-2 rounded-lg text-xs font-medium border border-violet-700 text-violet-300 hover:bg-violet-500/10 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles size={12} />
            Generează sugestii
          </button>
        )}

        {/* Loading state */}
        {loadingSuggestions && (
          <div className="flex items-center gap-2 py-2 text-xs text-slate-400 justify-center">
            <Loader2 size={13} className="animate-spin text-violet-400" />
            Claude analizează articolul...
          </div>
        )}

        {/* Error */}
        {suggestionError && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-red-800 text-xs text-red-300" style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
            <AlertCircle size={12} className="shrink-0 mt-0.5" />
            {suggestionError}
          </div>
        )}

        {/* Results */}
        {!loadingSuggestions && suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <SuggestionCard key={i} suggestion={s} onInsert={handleInserted} />
            ))}
          </div>
        )}

        {/* No suggestions after generation */}
        {!loadingSuggestions && suggestions.length === 0 && !suggestionError && (
          <p className="text-[10px] text-slate-600 italic text-center py-1">
            Apasă butonul pentru a genera sugestii.
          </p>
        )}
      </div>
    </div>
  )
}
