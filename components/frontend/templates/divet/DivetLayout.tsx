'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BrandMark, type NavCategoryItem } from './utils'

interface DivetLayoutProps {
  site: { siteName: string; siteUrl: string }
  categories: NavCategoryItem[]
  activeCategory?: string | null
  seoSettings?: { defaultMetaDesc?: string | null } | null
  children: React.ReactNode
}

type ThemeState = 'system' | 'light' | 'dark'

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m1.2-4.8a6 6 0 11-12 0 6 6 0 0112 0Z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

function ThemeIcon({ dark }: { dark: boolean }) {
  if (dark) {
    return (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.5M12 18.5V21M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M3 12h2.5M18.5 12H21M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8M12 7.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Z" />
      </svg>
    )
  }

  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 15.4A8.5 8.5 0 1 1 8.6 4 6.8 6.8 0 0 0 20 15.4Z" />
    </svg>
  )
}

export default function DivetLayout({
  site,
  categories,
  activeCategory,
  seoSettings,
  children,
}: DivetLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [theme, setTheme] = useState<ThemeState>('system')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (theme === 'system') {
      window.localStorage.removeItem('divet-theme')
      return
    }

    window.localStorage.setItem('divet-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!searchOpen) return
    searchInputRef.current?.focus()
  }, [searchOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }

      if (event.key === 'Escape') {
        setMobileOpen(false)
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const lockScroll = mobileOpen || searchOpen
    document.documentElement.classList.toggle('overflow-hidden', lockScroll)
    return () => document.documentElement.classList.remove('overflow-hidden')
  }, [mobileOpen, searchOpen])

  const themeValue = theme
  const isDark = theme === 'dark'
  const primaryCategories = useMemo(() => categories.slice(0, 7), [categories])
  const footerCategories = useMemo(() => categories.slice(0, 6), [categories])
  const heroHint = seoSettings?.defaultMetaDesc ?? 'Enciclopedia editoriala pentru oameni care vor sa inteleaga animalele.'

  return (
    <div className="divet-shell relative min-h-screen" data-theme={themeValue}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -left-24 top-0 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'var(--dv-accent-soft)' }}
        />
        <div
          className="absolute right-[-6rem] top-24 h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'var(--dv-forest-soft)' }}
        />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          style={{ background: 'var(--dv-accent-strong)' }}
        >
          Sari la continut
        </a>

        <header
          className="sticky top-0 z-50 border-b border-[color:var(--dv-border)] backdrop-blur-xl"
          style={{ background: 'color-mix(in srgb, var(--dv-surface) 82%, transparent)' }}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex min-w-0 items-center gap-3">
              <BrandMark className="h-11 w-11 shrink-0" />
              <div className="min-w-0">
                <p className="divet-display text-2xl leading-none text-[color:var(--dv-contrast)]">{site.siteName}</p>
                <p className="truncate text-xs text-[color:var(--dv-muted)]">{heroHint}</p>
              </div>
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex" aria-label="Categorii principale">
              {primaryCategories.map((category) => {
                const active = activeCategory === category.slug
                return (
                  <Link
                    key={category.id}
                    href={`/${category.slug}`}
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      active
                        ? 'text-[color:var(--dv-contrast)]'
                        : 'text-[color:var(--dv-muted-strong)] hover:text-[color:var(--dv-contrast)]'
                    }`}
                    style={active ? { background: 'var(--dv-accent-soft)' } : undefined}
                  >
                    {category.name}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden items-center gap-2 rounded-full border border-[color:var(--dv-border)] px-4 py-2 text-sm text-[color:var(--dv-muted-strong)] transition-colors hover:text-[color:var(--dv-contrast)] md:flex"
              >
                <SearchIcon />
                Cauta
                <span className="rounded-full border border-[color:var(--dv-border)] px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-[color:var(--dv-muted)]">
                  Ctrl K
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--dv-border)] text-[color:var(--dv-muted-strong)] transition-colors hover:text-[color:var(--dv-contrast)]"
                aria-label={isDark ? 'Schimba pe light mode' : 'Schimba pe dark mode'}
              >
                <ThemeIcon dark={isDark} />
              </button>

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--dv-border)] text-[color:var(--dv-muted-strong)] transition-colors hover:text-[color:var(--dv-contrast)] lg:hidden"
                aria-label="Deschide meniul"
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </header>

        {searchOpen && (
          <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-16 sm:px-6" role="dialog" aria-modal="true" aria-label="Cautare">
            <button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setSearchOpen(false)}
              aria-label="Inchide cautarea"
            />
            <div className="divet-card relative z-10 w-full max-w-3xl rounded-[32px]">
              <form action="/cautare" method="get" className="border-b border-[color:var(--dv-border)] p-5 sm:p-6">
                <label htmlFor="divet-search" className="divet-kicker text-[11px] font-semibold">
                  Cauta in DiVet
                </label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--dv-muted)]">
                      <SearchIcon />
                    </span>
                    <input
                      ref={searchInputRef}
                      id="divet-search"
                      type="search"
                      name="q"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="rase, specii, ingrijire, comportament..."
                      className="divet-input h-14 w-full rounded-full pl-12 pr-4 text-base outline-none"
                      autoComplete="off"
                    />
                  </div>
                  <button type="submit" className="divet-button rounded-full px-6 py-3 text-sm font-semibold">
                    Vezi rezultatele
                  </button>
                </div>
              </form>
              <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
                <div>
                  <p className="divet-kicker text-[11px] font-semibold">Categorii populare</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.slice(0, 8).map((category) => (
                      <Link
                        key={category.id}
                        href={`/${category.slug}`}
                        onClick={() => setSearchOpen(false)}
                        className="divet-chip rounded-full px-3 py-2 text-sm transition-transform hover:-translate-y-0.5"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="divet-kicker text-[11px] font-semibold">Ce gasesti aici</p>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                    <p>Rase si specii explicate clar, fara zgomot de magazin.</p>
                    <p>Articole scrise pentru oameni curiosi, nu doar pentru roboti de cautare.</p>
                    <p>Subcategorii utile precum caini mici, de vanatoare, de paza sau de familie.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {mobileOpen && (
          <div className="fixed inset-0 z-[65] lg:hidden" role="dialog" aria-modal="true" aria-label="Meniu mobil">
            <button
              type="button"
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Inchide meniul"
            />
            <div
              className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-[color:var(--dv-border)] p-5"
              style={{ background: 'color-mix(in srgb, var(--dv-surface-strong) 90%, transparent)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BrandMark className="h-10 w-10" />
                  <div>
                    <p className="divet-display text-2xl leading-none text-[color:var(--dv-contrast)]">{site.siteName}</p>
                    <p className="text-xs text-[color:var(--dv-muted)]">enciclopedia moderna despre animale</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--dv-border)] text-[color:var(--dv-muted-strong)]"
                  aria-label="Inchide meniul"
                >
                  <CloseIcon />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchOpen(true)
                  setMobileOpen(false)
                }}
                className="divet-button-ghost mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
              >
                <SearchIcon />
                Cauta in DiVet
              </button>

              <nav className="mt-8 space-y-2 overflow-y-auto" aria-label="Navigatie mobila">
                {categories.map((category) => {
                  const active = activeCategory === category.slug
                  return (
                    <Link
                      key={category.id}
                      href={`/${category.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-[22px] px-4 py-3 text-sm text-[color:var(--dv-text)] transition-colors"
                      style={active ? { background: 'var(--dv-accent-soft)' } : { background: 'color-mix(in srgb, var(--dv-surface) 72%, transparent)' }}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs text-[color:var(--dv-muted)]">{category._count?.posts ?? 0}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        )}

        <main id="main-content" className="relative flex-1">
          {children}
        </main>

        <footer className="border-t border-[color:var(--dv-border)] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <BrandMark className="h-11 w-11" />
                <div>
                  <p className="divet-display text-3xl leading-none text-[color:var(--dv-contrast)]">{site.siteName}</p>
                  <p className="text-sm text-[color:var(--dv-muted)]">Friendly editorial. Taxonomie clara. Lectura care ramane.</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                DiVet este construit ca o enciclopedie calma despre animale: articole utile, categorii care au sens si o experienta
                vizuala suficient de buna incat sa ramai sa citesti.
              </p>
            </div>

            <div>
              <p className="divet-kicker text-[11px] font-semibold">Explorare rapida</p>
              <div className="mt-4 space-y-2">
                {footerCategories.map((category) => (
                  <Link key={category.id} href={`/${category.slug}`} className="block text-sm text-[color:var(--dv-muted-strong)] transition-colors hover:text-[color:var(--dv-contrast)]">
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="divet-kicker text-[11px] font-semibold">Mai departe</p>
              <div className="mt-4 space-y-2 text-sm text-[color:var(--dv-muted-strong)]">
                <Link href="/blog" className="block transition-colors hover:text-[color:var(--dv-contrast)]">Toate articolele</Link>
                <Link href="/cautare" className="block transition-colors hover:text-[color:var(--dv-contrast)]">Cautare</Link>
                <p>Shortcut: Ctrl + K</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
