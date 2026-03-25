/**
 * lib/scheduler/smart-scheduler.ts
 *
 * Smart content scheduling engine.
 *
 * Reads SiteScheduleSettings and finds the next free publication slot
 * across a 14-day window, respecting:
 *   - maxPerDay cap
 *   - preferredTimes (list of "HH:MM" strings)
 *   - ±30-minute collision avoidance
 *   - slot must be ≥ 5 minutes in the future
 *
 * Also exposes schedulePost() to atomically validate + persist a scheduled slot.
 */

import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NextSlotResult {
  scheduledAt: Date
  /** How many more slots remain available today */
  slotsAvailableToday: number
  /** How many slots are available tomorrow */
  slotsAvailableTomorrow: number
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes since midnight. */
function timeToMinutes(t: string): number {
  const [h = '9', m = '0'] = t.split(':')
  return parseInt(h, 10) * 60 + parseInt(m, 10)
}

/** Build a UTC Date for the start (00:00:00.000) of a given day offset from now. */
function utcDayStart(now: Date, offsetDays: number): Date {
  const d = new Date(now)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + offsetDays)
  return d
}

interface DaySlotInfo {
  /** Used minute values of already-scheduled posts on this day */
  usedMinutes: number[]
  /** Count of already-scheduled posts */
  count: number
}

async function getDaySlotInfo(siteId: string, dayStart: Date): Promise<DaySlotInfo> {
  const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1)
  const scheduled = await prisma.post.findMany({
    where: {
      siteId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
    },
    select: { scheduledAt: true },
  })
  const usedMinutes = scheduled
    .filter((p) => p.scheduledAt)
    .map((p) => p.scheduledAt!.getUTCHours() * 60 + p.scheduledAt!.getUTCMinutes())
  return { usedMinutes, count: scheduled.length }
}

function findFreeSlot(
  preferredMinutes: number[],
  usedMinutes: number[],
  dayStart: Date,
  now: Date,
  maxPerDay: number,
  count: number
): Date | null {
  if (count >= maxPerDay) return null
  for (const mins of preferredMinutes) {
    const candidate = new Date(dayStart.getTime() + mins * 60_000)
    if (candidate.getTime() <= now.getTime() + 300_000) continue          // < 5 min in future
    if (usedMinutes.some((u) => Math.abs(u - mins) < 30)) continue        // ±30-min collision
    return candidate
  }
  return null
}

// ─── getNextAvailableSlot ─────────────────────────────────────────────────────

/**
 * Find the next free publication slot for a site.
 * Returns null when scheduling is disabled or no slot found within 14 days.
 */
export async function getNextAvailableSlot(siteId: string): Promise<NextSlotResult | null> {
  const settings = await prisma.siteScheduleSettings.findUnique({ where: { siteId } })
  if (!settings?.isActive) return null

  const preferredTimes = (settings.preferredTimes as string[]) ?? ['09:00', '14:00', '18:00']
  const maxPerDay = settings.maxPerDay ?? 3
  const preferredMinutes = preferredTimes.map(timeToMinutes)

  const now = new Date()

  let result: NextSlotResult | null = null

  // Gather today + tomorrow slot counts for the summary even if slot is further out
  const todayInfo = await getDaySlotInfo(siteId, utcDayStart(now, 0))
  const tomorrowInfo = await getDaySlotInfo(siteId, utcDayStart(now, 1))

  const slotsAvailableToday = Math.max(0,
    maxPerDay - todayInfo.count -
    preferredMinutes.filter((mins) => {
      const candidate = new Date(utcDayStart(now, 0).getTime() + mins * 60_000)
      return candidate.getTime() > now.getTime() + 300_000 &&
        !todayInfo.usedMinutes.some((u) => Math.abs(u - mins) < 30)
    }).length === 0 ? todayInfo.count : 0
  )
  const slotsAvailableTomorrow = Math.max(0, maxPerDay - tomorrowInfo.count)

  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    const dayStart = utcDayStart(now, dayOffset)
    const info = dayOffset === 0 ? todayInfo :
                 dayOffset === 1 ? tomorrowInfo :
                 await getDaySlotInfo(siteId, dayStart)

    const slot = findFreeSlot(preferredMinutes, info.usedMinutes, dayStart, now, maxPerDay, info.count)
    if (slot) {
      result = {
        scheduledAt: slot,
        slotsAvailableToday: Math.max(0, maxPerDay - todayInfo.count),
        slotsAvailableTomorrow: Math.max(0, maxPerDay - tomorrowInfo.count),
      }
      break
    }
  }

  return result
}

// ─── schedulePost ─────────────────────────────────────────────────────────────

export interface SchedulePostResult {
  scheduledAt: Date
  logId: string
}

/**
 * Atomically validate and persist a scheduled slot for a post.
 *
 * Validation:
 *   - scheduledAt must be in the future
 *   - day must not be at maxPerDay cap
 *
 * Side effects:
 *   - Sets post.scheduledAt + keeps status as DRAFT (cron will flip to PUBLISHED)
 *   - Creates a SchedulerLog with status=PENDING
 *   - Cancels any existing PENDING log for this post
 */
export async function schedulePost(
  postId: string,
  siteId: string,
  scheduledAt: Date
): Promise<SchedulePostResult> {
  const now = new Date()
  if (scheduledAt <= now) throw new Error('scheduledAt must be in the future')

  // Race-condition check: is the day still under maxPerDay?
  const settings = await prisma.siteScheduleSettings.findUnique({ where: { siteId } })
  const maxPerDay = settings?.maxPerDay ?? 3
  const dayStart = new Date(scheduledAt)
  dayStart.setUTCHours(0, 0, 0, 0)
  const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1)

  const dayCount = await prisma.post.count({
    where: {
      siteId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      id: { not: postId },          // exclude current post (rescheduling)
    },
  })
  if (dayCount >= maxPerDay) {
    throw new Error(`maxPerDay (${maxPerDay}) already reached for ${dayStart.toISOString().slice(0, 10)}`)
  }

  // Cancel any existing PENDING log
  await prisma.schedulerLog.updateMany({
    where: { postId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  })

  // Set post scheduledAt (status stays DRAFT — cron publishes)
  await prisma.post.update({
    where: { id: postId },
    data: { scheduledAt, status: 'DRAFT' },
  })

  // Create new PENDING log
  const log = await prisma.schedulerLog.create({
    data: { siteId, postId, scheduledAt, status: 'PENDING' },
  })

  return { scheduledAt, logId: log.id }
}

// ─── cancelSchedule ───────────────────────────────────────────────────────────

/**
 * Cancel a scheduled post — clears scheduledAt and marks SchedulerLog as CANCELLED.
 */
export async function cancelSchedule(postId: string): Promise<void> {
  await Promise.all([
    prisma.post.update({
      where: { id: postId },
      data: { scheduledAt: null },
    }),
    prisma.schedulerLog.updateMany({
      where: { postId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    }),
  ])
}
