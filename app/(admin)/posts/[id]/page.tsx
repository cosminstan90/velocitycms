'use client'

import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Save, ArrowLeft, Globe, EyeOff, Clock, ChevronDown,
  ChevronUp, Tag, Image as ImageIcon, Settings, History,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react'
import type { EditorOutput } from '@/components/editor/TiptapEditor'
import type { Revision } from '@/components/admin/RevisionHistory'
import SeoPanel from '@/components/seo/SeoPanel'
import GeoPanel from '@/components/seo/GeoPanel'
import CustomFieldsPanel, { FieldDefinition } from '@/components/editor/CustomFieldsPanel'
import InternalLinksPanel from '@/components/editor/InternalLinksPanel'
import PublishingPanel from '@/components/editor/PublishingPanel'

// Dynamically import editor (no SSR — ProseMirror is client-only)
const TiptapEditor = dynamic(() => import('@/components/editor/TiptapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-96 rounded-xl border border-slate-700 flex items-center justify-center text-slate-500 text-sm"
      style={{ backgroundColor: '#1e293b' }}>
      Se încarcă editorul...
    </div>
  ),
})

const RevisionHistory = dynamic(() => import('@/components/admin/RevisionHistory'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category { id: string; name: string; slug: string }
interface Tag { id: string; name: string; slug: string }
interface Post {
  id: string; siteId: string; title: string; slug: string; excerpt: string | null
  contentJson: Record<string, unknown>; contentHtml: string
  status: string; metaTitle: string | null; metaDescription: string | null
  focusKeyword: string | null; canonicalUrl: string | null; noIndex: boolean
  ogTitle: string | null; ogDescription: string | null
  categoryId: string | null; featuredImageId: string | null
  scheduledAt: string | null; publishedAt: string | null
  tags: Array<{ tag: Tag }>
}

// ─── Panel helpers ─────────────────────────────────────────────────────────────

function Panel({
  title, defaultOpen = true, children,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white hover:bg-slate-700/30 transition"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-slate-700">{children}</div>}
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition ${className}`}
      style={{ backgroundColor: '#0f172a' }}
      {...props}
    />
  )
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition resize-none ${className}`}
      style={{ backgroundColor: '#0f172a' }}
      {...props}
    />
  )
}

