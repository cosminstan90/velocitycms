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
  if (!Array.isArray(paths) || !paths.every(isSafePath)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const seo = await prisma.seoSettings.findUnique({ where: { siteId } })
  const siteUrl = (seo?.siteUrl ?? 'http://localhost:3000').replace(/\/$/, '')

  let siteOrigin: string
  try {
    siteOrigin = new URL(siteUrl).origin
  } catch {
    return NextResponse.json({ error: 'Invalid site URL' }, { status: 400 })
  }

  const targets = paths.map((path) => ({ path, url: new URL(path, siteUrl) }))
  if (targets.some((t) => t.url.origin !== siteOrigin)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  const results = await Promise.all(
    targets.map(async ({ path, url }) => {
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
