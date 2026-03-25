'use client'
export const dynamic = 'force-dynamic'


/**

 * /admin/scheduler

 *

 * Content scheduling dashboard.

 *

 * Tabs:

 *  - Calendar  — monthly grid with colored post dots; click month < > to navigate

 *  - List      — table: post title, scheduled/published at, category, author, status, cancel action

 *  - Week      — 7-column layout showing slots used vs available per day

 *  - Settings  — maxPerDay slider, preferred times list, timezone select, active toggle

 */


import {
  Calendar, List, LayoutGrid, Settings2, ChevronLeft, ChevronRight,
  Loader2, Clock, Globe, XCircle, Plus, Trash2, CheckCircle2, AlertCircle,
  ToggleLeft, ToggleRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarPost {
  id: string
  title: string
  slug: string
  scheduledAt: string | null
  status: string
  category: { name: string; slug: string } | null
  author: { name: string | null } | null
}

interface CalendarDays {
  [dateStr: string]: CalendarPost[]
}

interface SchedulerSettings {
  siteId: string
  maxPerDay: number
  preferredTimes: string[]
  timezone: string
  isActive: boolean
}

type Tab = 'calendar' | 'list' | 'week' | 'settings'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RO_WEEKDAYS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm']
const RO_MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
]
const MONTHS_SHORT = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

const EU_TIMEZONES = [
  'Europe/Bucharest', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Madrid', 'Europe/Rome', 'Europe/Warsaw', 'Europe/Prague',
  'Europe/Vienna', 'Europe/Amsterdam', 'Europe/Brussels', 'Europe/Copenhagen',
  'Europe/Helsinki', 'Europe/Athens', 'Europe/Istanbul', 'Europe/Moscow',
  'Europe/Kyiv', 'Europe/Budapest', 'Europe/Lisbon', 'Europe/Stockholm',
  'Europe/Oslo', 'Europe/Zurich',
]

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const day = RO_WEEKDAYS[d.getDay()]
  const date = d.getDate()
  const month = MONTHS_SHORT[d.getMonth()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${date} ${month}, ${hh}:${mm}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  // 0=Sun → remap to Monday-first (0=Mon..6=Sun)
  const raw = new Date(year, month, 1).getDay()
  return raw === 0 ? 6 : raw - 1
}

