/**
 * GET /api/backup/download?file=...
 * Streams a backup file to the browser. Admin session required.
 * Path must be within BACKUP_PATH to prevent traversal attacks.
 */

import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { auth } from '@/auth'

const BACKUP_PATH = process.env.BACKUP_PATH ?? '/backups'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const filePath = req.nextUrl.searchParams.get('file')
  if (!filePath) return NextResponse.json({ error: 'file param required' }, { status: 400 })

  // Path traversal guard
  const resolved = path.resolve(filePath)
  const backupResolved = path.resolve(BACKUP_PATH)

  if (!resolved.startsWith(backupResolved + path.sep) && resolved !== backupResolved) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
  }

  // Check existence
  try {
    fs.accessSync(resolved)
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const stat = fs.statSync(resolved)
  const filename = path.basename(resolved)

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
