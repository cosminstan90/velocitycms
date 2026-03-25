import NextAuth from 'next-auth'
import authConfig from '@/auth.config'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth(async (req) => {
  const { pathname, origin, hostname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Always inject pathname so server components (e.g. not-found.tsx) can read it
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-pathname', pathname)

  // Domain-based site resolution via internal Node.js API (prisma/ioredis can't run in Edge)
  let resolvedSiteId: string | null = null
  try {
    const siteRes = await fetch(
      new URL(`/api/internal/site-lookup?domain=${encodeURIComponent(hostname)}`, origin),
      {
        headers: { 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
        signal: AbortSignal.timeout(3_000),
      }
    )
    if (siteRes.ok) {
      resolvedSiteId = ((await siteRes.json()) as { siteId: string | null }).siteId
    }
  } catch {
    // Fail open — never block requests due to lookup failure
  }

  if (resolvedSiteId) {
    requestHeaders.set('x-site-id', resolvedSiteId)
  }

  // ── 301/302 redirect lookup ───────────────────────────────────────────────
  // Skip static assets, API routes, and admin (handled separately below)
  const isStaticOrApi =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname === '/favicon.ico' ||
    /\.(?:ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?)$/.test(pathname)

  if (!isStaticOrApi && !resolvedSiteId) {
    return NextResponse.rewrite(new URL('/404', req.url))
  }

  if (!isStaticOrApi) {
    try {
      const lookupUrl = new URL('/api/internal/redirect-lookup', origin)
      lookupUrl.searchParams.set('path', pathname)
      lookupUrl.searchParams.set('domain', hostname)

      const res = await fetch(lookupUrl.toString(), {
        headers: { 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
        signal: AbortSignal.timeout(3_000),
      })

      if (res.ok) {
        const data = (await res.json()) as {
          redirect: { toPath: string; statusCode: number; id: string } | null
        }

        if (data.redirect) {
          const { toPath, statusCode, id } = data.redirect

          // Fire-and-forget hit increment — non-blocking
          const hitsUrl = new URL(`/api/redirects/${id}/hits`, origin)
          fetch(hitsUrl.toString(), {
            method: 'PATCH',
            headers: { 'x-internal-key': process.env.INTERNAL_API_KEY ?? '' },
          }).catch(() => {})

          const target = toPath.startsWith('http') ? toPath : new URL(toPath, origin).toString()
          return NextResponse.redirect(target, { status: statusCode })
        }
      }
    } catch {
      // Fail open — never block a legitimate request due to Redis/lookup failure
    }
  }

  // ── Admin auth ────────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect /login → dashboard when already authenticated
  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url))
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
})

export const config = {
  // Run on all paths except static files and API routes
  // (API routes have their own auth; internal API must not be intercepted)
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|api/).*)'],
}
