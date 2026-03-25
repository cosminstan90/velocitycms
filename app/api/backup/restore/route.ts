/**
 * POST /api/backup/restore
 * Body: { backupFile: string, confirm: true, siteId?: string }
 * Admin-only. Restores a database backup file (.sql.gz) using psql.
 * Requires confirm: true as an explicit safety gate.
 */

import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { auth } from '@/auth'

const execAsync = promisify(exec)

const BACKUP_PATH = process.env.BACKUP_PATH ?? '/backups'

// Turbopack requires a statically-scoped base path to avoid full-project tracing
const BACKUP_BASE = BACKUP_PATH

function parseDatabaseUrl(url: string) {
  const u = new URL(url)
  return {
    host: u.hostname,
    port: u.port || '5432',
    username: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1).split('?')[0],
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin role check
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin role required for restore' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({})) as {
    backupFile?: string
    confirm?: boolean
    siteId?: string
  }

  if (!body.confirm) {
    return NextResponse.json({ error: 'confirm: true required' }, { status: 400 })
  }

  if (!body.backupFile) {
    return NextResponse.json({ error: 'backupFile required' }, { status: 400 })
  }

  // Security: ensure the file is within BACKUP_PATH (no path traversal)
  const resolved = path.resolve(BACKUP_BASE, path.basename(body.backupFile))
  const backupResolved = path.resolve(BACKUP_BASE)

  if (!resolved.startsWith(backupResolved + path.sep) && resolved !== backupResolved) {
    return NextResponse.json({ error: 'Invalid backupFile path' }, { status: 400 })
  }

  if (!resolved.endsWith('.sql.gz')) {
    return NextResponse.json({ error: 'Only .sql.gz files are supported' }, { status: 400 })
  }

  // Verify file exists
  try {
    await fs.access(resolved)
  } catch {
    return NextResponse.json({ error: 'Backup file not found' }, { status: 404 })
  }

  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 500 })

  const { host, port, username, password, database } = parseDatabaseUrl(dbUrl)

  try {
    // gunzip | psql
    const cmd = `gunzip -c ${JSON.stringify(resolved)} | psql -h ${host} -p ${port} -U ${JSON.stringify(username)} ${JSON.stringify(database)}`

    await execAsync(cmd, {
      env: { ...process.env, PGPASSWORD: password },
      shell: '/bin/sh',
    })

    return NextResponse.json({ success: true, message: 'Restaurare finalizată cu succes.' })
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Restaurare eșuată: ${error}` }, { status: 500 })
  }
}
