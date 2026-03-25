'use client'

/**
 * PublishingPanel
 *
 * Full publishing control panel for the post editor sidebar.
 * Replaces the simple Publish/Unpublish button pair.
 *
 * Features:
 *  - Publish Now (immediate)
 *  - Schedule: manual datetime OR Smart Schedule (AI slot picker)
 *  - "Programat pentru [date]" display with Cancel link
 *  - Mini calendar preview of that week's scheduled posts
 *  - Save Draft footer button
 */

import { useCallback, useEffect, useState } from 'react'
import {
  Globe, EyeOff, Calendar, Clock, Sparkles, Loader2,
  CheckCircle2, XCircle, AlertCircle, Save,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarPost {
  id: string
  title: string
  slug: string
  scheduledAt: string | null
  status: string
}

interface WeekDay {
  dateStr: string   // YYYY-MM-DD
  label: string     // e.g. "Lun 24"
  posts: CalendarPost[]
  isToday: boolean
}

interface Props {
  postId: string
  isNew: boolean
  status: string
  scheduledAt: string | null   // ISO string or null
  siteId: string
  onStatusChange: (s: string) => void
  onScheduledAtChange: (v: string | null) => void
  onSave: () => Promise<void>
  onPublish: () => Promise<void>
  onUnpublish: () => Promise<void>
  isSaving: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RO_WEEKDAYS = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm']
const RO_MONTHS   = ['Ian','Feb','Mar','Apr','Mai','Iun','Iul','Aug','Sep','Oct','Nov','Dec']

function fmtDate(iso: string): string {
  const d = new Date(iso)
  const day = RO_WEEKDAYS[d.getDay()]
  const date = d.getDate()
  const month = RO_MONTHS[d.getMonth()]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${day} ${date} ${month}, ${hh}:${mm}`
}

function getWeekDays(centerDate?: string): string[] {
  const base = centerDate ? new Date(centerDate) : new Date()
  // Start from Monday of that week
  const day = base.getDay()
  const monday = new Date(base)
  monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft', REVIEW: 'Review', PUBLISHED: 'Publicat', ARCHIVED: 'Arhivat',
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-400',
  REVIEW: 'bg-yellow-500/20 text-yellow-300',
  PUBLISHED: 'bg-green-500/20 text-green-300',
  ARCHIVED: 'bg-slate-500/20 text-slate-500',
}

// ─── Mini week calendar ───────────────────────────────────────────────────────

function WeekCalendar({ weekDays }: { weekDays: WeekDay[] }) {
  return (
    <div className="grid grid-cols-7 gap-0.5 mt-2">
      {weekDays.map((d) => (
        <div key={d.dateStr} className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] text-slate-600">{d.label.slice(0, 3)}</span>
          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-medium
            ${d.isToday ? 'bg-blue-600 text-white' : 'text-slate-400'}
            ${d.posts.length > 0 && !d.isToday ? 'bg-slate-700' : ''}`}>
            {d.dateStr.slice(8)}
          </div>
          <div className="flex gap-0.5 flex-wrap justify-center">
            {d.posts.slice(0, 3).map((p) => (
              <div
                key={p.id}
                title={p.title}
                className={`w-1.5 h-1.5 rounded-full ${p.status === 'PUBLISHED' ? 'bg-green-500' : 'bg-violet-500'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PublishingPanel({
  postId, isNew, status, scheduledAt,
  siteId, onStatusChange, onScheduledAtChange,
  onSave, onPublish, onUnpublish, isSaving,
}: Props) {
  const [scheduleOpen, setScheduleOpen] = useState(!!scheduledAt)
  const [manualDate, setManualDate] = useState(
    scheduledAt ? scheduledAt.slice(0, 16) : ''
  )
  const [smartLoading, setSmartLoading] = useState(false)
  const [smartSlotMsg, setSmartSlotMsg] = useState<string | null>(null)
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleError, setScheduleError] = useState<string | null>(null)
  const [weekDays, setWeekDays] = useState<WeekDay[]>([])
  const [publishLoading, setPublishLoading] = useState(false)
  const [unPublishLoading, setUnpublishLoading] = useState(false)

  // ── Load week calendar ─────────────────────────────────────────────────────
  const loadWeekCalendar = useCallback(async (aroundDate?: string) => {
    if (!siteId) return
    const monthStr = (aroundDate ?? new Date().toISOString()).slice(0, 7)
    try {
      const res = await fetch(`/api/scheduler/calendar?siteId=${siteId}&month=${monthStr}`)
      if (!res.ok) return
      const data = await res.json() as { days: Record<string, CalendarPost[]> }
      const today = new Date().toISOString().slice(0, 10)
      const days = getWeekDays(aroundDate)
      setWeekDays(days.map((dateStr) => ({
        dateStr,
        label: `${RO_WEEKDAYS[new Date(dateStr + 'T12:00:00').getDay()]} ${dateStr.slice(8)}`,
        posts: data.days[dateStr] ?? [],
        isToday: dateStr === today,
      })))
    } catch { /* ignore */ }
  }, [siteId])

  useEffect(() => {
    if (!isNew && scheduleOpen) loadWeekCalendar(scheduledAt ?? undefined)
  }, [isNew, scheduleOpen, scheduledAt, loadWeekCalendar])

  // ── Smart Schedule ─────────────────────────────────────────────────────────
  async function handleSmartSchedule() {
    if (!postId || isNew) return
    setSmartLoading(true)
    setSmartSlotMsg(null)
    setScheduleError(null)
    try {
      const res = await fetch(`/api/posts/${postId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto: true }),
      })
      const data = await res.json() as { scheduledAt?: string; error?: string }
      if (!res.ok || !data.scheduledAt) {
        setScheduleError(data.error ?? 'Nu s-a putut găsi un slot.')
        return
      }
      const dateStr = data.scheduledAt
      setManualDate(dateStr.slice(0, 16))
      onScheduledAtChange(dateStr)
      setSmartSlotMsg(`Următorul slot disponibil: ${fmtDate(dateStr)}`)
      loadWeekCalendar(dateStr)
    } catch {
      setScheduleError('Eroare de rețea.')
    } finally {
      setSmartLoading(false)
    }
  }

  // ── Manual schedule save ───────────────────────────────────────────────────
  async function handleManualSchedule() {
    if (!manualDate || isNew) return
    setScheduleLoading(true)
    setScheduleError(null)
    try {
      const res = await fetch(`/api/posts/${postId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date(manualDate).toISOString() }),
      })
      const data = await res.json() as { scheduledAt?: string; error?: string }
      if (!res.ok || !data.scheduledAt) {
        setScheduleError(data.error ?? 'Eroare la planificare.')
        return
      }
      onScheduledAtChange(data.scheduledAt)
      loadWeekCalendar(data.scheduledAt)
    } catch {
      setScheduleError('Eroare de rețea.')
    } finally {
      setScheduleLoading(false)
    }
  }

  // ── Cancel schedule ────────────────────────────────────────────────────────
  async function handleCancelSchedule() {
    if (!postId || isNew) return
    try {
      await fetch(`/api/posts/${postId}/schedule`, { method: 'DELETE' })
      onScheduledAtChange(null)
      setManualDate('')
      setSmartSlotMsg(null)
      setScheduleOpen(false)
    } catch { /* ignore */ }
  }

  // ── Publish Now ────────────────────────────────────────────────────────────
  async function handlePublishNow() {
    setPublishLoading(true)
    try {
      await onPublish()
    } finally {
      setPublishLoading(false)
    }
  }

  async function handleUnpublishNow() {
    setUnpublishLoading(true)
    try {
      await onUnpublish()
    } finally {
      setUnpublishLoading(false)
    }
  }

  const isScheduled = !!scheduledAt && status !== 'PUBLISHED'

  return (
    <div className="space-y-3">

      {/* ── Current status ── */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500">Status curent</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status] ?? STATUS_COLORS.DRAFT}`}>
          {STATUS_LABELS[status] ?? status}
        </span>
      </div>

      {/* ── Scheduled indicator ── */}
      {isScheduled && scheduledAt && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-violet-700 text-xs"
          style={{ backgroundColor: 'rgba(139,92,246,0.08)' }}>
          <Clock size={12} className="text-violet-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-violet-300 font-medium">Programat pentru</p>
            <p className="text-violet-200 text-[11px]">{fmtDate(scheduledAt)}</p>
          </div>
          <button
            type="button"
            onClick={handleCancelSchedule}
            className="text-[10px] text-slate-500 hover:text-red-400 transition underline shrink-0 mt-0.5"
          >
            Anulează
          </button>
        </div>
      )}

      {/* ── Publish Now ── */}
      {status !== 'PUBLISHED' ? (
        <button
          type="button"
          onClick={handlePublishNow}
          disabled={publishLoading || isNew}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
        >
          {publishLoading
            ? <Loader2 size={12} className="animate-spin" />
            : <Globe size={12} />}
          Publică acum
        </button>
      ) : (
        <button
          type="button"
          onClick={handleUnpublishNow}
          disabled={unPublishLoading}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white transition"
        >
          {unPublishLoading
            ? <Loader2 size={12} className="animate-spin" />
            : <EyeOff size={12} />}
          Retrage din publicare
        </button>
      )}

      {/* ── Schedule toggle ── */}
      {status !== 'PUBLISHED' && (
        <div>
          <button
            type="button"
            onClick={() => setScheduleOpen((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            <Calendar size={12} />
            {scheduleOpen ? 'Ascunde programare' : 'Programează publicarea'}
          </button>

          {scheduleOpen && (
            <div className="mt-3 space-y-3">
              {/* DateTime picker */}
              <div className="space-y-1">
                <label className="block text-[10px] font-medium text-slate-500">Dată și oră</label>
                <input
                  type="datetime-local"
                  value={manualDate}
                  onChange={(e) => {
                    setManualDate(e.target.value)
                    setSmartSlotMsg(null)
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white border border-slate-600 focus:outline-none focus:border-blue-500 transition"
                  style={{ backgroundColor: '#0f172a' }}
                />
              </div>

              {/* Smart Schedule button */}
              <button
                type="button"
                onClick={handleSmartSchedule}
                disabled={smartLoading || isNew}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs border border-violet-700 text-violet-300 hover:bg-violet-500/10 disabled:opacity-50 transition"
              >
                {smartLoading
                  ? <Loader2 size={11} className="animate-spin" />
                  : <Sparkles size={11} />}
                Smart Schedule
              </button>

              {/* Smart slot message */}
              {smartSlotMsg && (
                <div className="flex items-center gap-1.5 text-[11px] text-violet-300">
                  <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                  {smartSlotMsg}
                </div>
              )}

              {/* Error */}
              {scheduleError && (
                <div className="flex items-start gap-1.5 text-[11px] text-red-300">
                  <AlertCircle size={11} className="shrink-0 mt-0.5" />
                  {scheduleError}
                </div>
              )}

              {/* Manual save button */}
              {manualDate && !isScheduled && (
                <button
                  type="button"
                  onClick={handleManualSchedule}
                  disabled={scheduleLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white transition"
                >
                  {scheduleLoading
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Clock size={11} />}
                  Salvează programarea
                </button>
              )}

              {/* Week mini-calendar */}
              {weekDays.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-600 mb-1">Această săptămână</p>
                  <WeekCalendar weekDays={weekDays} />
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Programat
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Publicat
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div className="border-t border-slate-700" />

      {/* ── Save Draft (always visible) ── */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white disabled:opacity-50 transition"
      >
        {isSaving
          ? <Loader2 size={12} className="animate-spin" />
          : <Save size={12} />}
        Salvează draft
      </button>
    </div>
  )
}
