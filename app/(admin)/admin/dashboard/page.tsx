import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import Link from 'next/link'
import {
  FileText, Globe, Image, HardDrive, Plus, BarChart2,
  AlertTriangle, Search, Eye, CheckCircle
} from 'lucide-react'
import ActivityChart from '@/components/admin/ActivityChart'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `acum ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `acum ${hours}h`
  const days = Math.floor(hours / 24)
  return `acum ${days}z`
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1073741824).toFixed(2)} GB`
}

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'bg-emerald-500/15 text-emerald-400',
  DRAFT:     'bg-slate-500/15 text-slate-400',
  REVIEW:    'bg-amber-500/15 text-amber-400',
  ARCHIVED:  'bg-rose-500/15 text-rose-400',
}

function GeoScore({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-600 text-xs">—</span>
  const color = score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-amber-400' : 'text-rose-400'
  return <span className={`text-xs font-bold tabular-nums ${color}`}>{score}</span>
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  await connection()
  const session = await auth()
  if (!session?.user) redirect('/login')

  const siteId = session.user.activeSiteId

  // Date range for activity chart (last 30 days)
  const now = new Date()
  const rangeStart = new Date(now)
  rangeStart.setDate(rangeStart.getDate() - 29)
  rangeStart.setHours(0, 0, 0, 0)

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalMedia,
    lastBackup,
    recentPosts,
    publishedInRange,
    seoAgg,
    missingMeta,
    missingKeyword,
    reviewPosts,
  ] = await Promise.all([
    siteId ? prisma.post.count({ where: { siteId } }) : 0,
    siteId ? prisma.post.count({ where: { siteId, status: 'PUBLISHED' } }) : 0,
    siteId ? prisma.post.count({ where: { siteId, status: 'DRAFT' } }) : 0,
    siteId ? prisma.media.count({ where: { siteId } }) : 0,
    siteId
      ? prisma.backupLog.findFirst({
          where: { siteId, status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
        })
      : null,
    siteId
      ? prisma.post.findMany({
          where: { siteId },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            slug: true,
            geoScore: true,
            category: { select: { name: true } },
            author: { select: { name: true } },
          },
        })
      : [],
    siteId
      ? prisma.post.findMany({
          where: { siteId, status: 'PUBLISHED', publishedAt: { gte: rangeStart } },
          select: { publishedAt: true },
          orderBy: { publishedAt: 'asc' },
        })
      : [],
    siteId
      ? prisma.post.aggregate({
          where: { siteId, geoScore: { not: null } },
          _avg: { geoScore: true },
          _count: { geoScore: true },
        })
      : null,
    siteId
      ? prisma.post.count({ where: { siteId, OR: [{ metaTitle: null }, { metaTitle: '' }, { metaDescription: null }, { metaDescription: '' }] } })
      : 0,
    siteId
      ? prisma.post.count({ where: { siteId, OR: [{ focusKeyword: null }, { focusKeyword: '' }] } })
      : 0,
    siteId
      ? prisma.post.count({ where: { siteId, status: 'REVIEW' } })
      : 0,
  ])

  // Build chart data: 30-day array with counts
  const dayMap = new Map<string, number>()
  for (let i = 0; i < 30; i++) {
    const d = new Date(rangeStart)
    d.setDate(d.getDate() + i)
    dayMap.set(d.toISOString().slice(0, 10), 0)
  }
  for (const p of publishedInRange) {
    if (!p.publishedAt) continue
    const key = new Date(p.publishedAt).toISOString().slice(0, 10)
    if (dayMap.has(key)) dayMap.set(key, (dayMap.get(key) ?? 0) + 1)
  }
  const chartData = Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))

  const avgGeo = seoAgg?._avg?.geoScore ? Math.round(seoAgg._avg.geoScore) : null

  return (
    <div className="space-y-6">

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: 'Total articole', value: totalPosts,       icon: FileText,    color: 'text-blue-400',    bg: 'bg-blue-500/10' },
          { label: 'Publicate',      value: publishedPosts,   icon: Globe,       color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Draft-uri',      value: draftPosts,       icon: FileText,    color: 'text-amber-400',   bg: 'bg-amber-500/10' },
          { label: 'Fișiere media',  value: totalMedia,       icon: Image,       color: 'text-pink-400',    bg: 'bg-pink-500/10' },
          {
            label: 'Backup',
            value: lastBackup ? timeAgo(lastBackup.createdAt) : 'Niciodată',
            sub: lastBackup ? fmtSize(lastBackup.fileSize) : undefined,
            icon: HardDrive,
            color: lastBackup ? 'text-slate-300' : 'text-rose-400',
            bg: lastBackup ? 'bg-slate-500/10' : 'bg-rose-500/10',
          },
          { label: 'În recenzie',    value: reviewPosts,      icon: Eye,         color: 'text-violet-400',  bg: 'bg-violet-500/10' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 border border-slate-700 bg-[#1e293b]">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <p className="text-2xl font-bold text-white leading-tight">{s.value}</p>
            {('sub' in s && s.sub) && <p className="text-xs text-slate-500">{s.sub}</p>}
            <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity chart */}
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Activitate publicare (30 zile)</h2>
          </div>
          <span className="text-xs text-slate-500">{publishedInRange.length} articole publicate</span>
        </div>
        <ActivityChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts table */}
        <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-[#1e293b] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="font-semibold text-white text-sm">Articole recente</h2>
            <Link href="/admin/posts" className="text-xs text-violet-400 hover:text-violet-300 transition">
              Vezi toate →
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-500 text-sm">Niciun articol încă.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-5 py-3 text-xs text-slate-400 font-medium">Titlu</th>
                  <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium hidden md:table-cell">Categorie</th>
                  <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium">Status</th>
                  <th className="text-right px-3 py-3 text-xs text-slate-400 font-medium">GEO</th>
                  <th className="text-left px-3 py-3 text-xs text-slate-400 font-medium hidden lg:table-cell">Actualizat</th>
                </tr>
              </thead>
              <tbody>
                {(recentPosts as Array<{ id: string; title: string; status: string; updatedAt: Date; slug: string; geoScore: number | null; category: { name: string } | null; author: { name: string | null } | null }>).map((post) => (
                  <tr key={post.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                    <td className="px-5 py-3 text-white max-w-[200px]">
                      <Link href={`/admin/posts/${post.id}`} className="hover:text-violet-400 transition truncate block">
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs hidden md:table-cell">
                      {post.category?.name ?? '—'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[post.status] ?? ''}`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <GeoScore score={post.geoScore} />
                    </td>
                    <td className="px-3 py-3 text-slate-500 text-xs hidden lg:table-cell">
                      {timeAgo(post.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* SEO Health */}
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-2">
              <Search size={14} className="text-slate-500" />
              <h2 className="font-semibold text-white text-sm">SEO Health</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">GEO score mediu</span>
                {avgGeo !== null ? (
                  <span className={`text-sm font-bold ${avgGeo >= 70 ? 'text-emerald-400' : avgGeo >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {avgGeo}
                  </span>
                ) : (
                  <span className="text-xs text-slate-600">—</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Publicate (30 zile)</span>
                <span className="text-sm font-bold text-white">{publishedInRange.length}</span>
              </div>
              <div className="border-t border-slate-700/60 pt-3 space-y-2">
                <Link
                  href="/admin/posts?missingMeta=1"
                  className="flex items-center justify-between hover:bg-slate-700/40 rounded-lg px-2 py-1.5 -mx-2 transition group"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition">Meta lipsă</span>
                  </div>
                  <span className={`text-xs font-bold ${missingMeta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {missingMeta > 0 ? missingMeta : <CheckCircle size={12} />}
                  </span>
                </Link>
                <Link
                  href="/admin/posts?missingKeyword=1"
                  className="flex items-center justify-between hover:bg-slate-700/40 rounded-lg px-2 py-1.5 -mx-2 transition group"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={12} className="text-amber-400" />
                    <span className="text-xs text-slate-400 group-hover:text-slate-200 transition">Keyword lipsă</span>
                  </div>
                  <span className={`text-xs font-bold ${missingKeyword > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {missingKeyword > 0 ? missingKeyword : <CheckCircle size={12} />}
                  </span>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-700">
              <h2 className="font-semibold text-white text-sm">Acțiuni rapide</h2>
            </div>
            <div className="p-4 space-y-2">
              <Link
                href="/admin/posts/new"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-white bg-violet-600 hover:bg-violet-500 transition font-medium"
              >
                <Plus size={15} />
                Articol nou
              </Link>
              <Link
                href="/admin/pages/new"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition border border-slate-600"
              >
                <Plus size={15} />
                Pagina nouă
              </Link>
              <Link
                href="/admin/media"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition border border-slate-600"
              >
                <Image size={15} />
                Upload media
              </Link>
              <Link
                href="/admin/backup"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition border border-slate-600"
              >
                <HardDrive size={15} />
                Backup
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
