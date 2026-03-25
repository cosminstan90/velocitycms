/**
 * Core backup runner for VelocityCMS.
 * Supports DATABASE (pg_dump + gzip), MEDIA (rsync), and FULL (both) backup types.
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { createGzip } from 'zlib'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream/promises'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

const BACKUP_PATH = process.env.BACKUP_PATH ?? '/backups'
const DB_RETENTION_DAYS = 30

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(): string {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
}

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

async function getFileSize(filePath: string): Promise<number> {
  try {
    return (await fs.stat(filePath)).size
  } catch {
    return 0
  }
}

async function getDirSize(dir: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`du -sb ${JSON.stringify(dir)}`)
    return parseInt(stdout.split('\t')[0], 10) || 0
  } catch {
    return 0
  }
}

// ── Database backup ──────────────────────────────────────────────────────────

async function backupDatabase(siteId: string): Promise<{ filePath: string; fileSize: number }> {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) throw new Error('DATABASE_URL not configured')

  const dbDir = path.join(BACKUP_PATH, 'db')
  await fs.mkdir(dbDir, { recursive: true })

  const outFile = path.join(dbDir, `${fmtDate()}-${siteId}.sql.gz`)
  const { host, port, username, password, database } = parseDatabaseUrl(dbUrl)

  await new Promise<void>((resolve, reject) => {
    const pg = spawn(
      'pg_dump',
      ['--no-owner', '--no-acl', '-h', host, '-p', port, '-U', username, database],
      {
        env: { ...process.env, PGPASSWORD: password },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    )

    const gzip = createGzip()
    const out = createWriteStream(outFile)
    const errors: string[] = []

    pg.stderr.on('data', (d: Buffer) => errors.push(d.toString()))
    pg.on('error', reject)
    pg.on('close', (code) => {
      if (code !== 0) reject(new Error(`pg_dump failed (exit ${code}): ${errors.join('')}`))
    })

    pipeline(pg.stdout, gzip, out)
      .then(resolve)
      .catch(reject)
  })

  const fileSize = await getFileSize(outFile)

  // Cleanup backups older than DB_RETENTION_DAYS
  try {
    const files = await fs.readdir(dbDir)
    const cutoff = Date.now() - DB_RETENTION_DAYS * 86_400_000
    await Promise.all(
      files
        .filter((f) => f.endsWith('.sql.gz'))
        .map(async (f) => {
          const fp = path.join(dbDir, f)
          const mtime = (await fs.stat(fp)).mtimeMs
          if (mtime < cutoff) await fs.unlink(fp).catch(() => {})
        })
    )
  } catch {
    // Non-fatal
  }

  return { filePath: outFile, fileSize }
}

// ── Media backup ─────────────────────────────────────────────────────────────

async function backupMedia(siteId: string): Promise<{ filePath: string; fileSize: number }> {
  const src = path.join(process.cwd(), 'public', 'media', 'uploads', siteId)
  const dst = path.join(BACKUP_PATH, 'media', siteId)

  await fs.mkdir(dst, { recursive: true })

  // rsync for incremental sync
  const cmd = `rsync -av --delete ${JSON.stringify(src + '/')} ${JSON.stringify(dst + '/')}`
  await execAsync(cmd)

  const fileSize = await getDirSize(dst)
  return { filePath: dst, fileSize }
}

// ── Public entry point ───────────────────────────────────────────────────────

export interface BackupResult {
  logId: string
  status: 'SUCCESS' | 'FAILED'
  filePath: string | null
  fileSize: number | null
  duration: number
  error: string | null
}

export async function runBackup(
  siteId: string,
  type: 'database' | 'media' | 'full'
): Promise<BackupResult> {
  const prismaType =
    type === 'database' ? 'DATABASE' : type === 'media' ? 'MEDIA' : 'FULL'

  // Create a RUNNING log entry
  const log = await prisma.backupLog.create({
    data: { siteId, type: prismaType, status: 'RUNNING' },
  })

  const start = Date.now()

  try {
    let filePath: string
    let fileSize: number

    if (type === 'database') {
      ;({ filePath, fileSize } = await backupDatabase(siteId))
    } else if (type === 'media') {
      ;({ filePath, fileSize } = await backupMedia(siteId))
    } else {
      // FULL: run both sequentially
      const db = await backupDatabase(siteId)
      const media = await backupMedia(siteId)
      // Store DB file path; media path as secondary info in filePath (comma-separated)
      filePath = [db.filePath, media.filePath].join('|')
      fileSize = db.fileSize + media.fileSize
    }

    const duration = Date.now() - start

    await prisma.backupLog.update({
      where: { id: log.id },
      data: { status: 'SUCCESS', filePath, fileSize, duration },
    })

    return { logId: log.id, status: 'SUCCESS', filePath, fileSize, duration, error: null }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    const duration = Date.now() - start

    await prisma.backupLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', duration, error },
    })

    return { logId: log.id, status: 'FAILED', filePath: null, fileSize: null, duration, error }
  }
}
