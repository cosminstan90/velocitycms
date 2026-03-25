'use client'
export const dynamic = 'force-dynamic'


import { useParams, useRouter } from 'next/navigation'

interface SiteData {
  id: string
  name: string
  domain: string
  isActive: boolean
}

const steps = [
  'Basic SEO Settings',
  'Create first Category',
  'Configure publish schedule',
  'Download PHP receiver',
  'Done',
]

export default function SiteSetupPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [site, setSite] = useState<SiteData | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [settings, setSettings] = useState({ siteName: '', siteUrl: '', defaultMetaDesc: '' })

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/sites`)
        if (!res.ok) throw new Error('Cannot load site')
        const data = await res.json()
        const found = data.sites.find((item: any) => item.id === params.id)
        setSite(found)
        if (found) {
          setSettings({ siteName: found.name, siteUrl: `https://${found.domain}`, defaultMetaDesc: '' })
        }
      } catch {
        setSite(null)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [params.id])

  if (isLoading) return <p>Se încarcă...</p>
  if (!site) return <p>Site inexistent.</p>

  async function markDone() {
    router.push('/admin/dashboard')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurare site: {site.name}</h1>
      <div className="grid grid-cols-5 gap-2">
        {steps.map((step, idx) => (
          <div key={idx} className={`p-2 text-xs text-center rounded ${activeStep === idx ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
            {idx + 1}. {step}
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
        {activeStep === 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Setări SEO de bază</h2>
            <label className="block text-xs text-slate-400">Nume site</label>
            <input className="w-full p-2 rounded bg-slate-800 border border-slate-700" value={settings.siteName} onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))} />
            <label className="block text-xs text-slate-400">Site URL</label>
            <input className="w-full p-2 rounded bg-slate-800 border border-slate-700" value={settings.siteUrl} onChange={(e) => setSettings((s) => ({ ...s, siteUrl: e.target.value }))} />
            <label className="block text-xs text-slate-400">Meta description implicită</label>
            <textarea className="w-full p-2 rounded bg-slate-800 border border-slate-700" value={settings.defaultMetaDesc} onChange={(e) => setSettings((s) => ({ ...s, defaultMetaDesc: e.target.value }))} />
          </div>
        )}

        {activeStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold">Creează prima categorie</h2>
            <p className="text-sm text-slate-400">Accesează meniul Categorii și adaugă una.</p>
            <button onClick={() => router.push('/admin/categories')} className="px-3 py-1.5 bg-slate-700 rounded">Mergi la Categorii</button>
          </div>
        )}

        {activeStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold">Configurare schema publicare</h2>
            <p className="text-sm text-slate-400">Setează preferințele de programare în Setările site.</p>
            <button onClick={() => router.push('/admin/settings')} className="px-3 py-1.5 bg-slate-700 rounded">Mergi la Setări</button>
          </div>
        )}

        {activeStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold">Descărcare receiver PHP</h2>
            <p className="text-sm text-slate-400">Apasă mai jos pentru a descărca bridge PHP.</p>
            <a href="/api/publisher/php-receiver" download="velocity-receiver.php" className="inline-block px-3 py-1.5 bg-slate-700 rounded">Descarcă</a>
          </div>
        )}

        {activeStep === 4 && (
          <div>
            <h2 className="text-lg font-semibold">Finalizat</h2>
            <p className="text-slate-300">Configurația este completă. Poți începe să publici încă de acum.</p>
            <button onClick={markDone} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 rounded">Mergi la dashboard</button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0} className="px-3 py-1.5 rounded bg-slate-700 text-sm">Înapoi</button>
        {activeStep < steps.length - 1 ? (
          <button onClick={() => setActiveStep((s) => Math.min(steps.length - 1, s + 1))} className="px-3 py-1.5 rounded bg-indigo-600 text-sm">Următor</button>
        ) : (
          <button onClick={markDone} className="px-3 py-1.5 rounded bg-emerald-600 text-sm">Termină</button>
        )}
      </div>
    </div>
  )
}
