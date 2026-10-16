'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── Design tokens ────────────────────────────────────────────────────────────

const FOREST      = '#1a2e1c'
const FOREST_MID  = '#2a4d2e'
const MOSS        = '#4a8a4a'
const CREAM       = '#f6f1e6'
const CREAM_WARM  = '#ede6d3'
const GOLD        = '#c4893a'
const GOLD_LIGHT  = '#e8b86a'
const TEXT_MUTED  = '#6b7a65'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DivetLayoutProps {
  site: { siteName: string; siteUrl: string }
  categories: Array<{
    id: string
    name: string
    slug: string
    description?: string | null
    _count?: { posts: number }
  }>
  seoSettings?: { defaultMetaDesc?: string | null } | null
  activeCategory?: string | null
  children: React.ReactNode
}

// ─── SVG Leaf pattern (used in hero sections) ────────────────────────────────

export const LEAF_PATTERN_SVG = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 C20 15 10 25 15 35 C20 45 35 45 40 35 C45 25 35 15 30 5Z' fill='%23ffffff' fill-opacity='0.07'/%3E%3C/svg%3E")`

// ─── Component ────────────────────────────────────────────────────────────────

export default function DivetLayout({
  site,
  categories,
  seoSettings,
  activeCategory,
  children,
}: DivetLayoutProps) {
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [showMega, setShowMega]         = useState(false)
  const [showBackTop, setShowBackTop]   = useState(false)
  const searchInputRef                  = useRef<HTMLInputElement>(null)
  const megaTimerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Font import via style tag
  useEffect(() => {
    if (document.getElementById('divet-fonts')) return
    const link = document.createElement('link')
    link.id = 'divet-fonts'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,600&family=Lora:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])

  useEffect(() => { if (searchOpen) searchInputRef.current?.focus() }, [searchOpen])

  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setMobileOpen(false); setSearchOpen(false); setShowMega(false) }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  useEffect(() => {
    const open = mobileOpen || searchOpen
    document.documentElement.classList.toggle('overflow-hidden', open)
    return () => document.documentElement.classList.remove('overflow-hidden')
  }, [mobileOpen, searchOpen])

  const closeAll = useCallback(() => { setMobileOpen(false); setSearchOpen(false); setShowMega(false) }, [])

  const handleMegaEnter = () => {
    if (megaTimerRef.current) clearTimeout(megaTimerRef.current)
    setShowMega(true)
  }

  const handleMegaLeave = () => {
    megaTimerRef.current = setTimeout(() => setShowMega(false), 120)
  }

  const [logoFirst, logoSecond] = (() => {
    const name = site.siteName
    const mid  = Math.ceil(name.length / 2)
    return [name.slice(0, mid), name.slice(mid)]
  })()

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif', backgroundColor: CREAM_WARM }}>

      {/* ══ SKIP TO CONTENT ══════════════════════════════════════════════════════ */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:font-bold"
        style={{ backgroundColor: MOSS, color: CREAM }}
      >
        Sari la conținut
      </a>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50" style={{ backgroundColor: FOREST, height: '52px' }}>
        <div className="max-w-[1200px] mx-auto px-5 h-full flex items-center justify-between gap-6">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label={`${site.siteName} - Acasă`}>
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontWeight: 700, color: CREAM }}>
              {logoFirst}
            </span>
            <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '22px', fontWeight: 700, color: GOLD_LIGHT }}>
              {logoSecond}
            </span>
          </Link>

          {/* Desktop nav — hidden ≤768px */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navigare principală">
            <Link
              href="/"
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: CREAM, fontFamily: '"DM Sans", sans-serif' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = FOREST_MID)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              Acasă
            </Link>

            {/* Animale mega-menu trigger */}
            <div
              className="relative"
              onMouseEnter={handleMegaEnter}
              onMouseLeave={handleMegaLeave}
            >
              <button
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{ color: CREAM, backgroundColor: showMega ? FOREST_MID : 'transparent' }}
                aria-expanded={showMega}
              >
                Animale
                <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mega-menu dropdown */}
              {showMega && categories.length > 0 && (
                <div
                  className="absolute top-full left-0 mt-1 rounded-2xl shadow-2xl overflow-hidden"
                  style={{ width: '500px', backgroundColor: 'white', border: `1px solid rgba(26,46,28,0.12)` }}
                >
                  <div className="p-4 grid grid-cols-2 gap-2">
                    {categories.slice(0, 8).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/${cat.slug}`}
                        onClick={closeAll}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors group"
                        style={{ ...(activeCategory === cat.slug ? { backgroundColor: CREAM_WARM } : {}) }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = CREAM_WARM)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = activeCategory === cat.slug ? CREAM_WARM : 'transparent')}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: CREAM_WARM }}>
                          🐾
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold truncate" style={{ color: FOREST }}>
                            {cat.name}
                          </div>
                          {cat._count && (
                            <div className="text-xs" style={{ color: TEXT_MUTED }}>{cat._count.posts} articole</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t flex justify-between items-center" style={{ borderColor: CREAM_WARM }}>
                    <span className="text-xs" style={{ color: TEXT_MUTED }}>
                      {categories.length} categorii disponibile
                    </span>
                    <Link
                      href="/blog"
                      className="text-xs font-semibold flex items-center gap-1"
                      style={{ color: MOSS }}
                      onClick={closeAll}
                    >
                      Toate articolele →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {categories.slice(0, 3).map((cat) => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  color: activeCategory === cat.slug ? GOLD_LIGHT : CREAM,
                  backgroundColor: activeCategory === cat.slug ? FOREST_MID : 'transparent',
                  fontFamily: '"DM Sans", sans-serif',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = FOREST_MID)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = activeCategory === cat.slug ? FOREST_MID : 'transparent')}
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Right: search + hamburger */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              aria-label="Caută (Ctrl+K)"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = FOREST_MID)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: CREAM }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
              aria-label="Deschide meniu"
              aria-expanded={mobileOpen}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = FOREST_MID)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: CREAM }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ══ SEARCH OVERLAY ═══════════════════════════════════════════════════════ */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20" role="dialog" aria-modal="true" aria-label="Căutare">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeAll} aria-hidden="true" />
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ border: `1px solid rgba(26,46,28,0.12)` }}>
            <form action="/cautare" method="get" className="flex items-center gap-3 px-5 py-4">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: MOSS }} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                name="q"
                placeholder="Caută animale, rase, articole..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-lg outline-none bg-transparent"
                style={{ color: FOREST, fontFamily: '"DM Sans", sans-serif' }}
                autoComplete="off"
              />
              <button type="button" onClick={closeAll} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: TEXT_MUTED }} aria-label="Închide căutare">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
            {categories.length > 0 && (
              <div className="px-5 pb-4 border-t pt-3" style={{ borderColor: CREAM_WARM }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: TEXT_MUTED }}>Categorii populare</p>
                <div className="flex flex-wrap gap-2">
                  {categories.slice(0, 6).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/${cat.slug}`}
                      onClick={closeAll}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                      style={{ backgroundColor: CREAM_WARM, color: FOREST }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ MOBILE MENU OVERLAY ══════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Meniu">
          <div className="absolute inset-0" style={{ backgroundColor: FOREST }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid rgba(246,241,230,0.1)` }}>
              <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '20px', fontWeight: 700, color: CREAM }}>
                {logoFirst}<span style={{ color: GOLD_LIGHT }}>{logoSecond}</span>
              </span>
              <button onClick={closeAll} className="p-2 rounded-xl" style={{ backgroundColor: FOREST_MID, color: CREAM }} aria-label="Închide meniu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Categories grid */}
            <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 130px)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD_LIGHT }}>Categorii</p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/${cat.slug}`}
                    onClick={closeAll}
                    className="flex flex-col gap-1 p-4 rounded-2xl transition-colors"
                    style={{
                      backgroundColor: activeCategory === cat.slug ? MOSS : FOREST_MID,
                      border: activeCategory === cat.slug ? `1px solid ${MOSS}` : '1px solid transparent',
                    }}
                  >
                    <span className="text-sm font-semibold" style={{ color: CREAM }}>{cat.name}</span>
                    {cat._count && (
                      <span className="text-xs" style={{ color: GOLD_LIGHT }}>{cat._count.posts} articole</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div className="absolute bottom-0 left-0 right-0 px-5 py-4" style={{ borderTop: `1px solid rgba(246,241,230,0.1)` }}>
              <button
                onClick={() => { closeAll(); setTimeout(() => setSearchOpen(true), 50) }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm"
                style={{ backgroundColor: MOSS, color: CREAM }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Caută pe site
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MAIN CONTENT ═════════════════════════════════════════════════════════ */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {children}
      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════════ */}
      <footer style={{ backgroundColor: FOREST, color: CREAM }} aria-label="Footer">
        <div className="max-w-[1200px] mx-auto px-5 py-14">
          <div className="grid md:grid-cols-4 gap-10 pb-10" style={{ borderBottom: `1px solid rgba(246,241,230,0.12)` }}>

            {/* Brand */}
            <div>
              <div className="mb-4">
                <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '24px', fontWeight: 700, color: CREAM }}>
                  {logoFirst}
                </span>
                <span style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '24px', fontWeight: 700, color: GOLD_LIGHT }}>
                  {logoSecond}
                </span>
              </div>
              {seoSettings?.defaultMetaDesc && (
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(246,241,230,0.6)' }}>
                  {seoSettings.defaultMetaDesc}
                </p>
              )}
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
                Enciclopedia Animală Română
              </p>
            </div>

            {/* Category columns */}
            {[0, 1, 2].map((colIdx) => {
              const size    = Math.ceil(categories.length / 3)
              const colCats = categories.slice(colIdx * size, (colIdx + 1) * size)
              if (!colCats.length) return null
              return (
                <div key={colIdx}>
                  {colIdx === 0 && (
                    <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: GOLD_LIGHT }}>
                      Categorii
                    </p>
                  )}
                  {colIdx > 0 && <div className="hidden md:block h-5 mt-[22px]" />}
                  <ul className="space-y-2">
                    {colCats.map((cat) => (
                      <li key={cat.id}>
                        <Link
                          href={`/${cat.slug}`}
                          className="text-sm transition-colors"
                          style={{ color: 'rgba(246,241,230,0.6)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = CREAM)}
                          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(246,241,230,0.6)')}
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'rgba(246,241,230,0.4)' }}>
              © {new Date().getFullYear()} {site.siteName} · Toate drepturile rezervate
            </p>
            <nav aria-label="Link-uri legale" className="flex items-center gap-4 text-xs" style={{ color: 'rgba(246,241,230,0.4)' }}>
              {[
                { href: '/politica-de-confidentialitate', label: 'Confidențialitate' },
                { href: '/termeni-si-conditii', label: 'Termeni' },
                { href: '/contact', label: 'Contact' },
                { href: '/sitemap.xml', label: 'Sitemap' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-colors hover:text-white"
                  style={{ color: 'rgba(246,241,230,0.4)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = CREAM)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(246,241,230,0.4)')}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>

      {/* ══ BACK TO TOP ══════════════════════════════════════════════════════════ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Înapoi sus"
        className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-xl shadow-lg flex items-center justify-center transition-all duration-300 ${
          showBackTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ backgroundColor: MOSS, color: CREAM }}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  )
}
