'use client'
export const dynamic = 'force-dynamic'


import {
  Search, Map, Bot, ExternalLink, RefreshCw, Globe, Check, X,
  AlertCircle, ChevronRight, BarChart2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SeoSettings {
  id?: string
  siteName: string
  siteUrl: string
  defaultMetaTitle: string
  defaultMetaDesc: string
  defaultOgImage: string
  robotsTxt: string
  blockAiTrainingBots: boolean
  googleVerification: string
  sitemapLastBuilt?: string | null
}

interface SitemapStats {
  total: number
  breakdown: {
    homepage: number
    posts: number
    pages: number
    topLevelCategories: number
    subcategories: number
  }
  chunksNeeded: number
  lastBuilt: string | null
}

// ─── Helper components ────────────────────────────────────────────────────────
function TabBtn({
  active, onClick, icon: Icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ComponentType<{ size?: number }>; label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-indigo-500 text-indigo-400'
          : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      <Icon size={15} />
      {label}
    </button>
  )
}

function Field({
  label, hint, children,
}: {
  label: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

function Input({
  value, onChange, placeholder, type = 'text',
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-gray-700 focus:border-indigo-500 focus:outline-none"
    />
  )
}

function Textarea({
  value, onChange, placeholder, rows = 4,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-gray-800 text-gray-200 text-sm rounded-lg px-3 py-2.5 border border-gray-700 focus:border-indigo-500 focus:outline-none resize-none font-mono"
    />
  )
}

// ─── Tab: General SEO ─────────────────────────────────────────────────────────
function GeneralTab({
  form, set, onSave, saving,
}: {
  form: SeoSettings
  set: (k: keyof SeoSettings, v: string | boolean) => void
  onSave: () => void
  saving: boolean
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field label="Nume site" hint="Apare în titlurile paginilor și schema.org">
          <Input value={form.siteName} onChange={(v) => set('siteName', v)} placeholder="VelocityCMS" />
        </Field>
        <Field label="URL site" hint="URL-ul canonical al site-ului, fără slash final">
          <Input value={form.siteUrl} onChange={(v) => set('siteUrl', v)} placeholder="https://example.com" />
        </Field>
        <Field label="Meta title implicit" hint="Folosit când pagina nu are meta title propriu">
          <Input value={form.defaultMetaTitle} onChange={(v) => set('defaultMetaTitle', v)} />
        </Field>
        <Field label="Meta description implicită">
          <Input value={form.defaultMetaDesc} onChange={(v) => set('defaultMetaDesc', v)} />
        </Field>
        <Field label="Imagine OG implicită" hint="URL imagine Open Graph fallback (1200×630)">
          <Input value={form.defaultOgImage} onChange={(v) => set('defaultOgImage', v)} placeholder="/og-default.webp" />
        </Field>
        <Field label="Google Verification code" hint="Conținut meta name=google-site-verification">
          <Input value={form.googleVerification} onChange={(v) => set('googleVerification', v)} />
        </Field>
      </div>

      <hr className="border-gray-700" />

      <Field
        label="Robots.txt personalizat"
        hint="Dacă este setat, înlocuiește regulile generate automat. Lasă gol pentru regulile implicite."
      >
        <Textarea
          value={form.robotsTxt}
          onChange={(v) => set('robotsTxt', v)}
          placeholder={`User-agent: *\nAllow: /\nDisallow: /admin/`}
          rows={6}
        />
      </Field>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-800 border border-gray-700">
        <Bot className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-gray-200 text-sm font-medium">Blochează roboții AI pentru training</p>
          <p className="text-gray-500 text-xs mt-1">
            Adaugă reguli Disallow pentru GPTBot, CCBot, Claude-Web, anthropic-ai și alți roboți de training.
          </p>
        </div>
        <button
          onClick={() => set('blockAiTrainingBots', !form.blockAiTrainingBots)}
          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
            form.blockAiTrainingBots ? 'bg-amber-500' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              form.blockAiTrainingBots ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium"
        >
          {saving ? 'Se salvează...' : 'Salvează setările'}
        </button>
      </div>
    </div>
  )
}

// ─── Tab: Sitemap ─────────────────────────────────────────────────────────────
function SitemapTab({ siteUrl }: { siteUrl: string }) {
  const [stats, setStats] = useState<SitemapStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [rebuilding, setRebuilding] = useState(false)
  const [rebuildResult, setRebuildResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pinging, setPinging] = useState(false)
  const [pingResults, setPingResults] = useState<Array<{ engine: string; ok: boolean; msg: string }>>([])

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/sitemap/rebuild')
      if (res.ok) setStats(await res.json())
    } finally {
      setLoadingStats(false)
    }
  }, [])

  useEffect(() => { loadStats() }, [loadStats])

  async function handleRebuild() {
    setRebuilding(true)
    setRebuildResult(null)
    try {
      const res = await fetch('/api/sitemap/rebuild', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setRebuildResult({ ok: true, msg: `Reclădit la ${new Date(data.rebuiltAt).toLocaleString('ro-RO')}` })
        loadStats()
      } else {
        setRebuildResult({ ok: false, msg: data.error ?? 'Eroare la reclădire' })
      }
    } catch {
      setRebuildResult({ ok: false, msg: 'Eroare de rețea' })
    } finally {
      setRebuilding(false)
    }
  }

  async function handlePing() {
    if (!siteUrl) return
    setPinging(true)
    setPingResults([])
    const sitemapUrl = `${siteUrl}/sitemap.xml`

    const engines = [
      {
        name: 'Google',
        url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      },
      {
        name: 'Bing',
        url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
      },
    ]

    const results = await Promise.all(
      engines.map(async ({ name, url }) => {
        try {
          const res = await fetch(`/api/sitemap/ping?url=${encodeURIComponent(url)}`)
          if (res.ok) return { engine: name, ok: true, msg: 'Ping trimis cu succes' }
          return { engine: name, ok: false, msg: `HTTP ${res.status}` }
        } catch {
          return { engine: name, ok: false, msg: 'Eroare de rețea' }
        }
      })
    )

    setPingResults(results)
    setPinging(false)
  }

  const base = siteUrl || 'http://localhost:3000'

  return (
    <div className="space-y-6">
      {/* Stats card */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Statistici sitemap</h3>
          {loadingStats && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
              {[
                { label: 'Total URL-uri', value: stats.total.toLocaleString() },
                { label: 'Articole', value: stats.breakdown.posts.toLocaleString() },
                { label: 'Pagini', value: stats.breakdown.pages.toLocaleString() },
                { label: 'Categorii top', value: stats.breakdown.topLevelCategories.toLocaleString() },
                { label: 'Subcategorii', value: stats.breakdown.subcategories.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {stats.chunksNeeded > 1 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-900/20 px-3 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Sitemap împărțit în {stats.chunksNeeded} fișiere (index + chunks)</span>
              </div>
            )}

            {stats.lastBuilt && (
              <p className="text-gray-500 text-xs mt-3">
                Ultima regenerare: {new Date(stats.lastBuilt).toLocaleString('ro-RO')}
              </p>
            )}
          </>
        ) : (
          !loadingStats && <p className="text-gray-500 text-sm">Nu s-au putut încărca statisticile.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleRebuild}
          disabled={rebuilding}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${rebuilding ? 'animate-spin' : ''}`} />
          {rebuilding ? 'Se regenerează...' : 'Regenerează Sitemap'}
        </button>

        <a
          href={`${base}/sitemap.xml`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Preview sitemap.xml
        </a>

        <a
          href={`${base}/sitemap-images.xml`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Preview sitemap-images.xml
        </a>

        <a
          href={`${base}/feed.xml`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Feed RSS
        </a>
      </div>

      {rebuildResult && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
            rebuildResult.ok
              ? 'bg-green-900/20 text-green-400 border border-green-800'
              : 'bg-red-900/20 text-red-400 border border-red-800'
          }`}
        >
          {rebuildResult.ok ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          {rebuildResult.msg}
        </div>
      )}

      <hr className="border-gray-700" />

      {/* Ping search engines */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold">Notifică motoarele de căutare</h3>
            <p className="text-gray-500 text-xs mt-0.5">
              Trimite ping către Google și Bing pentru a solicita re-crawlare sitemap.
            </p>
          </div>
          <button
            onClick={handlePing}
            disabled={pinging || !siteUrl}
            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Globe className={`w-4 h-4 ${pinging ? 'animate-pulse' : ''}`} />
            {pinging ? 'Se trimite...' : 'Ping Search Engines'}
          </button>
        </div>

        {pingResults.length > 0 && (
          <div className="space-y-2">
            {pingResults.map((r) => (
              <div
                key={r.engine}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${
                  r.ok
                    ? 'bg-green-900/20 text-green-400 border border-green-800'
                    : 'bg-red-900/20 text-red-400 border border-red-800'
                }`}
              >
                {r.ok ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                <span className="font-medium">{r.engine}:</span>
                <span>{r.msg}</span>
              </div>
            ))}
          </div>
        )}

        {!siteUrl && (
          <p className="text-amber-400 text-xs flex items-center gap-1.5 mt-2">
            <AlertCircle className="w-3.5 h-3.5" />
            Setează URL-ul site-ului în tab-ul General înainte de a trimite ping.
          </p>
        )}
      </div>

      {/* Sitemap URL reference */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-2">
        <h3 className="text-gray-300 text-sm font-semibold mb-3">URL-uri sitemap</h3>
        {[
          { label: 'Sitemap principal', url: `${base}/sitemap.xml` },
          { label: 'Sitemap imagini', url: `${base}/sitemap-images.xml` },
          { label: 'Feed RSS', url: `${base}/feed.xml` },
          { label: 'Robots.txt', url: `${base}/robots.txt` },
        ].map(({ label, url }) => (
          <div key={label} className="flex items-center justify-between gap-3">
            <span className="text-gray-400 text-xs w-36 shrink-0">{label}</span>
            <code className="flex-1 text-xs text-gray-300 font-mono bg-gray-900 px-2 py-1 rounded truncate">
              {url}
            </code>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-400 hover:text-indigo-300 shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
const DEFAULT_FORM: SeoSettings = {
  siteName: '',
  siteUrl: '',
  defaultMetaTitle: '',
  defaultMetaDesc: '',
  defaultOgImage: '',
  robotsTxt: '',
  blockAiTrainingBots: false,
  googleVerification: '',
}

export default function SeoSettingsPage() {
  const [tab, setTab] = useState<'general' | 'sitemap'>('general')
  const [form, setForm] = useState<SeoSettings>(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/seo-settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.seo) {
          setForm({
            siteName: data.seo.siteName ?? '',
            siteUrl: data.seo.siteUrl ?? '',
            defaultMetaTitle: data.seo.defaultMetaTitle ?? '',
            defaultMetaDesc: data.seo.defaultMetaDesc ?? '',
            defaultOgImage: data.seo.defaultOgImage ?? '',
            robotsTxt: data.seo.robotsTxt ?? '',
            blockAiTrainingBots: data.seo.blockAiTrainingBots ?? false,
            googleVerification: data.seo.googleVerification ?? '',
            sitemapLastBuilt: data.seo.sitemapLastBuilt,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function setField(k: keyof SeoSettings, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch('/api/seo-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteName: form.siteName,
          siteUrl: form.siteUrl,
          defaultMetaTitle: form.defaultMetaTitle || null,
          defaultMetaDesc: form.defaultMetaDesc || null,
          defaultOgImage: form.defaultOgImage || null,
          robotsTxt: form.robotsTxt || null,
          blockAiTrainingBots: form.blockAiTrainingBots,
          googleVerification: form.googleVerification || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSaveMsg({ ok: true, text: 'Setările au fost salvate.' })
      } else {
        setSaveMsg({ ok: false, text: data.error ?? 'Eroare la salvare' })
      }
    } catch {
      setSaveMsg({ ok: false, text: 'Eroare de rețea' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Setări SEO</h1>
        <p className="text-gray-400 text-sm mt-1">Configurare sitemap, robots.txt, metadate globale și feed RSS.</p>
      </div>

      {saveMsg && (
        <div
          className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg mb-4 ${
            saveMsg.ok
              ? 'bg-green-900/20 text-green-400 border border-green-800'
              : 'bg-red-900/20 text-red-400 border border-red-800'
          }`}
        >
          {saveMsg.ok ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
          {saveMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <TabBtn
          active={tab === 'general'}
          onClick={() => setTab('general')}
          icon={Search}
          label="General SEO"
        />
        <TabBtn
          active={tab === 'sitemap'}
          onClick={() => setTab('sitemap')}
          icon={Map}
          label="Sitemap & Feed"
        />
      </div>

      {tab === 'general' && (
        <GeneralTab form={form} set={setField} onSave={handleSave} saving={saving} />
      )}
      {tab === 'sitemap' && <SitemapTab siteUrl={form.siteUrl} />}
    </div>
  )
}
