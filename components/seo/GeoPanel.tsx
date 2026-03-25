'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import {
  ChevronDown, ChevronUp, MessageSquare, Mic2, ListChecks,
  BarChart2, User, BookOpen, Table2, Scissors, CheckCircle2,
  XCircle, AlertTriangle, Info, Sparkles,
} from 'lucide-react'
import {
  calculateGeoScore,
  citabilityLabel,
  type GeoBreakdown,
  type GeoScoreResult,
} from '@/lib/seo/geo-scorer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GeoPanelProps {
  contentHtml: string
  contentJson?: Record<string, unknown>
  focusKeyword?: string | null
  schemaMarkup?: unknown
  authorName?: string | null
  authorCredentials?: string | null
  /** Stored score from DB (from last save) */
  storedGeoScore?: number | null
  storedBreakdown?: Record<string, unknown> | null
  /** Called when panel detects directAnswer / speakableSections for the first time */
  onExtracted?: (data: { directAnswer: string | null; speakableSections: string[] }) => void
}

// ─── Circular Gauge ───────────────────────────────────────────────────────────

function CircularGauge({ score }: { score: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score))
  const dashOffset = circumference - (progress / 100) * circumference

  const color = score >= 71 ? '#22c55e' : score >= 41 ? '#f59e0b' : '#ef4444'
  const label = score >= 71 ? 'Bun' : score >= 41 ? 'Mediu' : 'Slab'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={110} height={110} viewBox="0 0 110 110">
        {/* Background track */}
        <circle cx={55} cy={55} r={radius} fill="none" stroke="#1e293b" strokeWidth={10} />
        {/* Progress arc */}
        <circle
          cx={55} cy={55} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 55 55)"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        {/* Score text */}
        <text x={55} y={50} textAnchor="middle" fill="white" fontSize={22} fontWeight="700">
          {score}
        </text>
        <text x={55} y={66} textAnchor="middle" fill={color} fontSize={10} fontWeight="600">
          {label}
        </text>
      </svg>
      <span className="text-xs text-slate-400 font-medium">Scor GEO/AEO</span>
    </div>
  )
}

// ─── Factor row ───────────────────────────────────────────────────────────────

type FactorStatus = 'ok' | 'warn' | 'fail'

interface FactorConfig {
  key: keyof GeoBreakdown
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  description: (f: GeoBreakdown[keyof GeoBreakdown]) => string
  status: (f: GeoBreakdown[keyof GeoBreakdown]) => FactorStatus
}

