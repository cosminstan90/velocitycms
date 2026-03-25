'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'
import SerpPreview from './SerpPreview'
import { slugify } from '@/lib/slugify'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeoPanelProps {
  title: string
  slug: string
  metaTitle: string
  metaDescription: string
  focusKeyword: string
  contentHtml: string
  contentJson?: Record<string, unknown>
  canonicalUrl: string
  noIndex: boolean
  siteDomain: string
  categorySlug?: string
  /** Controlled callbacks — the panel also owns these fields */
  onChangeMetaTitle: (v: string) => void
  onChangeMetaDesc: (v: string) => void
  onChangeFocusKeyword: (v: string) => void
  onChangeCanonical: (v: string) => void
  onChangeNoIndex: (v: boolean) => void
  onChangeSlug: (v: string) => void
  onRegenerateSlug: () => void
  /** Called when user clicks the "open links panel" hint (0 internal links) */
  onOpenLinksPanel?: () => void
}

// ─── Stopwords (Romanian) ─────────────────────────────────────────────────────

const RO_STOPWORDS = ['și', 'sau', 'în', 'la', 'de', 'cu', 'pe', 'un', 'o', 'că', 'din', 'pentru', 'este', 'a', 'al', 'ale']

// ─── Analysis logic ───────────────────────────────────────────────────────────

interface AnalysisResult {
  wordCount: number
  keywordInTitle: boolean
  keywordInMeta: boolean
  keywordInFirstParagraph: boolean
  keywordInH2: boolean
  keywordDensity: number
  h2Count: number
  internalLinkCount: number
  externalLinkCount: number
  imagesWithAlt: number
  imagesWithoutAlt: number
  metaFilled: boolean
  hasFAQBlock: boolean
  hasHowToBlock: boolean
  slugHasStopwords: boolean
  score: number
  factors: ScoreFactor[]
}

interface ScoreFactor {
  key: string
  label: string
  status: 'ok' | 'warn' | 'error' | 'bonus'
  value?: string | number
  tip?: string
}

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractFirstParagraphText(html: string): string {
  const m = /<p[^>]*>(.*?)<\/p>/i.exec(html)
  if (!m) return ''
  return htmlToText(m[1])
}

function extractH2Texts(html: string): string[] {
  const re = /<h2[^>]*>(.*?)<\/h2>/gi
  const results: string[] = []
  let m
  while ((m = re.exec(html)) !== null) {
    results.push(htmlToText(m[1]))
  }
  return results
}

function getKeywordDensity(html: string, keyword: string): number {
  if (!keyword) return 0
  const text = htmlToText(html).toLowerCase()
  const words = text.split(/\s+/)
  const kw = keyword.toLowerCase()
  const count = words.filter((w) => w.includes(kw)).length
  return words.length ? (count / words.length) * 100 : 0
}

function countImages(html: string): { withAlt: number; withoutAlt: number } {
  const re = /<img([^>]*)>/gi
  let withAlt = 0; let withoutAlt = 0
  let m
  while ((m = re.exec(html)) !== null) {
    const attrs = m[1]
    const altMatch = /alt="([^"]*)"/i.exec(attrs)
    if (altMatch && altMatch[1].trim() !== '') withAlt++
    else withoutAlt++
  }
  return { withAlt, withoutAlt }
}

function countLinks(html: string): { internal: number; external: number } {
  const re = /<a[^>]+href="([^"]+)"[^>]*>/gi
  let internal = 0; let external = 0
  let m
  while ((m = re.exec(html)) !== null) {
    const href = m[1]
    if (href.startsWith('http://') || href.startsWith('https://')) external++
    else if (href.startsWith('/') || href.startsWith('#')) internal++
  }
  return { internal, external }
}

function slugHasStopword(slug: string): boolean {
  const parts = slug.split('-')
  return parts.some((p) => RO_STOPWORDS.includes(p.toLowerCase()))
}

