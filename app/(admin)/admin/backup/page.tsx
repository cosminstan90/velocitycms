'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Database, FolderSync, Archive, Play, Download, RotateCcw, Bell,
  CheckCircle2, XCircle, Loader2, Clock, HardDrive, AlertTriangle,
  Save, Mail, ShieldAlert
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BackupEntry {
  id: string
  type: 'DATABASE' | 'MEDIA' | 'FULL'
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
  filePath: string | null
  fileSize: number | null
  fileSizeFmt: string
  duration: number | null
  error: string | null
  createdAt: string
}

interface BackupStats {
  database: BackupEntry | null
  media:    BackupEntry | null
  full:     BackupEntry | null
}

interface SeoSettings {
  notifyEmail: string | null
  notifyOnPublish: boolean
  notifyOnBackup: boolean
  notifyOnErrors: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  if (d > 0) return `acum ${d}z`
  if (h > 0) return `acum ${h}h`
  if (m > 0) return `acum ${m}m`
  return 'acum câteva sec.'
}

function fmtDuration(ms: number | null) {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function StatusBadge({ status }: { status: BackupEntry['status'] }) {
  if (status === 'SUCCESS') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
      <CheckCircle2 size={10} /> SUCCESS
    </span>
  )
  if (status === 'FAILED') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
      <XCircle size={10} /> FAILED
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
      <Loader2 size={10} className="animate-spin" /> RUNNING
    </span>
  )
}

