/**
 * GET /api/sitemap/ping?url=...
 * Server-side proxy for search engine sitemap ping requests.
 * Avoids CORS issues when pinging from the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url param required' }, { status: 400 })

  // Only allow pinging known search engine endpoints
  const allowed = ['https://www.google.com/ping', 'https://www.bing.com/ping']
  if (!allowed.some((prefix) => url.startsWith(prefix))) {
    return NextResponse.json({ error: 'Disallowed ping URL' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
    })
    return NextResponse.json({ ok: res.ok, status: res.status })
  } catch (err) {
    console.error('[sitemap/ping] failed:', err)
    return NextResponse.json({ error: 'Ping failed' }, { status: 502 })
  }
}
