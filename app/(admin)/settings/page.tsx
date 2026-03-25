'use client'
export const dynamic = 'force-dynamic'


import {
  Key, Copy, RefreshCw, Download, Terminal, CheckCircle2, ExternalLink,
  Clock, Zap, AlertCircle, Globe, ChevronRight, Plus, Trash2, Eye, EyeOff,
  ShieldCheck,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

interface RecentPost {
  id: string
  title: string
  slug: string
  status: string
  publisherCampaign: string | null
  publisherPageId: string | null
  geoScore: number | null
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
}

interface PublisherSettings {
  tokenMasked: string | null
  hasToken: boolean
  endpointUrl: string
  recentPosts: RecentPost[]
}

interface ApiKey {
  id: string
  name: string
  description: string | null
  keyMasked: string
  scopes: string[]
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PUBLISHED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    DRAFT:     'bg-slate-500/15 text-slate-400 border-slate-500/30',
    REVIEW:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ARCHIVED:  'bg-rose-500/15 text-rose-400 border-rose-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${map[status] ?? map.DRAFT}`}>
      {status}
    </span>
  )
}

function GeoScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-600 text-xs">—</span>
  const color = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400'
  return <span className={`text-xs font-bold ${color}`}>{score}</span>
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `acum ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `acum ${hours}h`
  return `acum ${Math.floor(hours / 24)}z`
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'publisher' | 'api-keys'

// ── Publisher Tab ─────────────────────────────────────────────────────────────

function PublisherTab() {
  const [settings, setSettings] = useState<PublisherSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revealedToken, setRevealedToken] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/publisher/settings')
      if (!res.ok) throw new Error(await res.text())
      setSettings(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRegenerate() {
    if (!confirm('Ești sigur? Token-ul vechi va fi invalidat imediat.')) return
    setRegenerating(true)
    try {
      const res = await fetch('/api/publisher/settings', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { token: string; tokenMasked: string }
      setRevealedToken(data.token)
      setSettings((prev) => prev ? { ...prev, tokenMasked: data.tokenMasked, hasToken: true } : prev)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la regenerare')
    } finally {
      setRegenerating(false)
    }
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* ignore */ }
  }

  const displayToken = revealedToken ?? settings?.tokenMasked ?? null

  const curlCommand = settings
    ? `curl -X POST \\\n  ${settings.endpointUrl} \\\n  -H "Content-Type: application/json" \\\n  -H "X-CMS-Token: YOUR_TOKEN" \\\n  -d '{\n    "title": "Titlu articol test",\n    "slug": "titlu-articol-test",\n    "contentHtml": "<p>Conținut test.</p>",\n    "siteId": "YOUR_SITE_ID",\n    "status": "draft"\n  }'`
    : ''

  return (
    <div className="space-y-6">
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#334155]">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Zap size={15} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">SEO Publisher Integration</h2>
            <p className="text-xs text-slate-500">Primire automată de conținut de la SEO Publisher</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          {loading ? (
            <div className="text-slate-500 text-sm">Se încarcă...</div>
          ) : error ? (
            <div className="text-rose-400 text-sm flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          ) : settings && (
            <>
              {/* Token */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Key size={11} /> Token Publisher
                  </label>
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={regenerating ? 'animate-spin' : ''} />
                    Regenerează
                  </button>
                </div>
                {revealedToken && (
                  <div className="mb-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-300 text-xs font-medium mb-1">Token nou generat — copiați-l acum, nu va mai fi afișat!</p>
                    <div className="flex items-center gap-2 bg-[#0f172a] rounded-md px-3 py-2">
                      <code className="text-amber-200 text-xs font-mono flex-1 break-all">{revealedToken}</code>
                      <button onClick={() => copyToClipboard(revealedToken, 'token-full')} className="shrink-0 text-slate-400 hover:text-slate-200">
                        {copied === 'token-full' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5">
                  <code className="text-slate-300 text-xs font-mono flex-1">
                    {displayToken ?? <span className="text-slate-600 italic">Niciun token configurat</span>}
                  </code>
                  {settings.hasToken && !revealedToken && (
                    <button onClick={() => copyToClipboard(settings.tokenMasked ?? '', 'token')}
                      className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
                      {copied === 'token' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1.5">
                  Folosit de SEO Publisher în headerul <code className="text-slate-500">X-CMS-Token</code>.
                </p>
              </div>

              {/* Endpoint URL */}
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <Globe size={11} /> URL Endpoint
                </label>
                <div className="flex items-center gap-2 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5">
                  <code className="text-slate-300 text-xs font-mono flex-1 break-all">{settings.endpointUrl}</code>
                  <button onClick={() => copyToClipboard(settings.endpointUrl, 'endpoint')}
                    className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
                    {copied === 'endpoint' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* PHP Download */}
              <div className="flex items-start gap-3 p-4 bg-[#0f172a] border border-[#334155] rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Download size={14} className="text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 mb-0.5">PHP Receiver Bridge</p>
                  <p className="text-xs text-slate-500 mb-3">
                    Fișier PHP pentru site-urile cu PHP care nu pot apela direct API-ul Next.js.
                  </p>
                  <a
                    href="/api/publisher/php-receiver"
                    download="velocity-receiver.php"
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Download size={12} />
                    Descarcă velocity-receiver.php
                  </a>
                </div>
              </div>

              {/* cURL test */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal size={13} className="text-slate-500" />
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Testare conexiune (cURL)</label>
                  <button onClick={() => copyToClipboard(curlCommand, 'curl')}
                    className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {copied === 'curl' ? <><CheckCircle2 size={11} className="text-emerald-400" /> Copiat</> : <><Copy size={11} /> Copiază</>}
                  </button>
                </div>
                <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3.5 text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre">
                  {curlCommand}
                </pre>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent posts */}
      {settings && settings.recentPosts.length > 0 && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#334155]">
            <Clock size={14} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-100">Ultimele articole primite</h2>
            <span className="ml-auto text-xs text-slate-600">{settings.recentPosts.length} articole</span>
          </div>
          <div className="divide-y divide-[#334155]">
            {settings.recentPosts.map((post) => (
              <div key={post.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <a href={`/admin/posts/${post.id}`} className="text-sm font-medium text-slate-200 hover:text-white truncate max-w-[280px] flex items-center gap-1.5">
                      {post.title}
                      <ExternalLink size={10} className="shrink-0 text-slate-600" />
                    </a>
                    <StatusBadge status={post.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span>/{post.slug}</span>
                    {post.publisherCampaign && (<><ChevronRight size={10} /><span className="text-slate-500">{post.publisherCampaign}</span></>)}
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <div className="text-[10px] text-slate-600 mb-0.5">GEO</div>
                    <GeoScoreBadge score={post.geoScore} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 mb-0.5">
                      {post.scheduledAt ? 'Programat' : post.publishedAt ? 'Publicat' : 'Primit'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {fmtDate(post.scheduledAt ?? post.publishedAt ?? post.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {settings && settings.recentPosts.length === 0 && !loading && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 text-center">
          <Zap size={24} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Niciun articol primit încă prin Publisher.</p>
        </div>
      )}
    </div>
  )
}

// ── API Keys Tab ──────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newKeyResult, setNewKeyResult] = useState<{ rawKey: string; warning: string } | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)
  const rawKeyRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/api-keys')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { keys: ApiKey[] }
      setKeys(data.keys)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare necunoscută')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { key: ApiKey; rawKey: string; warning: string }
      rawKeyRef.current = data.rawKey
      setNewKeyResult({ rawKey: data.rawKey, warning: data.warning })
      setShowKey(false)
      setNewName('')
      setNewDesc('')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la creare')
    } finally {
      setCreating(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revocare cheie API? Orice cerere care o folosește va fi respinsă imediat.')) return
    setRevoking(id)
    try {
      const res = await fetch(`/api/api-keys/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Eroare la revocare')
    } finally {
      setRevoking(null)
    }
  }

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#334155]">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
            <Plus size={15} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Cheie API nouă</h2>
            <p className="text-xs text-slate-500">Generează o cheie pentru acces headless API</p>
          </div>
        </div>
        <form onSubmit={handleCreate} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Nume *</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex: Site Funerarii"
                required
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Descriere (opțional)</label>
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="ex: Acces headless blog"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={14} />
            {creating ? 'Se generează...' : 'Generează cheie'}
          </button>
        </form>

        {/* One-time key reveal */}
        {newKeyResult && (
          <div className="mx-5 mb-5 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-300 font-medium">{newKeyResult.warning}</p>
            </div>
            <div className="flex items-center gap-2 bg-[#0f172a] rounded-lg px-3 py-2.5 mt-2">
              <code className="flex-1 text-xs font-mono text-amber-200 break-all">
                {showKey ? newKeyResult.rawKey : '•'.repeat(Math.min(newKeyResult.rawKey.length, 48))}
              </code>
              <button onClick={() => setShowKey((v) => !v)} className="shrink-0 text-slate-500 hover:text-slate-300">
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
              <button onClick={() => copyToClipboard(newKeyResult.rawKey, 'new-key')} className="shrink-0 text-slate-500 hover:text-slate-300">
                {copied === 'new-key' ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
              </button>
            </div>
            <button onClick={() => setNewKeyResult(null)} className="mt-2 text-xs text-slate-600 hover:text-slate-400 transition">
              Am copiat cheia, ascunde
            </button>
          </div>
        )}
      </div>

      {/* Keys table */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#334155]">
          <ShieldCheck size={14} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-100">Chei active</h2>
          <span className="ml-auto text-xs text-slate-600">{keys.length} chei</span>
        </div>

        {loading ? (
          <div className="p-6 text-slate-500 text-sm">Se încarcă...</div>
        ) : error ? (
          <div className="p-6 text-rose-400 text-sm flex items-center gap-2"><AlertCircle size={14} />{error}</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <Key size={24} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Nicio cheie API creată încă.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#334155]">
            {keys.map((k) => (
              <div key={k.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0">
                  <Key size={13} className="text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-200 truncate">{k.name}</p>
                    {k.isActive ? (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">ACTIV</span>
                    ) : (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">REVOCAT</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <code className="font-mono text-slate-500">{k.keyMasked}</code>
                    {k.description && <span>· {k.description}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right hidden md:block">
                  <div className="text-[10px] text-slate-600 mb-0.5">Ultima utilizare</div>
                  <div className="text-xs text-slate-500">{k.lastUsedAt ? timeAgo(k.lastUsedAt) : '—'}</div>
                </div>
                <div className="shrink-0 text-right hidden lg:block">
                  <div className="text-[10px] text-slate-600 mb-0.5">Creată</div>
                  <div className="text-xs text-slate-500">{timeAgo(k.createdAt)}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copyToClipboard(k.keyMasked, k.id)}
                    title="Copiază prefixul"
                    className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-700 transition"
                  >
                    {copied === k.id ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                  {k.isActive && (
                    <button
                      onClick={() => handleRevoke(k.id)}
                      disabled={revoking === k.id}
                      title="Revocă cheia"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API docs hint */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex items-start gap-3">
        <Globe size={15} className="text-slate-500 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-400">Cum se folosesc cheile API</p>
          <p>Includeți header-ul <code className="text-slate-300">X-API-Key: sk-...</code> în toate cererile headless.</p>
          <p>Endpoints disponibile: <code className="text-slate-300">/api/public/posts</code>, <code className="text-slate-300">/api/public/posts/[slug]</code>, <code className="text-slate-300">/api/public/pages/[slug]</code>, <code className="text-slate-300">/api/public/categories</code>, <code className="text-slate-300">/api/public/tags</code></p>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('publisher')

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-bold text-slate-100 mb-1">Setări</h1>
      <p className="text-slate-400 text-sm mb-6">Configurare integrare SEO Publisher, chei API și alte opțiuni.</p>

      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-6 border-b border-[#334155]">
        {([
          { id: 'publisher', label: 'SEO Publisher', icon: Zap },
          { id: 'api-keys', label: 'Chei API', icon: Key },
        ] as { id: Tab; label: string; icon: React.ElementType }[]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'publisher' && <PublisherTab />}
      {tab === 'api-keys' && <ApiKeysTab />}
    </div>
  )
}
