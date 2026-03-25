/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation endpoint.
 * Protected by CRON_SECRET — only trusted callers (admin actions, cron jobs) may invoke it.
 *
 * Body schema:
 *   {
 *     secret: string              // must equal process.env.CRON_SECRET
 *     path?: string               // e.g. "/blog/my-article" — calls revalidatePath
 *     tag?: string                // e.g. "post-abc123"      — calls revalidateTag
 *     type?: "page"|"post"|"category"|"all"
 *   }
 *
 * type shortcuts:
 *   "all"      → revalidates layout from "/"
 *   "page"     → revalidates path only (path is required)
 *   "post"     → revalidates path + homepage + blog listing
 *   "category" → revalidates path + homepage
 */

import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

interface RevalidateBody {
  secret?: string
  path?: string
  tag?: string
  type?: 'page' | 'post' | 'category' | 'all'
}

export async function POST(req: NextRequest) {
  let body: RevalidateBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { secret, path, tag, type } = body

  // Auth: CRON_SECRET header OR body field
  const headerSecret = req.headers.get('x-cron-secret')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || (headerSecret !== cronSecret && secret !== cronSecret)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  const revalidated: string[] = []

  try {
    // Tag-based invalidation (works with unstable_cache)
    if (tag) {
      revalidateTag(tag, { expire: 0 })
      revalidated.push(`tag:${tag}`)
    }

    // Path-based invalidation
    if (path) {
      revalidatePath(path, 'page')
      revalidated.push(`path:${path}`)
    }

    // Type shortcuts
    switch (type) {
      case 'all':
        revalidatePath('/', 'layout')
        revalidated.push('layout:/')
        break

      case 'post':
        // Post pages also affect the homepage (latest posts) and blog listing
        if (path) {
          revalidatePath('/', 'page')
          revalidatePath('/blog', 'page')
          revalidated.push('path:/', 'path:/blog')
        }
        break

      case 'category':
        if (path) {
          revalidatePath('/', 'page')
          revalidated.push('path:/')
        }
        break

      case 'page':
        // path-only revalidation already handled above
        break
    }
  } catch (err) {
    // revalidatePath/revalidateTag only works in deployed Next.js
    console.warn('[revalidate] warning:', err)
  }

  return NextResponse.json({
    revalidated: true,
    revalidatedAt: new Date().toISOString(),
    entries: revalidated,
  })
}
