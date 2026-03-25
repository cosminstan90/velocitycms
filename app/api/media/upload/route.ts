/**
 * POST /api/media/upload
 * Multipart form upload — accepts images (jpg, jpeg, png, gif, webp), svg, pdf.
 * Images are processed with Sharp: WebP main + 400px thumbnail + 1200×630 OG crop.
 * SVG and PDF are saved as-is.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { processImage, saveProcessedImage, generateAltText } from '@/lib/media/image-processor'
import { siteUploadDir, sitePublicPrefix } from '@/lib/media/storage'
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit'
import { getSiteIdFromRequest } from '@/lib/site'

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg':       'image',
  'image/jpg':        'image',
  'image/png':        'image',
  'image/gif':        'image',
  'image/webp':       'image',
  'image/svg+xml':    'svg',
  'application/pdf':  'pdf',
}

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

function slugifyFilename(name: string): string {
  return path.parse(name).name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit: 20 uploads per hour per user
  const rl = await rateLimit(`upload:${session.user.id}`, 20, 3600)
  if (!rl.allowed) return rateLimitResponse(rl)

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const siteId = (await getSiteIdFromRequest(req)) ?? (formData.get('siteId') as string | null) ?? session.user.activeSiteId
  const altTextOverride = formData.get('altText') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 20 MB)' }, { status: 422 })

  const kind = ALLOWED_TYPES[file.type]
  if (!kind) {
    return NextResponse.json(
      { error: 'File type not allowed. Accepted: JPG, PNG, GIF, WebP, SVG, PDF.' },
      { status: 422 }
    )
  }

  const uploadDir = siteUploadDir(siteId)
  const publicPrefix = sitePublicPrefix(siteId)
  await fs.mkdir(uploadDir, { recursive: true })

  const buffer = Buffer.from(await file.arrayBuffer())
  const slug = slugifyFilename(file.name)
  const ts = Date.now()

  // ── SVG / PDF — save as-is ────────────────────────────────────────────────
  if (kind === 'svg' || kind === 'pdf') {
    const ext = kind === 'pdf' ? 'pdf' : 'svg'
    const filename = `${slug}-${ts}.${ext}`
    const filePath = path.join(uploadDir, filename)
    await fs.writeFile(filePath, buffer)

    const media = await prisma.media.create({
      data: {
        siteId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        width: null,
        height: null,
        url: `${publicPrefix}/${filename}`,
        urlOriginal: null,
        altText: altTextOverride,
      },
    })
    return NextResponse.json({ media }, { status: 201 })
  }

  // ── Raster images — full processing pipeline ──────────────────────────────
  let processed
  try {
    processed = await processImage(buffer, `${slug}-${ts}`)
  } catch (err) {
    console.error('[media/upload] processing failed:', err)
    return NextResponse.json({ error: 'Image processing failed' }, { status: 500 })
  }

  let urls
  try {
    urls = await saveProcessedImage(processed, uploadDir, publicPrefix)
  } catch (err) {
    console.error('[media/upload] save failed:', err)
    return NextResponse.json({ error: 'File save failed' }, { status: 500 })
  }

  // Alt text via Claude Haiku (non-blocking on failure)
  let altText: string | null = altTextOverride
  if (!altText) {
    altText = await generateAltText(processed.webpBuffer)
  }

  const media = await prisma.media.create({
    data: {
      siteId,
      filename: processed.webpFilename,
      originalName: file.name,
      mimeType: 'image/webp',
      size: processed.size,
      width: processed.width,
      height: processed.height,
      url: urls.url,
      urlOriginal: urls.urlOriginal,
      altText,
    },
  })

  return NextResponse.json(
    { media, thumbUrl: urls.urlThumb, ogUrl: urls.urlOg },
    { status: 201 }
  )
}