const FACTORS: FactorConfig[] = [
  {
    key: 'directAnswer',
    label: 'Răspuns Direct',
    icon: MessageSquare,
    description: (f) => {
      const r = f as GeoBreakdown['directAnswer']
      return `Primul paragraf: ${r.wordCount} cuv. | Conține kw: ${r.hasKeyword ? 'Da' : 'Nu'} | Punct final: ${r.endsWithPeriod ? 'Da' : 'Nu'}`
    },
    status: (f) => {
      const r = f as GeoBreakdown['directAnswer']
      return r.score >= 20 ? 'ok' : r.score >= 8 ? 'warn' : 'fail'
    },
  },
  {
    key: 'speakable',
    label: 'Secțiuni Speakable',
    icon: Mic2,
    description: (f) => {
      const r = f as GeoBreakdown['speakable']
      return `${r.h2Count} titluri H2 | Schema speakable: ${r.hasSpeakableSchema ? 'Da' : 'Nu (salvează pentru a genera)'}`
    },
    status: (f) => {
      const r = f as GeoBreakdown['speakable']
      return r.score >= 15 ? 'ok' : r.score >= 8 ? 'warn' : 'fail'
    },
  },
  {
    key: 'structuredQA',
    label: 'FAQ Structurat',
    icon: ListChecks,
    description: (f) => {
      const r = f as GeoBreakdown['structuredQA']
      return `${r.faqCount} întrebări | Medie răspuns: ${r.avgAnswerWords} cuv.`
    },
    status: (f) => {
      const r = f as GeoBreakdown['structuredQA']
      return r.score >= 15 ? 'ok' : r.score >= 5 ? 'warn' : 'fail'
    },
  },
  {
    key: 'dataStats',
    label: 'Date & Statistici',
    icon: BarChart2,
    description: (f) => {
      const r = f as GeoBreakdown['dataStats']
      return `${r.count} statistici detectate (procente, cifre, ani)`
    },
    status: (f) => {
      const r = f as GeoBreakdown['dataStats']
      return r.score >= 10 ? 'ok' : r.score >= 3 ? 'warn' : 'fail'
    },
  },
  {
    key: 'authorCredibility',
    label: 'Credibilitate Autor',
    icon: User,
    description: (f) => {
      const r = f as GeoBreakdown['authorCredibility']
      return `Nume: ${r.hasName ? '✓' : '✗'} | Credențiale: ${r.hasCredentials ? '✓' : '✗'} | În schema: ${r.inSchema ? '✓' : '✗'}`
    },
    status: (f) => {
      const r = f as GeoBreakdown['authorCredibility']
      return r.score >= 10 ? 'ok' : r.score >= 4 ? 'warn' : 'fail'
    },
  },
  {
    key: 'definitionBlock',
    label: 'Bloc Definiție',
    icon: BookOpen,
    description: (f) => {
      const r = f as GeoBreakdown['definitionBlock']
      return `Kw în primele 100 cuv.: ${r.keywordInFirst100 ? 'Da' : 'Nu'} | Cuvânt definiție: ${r.hasDefinitionWord ? 'Da' : 'Nu'}`
    },
    status: (f) => {
      const r = f as GeoBreakdown['definitionBlock']
      return r.score >= 10 ? 'ok' : r.score >= 5 ? 'warn' : 'fail'
    },
  },
  {
    key: 'comparisonTable',
    label: 'Tabel Comparativ',
    icon: Table2,
    description: (f) => {
      const r = f as GeoBreakdown['comparisonTable']
      return r.hasComparison ? 'Tabel comparativ detectat ✓' : 'Niciun tabel comparativ — adaugă cu /compare'
    },
    status: (f) => ((f as GeoBreakdown['comparisonTable']).hasComparison ? 'ok' : 'fail'),
  },
  {
    key: 'citationReady',
    label: 'Citabilitate',
    icon: Scissors,
    description: (f) => {
      const r = f as GeoBreakdown['citationReady']
      return `Lungime medie propoziție: ${r.avgSentenceWords} cuvinte (ideal <20)`
    },
    status: (f) => {
      const r = f as GeoBreakdown['citationReady']
      return r.score >= 10 ? 'ok' : r.score >= 6 ? 'warn' : 'fail'
    },
  },
]

function StatusIcon({ status }: { status: FactorStatus }) {
  if (status === 'ok') return <CheckCircle2 size={14} className="text-green-400 shrink-0" />
  if (status === 'warn') return <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
  return <XCircle size={14} className="text-red-400 shrink-0" />
}

