/**
 * POST /api/redirects/bulk-import
 * Accepts CSV text (one redirect per line: fromPath,toPath[,statusCode])
 * Returns { imported, skipped, errors[] }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { refreshRedirectsCache } from '@/lib/redis/redirects'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { csv?: string; siteId?: string }
  const siteId = body.siteId ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!body.csv) return NextResponse.json({ error: 'csv required' }, { status: 400 })

  const lines = body.csv
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))

  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  }

  for (const line of lines) {
    const parts = line.split(',').map((p) => p.trim())
    const fromPath  = parts[0]
    const toPath    = parts[1]
    const statusCode = parseInt(parts[2] ?? '301', 10)
    const code = [301, 302, 307, 308].includes(statusCode) ? statusCode : 301

    // Validate
    if (!fromPath?.startsWith('/')) {
      results.errors.push(`Line "${line}": fromPath must start with /`)
      results.skipped++
      continue
    }
    if (!toPath || (!toPath.startsWith('/') && !toPath.startsWith('http'))) {
      results.errors.push(`Line "${line}": toPath must start with / or http(s)://`)
      results.skipped++
      continue
    }
    if (fromPath === toPath) {
      results.errors.push(`Line "${line}": circular redirect`)
      results.skipped++
      continue
    }

    try {
      await prisma.redirect.create({
        data: { siteId, fromPath, toPath, statusCode: code },
      })
      results.imported++
    } catch (e: unknown) {
      if ((e as { code?: string }).code === 'P2002') {
        results.errors.push(`Line "${line}": ${fromPath} already exists (skipped)`)
        results.skipped++
      } else {
        results.errors.push(`Line "${line}": unexpected error`)
        results.skipped++
      }
    }
  }

  if (results.imported > 0) {
    await refreshRedirectsCache(siteId)
  }

  return NextResponse.json(results)
}