function runAnalysis(
  title: string,
  metaTitle: string,
  metaDescription: string,
  focusKeyword: string,
  slug: string,
  contentHtml: string,
  contentJson?: Record<string, unknown>
): AnalysisResult {
  const kw = focusKeyword.toLowerCase().trim()
  const plainText = htmlToText(contentHtml)
  const wordCount = countWords(plainText)
  const firstPara = extractFirstParagraphText(contentHtml).toLowerCase()
  const h2s = extractH2Texts(contentHtml)
  const { withAlt, withoutAlt } = countImages(contentHtml)
  const { internal, external } = countLinks(contentHtml)
  const density = getKeywordDensity(contentHtml, kw)

  const keywordInTitle = kw ? (metaTitle || title).toLowerCase().includes(kw) : false
  const keywordInMeta = kw ? metaDescription.toLowerCase().includes(kw) : false
  const keywordInFirstParagraph = kw ? firstPara.includes(kw) : false
  const keywordInH2 = kw ? h2s.some((h) => h.toLowerCase().includes(kw)) : false
  const hasFAQ = contentHtml.includes('data-type="faq-block"') || contentHtml.includes('data-faq="true"')
  const hasHowTo = contentHtml.includes('data-type="howto-block"')
  const slugStop = slugHasStopword(slug)
  const metaFilled = metaDescription.length >= 50

  // Score calculation — out of 100
  const factors: ScoreFactor[] = []
  let score = 0

  const add = (
    key: string,
    label: string,
    pass: boolean,
    points: number,
    tip?: string,
    bonus = false,
    value?: string | number
  ) => {
    if (pass) score += points
    factors.push({
      key,
      label,
      status: bonus ? 'bonus' : pass ? 'ok' : points > 10 ? 'error' : 'warn',
      value,
      tip,
    })
  }

  add('wordCount', `Conținut (${wordCount} cuvinte)`, wordCount >= 600, 20,
    'Recomandat minim 600 cuvinte pentru articole informaționale.', false, wordCount)
  add('kwTitle', 'Keyword în titlu', keywordInTitle, 15, 'Includeți cuvântul cheie în titlu / meta title.')
  add('kwMeta', 'Keyword în meta descriere', keywordInMeta, 10, 'Includeți cuvântul cheie în meta descriere.')
  add('kwFirstPara', 'Keyword în primul paragraf', keywordInFirstParagraph, 10, 'Menționați cuvântul cheie în primul paragraf.')
  add('kwH2', 'Keyword în cel puțin un H2', keywordInH2, 5, 'Includeți cuvântul cheie într-un titlu H2.')
  add('h2Structure', `Structură H2 (${h2s.length} h2)`, h2s.length >= 2, 10, 'Folosiți cel puțin 2 subtitluri H2.')
  // Internal links: 0=error(red, 0pts), 1=warn(yellow, 5pts), 2+=ok(green, 10pts)
  factors.push({
    key: 'internalLinks',
    label: `Linkuri interne (${internal})`,
    status: internal === 0 ? 'error' : internal === 1 ? 'warn' : 'ok',
    value: internal,
    tip: internal === 0
      ? 'Niciun link intern. Folosiți panoul de Linkuri Interne pentru sugestii AI.'
      : internal === 1
        ? 'Un singur link intern — ideal ar fi 2 sau mai multe.'
        : `${internal} linkuri interne — excelent!`,
  })
  if (internal >= 2) score += 10
  else if (internal === 1) score += 5
  add('externalLinks', `Linkuri externe (${external})`, external >= 1, 5, 'Linkurile spre surse de autoritate ajută.')
  add('imgAlt', `Imagini cu alt (${withAlt}/${withAlt + withoutAlt})`, withoutAlt === 0 && withAlt > 0, 10,
    withoutAlt > 0 ? `${withoutAlt} imagine(i) fără text alternativ!` : 'Toate imaginile au text alternativ.')
  add('metaFilled', 'Meta descriere completată', metaFilled, 10, 'Meta descrierea trebuie să aibă minim 50 caractere.')
  add('slugClean', 'Slug fără cuvinte de oprire', !slugStop, 5, 'Evitați cuvinte ca: și, sau, în, la, de, cu...')
  // Bonus
  if (hasFAQ) { score += 5; factors.push({ key: 'faq', label: 'Bloc FAQ prezent (+5 GEO)', status: 'bonus' }) }
  if (hasHowTo) { score += 5; factors.push({ key: 'howto', label: 'Bloc HowTo prezent (+5 GEO)', status: 'bonus' }) }
  if (density > 0 && density <= 3) {
    factors.push({ key: 'density', label: `Densitate keyword: ${density.toFixed(1)}%`, status: 'ok', value: `${density.toFixed(1)}%` })
  } else if (density > 3) {
    factors.push({ key: 'density', label: `Densitate keyword: ${density.toFixed(1)}% — over-optimized!`, status: 'error', value: `${density.toFixed(1)}%`, tip: 'Densitate prea mare (>3%). Poate fi penalizat.' })
  }

  return {
    wordCount, keywordInTitle, keywordInMeta, keywordInFirstParagraph, keywordInH2,
    keywordDensity: density, h2Count: h2s.length, internalLinkCount: internal,
    externalLinkCount: external, imagesWithAlt: withAlt, imagesWithoutAlt: withoutAlt,
    metaFilled, hasFAQBlock: hasFAQ, hasHowToBlock: hasHowTo, slugHasStopwords: slugStop,
    score: Math.min(100, score), factors,
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: 'ok' | 'warn' | 'error' | 'bonus' }) {
  if (status === 'ok') return <CheckCircle2 size={13} className="text-green-400 shrink-0" />
  if (status === 'bonus') return <span className="text-yellow-400 text-xs shrink-0">★</span>
  if (status === 'warn') return <AlertCircle size={13} className="text-yellow-400 shrink-0" />
  return <XCircle size={13} className="text-red-400 shrink-0" />
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Bun' : score >= 40 ? 'Mediu' : 'Slab'
  // SVG arc gauge
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ * 0.75

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="80" height="56" viewBox="0 0 80 56">
        {/* Background arc */}
        <circle cx="40" cy="44" r={r} fill="none" stroke="#334155" strokeWidth="8"
          strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={circ * 0.125}
          strokeLinecap="round" transform="rotate(135 40 44)" />
        {/* Value arc */}
        <circle cx="40" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.125}
          strokeLinecap="round" transform="rotate(135 40 44)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        <text x="40" y="48" textAnchor="middle" fill={color} fontSize="15" fontWeight="700">{score}</text>
      </svg>
      <span className="text-xs font-medium" style={{ color }}>{label}</span>
    </div>
  )
}

