'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavGroup, GroupPost } from '@/lib/navigation'
import DivetMegaPanel from './DivetMegaPanel'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-dv-accent'
const CLOSE_DELAY_MS = 150

export default function DivetNav({
  groups,
  recentByGroup,
  activeSlug,
  extraLinks = [],
}: {
  groups: NavGroup[]
  recentByGroup: Record<string, GroupPost[]>
  activeSlug?: string | null
  extraLinks?: Array<{ label: string; href: string }>
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [prevPath, setPrevPath] = useState<string | null>(null)
  const pathname = usePathname()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const chevrons = useRef<Record<string, HTMLButtonElement | null>>({})

  // Orice navigare inchide meniurile (ajustare de stare in timpul randarii, fara efecte).
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    if (openId !== null) setOpenId(null)
    if (mobileOpen) setMobileOpen(false)
  }

  const clearTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }
  const open = (id: string) => {
    clearTimer()
    setOpenId(id)
  }
  const scheduleClose = () => {
    clearTimer()
    closeTimer.current = setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== 'Escape' || openId === null) return
    clearTimer()
    const id = openId
    setOpenId(null)
    chevrons.current[id]?.focus()
  }

  return (
    <div className="relative border-b border-dv-border bg-dv-surface">
      {/* Desktop */}
      <nav
        aria-label="Navigare principală"
        className="hidden px-4 md:px-10 lg:block"
        onKeyDown={handleKeyDown}
      >
        <ul className="flex h-[50px] items-stretch gap-[26px]">
          {groups.map((group) => {
            const hasChildren = group.children.length > 0
            const panelId = `dv-panel-${group.id}`
            const isActive = group.slug === activeSlug
            const isOpen = openId === group.id
            return (
              <li
                key={group.id}
                className="flex items-stretch"
                // Hover doar cu mouse-ul: pe touch, atingerea emuleaza mouseenter si ar deschide
                // panoul chiar inainte ca `click` sa-l inchida din nou. Focusul deschide doar
                // cand vine de la tastatura (:focus-visible), nu la atingere.
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') open(group.id)
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') scheduleClose()
                }}
                onFocus={(e) => {
                  if ((e.target as HTMLElement).matches(':focus-visible')) open(group.id)
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) scheduleClose()
                }}
              >
                <Link
                  href={group.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center border-b-2 text-[14px] ${focusRing} ${
                    isActive
                      ? 'border-dv-accent font-semibold text-dv-accent'
                      : 'border-transparent text-dv-ink hover:text-dv-accent'
                  }`}
                >
                  {group.name}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    ref={(el) => {
                      chevrons.current[group.id] = el
                    }}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    aria-label={`Deschide submeniul ${group.name}`}
                    onClick={() => (isOpen ? setOpenId(null) : open(group.id))}
                    className={`flex items-center px-2 text-dv-ink-muted hover:text-dv-accent ${focusRing}`}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 12 12"
                      width="10"
                      height="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m2 4.5 4 4 4-4" />
                    </svg>
                  </button>
                )}
                {hasChildren && (
                  <div
                    className={`${isOpen ? '' : 'hidden'} absolute inset-x-0 top-full z-40 border-y border-dv-border bg-dv-surface px-4 pb-7 pt-[26px] shadow-dv-mega md:px-10`}
                  >
                    <DivetMegaPanel group={group} recentPosts={recentByGroup[group.id] ?? []} id={panelId} />
                  </div>
                )}
              </li>
            )
          })}
          {extraLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
            return (
              <li key={l.href} className="flex items-stretch">
                <Link
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center border-b-2 text-[14px] ${focusRing} ${
                    active
                      ? 'border-dv-accent font-semibold text-dv-accent'
                      : 'border-transparent text-dv-ink hover:text-dv-accent'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Mobil */}
      <div className="px-4 md:px-10 lg:hidden">
        <button
          type="button"
          aria-expanded={mobileOpen}
          aria-controls="dv-mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
          className={`h-11 text-[14px] font-semibold text-dv-ink ${focusRing}`}
        >
          Meniu
        </button>
        <div id="dv-mobile-menu" className={`${mobileOpen ? '' : 'hidden'} pb-3`}>
          {groups.map((group) => {
            const isActive = group.slug === activeSlug
            const tone = isActive ? 'font-semibold text-dv-accent' : 'text-dv-ink'
            if (group.children.length === 0) {
              return (
                <Link
                  key={group.id}
                  href={group.href}
                  className={`flex min-h-11 items-center border-t border-dv-border text-[14px] ${focusRing} ${tone}`}
                >
                  {group.name}
                </Link>
              )
            }
            return (
              <details key={group.id} open={isActive} className="border-t border-dv-border">
                <summary className={`flex min-h-11 cursor-pointer items-center text-[14px] ${focusRing} ${tone}`}>
                  {group.name}
                </summary>
                <ul className="pb-2 pl-3">
                  <li>
                    <Link
                      href={group.href}
                      className={`flex min-h-11 items-center text-[14px] font-semibold text-dv-accent ${focusRing}`}
                    >
                      Toate din {group.name}
                    </Link>
                  </li>
                  {group.children.map((child) => (
                    <li key={child.id}>
                      <Link href={child.href} className={`flex min-h-11 items-center text-[14px] text-dv-ink ${focusRing}`}>
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )
          })}
          {extraLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex min-h-11 items-center border-t border-dv-border text-[14px] text-dv-ink ${focusRing}`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
