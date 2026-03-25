/**
 * POST /api/posts/[id]/schedule
 *   Body: { scheduledAt?: string (ISO), auto?: boolean }
 *   - auto=true → calls getNextAvailableSlot, uses that datetime
 *   - scheduledAt provided → validates + schedules at that exact time
 *   Returns: { scheduledAt, logId, slotsRemaining }
 *
 * DELETE /api/posts/[id]/schedule
 *   Cancels the schedule: clears scheduledAt, marks SchedulerLog as CANCELLED.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  getNextAvailableSlot,
  schedulePost,
  cancelSchedule,
} from '@/lib/scheduler/smart-scheduler'

type Params = { params: Promise<{ id: string }> }

// ─── POST — schedule ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({})) as {
    scheduledAt?: string
    auto?: boolean
  }

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, siteId: true, status: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let targetDate: Date

  if (body.auto) {
    // Smart scheduling: find next free slot
    const slot = await getNextAvailableSlot(post.siteId)
    if (!slot) {
      return NextResponse.json(
        { error: 'Nu există slot disponibil în următoarele 14 zile sau planificarea este dezactivată.' },
        { status: 422 }
      )
    }
    targetDate = slot.scheduledAt

    try {
      const result = await schedulePost(id, post.siteId, targetDate)
      return NextResponse.json({
        scheduledAt: result.scheduledAt.toISOString(),
        logId: result.logId,
        slotsAvailableToday: slot.slotsAvailableToday,
        slotsAvailableTomorrow: slot.slotsAvailableTomorrow,
      })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Eroare la planificare.' },
        { status: 422 }
      )
    }
  }

  if (body.scheduledAt) {
    targetDate = new Date(body.scheduledAt)
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: 'scheduledAt invalid.' }, { status: 400 })
    }
    if (targetDate <= new Date()) {
      return NextResponse.json({ error: 'Data trebuie să fie în viitor.' }, { status: 422 })
    }

    try {
      const result = await schedulePost(id, post.siteId, targetDate)

      // Count remaining slots on that day
      const dayStart = new Date(targetDate)
      dayStart.setUTCHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1)
      const settings = await prisma.siteScheduleSettings.findUnique({
        where: { siteId: post.siteId },
        select: { maxPerDay: true },
      })
      const usedToday = await prisma.post.count({
        where: { siteId: post.siteId, scheduledAt: { gte: dayStart, lte: dayEnd } },
      })
      const slotsRemaining = Math.max(0, (settings?.maxPerDay ?? 3) - usedToday)

      return NextResponse.json({
        scheduledAt: result.scheduledAt.toISOString(),
        logId: result.logId,
        slotsRemaining,
      })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Eroare la planificare.' },
        { status: 422 }
      )
    }
  }

  return NextResponse.json({ error: 'Furnizați scheduledAt sau auto=true.' }, { status: 400 })
}

// ─── DELETE — cancel ──────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await cancelSchedule(id)

  return NextResponse.json({ success: true })
}
