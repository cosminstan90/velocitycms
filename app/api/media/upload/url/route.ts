/**
 * POST /api/media/upload/url
 * Downloads an image from a remote URL, processes it the same as a file upload.
 * Used by the SEO Publisher adapter for featured images.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { processImage, saveProcessedImage, generateAltText } from '@/lib/media/image-processor'
import { siteUploadDir, sitePublicPrefix } from '@/lib/media/storage'
import { getSiteIdFromRequest } from '@/lib/site'
import fs from 'fs/promises'
import path from 'path'

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
const MAX_SIZE = 20 * 1024 * 1024

function filenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname
    return path.basename(pathname) || 'image'
  } catch {
    return 'image'
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { url, siteId: bodySiteId, altText: altTextOverride } = body as {
    url?: string
    siteId?: string
    altText?: string
  }

  const siteId = (await getSiteIdFromRequest(req)) ?? bodySiteId ?? session.user.activeSiteId
  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Download the image
  let imageBuffer: Buffer
  let contentType: string
  let originalName: string

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VelocityCMS/1.0 MediaFetcher' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to download image: HTTP ${res.status}` }, { status: 422 })
    }

    contentType = res.headers.get('content-type')?.split(';')[0].trim() ?? 'image/jpeg'
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return NextResponse.json({ error: `Unsupported remote content-type: ${contentType}` }, { status: 422 })
    }

    const arrayBuf = await res.arrayBuffer()
    if (arrayBuf.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: 'Remote image too large (max 20 MB)' }, { status: 422 })
    }

    imageBuffer = Buffer.from(arrayBuf)
    originalName = filenameFromUrl(url)
  } catch (err) {
    console.error('[media/upload/url] download failed:', err)
    return NextResponse.json({ error: 'Could not download image from URL' }, { status: 422 })
  }

  const uploadDir = siteUploadDir(siteId)
  const publicPrefix = sitePublicPrefix(siteId)
  await fs.mkdir(uploadDir, { recursive: true })

  // Process
  let processed
  try {
    processed = await processImage(imageBuffer, originalName)
  } catch (err) {
    console.error('[media/upload/url] processing failed:', err)
    return NextResponse.json({ error: 'Image processing failed' }, { status: 500 })
  }

  let urls
  try {
    urls = await saveProcessedImage(processed, uploadDir, publicPrefix)
  } catch (err) {
    console.error('[media/upload/url] save failed:', err)
    return NextResponse.json({ error: 'File save failed' }, { status: 500 })
  }

  let altText: string | null = altTextOverride ?? null
  if (!altText) {
    altText = await generateAltText(processed.webpBuffer)
  }

  const media = await prisma.media.create({
    data: {
      siteId,
      filename: processed.webpFilename,
      originalName,
      mimeType: 'image/webp',
      size: processed.size,
      width: processed.width,
      height: processed.height,
      url: urls.url,
      urlOriginal: urls.urlOriginal,
      altText,
    },
  })

  return NextResponse.json({ media, thumbUrl: urls.urlThumb, ogUrl: urls.urlOg }, { status: 201 })
}
