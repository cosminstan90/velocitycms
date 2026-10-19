import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSiteAccess } from '@/lib/site-access'
import { getSiteIdFromRequest } from '@/lib/site'

// A single leading "/" (not "//"), with no "@", backslash, whitespace or control characters.
const FORBIDDEN_PATH_CHARS = /[@\\\s\u0000-\u001f\u007f]/

function isSafePath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !FORBIDDEN_PATH_CHARS.test(path)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(request)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!(await hasSiteAccess(session.user.id, siteId))) return NextResponse.json({ error: 'Site access denied' }, { status: 403 })

  const { paths } = await request.json() as { paths: string[] }
  if (!Array.isArray(paths)) {
    return NextResponse.json({ error: 'paths must be an array' }, { status: 400 })
  }

  const seo = await prisma.seoSettings.findUnique({ where: { siteId } })
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  let siteBase: URL
  try {
    siteBase = new URL(siteUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid site URL' }, { status: 400 })
  }
  // Keep a path prefix of the site URL (https://host/sub) but never let the host change
  const basePath = siteBase.pathname.replace(/\/$/, '')

  // Resolve a path to a URL on the site's own origin, or null when it is unsafe
  const resolveTarget = (path: unknown): URL | null => {
    if (!isSafePath(path)) return null
    try {
      const url = new URL(`${siteBase.origin}${basePath}${path}`)
      return url.origin === siteBase.origin ? url : null
    } catch {
      return null
    }
  }

  const results = await Promise.all(
    paths.map(async (path: string) => {
      const url = resolveTarget(path)
      if (!url) return { path, status: null, redirected: false, finalUrl: null }
      try {
        const res = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          headers: { 'User-Agent': 'VelocityCMS-Checker/1.0' },
          signal: AbortSignal.timeout(8000),
        })
        return { path, status: res.status, redirected: res.redirected, finalUrl: res.url }
      } catch {
        return { path, status: null, redirected: false, finalUrl: null }
      }
    })
  )

  return NextResponse.json({ results })
}
