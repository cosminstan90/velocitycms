/**
 * Smart scheduler for publisher-received posts.
 * Finds the next free publication slot based on SiteScheduleSettings.
 */

import { prisma } from '@/lib/prisma'

/**
 * Returns the next available UTC Date to schedule a post,
 * or null if scheduling is disabled / no slot found within 14 days.
 */
export async function getSmartScheduledAt(siteId: string): Promise<Date | null> {
  const settings = await prisma.siteScheduleSettings.findUnique({ where: { siteId } })
  if (!settings?.isActive) return null

  const preferredTimes = (settings.preferredTimes as string[]) ?? ['09:00', '14:00', '18:00']
  const maxPerDay = settings.maxPerDay ?? 3

  // Convert "HH:MM" strings to minutes-since-midnight
  const preferredMinutes = preferredTimes.map((t) => {
    const [h, m] = t.split(':').map(Number)
    return (h ?? 9) * 60 + (m ?? 0)
  })

  const now = new Date()

  for (let dayOffset = 0; dayOffset <= 14; dayOffset++) {
    // Build UTC midnight for this day
    const dayStart = new Date(now)
    dayStart.setUTCHours(0, 0, 0, 0)
    dayStart.setUTCDate(dayStart.getUTCDate() + dayOffset)
    const dayEnd = new Date(dayStart.getTime() + 86_400_000 - 1)

    // Already-scheduled posts for this UTC day
    const dayScheduled = await prisma.post.findMany({
      where: { siteId, scheduledAt: { gte: dayStart, lte: dayEnd } },
      select: { scheduledAt: true },
    })

    if (dayScheduled.length >= maxPerDay) continue

    const usedMinutes = dayScheduled
      .filter((p) => p.scheduledAt)
      .map((p) => p.scheduledAt!.getUTCHours() * 60 + p.scheduledAt!.getUTCMinutes())

    for (const mins of preferredMinutes) {
      const candidate = new Date(dayStart.getTime() + mins * 60_000)
      // Must be at least 5 minutes in the future
      if (candidate.getTime() <= now.getTime() + 300_000) continue
      // Slot must not be taken (within ±30-minute window)
      if (usedMinutes.some((u) => Math.abs(u - mins) < 30)) continue
      return candidate
    }
  }

  return null
}
