/**
 * GET  /api/scheduler/settings?siteId=
 * PUT  /api/scheduler/settings
 *   Body: { siteId, maxPerDay, preferredTimes, timezone, isActive }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = req.nextUrl.searchParams.get('siteId') ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const settings = await prisma.siteScheduleSettings.findUnique({ where: { siteId } })
  if (!settings) {
    // Return defaults
    return NextResponse.json({
      settings: {
        siteId,
        maxPerDay: 3,
        preferredTimes: ['09:00', '14:00', '18:00'],
        timezone: 'Europe/Bucharest',
        isActive: true,
      },
    })
  }

  return NextResponse.json({ settings })
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    siteId?: string
    maxPerDay?: number
    preferredTimes?: string[]
    timezone?: string
    isActive?: boolean
  }

  const siteId = body.siteId ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Validate preferredTimes format "HH:MM"
  if (body.preferredTimes) {
    const valid = body.preferredTimes.every((t) => /^\d{2}:\d{2}$/.test(t))
    if (!valid) return NextResponse.json({ error: 'preferredTimes must be HH:MM format' }, { status: 400 })
  }

  const settings = await prisma.siteScheduleSettings.upsert({
    where: { siteId },
    create: {
      siteId,
      maxPerDay: body.maxPerDay ?? 3,
      preferredTimes: (body.preferredTimes ?? ['09:00', '14:00', '18:00']) as any,
      timezone: body.timezone ?? 'Europe/Bucharest',
      isActive: body.isActive ?? true,
    },
    update: {
      ...(body.maxPerDay !== undefined && { maxPerDay: body.maxPerDay }),
      ...(body.preferredTimes !== undefined && { preferredTimes: body.preferredTimes as any }),
      ...(body.timezone !== undefined && { timezone: body.timezone }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })

  return NextResponse.json({ settings })
}
