/**
 * GET/HEAD /api/media-file/[...path]
 *
 * Serves files under public/media/uploads that were written after the Next
 * server started (Next only serves the public/ file list scanned at boot).
 * Reached through the `fallback` rewrite /media/uploads/:path* in next.config.ts.
 */

import fs from 'fs'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { getMediaRoot } from '@/lib/media/storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CONTENT_TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.pdf': 'application/pdf',
}

type Ctx = { params: Promise<{ path?: string[] }> }

function notFound(): NextResponse {
  return new NextResponse('Not found', { status: 404 })
}

function isSafeSegment(seg: string): boolean {
  return (
    seg.length > 0 &&
    seg !== '.' &&
    seg !== '..' &&
    !seg.startsWith('.') &&
    !/[\\/\0]/.test(seg) &&
    !seg.includes(':')
  )
}

function isInside(root: string, target: string): boolean {
  const rel = path.relative(root, target)
  return !!rel && !rel.startsWith('..') && !path.isAbsolute(rel)
}

async function resolveFile(
  segments: string[] | undefined
): Promise<{ file: string; size: number; mtime: Date; type: string } | null> {
  if (!segments || segments.length === 0 || !segments.every(isSafeSegment)) return null

  const ext = path.extname(segments[segments.length - 1]).toLowerCase()
  const type = CONTENT_TYPES[ext]
  if (!type) return null

  const root = path.resolve(getMediaRoot())
  const file = path.resolve(root, ...segments)
  if (!isInside(root, file)) return null

  try {
    const st = await fs.promises.lstat(file)
    if (!st.isFile()) return null // directories, symlinks, devices
    // Defend against symlinked parent directories pointing outside the root.
    const [realRoot, realFile] = await Promise.all([
      fs.promises.realpath(root),
      fs.promises.realpath(file),
    ])
    if (!isInside(realRoot, realFile)) return null
    return { file, size: st.size, mtime: st.mtime, type }
  } catch {
    return null
  }
}

function etagOf(size: number, mtime: Date): string {
  return `"${size.toString(16)}-${Math.floor(mtime.getTime()).toString(16)}"`
}

function notModified(req: NextRequest, etag: string, mtime: Date): boolean {
  const inm = req.headers.get('if-none-match')
  if (inm) {
    return inm
      .split(',')
      .map((t) => t.trim().replace(/^W\//, ''))
      .some((t) => t === '*' || t === etag)
  }
  const ims = req.headers.get('if-modified-since')
  if (ims) {
    const t = Date.parse(ims)
    if (!Number.isNaN(t)) return Math.floor(mtime.getTime() / 1000) <= Math.floor(t / 1000)
  }
  return false
}

async function handle(req: NextRequest, ctx: Ctx, head: boolean): Promise<Response> {
  const { path: segments } = await ctx.params
  const info = await resolveFile(segments)
  if (!info) return notFound()

  const etag = etagOf(info.size, info.mtime)
  const headers: Record<string, string> = {
    'Content-Type': info.type,
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
    'Last-Modified': info.mtime.toUTCString(),
    ETag: etag,
  }

  if (notModified(req, etag, info.mtime)) {
    return new Response(null, { status: 304, headers })
  }

  headers['Content-Length'] = String(info.size)
  if (head) return new Response(null, { status: 200, headers })

  const stream = fs.createReadStream(info.file)
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on('data', (chunk: string | Buffer) => {
        controller.enqueue(new Uint8Array(typeof chunk === 'string' ? Buffer.from(chunk) : chunk))
        if (controller.desiredSize !== null && controller.desiredSize <= 0) stream.pause()
      })
      stream.on('end', () => controller.close())
      stream.on('error', (err) => controller.error(err))
    },
    pull() {
      stream.resume()
    },
    cancel() {
      stream.destroy()
    },
  })
  return new Response(body, { status: 200, headers })
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx, false)
}

export async function HEAD(req: NextRequest, ctx: Ctx) {
  return handle(req, ctx, true)
}
