/**
 * GET /api/backup/download?file=...
 * Streams a backup file to the browser. Site admin required; the file must belong to a BackupLog of the site.
 * Path must be within BACKUP_PATH to prevent traversal attacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { auth } from '@/auth'
import { resolveBackupPath, toBackupRelativePath } from '@/lib/backup/storage'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { isSiteAdmin } from '@/lib/site-access'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!(await isSiteAdmin(session.user.id, siteId))) {
    return NextResponse.json({ error: 'Site admin required' }, { status: 403 })
  }

  const filePath = req.nextUrl.searchParams.get('file')
  if (!filePath) return NextResponse.json({ error: 'file param required' }, { status: 400 })

  const resolved = resolveBackupPath(filePath)
  if (!resolved) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
  }

  // The file must be recorded in a BackupLog of this site (FULL logs store "db|media").
  const wanted = toBackupRelativePath(filePath)
  const logs = await prisma.backupLog.findMany({
    where: { siteId, status: 'SUCCESS', filePath: { contains: wanted ?? '' } },
    select: { filePath: true },
  })
  const owned = logs.some((l) =>
    (l.filePath ?? '').split('|').some((entry) => toBackupRelativePath(entry) === wanted),
  )
  if (!wanted || !owned) return NextResponse.json({ error: 'File not found' }, { status: 404 })

  // Check existence
  try {
    fs.accessSync(resolved)
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const stat = fs.statSync(resolved)
  const filename = resolved.split(/[/\\]/).pop() ?? 'backup.sql.gz'

  // Stream file
  const stream = fs.createReadStream(resolved)
  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk))
      stream.on('end', () => controller.close())
      stream.on('error', (err) => controller.error(err))
    },
    cancel() { stream.destroy() },
  })

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(stat.size),
    },
  })
}