function toYMD(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getWeekDays(centerDate: string): string[] {
  const base = new Date(centerDate)
  const dow = base.getDay()
  const monday = new Date(base)
  monday.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-violet-500/20 text-violet-300 border-violet-700',
  PUBLISHED: 'bg-green-500/20 text-green-300 border-green-700',
  DRAFT: 'bg-slate-500/20 text-slate-400 border-slate-600',
}
const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programat', PUBLISHED: 'Publicat', DRAFT: 'Draft',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Dot({ status }: { status: string }) {
  const cls = status === 'PUBLISHED' ? 'bg-green-500' : 'bg-violet-500'
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${cls} shrink-0`} />
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const [tab, setTab] = useState<Tab>('calendar')
  const [year, setYear] = useState(() => new Date().getFullYear())
  const [month, setMonth] = useState(() => new Date().getMonth())
  const [days, setDays] = useState<CalendarDays>({})
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<SchedulerSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  // settings edit state
  const [maxPerDay, setMaxPerDay] = useState(3)
  const [preferredTimes, setPreferredTimes] = useState<string[]>(['09:00', '14:00', '18:00'])
  const [timezone, setTimezone] = useState('Europe/Bucharest')
  const [isActive, setIsActive] = useState(true)
  const [newTime, setNewTime] = useState('')
  const [newTimeError, setNewTimeError] = useState('')

  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  // ── Load calendar data ──────────────────────────────────────────────────────
  const loadCalendar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/scheduler/calendar?month=${monthStr}`)
      if (res.ok) {
        const data = await res.json() as { days: CalendarDays }
        setDays(data.days ?? {})
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [monthStr])

  useEffect(() => {
    void loadCalendar()
  }, [loadCalendar])

  // ── Load settings ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'settings') return
    fetch('/api/scheduler/settings')
      .then((r) => r.json())
      .then((data: { settings: SchedulerSettings }) => {
        if (data.settings) {
          setSettings(data.settings)
          setMaxPerDay(data.settings.maxPerDay)
          setPreferredTimes(data.settings.preferredTimes)
          setTimezone(data.settings.timezone)
          setIsActive(data.settings.isActive)
        }
      })
      .catch(() => {})
  }, [tab])

  // ── Cancel a scheduled post ─────────────────────────────────────────────────
  async function handleCancel(postId: string) {
    if (!confirm('Anulezi programarea acestui articol?')) return
    await fetch(`/api/posts/${postId}/schedule`, { method: 'DELETE' })
    void loadCalendar()
  }

  // ── Save settings ───────────────────────────────────────────────────────────
  async function handleSaveSettings() {
    setSettingsLoading(true)
    setSettingsError(null)
    try {
      const res = await fetch('/api/scheduler/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPerDay, preferredTimes, timezone, isActive }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setSettingsError(d.error ?? 'Eroare la salvare.')
        return
      }
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch {
      setSettingsError('Eroare de rețea.')
    } finally {
      setSettingsLoading(false)
    }
  }

  function handleAddTime() {
    setNewTimeError('')
    if (!/^\d{2}:\d{2}$/.test(newTime)) {
      setNewTimeError('Format incorect. Folosiți HH:MM.')
      return
    }
    if (preferredTimes.includes(newTime)) {
      setNewTimeError('Ora există deja.')
      return
    }
    setPreferredTimes((prev) => [...prev, newTime].sort())
    setNewTime('')
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  // Flat list of all posts (for list + week views)
  const allPosts: CalendarPost[] = Object.values(days).flat()

  // Scheduled only (for week view slots calculation)
  const scheduledPosts = allPosts.filter((p) => p.status === 'SCHEDULED')

  // Week days for week view (always current week in current month context)
  const today = new Date().toISOString().slice(0, 10)
  const weekDayStrs = getWeekDays(today)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Planificator</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gestionează publicarea programată a articolelor</p>
        </div>

        {/* Month nav (shown for calendar + week tabs) */}
        {(tab === 'calendar' || tab === 'week') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { if (month === 0) { setMonth(11); setYear((y) => y - 1) } else setMonth((m) => m - 1) }}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-white w-36 text-center">
              {RO_MONTHS[month]} {year}
            </span>
            <button
              onClick={() => { if (month === 11) { setMonth(0); setYear((y) => y + 1) } else setMonth((m) => m + 1) }}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700 pb-0">
        {([
          { id: 'calendar', label: 'Calendar', Icon: Calendar },
          { id: 'list',     label: 'Listă',    Icon: List },
          { id: 'week',     label: 'Săptămână', Icon: LayoutGrid },
          { id: 'settings', label: 'Setări',   Icon: Settings2 },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border border-transparent transition -mb-px ${
              tab === id
                ? 'text-white border-slate-700 border-b-transparent bg-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Loading bar */}
      {loading && (
        <div className="flex items-center justify-center py-6 text-slate-500">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-sm">Se încarcă...</span>
        </div>
      )}

      {/* ── CALENDAR TAB ── */}
      {tab === 'calendar' && !loading && (
        <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-700">
            {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-slate-500">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {/* Empty cells before month start */}
            {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-700/50 bg-slate-800/20" />
            ))}

            {/* Month days */}
            {Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1).map((day) => {
              const dateStr = toYMD(year, month, day)
              const posts = days[dateStr] ?? []
              const isToday = dateStr === today
              return (
                <div
                  key={dateStr}
                  className={`min-h-[80px] border-b border-r border-slate-700/50 p-1.5 ${
                    isToday ? 'bg-blue-900/20' : ''
                  }`}
                >
                  {/* Day number */}
                  <div className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium mb-1 ${
                    isToday ? 'bg-blue-600 text-white' : 'text-slate-400'
                  }`}>
                    {day}
                  </div>

                  {/* Post dots + titles */}
                  <div className="space-y-0.5">
                    {posts.slice(0, 3).map((p) => (
                      <div key={p.id} className="flex items-center gap-1 min-w-0" title={p.title}>
                        <Dot status={p.status} />
                        <span className="text-[10px] text-slate-300 truncate leading-tight">{p.title}</span>
                      </div>
                    ))}
                    {posts.length > 3 && (
                      <span className="text-[10px] text-slate-500">+{posts.length - 3} mai mult</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2.5 border-t border-slate-700">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" /> Programat
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Publicat
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Azi
            </div>
          </div>
        </div>
      )}

      {/* ── LIST TAB ── */}
      {tab === 'list' && !loading && (
        <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
          {allPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
              <Calendar size={32} className="text-slate-600" />
              <p className="text-sm">Niciun articol programat sau publicat în această lună.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs text-slate-500">
                  <th className="text-left px-4 py-3 font-medium">Articol</th>
                  <th className="text-left px-4 py-3 font-medium">Dată</th>
                  <th className="text-left px-4 py-3 font-medium">Categorie</th>
                  <th className="text-left px-4 py-3 font-medium">Autor</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {allPosts
                  .sort((a, b) => {
                    const da = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0
                    const db = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0
                    return da - db
                  })
                  .map((p) => (
                    <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition">
                      <td className="px-4 py-3">
                        <a
                          href={`/admin/posts/${p.id}`}
                          className="text-white hover:text-blue-400 transition font-medium line-clamp-1"
                        >
                          {p.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">
                        {p.scheduledAt ? (
                          <span className="flex items-center gap-1.5">
                            <Clock size={11} className="shrink-0" />
                            {fmtDateTime(p.scheduledAt)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {p.category?.name ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {p.author?.name ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[p.status] ?? STATUS_COLORS.DRAFT}`}>
                          {p.status === 'PUBLISHED' ? <Globe size={10} /> : <Clock size={10} />}
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status === 'SCHEDULED' && (
                          <button
                            onClick={() => handleCancel(p.id)}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition"
                          >
                            <XCircle size={13} />
                            Anulează
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── WEEK TAB ── */}
      {tab === 'week' && !loading && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Săptămâna curentă — sloturi utilizate vs. disponibile (maxim {settings?.maxPerDay ?? 3}/zi)</p>
          <div className="grid grid-cols-7 gap-2">
            {weekDayStrs.map((dateStr) => {
              const postsOnDay = days[dateStr] ?? []
              const used = postsOnDay.filter((p) => p.status === 'SCHEDULED').length
              const published = postsOnDay.filter((p) => p.status === 'PUBLISHED').length
              const maxPD = settings?.maxPerDay ?? 3
              const available = Math.max(0, maxPD - used)
              const isToday = dateStr === today
              const dow = new Date(dateStr + 'T12:00:00').getDay()

              return (
                <div
                  key={dateStr}
                  className={`rounded-xl border p-3 flex flex-col gap-2 ${
                    isToday ? 'border-blue-600 bg-blue-900/20' : 'border-slate-700'
                  }`}
                  style={!isToday ? { backgroundColor: '#1e293b' } : undefined}
                >
                  {/* Header */}
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500">{RO_WEEKDAYS[dow]}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-blue-400' : 'text-white'}`}>
                      {dateStr.slice(8)}
                    </p>
                    <p className="text-[10px] text-slate-500">{MONTHS_SHORT[parseInt(dateStr.slice(5, 7)) - 1]}</p>
                  </div>

                  {/* Slot bars */}
                  <div className="space-y-1">
                    {/* Scheduled slots */}
                    {Array.from({ length: used }).map((_, i) => (
                      <div key={`s-${i}`} className="h-2 rounded-full bg-violet-500/70" />
                    ))}
                    {/* Available slots */}
                    {Array.from({ length: available }).map((_, i) => (
                      <div key={`a-${i}`} className="h-2 rounded-full bg-slate-700 border border-dashed border-slate-600" />
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="text-center space-y-0.5">
                    {used > 0 && (
                      <p className="text-[10px] text-violet-400">{used} programat{used > 1 ? 'e' : ''}</p>
                    )}
                    {published > 0 && (
                      <p className="text-[10px] text-green-400">{published} publicat{published > 1 ? 'e' : ''}</p>
                    )}
                    {used === 0 && published === 0 && (
                      <p className="text-[10px] text-slate-600">Liber</p>
                    )}
                    <p className="text-[10px] text-slate-500">{available} sloturi libere</p>
                  </div>

                  {/* Post titles */}
                  {postsOnDay.length > 0 && (
                    <div className="border-t border-slate-700 pt-2 space-y-1">
                      {postsOnDay.slice(0, 2).map((p) => (
                        <div key={p.id} className="flex items-start gap-1 min-w-0">
                          <Dot status={p.status} />
                          <a
                            href={`/admin/posts/${p.id}`}
                            className="text-[10px] text-slate-300 hover:text-white transition line-clamp-2 leading-tight"
                            title={p.title}
                          >
                            {p.title}
                          </a>
                        </div>
                      ))}
                      {postsOnDay.length > 2 && (
                        <p className="text-[10px] text-slate-500">+{postsOnDay.length - 2} mai mult</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-violet-500/70" /> Programat
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-2 rounded-full bg-slate-700 border border-dashed border-slate-600" /> Slot liber
            </div>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {tab === 'settings' && (
        <div className="max-w-xl space-y-6">
          <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
            <div className="px-5 py-4 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-white">Configurare planificator</h2>
              <p className="text-xs text-slate-500 mt-0.5">Setările afectează algoritmul Smart Schedule</p>
            </div>

            <div className="px-5 py-5 space-y-6">
              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Planificator activ</p>
                  <p className="text-xs text-slate-500 mt-0.5">Dezactivarea oprește Smart Schedule</p>
                </div>
                <button
                  onClick={() => setIsActive((v) => !v)}
                  className="transition"
                  title={isActive ? 'Dezactivează' : 'Activează'}
                >
                  {isActive
                    ? <ToggleRight size={32} className="text-blue-500" />
                    : <ToggleLeft size={32} className="text-slate-500" />}
                </button>
              </div>

              <div className="border-t border-slate-700" />

              {/* Max per day */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-white">Articole maxime / zi</label>
                  <span className="text-sm font-bold text-blue-400 w-6 text-right">{maxPerDay}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={maxPerDay}
                  onChange={(e) => setMaxPerDay(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-700" />

              {/* Preferred times */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-white">Ore preferate de publicare</p>
                  <p className="text-xs text-slate-500 mt-0.5">Smart Schedule va alege dintr-acestea (UTC)</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {preferredTimes.map((t) => (
                    <div
                      key={t}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-sm text-white"
                    >
                      <Clock size={11} className="text-slate-400" />
                      {t}
                      <button
                        onClick={() => setPreferredTimes((prev) => prev.filter((x) => x !== t))}
                        className="text-slate-500 hover:text-red-400 transition ml-0.5"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new time */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => { setNewTime(e.target.value); setNewTimeError('') }}
                      className="w-full px-3 py-1.5 rounded-lg text-sm text-white border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                      style={{ backgroundColor: '#0f172a' }}
                      placeholder="HH:MM"
                    />
                    {newTimeError && (
                      <p className="text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={10} /> {newTimeError}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleAddTime}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-white transition border border-slate-600 shrink-0"
                  >
                    <Plus size={12} /> Adaugă
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-700" />

              {/* Timezone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white block">Fus orar</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm text-slate-300 border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  {EU_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Ora curentă în {timezone}:{' '}
                  <span className="text-slate-300">
                    {new Intl.DateTimeFormat('ro-RO', {
                      timeZone: timezone,
                      hour: '2-digit', minute: '2-digit', second: '2-digit',
                    }).format(new Date())}
                  </span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {settingsSaved && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <CheckCircle2 size={13} /> Salvat cu succes
                  </span>
                )}
                {settingsError && (
                  <span className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle size={13} /> {settingsError}
                  </span>
                )}
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
              >
                {settingsLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                Salvează setările
              </button>
            </div>
          </div>

          {/* Info box */}
          <div className="rounded-xl border border-slate-700 px-5 py-4 space-y-2" style={{ backgroundColor: '#1e293b' }}>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cum funcționează Smart Schedule</h3>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Scanează următoarele <strong className="text-slate-300">14 zile</strong> și alege primul slot liber</li>
              <li>• Respectă limita de <strong className="text-slate-300">maxime / zi</strong> și orele preferate</li>
              <li>• Evită coliziunile ±30 minute față de alte articole programate</li>
              <li>• Slotul ales trebuie să fie cu cel puțin <strong className="text-slate-300">5 minute</strong> în viitor</li>
              <li>• Cron-ul verifică la fiecare 5 minute: <code className="bg-slate-800 px-1 rounded">*/5 * * * *</code></li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
