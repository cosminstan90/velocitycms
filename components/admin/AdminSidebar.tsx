'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  FileText,
  File,
  FolderOpen,
  Image,
  ArrowLeftRight,
  Clock,
  Search,
  Download,
  HardDrive,
  Settings,
  ChevronDown,
  Plus,
  LogOut,
  Menu,
  X,
  Zap,
  Globe,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/posts', label: 'Articole', icon: FileText },
  { href: '/admin/pages', label: 'Pagini', icon: File },
  { href: '/admin/categories', label: 'Categorii', icon: FolderOpen },
  { href: '/admin/media', label: 'Media', icon: Image },
  { href: '/admin/sites', label: 'Site-uri', icon: Globe },
  { href: '/admin/redirects', label: 'Redirecturi', icon: ArrowLeftRight },
  { href: '/admin/scheduler', label: 'Scheduler', icon: Clock },
  { href: '/admin/seo', label: 'Setări SEO', icon: Search },
  { href: '/admin/import', label: 'Import', icon: Download },
  { href: '/admin/backup', label: 'Backup', icon: HardDrive },
  { href: '/admin/settings', label: 'Setări', icon: Settings },
]

interface Site {
  id: string
  name: string
  domain: string
  accessRole: string
  postCount?: number
  mediaCount?: number
  isActive?: boolean
}

interface User {
  id: string
  email: string
  name?: string | null
  role: string
  activeSiteId: string | null
}

interface Props {
  user: User
  sites: Site[]
  activeSite: Site | null
}

export default function AdminSidebar({ user, sites, activeSite }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false)

  async function switchSite(siteId: string) {
    try {
      const res = await fetch('/api/auth/switch-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to switch site')
      }
      setSiteDropdownOpen(false)
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Nu am putut schimba site-ul. Încearcă din nou.')
    }
  }

  const initials = (user.name || user.email).slice(0, 2).toUpperCase()

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <aside
        className={`relative z-30 flex flex-col transition-all duration-200 shrink-0 ${
          collapsed ? 'w-16' : 'w-60'
        }`}
        style={{ backgroundColor: '#1e293b', borderRight: '1px solid #334155' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-sm truncate">VelocityCMS</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto text-slate-400 hover:text-white transition"
          >
            {collapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Site switcher */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-slate-700">
            <button
              onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="truncate flex-1 text-left">{activeSite?.name ?? 'Selectează site'}</span>
              <ChevronDown size={14} className={`shrink-0 transition-transform ${siteDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {siteDropdownOpen && (
              <div className="mt-1 rounded-lg overflow-hidden border border-slate-600" style={{ backgroundColor: '#0f172a' }}>
                {sites.map((site) => (
                  <button
                    key={site.id}
                    className={`w-full text-left px-3 py-2 text-sm transition flex items-center gap-2 ${
                      site.id === activeSite?.id ? 'bg-slate-800 text-blue-300' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                    onClick={() => switchSite(site.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="truncate font-medium">{site.name}</span>
                        {site.isActive === false ? (
                          <span className="text-[10px] text-slate-400 bg-slate-700 px-1 rounded">Inactive</span>
                        ) : null}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{site.domain}</div>
                    </div>
                    <div className="text-xs text-slate-400 flex gap-2 items-center">
                      <span>{site.postCount ?? 0} articole</span>
                      {site.id === activeSite?.id && <span className="text-blue-400">✓</span>}
                    </div>
                  </button>
                ))}
                <Link
                  href="/admin/sites"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:bg-slate-700 transition border-t border-slate-700"
                  onClick={() => setSiteDropdownOpen(false)}
                >
                  <Plus size={13} />
                  Adaugă site
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-2 py-3 border-t border-slate-700">
          <div className={`flex items-center gap-3 px-2 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400 truncate">{user.role}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-slate-400 hover:text-white transition"
                  title="Deconectare"
                >
                  <LogOut size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
