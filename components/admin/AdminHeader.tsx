'use client'

import { usePathname } from 'next/navigation'

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/posts': 'Articole',
  '/admin/pages': 'Pagini',
  '/admin/categories': 'Categorii',
  '/admin/media': 'Media',
  '/admin/redirects': 'Redirecturi',
  '/admin/scheduler': 'Scheduler',
  '/admin/seo': 'Setări SEO',
  '/admin/import': 'Import',
  '/admin/backup': 'Backup',
  '/admin/settings': 'Setări',
}

interface Site {
  id: string
  name: string
  domain: string
}

interface User {
  email: string
  name?: string | null
}

interface Props {
  user: User
  activeSite: Site | null
}

export default function AdminHeader({ activeSite }: Props) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const pageTitle = pageTitles[pathname] ?? segments[segments.length - 1] ?? 'Admin'

  const breadcrumbs = segments.map((seg, i) => ({
    label: pageTitles['/' + segments.slice(0, i + 1).join('/')]?.toLowerCase() ?? seg,
    href: '/' + segments.slice(0, i + 1).join('/'),
  }))

  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b shrink-0"
      style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
    >
      <div>
        <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>
        <nav className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <span className={i === breadcrumbs.length - 1 ? 'text-slate-300' : 'hover:text-white cursor-pointer'}>
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>
      {activeSite && (
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {activeSite.name}
          </span>
        </div>
      )}
    </header>
  )
}
