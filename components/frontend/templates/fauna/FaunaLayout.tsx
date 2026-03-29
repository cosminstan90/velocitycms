/**
 * Fauna — Shared Layout Shell
 *
 * Improvements over v1:
 *  - Skip-to-content link (accessibility)
 *  - aria-current="page" on active nav items
 *  - Back-to-top button (appears after scrolling 400px)
 *  - Search points to /cautare?q= (proper search results URL)
 *  - Mobile category strip visible on sm+md, hidden on lg
 *  - Keyboard: Cmd/Ctrl+K opens search
 *  - Body scroll locked during overlays via class, not inline style
 *  - Footer: social links column + sitemap link
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FaunaLayoutProps {
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function FaunaLayout({
  site,
  categories,
  seoSettings,
  activeCategory,
  children,
}: FaunaLayoutProps) {
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBackTop, setShowBackTop] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Focus search input when overlay opens
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Back-to-top visibility
  useEffect(() => {
    const onScroll = () => setShowBackTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { setMobileOpen(false); setSearchOpen(false) }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])

  // Lock body scroll when overlays are open
  useEffect(() => {
    const open = mobileOpen || searchOpen
    document.documentElement.classList.toggle('overflow-hidden', open)
    return () => document.documentElement.classList.remove('overflow-hidden')
  }, [mobileOpen, searchOpen])

  const closeAll = useCallback(() => { setMobileOpen(false); setSearchOpen(false) }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>

      {/* ══ SKIP TO CONTENT ══════════════════════════════════════════════════════ */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg"
      >
        Sari la conținut
      </a>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2.5 group" aria-label={`${site.siteName} - Acasă`}>
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm shadow-amber-200 group-hover:bg-amber-600 transition-colors" aria-hidden="true">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.5-2c-.83 0-1.5.67-1.5 1.5S6.67 11 7.5 11 9 10.33 9 9.5 8.33 8 7.5 8zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S17.33 8 16.5 8zM12 4c-.83 0-1.5.67-1.5 1.5S11.17 7 12 7s1.5-.67 1.5-1.5S12.83 4 12 4zm0 12c-2.21 0-4 1.12-4 2.5V20h8v-1.5c0-1.38-1.79-2.5-4-2.5z" />
                </svg>
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {site.siteName}
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5 overflow-hidden flex-1 justify-center" aria-label="Categorii principale">
              {categories.slice(0, 8).map((cat) => {
                const isActive = activeCategory === cat.slug
                return (
                  <Link
                    key={cat.id}
                    href={`/${cat.slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                      isActive
                        ? 'text-amber-700 bg-amber-50 font-bold'
                        : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    {cat.name}
                  </Link>
                )
              })}
              {categories.length > 8 && (
                <span className="px-2 py-1 text-xs text-gray-400 font-medium" aria-hidden="true">
                  +{categories.length - 8} mai mult
                </span>
              )}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                aria-label="Caută (Ctrl+K)"
                aria-expanded={searchOpen}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden sm:inline text-xs font-medium">Caută</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 border border-gray-200 rounded text-gray-400">
                  ⌘K
                </kbd>
              </button>

              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Deschide meniu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-drawer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / tablet: scrollable category strip */}
        <div className="lg:hidden overflow-x-auto border-t border-gray-100 scrollbar-hide">
          <div className="flex gap-2 px-4 py-2 w-max">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug
              return (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-amber-100 hover:text-amber-800'
                  }`}
                >
                  {cat.name}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* ══ SEARCH OVERLAY ═══════════════════════════════════════════════════════ */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-20" role="dialog" aria-modal="true" aria-label="Căutare">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAll} aria-hidden="true" />
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            <form action="/cautare" method="get" className="flex items-center gap-3 px-5 py-4">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                name="q"
                placeholder="Caută animale, rase, articole..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-lg text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                autoComplete="off"
              />
              <button type="button" onClick={closeAll} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Închide căutare">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
            <div className="px-5 pb-4 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400 font-medium mb-2">Categorii populare</p>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 6).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/${cat.slug}`}
                    onClick={closeAll}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full hover:bg-amber-100 transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE DRAWER ════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Meniu" id="mobile-drawer">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeAll} aria-hidden="true" />
          <div className="absolute top-0 right-0 w-80 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <span className="text-lg font-black text-gray-900">{site.siteName}</span>
              <button onClick={closeAll} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Închide meniu">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3" aria-label="Navigare mobilă">
              <Link href="/" onClick={closeAll} className="flex items-center gap-3 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Acasă
              </Link>

              <div className="px-5 pt-4 pb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Categorii</p>
              </div>

              {categories.map((cat) => {
                const isActive = activeCategory === cat.slug
                return (
                  <Link
                    key={cat.id}
                    href={`/${cat.slug}`}
                    onClick={closeAll}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center justify-between px-5 py-3 text-sm transition-colors ${
                      isActive ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-700 hover:bg-gray-50 font-medium'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {cat._count && (
                      <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {cat._count.posts}
                      </span>
                    )}
                  </Link>
                )
              })}

              <div className="px-5 pt-4 pb-2 mt-2 border-t border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Altele</p>
              </div>
              <Link href="/comparatie" onClick={closeAll} className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                Comparații rase
              </Link>
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 space-y-2">
              <button
                onClick={() => { closeAll(); setTimeout(() => setSearchOpen(true), 50) }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-amber-200"
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
      <footer className="bg-gray-900 text-gray-400" aria-label="Footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid md:grid-cols-4 gap-10 pb-10 border-b border-gray-800">

            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center" aria-hidden="true">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.5-2c-.83 0-1.5.67-1.5 1.5S6.67 11 7.5 11 9 10.33 9 9.5 8.33 8 7.5 8zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S17.33 8 16.5 8zM12 4c-.83 0-1.5.67-1.5 1.5S11.17 7 12 7s1.5-.67 1.5-1.5S12.83 4 12 4zm0 12c-2.21 0-4 1.12-4 2.5V20h8v-1.5c0-1.38-1.79-2.5-4-2.5z" />
                  </svg>
                </div>
                <span className="text-xl font-black text-white tracking-tight">{site.siteName}</span>
              </div>
              {seoSettings?.defaultMetaDesc && (
                <p className="text-sm leading-relaxed text-gray-500 mb-5">{seoSettings.defaultMetaDesc}</p>
              )}
              {/* Social links */}
              <div className="flex items-center gap-2">
                {[
                  { href: '#', label: 'Facebook', icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /> },
                  { href: '#', label: 'Instagram', icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /> },
                  { href: '#', label: 'YouTube', icon: <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /> },
                ].map(({ href, label, icon }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-amber-500 text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">{icon}</svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Category columns */}
            {[0, 1, 2].map((colIdx) => {
              const colSize = Math.ceil(categories.length / 3)
              const colCats = categories.slice(colIdx * colSize, (colIdx + 1) * colSize)
              if (colCats.length === 0) return null
              return (
                <div key={colIdx}>
                  {colIdx === 0 && (
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Categorii</p>
                  )}
                  {colIdx > 0 && <div className="hidden md:block h-5 mt-[22px]" />}
                  <ul className="space-y-2">
                    {colCats.map((cat) => (
                      <li key={cat.id}>
                        <Link href={`/${cat.slug}`} className="text-sm text-gray-500 hover:text-white transition-colors">
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Bottom bar */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} {site.siteName} · Toate drepturile rezervate
            </p>
            <nav aria-label="Link-uri legale" className="flex items-center gap-4 text-xs text-gray-600">
              <Link href="/politica-de-confidentialitate" className="hover:text-white transition-colors">Confidențialitate</Link>
              <Link href="/termeni-si-conditii" className="hover:text-white transition-colors">Termeni</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              <Link href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
            </nav>
          </div>
        </div>
      </footer>

      {/* ══ BACK TO TOP ══════════════════════════════════════════════════════════ */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Înapoi sus"
        className={`fixed bottom-6 right-6 z-40 w-11 h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg shadow-amber-200/50 flex items-center justify-center transition-all duration-300 ${
          showBackTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  )
}
