import Link from 'next/link'
import { headers } from 'next/headers'
import { connection } from 'next/server'
import { prisma } from '@/lib/prisma'

async function log404(path: string, referer: string | null) {
  try {
    const site = await prisma.site.findFirst({
      where: { isActive: true },
      select: { id: true },
    })
    if (!site) return

    await prisma.notFoundLog.upsert({
      where: { siteId_path: { siteId: site.id, path } },
      update: { hits: { increment: 1 }, lastSeen: new Date() },
      create: {
        siteId: site.id,
        path,
        referer,
        hits: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
      },
    })
  } catch {
    // Non-fatal — never crash the 404 page due to logging
  }
}

export default async function NotFound() {
  await connection()
  const hdrs = await headers()
  const path    = hdrs.get('x-pathname') ?? '/'
  const referer = hdrs.get('referer') ?? null

  let siteName = 'VelocityCMS'
  try {
    const seo = await prisma.seoSettings.findFirst({ select: { siteName: true } })
    if (seo?.siteName) siteName = seo.siteName
  } catch {
    // DB might not be available at build time
  }

  // Log the 404 (non-critical — errors are swallowed inside log404)
  await log404(path, referer)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-8xl font-black text-gray-200 select-none">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Pagina nu a fost găsită</h1>
        <p className="mt-3 text-gray-500 text-sm leading-relaxed">
          Ne pare rău, pagina pe care o cauți nu există sau a fost mutată.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            ← Înapoi acasă
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Toate articolele
          </Link>
        </div>
        <p className="mt-10 text-xs text-gray-400">{siteName}</p>
      </div>
    </div>
  )
}