function CharBar({ value, max, goodMin }: { value: number; max: number; goodMin: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = value > max ? '#ef4444' : value >= goodMin ? '#22c55e' : value > 0 ? '#f59e0b' : '#475569'
  return (
    <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-slate-400">{label}</label>
      {children}
    </div>
  )
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition ${className}`}
      style={{ backgroundColor: '#0f172a' }}
      {...props}
    />
  )
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 border border-slate-600 focus:outline-none focus:border-blue-500 transition resize-none ${className}`}
      style={{ backgroundColor: '#0f172a' }}
      {...props}
    />
  )
}

// ─── SeoPanel ─────────────────────────────────────────────────────────────────

export default function SeoPanel({
  title, slug, metaTitle, metaDescription, focusKeyword,
  contentHtml, contentJson, canonicalUrl, noIndex, siteDomain,
  categorySlug, onChangeMetaTitle, onChangeMetaDesc, onChangeFocusKeyword,
  onChangeCanonical, onChangeNoIndex, onChangeSlug, onRegenerateSlug,
  onOpenLinksPanel,
}: SeoPanelProps) {
  const [activeTab, setActiveTab] = useState<'analysis' | 'serp' | 'advanced'>('analysis')
  const [debouncedHtml, setDebouncedHtml] = useState(contentHtml)

  // Debounce content HTML for analysis (500ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedHtml(contentHtml), 500)
    return () => clearTimeout(t)
  }, [contentHtml])

  const analysis = useMemo(
    () => runAnalysis(title, metaTitle, metaDescription, focusKeyword, slug, debouncedHtml, contentJson),
    [title, metaTitle, metaDescription, focusKeyword, slug, debouncedHtml, contentJson]
  )

  const metaTitleLen = metaTitle.length
  const metaDescLen = metaDescription.length

  return (
    <div className="rounded-xl border border-slate-700 overflow-hidden" style={{ backgroundColor: '#1e293b' }}>
      {/* Header with score */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <span className="text-sm font-semibold text-white">🔍 SEO</span>
        <ScoreGauge score={analysis.score} />
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-700" style={{ backgroundColor: '#0f172a' }}>
        {(['analysis', 'serp', 'advanced'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition border-b-2 ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab === 'analysis' ? 'Analiză' : tab === 'serp' ? 'SERP' : 'Avansat'}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* ── ANALYSIS TAB ── */}
        {activeTab === 'analysis' && (
          <>
            {/* Focus keyword */}
            <Field label="Cuvânt cheie focus">
              <Input
                value={focusKeyword}
                onChange={(e) => onChangeFocusKeyword(e.target.value)}
                placeholder="ex: ghid seo wordpress"
              />
            </Field>

            {/* Checklist */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-slate-400 mb-2">Analiză conținut</p>
              {analysis.factors.map((f) => (
                <div key={f.key} className="flex items-start gap-2 group relative">
                  <StatusIcon status={f.status} />
                  <span className={`text-xs leading-tight flex-1 ${
                    f.status === 'ok' ? 'text-slate-300' :
                    f.status === 'bonus' ? 'text-yellow-300' :
                    f.status === 'warn' ? 'text-yellow-300' : 'text-red-300'
                  }`}>
                    {f.label}
                    {/* Shortcut to links panel when 0 internal links */}
                    {f.key === 'internalLinks' && f.status === 'error' && onOpenLinksPanel && (
                      <button
                        type="button"
                        onClick={onOpenLinksPanel}
                        className="ml-1.5 text-[10px] underline text-blue-400 hover:text-blue-300 transition"
                      >
                        Sugestii AI →
                      </button>
                    )}
                  </span>
                  {f.tip && (
                    <span className="hidden group-hover:block absolute left-5 top-5 z-50 max-w-48 rounded-lg px-2 py-1.5 text-[10px] text-slate-200 shadow-xl border border-slate-600 leading-snug pointer-events-none"
                      style={{ backgroundColor: '#0f172a' }}>
                      {f.tip}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Meta title */}
            <Field label={`Meta Title · ${metaTitleLen}/60`}>
              <Input
                value={metaTitle}
                onChange={(e) => onChangeMetaTitle(e.target.value)}
                maxLength={70}
                placeholder={title || 'Titlu pentru Google...'}
              />
              <CharBar value={metaTitleLen} max={60} goodMin={30} />
            </Field>

            {/* Meta description */}
            <Field label={`Meta Descriere · ${metaDescLen}/155`}>
              <Textarea
                value={metaDescription}
                onChange={(e) => onChangeMetaDesc(e.target.value)}
                maxLength={165}
                rows={3}
                placeholder="Descriere care apare în Google..."
              />
              <CharBar value={metaDescLen} max={155} goodMin={120} />
            </Field>

            {/* Slug */}
            <Field label="Slug URL">
              <div className="flex gap-1">
                <Input
                  value={slug}
                  onChange={(e) => onChangeSlug(slugify(e.target.value))}
                  className="font-mono"
                />
                <button
                  type="button"
                  onClick={onRegenerateSlug}
                  title="Regenerează din titlu"
                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 transition"
                  style={{ backgroundColor: '#0f172a' }}
                >
                  <RefreshCw size={12} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                {siteDomain}/{slug}
              </p>
              {analysis.slugHasStopwords && (
                <p className="text-[10px] text-yellow-400 mt-0.5 flex items-center gap-1">
                  <AlertCircle size={10} /> Slug-ul conține cuvinte de oprire
                </p>
              )}
            </Field>
          </>
        )}

        {/* ── SERP TAB ── */}
        {activeTab === 'serp' && (
          <SerpPreview
            title={metaTitle || title}
            description={metaDescription}
            slug={slug}
            siteDomain={siteDomain}
            categorySlug={categorySlug}
          />
        )}

        {/* ── ADVANCED TAB ── */}
        {activeTab === 'advanced' && (
          <div className="space-y-3">
            <Field label="Canonical URL">
              <Input
                value={canonicalUrl}
                onChange={(e) => onChangeCanonical(e.target.value)}
                placeholder={`https://${siteDomain}/${slug}`}
              />
            </Field>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noIndex}
                onChange={(e) => onChangeNoIndex(e.target.checked)}
                className="mt-0.5 rounded border-slate-600 bg-slate-800 text-red-600 focus:ring-0"
              />
              <div>
                <p className="text-xs text-slate-300 font-medium">Noindex</p>
                <p className="text-[10px] text-slate-500">Nu indexa această pagină în motoarele de căutare</p>
              </div>
            </label>

            {noIndex && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-800 text-xs text-red-300" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                <XCircle size={13} className="shrink-0" />
                Această pagină nu va fi indexată
              </div>
            )}

            {/* Missing alt text warning */}
            {analysis.imagesWithoutAlt > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-700 text-xs text-yellow-300" style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}>
                <AlertCircle size={13} className="shrink-0" />
                {analysis.imagesWithoutAlt} imagine(i) fără text alternativ
              </div>
            )}

            {/* Stats summary */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                { label: 'Cuvinte', value: analysis.wordCount },
                { label: 'H2-uri', value: analysis.h2Count },
                { label: 'Linkuri interne', value: analysis.internalLinkCount },
                { label: 'Linkuri externe', value: analysis.externalLinkCount },
                { label: 'Imagini cu alt', value: analysis.imagesWithAlt },
                { label: 'Imagini fără alt', value: analysis.imagesWithoutAlt },
              ].map((s) => (
                <div key={s.label} className="flex flex-col rounded-lg px-2 py-1.5 border border-slate-700" style={{ backgroundColor: '#0f172a' }}>
                  <span className="text-slate-500">{s.label}</span>
                  <span className="text-white font-semibold text-sm">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