function TypeBadge({ type }: { type: BackupEntry['type'] }) {
  const cfg = {
    DATABASE: { label: 'Bază de date', icon: Database,    cls: 'text-sky-400' },
    MEDIA:    { label: 'Media',        icon: FolderSync,  cls: 'text-violet-400' },
    FULL:     { label: 'Complet',      icon: Archive,     cls: 'text-amber-400' },
  }[type]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.cls}`}>
      <Icon size={12} /> {cfg.label}
    </span>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, icon: Icon, iconClass, entry, onRun, running
}: {
  label: string
  icon: React.ElementType
  iconClass: string
  entry: BackupEntry | null
  onRun: () => void
  running: boolean
}) {
  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-[#0f172a] border border-[#334155]`}>
            <Icon size={13} className={iconClass} />
          </div>
          <span className="text-xs font-semibold text-slate-300">{label}</span>
        </div>
        {entry && <StatusBadge status={entry.status} />}
      </div>

      {entry ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Ultima dată</span>
            <span className="text-slate-300">{timeAgo(entry.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Mărime</span>
            <span className="text-slate-300">{entry.fileSizeFmt}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Durată</span>
            <span className="text-slate-300">{fmtDuration(entry.duration)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600 mb-1">Niciun backup efectuat.</p>
      )}

      <button
        onClick={onRun}
        disabled={running}
        className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0f172a] border border-[#334155] hover:border-[#475569] text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
      >
        {running ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
        Rulează acum
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'logs' | 'restore' | 'settings'

export default function BackupPage() {
  const [tab, setTab] = useState<Tab>('logs')
  const [logs, setLogs] = useState<BackupEntry[]>([])
  const [stats, setStats] = useState<BackupStats>({ database: null, media: null, full: null })
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<Record<string, boolean>>({})

  // Restore state
  const [restoreFile, setRestoreFile] = useState('')
  const [restoreConfirm, setRestoreConfirm] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Settings state
  const [seoSettings, setSeoSettings] = useState<SeoSettings>({
    notifyEmail: '', notifyOnPublish: false, notifyOnBackup: true, notifyOnErrors: true,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  const loadLogs = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/backup/list?page=${p}&limit=20`)
      const data = await res.json()
      setLogs(data.logs ?? [])
      setStats(data.latest ?? { database: null, media: null, full: null })
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLogs(1) }, [loadLogs])

  // Load notification settings
  useEffect(() => {
    fetch('/api/seo-settings').then(r => r.json()).then(data => {
      if (data.seo) setSeoSettings({
        notifyEmail:    data.seo.notifyEmail ?? '',
        notifyOnPublish: data.seo.notifyOnPublish ?? false,
        notifyOnBackup:  data.seo.notifyOnBackup ?? true,
        notifyOnErrors:  data.seo.notifyOnErrors ?? true,
      })
    }).catch(() => {})
  }, [])

  async function handleRunBackup(type: 'database' | 'media' | 'full') {
    setRunning(r => ({ ...r, [type]: true }))
    try {
      const res = await fetch('/api/backup/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      await res.json()
      await loadLogs(1)
    } finally {
      setRunning(r => ({ ...r, [type]: false }))
    }
  }

  async function handleRestore() {
    if (!restoreFile || !restoreConfirm) return
    setRestoring(true)
    setRestoreMsg(null)
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupFile: restoreFile, confirm: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setRestoreMsg({ ok: true, text: 'Restaurare finalizată cu succes.' })
        setRestoreFile('')
        setRestoreConfirm(false)
      } else {
        setRestoreMsg({ ok: false, text: data.error ?? 'Eroare necunoscută' })
      }
    } finally {
      setRestoring(false)
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      await fetch('/api/seo-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seoSettings),
      })
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } finally {
      setSavingSettings(false)
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'logs',     label: 'Istoric backup' },
    { id: 'restore',  label: 'Restaurare' },
    { id: 'settings', label: 'Notificări' },
  ]

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-xl font-bold text-slate-100 mb-1">Backup</h1>
      <p className="text-slate-400 text-sm mb-6">Gestionați backup-urile și notificările pentru site.</p>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Bază de date"
          icon={Database}
          iconClass="text-sky-400"
          entry={stats.database}
          onRun={() => handleRunBackup('database')}
          running={!!running.database}
        />
        <StatCard
          label="Media"
          icon={FolderSync}
          iconClass="text-violet-400"
          entry={stats.media}
          onRun={() => handleRunBackup('media')}
          running={!!running.media}
        />
        <StatCard
          label="Complet"
          icon={Archive}
          iconClass="text-amber-400"
          entry={stats.full}
          onRun={() => handleRunBackup('full')}
          running={!!running.full}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-[#334155]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Logs Tab ─────────────────────────────────────────────────────── */}
      {tab === 'logs' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#334155] flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              {total} înregistrări
            </span>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(t => (
                <button
                  key={t}
                  onClick={() => handleRunBackup(t === 1 ? 'database' : t === 2 ? 'media' : 'full')}
                  disabled={running[t === 1 ? 'database' : t === 2 ? 'media' : 'full']}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#0f172a] border border-[#334155] hover:border-[#475569] text-slate-300 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {running[t === 1 ? 'database' : t === 2 ? 'media' : 'full']
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Play size={11} />
                  }
                  {t === 1 ? 'DB' : t === 2 ? 'Media' : 'Full'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <Loader2 size={20} className="animate-spin mx-auto mb-2" />
              Se încarcă...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <HardDrive size={24} className="text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Niciun backup efectuat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-[#334155]">
                    <th className="px-4 py-2.5 text-left font-medium">Tip</th>
                    <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    <th className="px-4 py-2.5 text-left font-medium">Fișier</th>
                    <th className="px-4 py-2.5 text-right font-medium">Mărime</th>
                    <th className="px-4 py-2.5 text-right font-medium">Durată</th>
                    <th className="px-4 py-2.5 text-right font-medium">Data</th>
                    <th className="px-4 py-2.5 text-center font-medium">Acțiuni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3"><TypeBadge type={log.type} /></td>
                      <td className="px-4 py-3"><StatusBadge status={log.status} /></td>
                      <td className="px-4 py-3 max-w-[260px]">
                        {log.filePath ? (
                          <span className="text-xs font-mono text-slate-400 truncate block" title={log.filePath}>
                            {log.filePath.split('/').pop()}
                          </span>
                        ) : log.error ? (
                          <span className="text-xs text-rose-400 truncate block" title={log.error}>
                            {log.error.slice(0, 60)}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">{log.fileSizeFmt}</td>
                      <td className="px-4 py-3 text-right text-xs text-slate-400">
                        <span className="flex items-center justify-end gap-1">
                          <Clock size={10} />
                          {fmtDuration(log.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-slate-500">
                        {timeAgo(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {log.status === 'SUCCESS' && log.filePath && !log.filePath.includes('|') && (
                          <a
                            href={`/api/backup/download?file=${encodeURIComponent(log.filePath)}`}
                            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                            title="Descarcă"
                          >
                            <Download size={12} />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-5 py-3 border-t border-[#334155]">
              <button
                onClick={() => loadLogs(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 text-xs bg-[#0f172a] border border-[#334155] rounded text-slate-400 disabled:opacity-50"
              >
                ← Precedent
              </button>
              <span className="text-xs text-slate-500">{page} / {totalPages}</span>
              <button
                onClick={() => loadLogs(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs bg-[#0f172a] border border-[#334155] rounded text-slate-400 disabled:opacity-50"
              >
                Următor →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Restore Tab ──────────────────────────────────────────────────── */}
      {tab === 'restore' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-5">
          <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            <ShieldAlert size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-300 mb-0.5">Atenție — Operațiune ireversibilă</p>
              <p className="text-xs text-rose-400/80">
                Restaurarea va suprascrie baza de date curentă cu datele din fișierul de backup.
                Asigurați-vă că aveți un backup recent înainte de a continua.
                Această operațiune necesită rolul de <strong>Administrator</strong>.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Calea completă a fișierului backup (.sql.gz)
            </label>
            <input
              type="text"
              value={restoreFile}
              onChange={(e) => setRestoreFile(e.target.value)}
              placeholder="/backups/db/2024-01-15-siteid.sql.gz"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-[#475569]"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={restoreConfirm}
              onChange={(e) => setRestoreConfirm(e.target.checked)}
              className="w-4 h-4 rounded border-[#334155] bg-[#0f172a]"
            />
            <span className="text-sm text-slate-300">
              Înțeleg că această operațiune va suprascrie baza de date curentă.
            </span>
          </label>

          {restoreMsg && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
              restoreMsg.ok
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {restoreMsg.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {restoreMsg.text}
            </div>
          )}

          <button
            onClick={handleRestore}
            disabled={!restoreFile || !restoreConfirm || restoring}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {restoring
              ? <><Loader2 size={14} className="animate-spin" /> Se restaurează...</>
              : <><RotateCcw size={14} /> Restaurează baza de date</>
            }
          </button>
        </div>
      )}

      {/* ── Settings Tab ─────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-[#334155]">
            <Bell size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-200">Notificări email</h2>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Mail size={11} /> Adresă email pentru notificări
            </label>
            <input
              type="email"
              value={seoSettings.notifyEmail ?? ''}
              onChange={(e) => setSeoSettings(s => ({ ...s, notifyEmail: e.target.value || null }))}
              placeholder="admin@example.com"
              className="w-full max-w-sm bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#475569]"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {([
              {
                key: 'notifyOnBackup' as const,
                label: 'Notificare backup',
                desc: 'Trimite email după fiecare backup reușit sau eșuat.',
                icon: HardDrive,
              },
              {
                key: 'notifyOnPublish' as const,
                label: 'Notificare publicare articol',
                desc: 'Trimite email când un articol este publicat.',
                icon: Archive,
              },
              {
                key: 'notifyOnErrors' as const,
                label: 'Alertă erori 404',
                desc: 'Trimite email când sunt detectate >10 URL-uri cu erori 404 în 24h.',
                icon: AlertTriangle,
              },
            ] as const).map(({ key, label, desc, icon: Icon }) => (
              <label key={key} className="flex items-start gap-3 p-3 bg-[#0f172a] border border-[#334155] rounded-xl cursor-pointer hover:border-[#475569] transition-colors">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#1e293b] border border-[#334155] flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
                <div className="shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={() => setSeoSettings(s => ({ ...s, [key]: !s[key] }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      seoSettings[key] ? 'bg-violet-600' : 'bg-[#334155]'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        seoSettings[key] ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {savingSettings
              ? <><Loader2 size={14} className="animate-spin" /> Salvare...</>
              : settingsSaved
                ? <><CheckCircle2 size={14} /> Salvat!</>
                : <><Save size={14} /> Salvează setările</>
            }
          </button>

          {/* Crontab reference */}
          <div className="pt-4 border-t border-[#334155]">
            <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
              <Clock size={11} /> Crontab recomandat (server)
            </p>
            <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3.5 text-xs font-mono text-slate-400 overflow-x-auto">
{`# Backup zilnic baza de date la 2am
0 2 * * * curl -s -H "X-Cron-Secret: $CRON_SECRET" \\
  "https://yoursite.com/api/backup/run?type=database"

# Backup media saptamanal duminica la 3am
0 3 * * 0 curl -s -H "X-Cron-Secret: $CRON_SECRET" \\
  "https://yoursite.com/api/backup/run?type=media"

# Backup complet lunar pe 1 la 4am
0 4 1 * * curl -s -H "X-Cron-Secret: $CRON_SECRET" \\
  "https://yoursite.com/api/backup/run?type=full"`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