function slugify(text: string) {
  const map: Record<string, string> = { ă:'a',â:'a',î:'i',ș:'s',ț:'t',Ă:'a',Â:'a',Î:'i',Ș:'s',Ț:'t' }
  return text.split('').map((c) => map[c] ?? c).join('')
    .toLowerCase().replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-')
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', REVIEW: 'Review', PUBLISHED: 'Publicat', ARCHIVED: 'Arhivat',
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PostEditorPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const isNew = postId === 'new'

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [categories, setCategories] = useState<Category[]>([])
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [showRevisions, setShowRevisions] = useState(false)
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [fieldValidationErrors, setFieldValidationErrors] = useState<string[]>([])

  // Internal Links panel state
  const [linksSuggestionsBadge, setLinksSuggestionsBadge] = useState(0)
  const linksPanelRef = useRef<HTMLDivElement>(null)
  const suggestionsPreFetched = useRef(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [excerpt, setExcerpt] = useState('')
  const [contentJson, setContentJson] = useState<Record<string, unknown>>({})
  const [contentHtml, setContentHtml] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [categoryId, setCategoryId] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [noIndex, setNoIndex] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')

  // GEO state — stored scores from DB, updated after each save
  const [storedGeoScore, setStoredGeoScore] = useState<number | null>(null)
  const [storedGeoBreakdown, setStoredGeoBreakdown] = useState<Record<string, unknown> | null>(null)
  const [geoDirectAnswer, setGeoDirectAnswer] = useState<string | null>(null)
  const [geoSpeakableSections, setGeoSpeakableSections] = useState<string[]>([])

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Fetch post + sidebar data ─────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/tags').then((r) => r.json()),
    ]).then(([catData, tagData]) => {
      setCategories(catData.categories ?? [])
      setAllTags(tagData.tags ?? [])
    })
  }, [])

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    fetch(`/api/posts/${postId}`)
      .then((r) => r.json())
      .then(({ post: p }: { post: Post }) => {
        if (!p) return
        setPost(p)
        setTitle(p.title)
        setSlug(p.slug)
        setSlugManual(true)
        setExcerpt(p.excerpt ?? '')
        setContentJson(p.contentJson)
        setContentHtml(p.contentHtml)
        setStatus(p.status)
        setCategoryId(p.categoryId ?? '')
        setSelectedTagIds(p.tags.map((t) => t.tag.id))
        setMetaTitle(p.metaTitle ?? '')
        setMetaDescription(p.metaDescription ?? '')
        setFocusKeyword(p.focusKeyword ?? '')
        setCanonicalUrl(p.canonicalUrl ?? '')
        setNoIndex(p.noIndex)
        setScheduledAt(p.scheduledAt ? p.scheduledAt.slice(0, 16) : '')
      })
      .finally(() => setLoading(false))
  }, [postId, isNew])

  useEffect(() => {
    if (!post || !post.siteId) return
    const loadFieldValues = async () => {
      try {
        const [defsResponse, valuesResponse] = await Promise.all([
          fetch(`/api/field-definitions?siteId=${post.siteId}&postType=POST`),
          fetch(`/api/posts/${postId}/field-values`),
        ])
        if (!defsResponse.ok || !valuesResponse.ok) {
          return
        }
        const defsData = await defsResponse.json()
        const valuesData = await valuesResponse.json()
        setFieldDefinitions(defsData.fieldDefinitions ?? [])
        const valueMap: Record<string, string> = {}
        for (const item of valuesData.fieldValues ?? []) {
          valueMap[item.fieldDefinitionId] = item.value
        }
        setFieldValues(valueMap)
      } catch {
        // ignore
      }
    }
    loadFieldValues()
  }, [post, postId])

  // ── Save ──────────────────────────────────────────────────────────────────

  const buildPayload = useCallback(
    () => ({
      title,
      slug: slug || slugify(title),
      excerpt: excerpt || null,
      contentJson,
      contentHtml,
      status,
      categoryId: categoryId || null,
      tagIds: selectedTagIds,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      focusKeyword: focusKeyword || null,
      canonicalUrl: canonicalUrl || null,
      noIndex,
      scheduledAt: scheduledAt || null,
    }),
    [title, slug, excerpt, contentJson, contentHtml, status, categoryId,
      selectedTagIds, metaTitle, metaDescription, focusKeyword, canonicalUrl, noIndex, scheduledAt]
  )

  const saveCustomFieldValues = useCallback(async () => {
    if (!postId) return
    const items = Object.entries(fieldValues).map(([fieldDefinitionId, value]) => ({ fieldDefinitionId, value }))
    if (items.length === 0) return

    const res = await fetch(`/api/posts/${postId}/field-values`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    })
    if (!res.ok) {
      throw new Error(`Failed to save field values: ${await res.text()}`)
    }

    return await res.json()
  }, [fieldValues, postId])

  const save = useCallback(
    async (silent = false) => {
      if (!title) return
      if (!silent) setSaving(true)

      // Block publish if required fields are missing
      if (status === 'PUBLISHED' && fieldValidationErrors.length > 0) {
        setSaving(false)
        setSaveStatus('error')
        alert(`Câmpuri obligatorii lipsă: ${fieldValidationErrors.join(', ')}`)
        return
      }

      const payload = buildPayload()
      let res: Response

      if (isNew) {
        res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          if (!silent) { setSaving(false); setSaveStatus('error') }
          return
        }

        if (fieldValues && Object.keys(fieldValues).length > 0 && data.post?.id) {
          try {
            await fetch(`/api/posts/${data.post.id}/field-values`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(Object.entries(fieldValues).map(([fieldDefinitionId, value]) => ({ fieldDefinitionId, value }))),
            })
          } catch (e) {
            console.error('Failed saving field values after create:', e)
          }
        }

        if (data.post) {
          router.replace(`/admin/posts/${data.post.id}`)
        }
      } else {
        try {
          await saveCustomFieldValues()
        } catch (err) {
          console.error(err)
        }

        res = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        // Capture GEO results returned by the API
        if (res.ok) {
          const data = await res.json()
          if (data.post) {
            if (data.post.geoScore != null) setStoredGeoScore(data.post.geoScore)
            if (data.post.geoBreakdown) setStoredGeoBreakdown(data.post.geoBreakdown)
          }

          // Background pre-fetch of link suggestions (once, when article has >300 words)
          if (!suggestionsPreFetched.current) {
            const wordCount = contentHtml
              .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
              .split(/\s+/).filter(Boolean).length
            if (wordCount > 300) {
              suggestionsPreFetched.current = true
              fetch(`/api/posts/${postId}/suggest-links`, { method: 'POST' })
                .then((r) => r.json())
                .then((d) => {
                  const count = (d.suggestions as unknown[])?.length ?? 0
                  if (count > 0) setLinksSuggestionsBadge(count)
                })
                .catch(() => {})
            }
          }
        }
      }

      if (!silent) {
        setSaving(false)
        setSaveStatus(res!.ok ? 'saved' : 'error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    },
    [buildPayload, isNew, postId, router, title]
  )

  // Auto-save every 60s
  useEffect(() => {
    if (!title || isNew) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => save(true), 60_000)
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current) }
  }, [title, contentJson, save, isNew])

  // Ctrl+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [save])

  // ── Publish / Unpublish ───────────────────────────────────────────────────

  async function handlePublish() {
    if (isNew) { await save(); return }
    await save(true)
    const res = await fetch(`/api/posts/${postId}/publish`, { method: 'POST' })
    if (res.ok) setStatus('PUBLISHED')
  }

  async function handleUnpublish() {
    const res = await fetch(`/api/posts/${postId}/unpublish`, { method: 'POST' })
    if (res.ok) setStatus('DRAFT')
  }

  // ── Open links panel (scroll into view + open if collapsed) ──────────────

  function handleOpenLinksPanel() {
    linksPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Tag toggle ────────────────────────────────────────────────────────────

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    )
  }

  // ── Editor update ─────────────────────────────────────────────────────────

  function handleEditorChange(output: EditorOutput) {
    setContentJson(output.contentJson)
    setContentHtml(output.contentHtml)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        <Loader2 size={24} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-6 py-3 border-b border-slate-700 shrink-0"
        style={{ backgroundColor: '#1e293b' }}
      >
        <Link href="/admin/posts" className="text-slate-400 hover:text-white transition">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-sm text-slate-400">
          {isNew ? 'Articol nou' : (title || 'Fără titlu')}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Auto-save indicator */}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 size={13} /> Salvat
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle size={13} /> Eroare
            </span>
          )}

          {!isNew && (
            <button
              onClick={() => setShowRevisions(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-700 transition border border-slate-600"
            >
              <History size={13} />
              Versiuni
            </button>
          )}

          <button
            onClick={() => save()}
            disabled={saving || !title}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white transition border border-slate-600"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
            Salvează
          </button>

          {status === 'PUBLISHED' ? (
            <button
              onClick={handleUnpublish}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-yellow-600 hover:bg-yellow-500 text-white transition"
            >
              <EyeOff size={13} />
              Retrage
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={!title}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
            >
              <Globe size={13} />
              Publică
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left — editor */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4" style={{ minWidth: 0 }}>
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (!slugManual) setSlug(slugify(e.target.value))
            }}
            placeholder="Titlu articol..."
            className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-600 focus:outline-none border-b border-transparent focus:border-slate-700 pb-2 transition"
          />

          {/* Slug row */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">URL:</span>
            <span className="text-slate-500">yourdomain.com/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManual(true) }}
              className="flex-1 bg-transparent text-blue-400 font-mono focus:outline-none border-b border-transparent focus:border-blue-500 transition"
              placeholder="slug-articol"
            />
          </div>

          {/* Excerpt */}
          <Textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Rezumat scurt (opțional)..."
            rows={2}
          />

          {/* Tiptap editor */}
          <TiptapEditor
            initialJson={contentJson && Object.keys(contentJson).length > 0 ? contentJson : undefined}
            onChange={handleEditorChange}
            placeholder="Începe să scrii... Tastează / pentru blocuri speciale"
          />
        </div>

        {/* Right — panels */}
        <div
          className="w-80 shrink-0 overflow-y-auto border-l border-slate-700 px-4 py-4 space-y-3"
          style={{ backgroundColor: '#0f172a' }}
        >
          {/* Publicare panel */}
          <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
            <div className="px-4 py-3 border-b border-slate-700">
              <span className="text-sm font-medium text-white">📢 Publicare</span>
            </div>
            <div className="px-4 pb-4 pt-3">
              <PublishingPanel
                postId={postId}
                isNew={isNew}
                status={status}
                scheduledAt={scheduledAt || null}
                siteId={post?.siteId ?? ''}
                onStatusChange={setStatus}
                onScheduledAtChange={(v) => setScheduledAt(v ?? '')}
                onSave={() => save()}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                isSaving={saving}
              />
            </div>
          </div>

          {/* SEO panel — full analysis + SERP preview */}
          <SeoPanel
            title={title}
            slug={slug}
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            focusKeyword={focusKeyword}
            contentHtml={contentHtml}
            contentJson={Object.keys(contentJson).length > 0 ? contentJson : undefined}
            canonicalUrl={canonicalUrl}
            noIndex={noIndex}
            siteDomain="localhost:3000"
            categorySlug={categories.find((c) => c.id === categoryId)?.slug}
            onChangeMetaTitle={setMetaTitle}
            onChangeMetaDesc={setMetaDescription}
            onChangeFocusKeyword={setFocusKeyword}
            onChangeCanonical={setCanonicalUrl}
            onChangeNoIndex={setNoIndex}
            onChangeSlug={(v) => { setSlug(v); setSlugManual(true) }}
            onRegenerateSlug={() => { setSlug(slugify(title)); setSlugManual(false) }}
            onOpenLinksPanel={handleOpenLinksPanel}
          />

          {/* Categorie & Tags panel */}
          <Panel title="🏷️ Categorie & Etichete" defaultOpen={false}>
            <div className="space-y-3">
              <FormField label="Categorie">
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <option value="">— fără categorie —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Etichete">
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-2.5 py-1 rounded-full text-xs transition border ${
                        selectedTagIds.includes(tag.id)
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {allTags.length === 0 && (
                    <p className="text-xs text-slate-600">Nicio etichetă creată.</p>
                  )}
                </div>
              </FormField>
            </div>
          </Panel>

          {/* GEO / AEO panel */}
          <Panel title="🤖 GEO / AEO Score" defaultOpen={false}>
            <GeoPanel
              contentHtml={contentHtml}
              contentJson={Object.keys(contentJson).length > 0 ? contentJson : undefined}
              focusKeyword={focusKeyword || null}
              schemaMarkup={undefined}
              authorName={null}
              authorCredentials={null}
              storedGeoScore={storedGeoScore}
              storedBreakdown={storedGeoBreakdown}
              onExtracted={({ directAnswer, speakableSections }) => {
                setGeoDirectAnswer(directAnswer)
                setGeoSpeakableSections(speakableSections)
              }}
            />
          </Panel>

          {/* Internal Links panel */}
          {!isNew && (
            <div ref={linksPanelRef} className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
              {/* Custom panel header with badge */}
              <details className="group" open={linksSuggestionsBadge > 0 ? true : undefined}>
                <summary className="flex items-center justify-between px-4 py-3 text-sm font-medium text-white hover:bg-slate-700/30 transition cursor-pointer list-none">
                  <span className="flex items-center gap-2">
                    🔗 Linkuri Interne
                    {linksSuggestionsBadge > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/20 border border-violet-700 text-violet-300">
                        {linksSuggestionsBadge} noi
                      </span>
                    )}
                  </span>
                  <ChevronDown size={14} className="text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-4 pb-4 pt-1 border-t border-slate-700">
                  <InternalLinksPanel
                    postId={postId}
                    contentHtml={contentHtml}
                    newSuggestionsCount={linksSuggestionsBadge}
                    onBadgeSeen={() => setLinksSuggestionsBadge(0)}
                  />
                </div>
              </details>
            </div>
          )}

          {/* Imagine principală panel */}
          <Panel title="🖼️ Imagine Principală" defaultOpen={false}>
            <div className="flex flex-col items-center justify-center h-24 rounded-lg border-2 border-dashed border-slate-600 text-slate-500 text-xs gap-1 hover:border-slate-400 transition cursor-pointer">
              <ImageIcon size={18} />
              <span>Selectează din media</span>
            </div>
          </Panel>

          <Panel title="⚙️ Câmpuri Custom" defaultOpen={false}>
            <CustomFieldsPanel
              postId={postId}
              siteId={post?.siteId ?? ''}
              postType="POST"
              onChange={setFieldValues}
              onValidationChange={setFieldValidationErrors}
            />
          </Panel>
        </div>
      </div>

      {/* Revision history drawer */}
      {showRevisions && !isNew && (
        <RevisionHistory
          entityType="posts"
          entityId={postId}
          currentTitle={title}
          currentContentHtml={contentHtml}
          onRestore={(rev: Revision) => {
            setTitle(rev.title)
            setContentJson(rev.contentJson as Record<string, unknown>)
            setContentHtml(rev.contentHtml)
            setMetaTitle(rev.metaTitle ?? '')
            setMetaDescription(rev.metaDescription ?? '')
          }}
          onClose={() => setShowRevisions(false)}
        />
      )}
    </div>
  )
}