function FactorRow({ factor, result }: { factor: FactorConfig; result: GeoBreakdown[keyof GeoBreakdown] }) {
  const [open, setOpen] = useState(false)
  const status = factor.status(result)
  const pct = Math.round((result.score / result.max) * 100)

  return (
    <div
      className="cursor-pointer rounded-lg overflow-hidden border border-slate-700 hover:border-slate-600 transition"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <factor.icon size={13} className="text-slate-400 shrink-0" />
        <span className="flex-1 text-xs font-medium text-slate-300 leading-none">{factor.label}</span>
        <span className="text-xs text-slate-500 shrink-0">{result.score}/{result.max}</span>
        <div className="w-12 h-1.5 rounded-full bg-slate-700 overflow-hidden shrink-0">
          <div
            className={`h-full rounded-full ${status === 'ok' ? 'bg-green-500' : status === 'warn' ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <StatusIcon status={status} />
        {open ? <ChevronUp size={12} className="text-slate-500 shrink-0" /> : <ChevronDown size={12} className="text-slate-500 shrink-0" />}
      </div>
      {open && (
        <div className="px-3 pb-2 text-xs text-slate-400 border-t border-slate-700 pt-2">
          {factor.description(result)}
        </div>
      )}
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function GeoPanel({
  contentHtml,
  contentJson,
  focusKeyword,
  schemaMarkup,
  authorName,
  authorCredentials,
  storedGeoScore,
  storedBreakdown,
  onExtracted,
}: GeoPanelProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Compute live GEO score from current content (runs in browser — pure function)
  const result: GeoScoreResult = useMemo(() => {
    return calculateGeoScore({
      contentHtml: contentHtml || '',
      contentJson,
      focusKeyword,
      schemaMarkup,
      author: { name: authorName, credentials: authorCredentials },
    })
  }, [contentHtml, contentJson, focusKeyword, schemaMarkup, authorName, authorCredentials])

  // Notify parent when extracted data changes
  useEffect(() => {
    onExtracted?.({
      directAnswer: result.directAnswerText,
      speakableSections: result.speakableSections,
    })
  }, [result.directAnswerText, result.speakableSections, onExtracted])

  const { score, breakdown, suggestions, speakableSections, directAnswerText } = result
  const citability = citabilityLabel(score)

  // Stored score indicator
  const scoreDelta = storedGeoScore != null ? score - storedGeoScore : null

  return (
    <div className="space-y-4">

      {/* ── Score gauge ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center py-3 rounded-xl border border-slate-700"
        style={{ backgroundColor: '#0f172a' }}>
        <CircularGauge score={score} />

        {/* Stored vs live delta */}
        {scoreDelta != null && scoreDelta !== 0 && (
          <p className="text-xs mt-1 text-slate-500">
            {scoreDelta > 0 ? '+' : ''}{scoreDelta} față de ultima salvare
          </p>
        )}

        {/* AI Citability */}
        <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700">
          <Sparkles size={11} style={{ color: citability.color }} />
          <span className="text-xs font-medium" style={{ color: citability.color }}>
            Citabilitate AI: {citability.label}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-1 text-center px-4">
          Probabilitatea de a fi citat de ChatGPT, Perplexity sau Google AI Overviews
        </p>
      </div>

      {/* ── Direct Answer Preview ──────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Răspuns Direct AI
        </p>
        {directAnswerText ? (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2.5">
            <p className="text-xs text-blue-300 font-medium mb-1 flex items-center gap-1.5">
              <MessageSquare size={11} />
              Extras ca răspuns direct pentru ChatGPT / Perplexity
            </p>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
              &ldquo;{directAnswerText}&rdquo;
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-700 px-3 py-2.5">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info size={11} />
              Primul paragraf nu poate fi extras ca răspuns direct.
              Scrie o definiție concisă sub 60 cuvinte, cu cuvântul cheie.
            </p>
          </div>
        )}
      </div>

      {/* ── Speakable Sections ─────────────────────────────────────────── */}
      {speakableSections.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Secțiuni Speakable
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-normal not-italic">
              {speakableSections.length}
            </span>
          </p>
          <div className="space-y-1">
            {speakableSections.map((h2, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400 px-2 py-1 rounded bg-slate-800/50">
                <Mic2 size={10} className="text-slate-500 shrink-0" />
                <span className="truncate">{h2}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Factor Rows ────────────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Factori GEO
        </p>
        <div className="space-y-1.5">
          {FACTORS.map((factor) => (
            <FactorRow
              key={factor.key}
              factor={factor}
              result={breakdown[factor.key] as GeoBreakdown[keyof GeoBreakdown]}
            />
          ))}
        </div>
      </div>

      {/* ── Suggestions ────────────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSuggestions((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-300 transition"
          >
            <span>Sugestii GEO ({suggestions.length})</span>
            {showSuggestions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showSuggestions && (
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200 leading-relaxed"
                >
                  <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── All green state ─────────────────────────────────────────────── */}
      {suggestions.length === 0 && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-green-500/5 border border-green-500/20">
          <CheckCircle2 size={14} className="text-green-400 shrink-0" />
          <p className="text-xs text-green-300">
            Articolul este optimizat excelent pentru AI! Toate factorii GEO sunt bifați.
          </p>
        </div>
      )}

      <p className="text-xs text-slate-600 text-center">
        Salvează articolul pentru a recalcula scorul și a actualiza schema JSON-LD.
      </p>
    </div>
  )
}
