/**
 * GET  /api/backup/run?type=database|media|full&siteId=...
 *      Protected by X-Cron-Secret header. For scheduled cron jobs.
 *
 * POST /api/backup/run
 *      Body: { type }
 *      Protected by user session. For admin UI "Run Now" buttons.
 * @eslint data-isolation: siteId is injected via middleware and used for data isolation
 *
 * Crontab examples:
 *   # Daily database backup at 2am
 *   0 2 * * * curl -s -H "X-Cron-Secret: $TOKEN" "https://yoursite.com/api/backup/run?type=database"
 *   # Weekly media backup Sunday 3am
 *   0 3 * * 0 curl -s -H "X-Cron-Secret: $TOKEN" "https://yoursite.com/api/backup/run?type=media"
 *   # Monthly full backup 1st at 4am
 *   0 4 1 * * curl -s -H "X-Cron-Secret: $TOKEN" "https://yoursite.com/api/backup/run?type=full"
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { runBackup } from '@/lib/backup/backup-runner'
import { notifyBackupResult, check404SpikeAndNotify } from '@/lib/notifications/email-service'
import { getSiteIdFromRequest } from '@/lib/site'

const VALID_TYPES = ['database', 'media', 'full'] as const
type BackupType = (typeof VALID_TYPES)[number]

async function getDefaultSiteId(): Promise<string | null> {
  const site = await prisma.site.findFirst({ where: { isActive: true }, select: { id: true } })
  return site?.id ?? null
}

async function executeBackup(siteId: string, type: BackupType) {
  const result = await runBackup(siteId, type)

  // Send notification (non-blocking)
  const prismaType = type.toUpperCase() as 'DATABASE' | 'MEDIA' | 'FULL'
  notifyBackupResult(siteId, { ...result, type: prismaType }).catch(() => {})

  // Check 404 spike on database/full backups (daily cadence)
  if (type === 'database' || type === 'full') {
    check404SpikeAndNotify(siteId).catch(() => {})
  }

  return result
}

// ── Cron-triggered (GET) ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret') ?? ''
  const expectedSecret = process.env.CRON_SECRET ?? ''

  if (!expectedSecret || cronSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const rawType = req.nextUrl.searchParams.get('type') ?? 'database'
  if (!VALID_TYPES.includes(rawType as BackupType)) {
    return NextResponse.json({ error: 'Invalid type. Use: database, media, full' }, { status: 400 })
  }

  const siteId =
    req.nextUrl.searchParams.get('siteId') ?? (await getDefaultSiteId())
  if (!siteId) return NextResponse.json({ error: 'No active site found' }, { status: 422 })

  const result = await executeBackup(siteId, rawType as BackupType)

  return NextResponse.json({ success: result.status === 'SUCCESS', log: result })
}

// ── UI-triggered (POST) ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const body = await req.json().catch(() => ({})) as { type?: string }
  const rawType = body.type ?? 'database'

  if (!VALID_TYPES.includes(rawType as BackupType)) {
    return NextResponse.json({ error: 'Invalid type. Use: database, media, full' }, { status: 400 })
  }

  const result = await executeBackup(siteId, rawType as BackupType)

  return NextResponse.json({ success: result.status === 'SUCCESS', log: result })
}
