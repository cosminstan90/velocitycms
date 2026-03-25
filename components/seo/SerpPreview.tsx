'use client'

import { useState } from 'react'
import { Monitor, Smartphone } from 'lucide-react'

interface SerpPreviewProps {
  title: string
  description: string
  slug: string
  siteDomain: string
  categorySlug?: string
}

/** Estimate rendered pixel width of a string using average 8px/char (Roboto-like) */
function estimatePx(text: string): number {
  // Simplified: uppercase ~10px, lowercase ~7px, space ~4px
  let px = 0
  for (const ch of text) {
    if (/[A-Z]/.test(ch)) px += 10
    else if (/[ ]/.test(ch)) px += 4
    else px += 7
  }
  return px
}

const TITLE_MAX_PX = 600
const TITLE_GOOD_MIN_PX = 200
const DESC_MAX_CHARS = 160
const DESC_GOOD_MIN_CHARS = 120

function PxBar({ px, max }: { px: number; max: number }) {
  const pct = Math.min(100, (px / max) * 100)
  const color = px > max ? '#ef4444' : px > max * 0.85 ? '#f59e0b' : px > max * 0.33 ? '#22c55e' : '#94a3b8'
  return (
    <div className="mt-1">
      <div className="relative h-1.5 rounded-full bg-slate-700">
        <div className="absolute inset-y-0 left-0 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
        {/* Max marker */}
        <div className="absolute inset-y-0 w-0.5 bg-slate-500" style={{ left: `100%`, transform: 'translateX(-1px)' }} />
      </div>
      <div className="flex justify-between text-[10px] mt-0.5" style={{ color }}>
        <span>{px}px</span>
        <span>máx {max}px</span>
      </div>
    </div>
  )
}

export default function SerpPreview({ title, description, slug, siteDomain, categorySlug }: SerpPreviewProps) {
  const [mobile, setMobile] = useState(false)

  const crumbs = [siteDomain, categorySlug, slug].filter(Boolean).join(' › ')
  const displayTitle = title || 'Titlu articol...'
  const displayDesc = description || 'Descriere meta pentru motoarele de căutare...'
  const titlePx = estimatePx(displayTitle)
  const descLen = displayDesc.length

  // Truncate title / description to SERP limits
  const truncatedTitle = titlePx > TITLE_MAX_PX
    ? (() => {
        let t = ''; let px = 0
        for (const ch of displayTitle) {
          const chPx = /[A-Z]/.test(ch) ? 10 : /[ ]/.test(ch) ? 4 : 7
          if (px + chPx > TITLE_MAX_PX) { t += '...'; break }
          t += ch; px += chPx
        }
        return t
      })()
    : displayTitle

  const truncatedDesc = descLen > DESC_MAX_CHARS ? displayDesc.slice(0, DESC_MAX_CHARS - 1) + '…' : displayDesc

  const titleColor = titlePx > TITLE_MAX_PX ? '#ef4444' : titlePx < TITLE_GOOD_MIN_PX ? '#94a3b8' : '#1a0dab'
  const descColor = descLen > DESC_MAX_CHARS ? '#ef4444' : descLen < DESC_GOOD_MIN_CHARS ? '#94a3b8' : '#545454'

  return (
    <div className="space-y-3">
      {/* Toggle mobile/desktop */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg w-fit" style={{ backgroundColor: '#0f172a' }}>
        <button
          type="button"
          onClick={() => setMobile(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition ${!mobile ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Monitor size={12} /> Desktop
        </button>
        <button
          type="button"
          onClick={() => setMobile(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition ${mobile ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
        >
          <Smartphone size={12} /> Mobil
        </button>
      </div>

      {/* SERP result card */}
      <div
        className="rounded-xl p-4 border border-slate-700"
        style={{
          backgroundColor: '#ffffff',
          maxWidth: mobile ? 320 : '100%',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        {/* Breadcrumb */}
        <div style={{ fontSize: mobile ? 11 : 12, color: '#202124', marginBottom: 2, lineHeight: '18px' }}>
          <span style={{ fontSize: mobile ? 14 : 16 }}>🌐</span>{' '}
          <span style={{ color: '#202124', fontWeight: 400 }}>{crumbs}</span>
          {' '}
          <span style={{ color: '#70757a', fontSize: 10 }}>▾</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: mobile ? 18 : 20,
            color: titleColor,
            lineHeight: '26px',
            marginBottom: 4,
            fontWeight: 400,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          {truncatedTitle}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: mobile ? 13 : 14,
            color: descColor,
            lineHeight: mobile ? '18px' : '20px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {truncatedDesc}
        </div>
      </div>

      {/* Pixel ruler for title */}
      <div className="text-[10px] text-slate-500 space-y-0.5">
        <span>Lătime titlu estimată</span>
        <PxBar px={titlePx} max={TITLE_MAX_PX} />
      </div>
    </div>
  )
}
