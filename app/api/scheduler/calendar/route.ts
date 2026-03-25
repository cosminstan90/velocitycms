/**
 * GET /api/scheduler/calendar?siteId=&month=2026-03
 *
 * Returns all scheduled and recently published posts for a given month,
 * grouped by date.
 *
 * Response:
 *   {
 *     days: {
 *       [date: string]: Array<{ id, title, slug, scheduledAt, status }>
 *     }
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const siteId = sp.get('siteId') ?? session.user.activeSiteId
  const monthStr = sp.get('month')   // e.g. "2026-03"

  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Parse month range
  let monthStart: Date
  let monthEnd: Date

  if (monthStr && /^\d{4}-\d{2}$/.test(monthStr)) {
    const [year, month] = monthStr.split('-').map(Number)
    monthStart = new Date(Date.UTC(year!, month! - 1, 1))
    monthEnd = new Date(Date.UTC(year!, month!, 0, 23, 59, 59, 999)) // last day of month
  } else {
    // Default: current month
    const now = new Date()
    monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  }

  // Fetch scheduled posts (DRAFT with scheduledAt in month)
  const [scheduledPosts, publishedPosts] = await Promise.all([
    prisma.post.findMany({
      where: {
        siteId,
        status: 'DRAFT',
        scheduledAt: { gte: monthStart, lte: monthEnd },
      },
      select: {
        id: true, title: true, slug: true, scheduledAt: true, status: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    // Also include posts published this month (for context/history)
    prisma.post.findMany({
      where: {
        siteId,
        status: 'PUBLISHED',
        publishedAt: { gte: monthStart, lte: monthEnd },
      },
      select: {
        id: true, title: true, slug: true, publishedAt: true, status: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 100,
    }),
  ])

  // Group by date (YYYY-MM-DD)
  const days: Record<string, Array<{
    id: string; title: string; slug: string
    scheduledAt: string | null; status: string
    category: { name: string; slug: string } | null
    author: { name: string | null } | null
  }>> = {}

  const addToDay = (dateStr: string, entry: (typeof days)[string][number]) => {
    if (!days[dateStr]) days[dateStr] = []
    days[dateStr].push(entry)
  }

  for (const p of scheduledPosts) {
    if (!p.scheduledAt) continue
    const dateStr = p.scheduledAt.toISOString().slice(0, 10)
    addToDay(dateStr, {
      id: p.id, title: p.title, slug: p.slug,
      scheduledAt: p.scheduledAt.toISOString(),
      status: 'SCHEDULED',
      category: p.category ?? null,
      author: p.author ?? null,
    })
  }

  for (const p of publishedPosts) {
    const date = p.publishedAt ?? new Date()
    const dateStr = date.toISOString().slice(0, 10)
    addToDay(dateStr, {
      id: p.id, title: p.title, slug: p.slug,
      scheduledAt: date.toISOString(),
      status: 'PUBLISHED',
      category: p.category ?? null,
      author: p.author ?? null,
    })
  }

  return NextResponse.json({ days, monthStart: monthStart.toISOString(), monthEnd: monthEnd.toISOString() })
}
