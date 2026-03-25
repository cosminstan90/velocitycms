/**
 * Image processing pipeline for VelocityCMS.
 * Converts uploads to WebP, generates thumbnails + OG crops,
 * injects width/height/loading attributes, and optionally generates
 * alt text via Claude Haiku.
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs/promises'

export interface ProcessedImage {
  /** WebP main image (quality 85) */
  webpBuffer: Buffer
  webpFilename: string
  /** Thumbnail 400px wide WebP */
  thumbBuffer: Buffer
  thumbFilename: string
  /** OG image 1200×630 WebP */
  ogBuffer: Buffer
  ogFilename: string
  /** Pixel dimensions of the main image */
  width: number
  height: number
  /** File size of main webp in bytes */
  size: number
}

/**
 * Process an uploaded image buffer through the full pipeline:
 * 1. Convert to WebP @ quality 85
 * 2. Resize thumbnail to 400px wide
 * 3. Cover-crop OG image to 1200×630
 */
export async function processImage(
  inputBuffer: Buffer,
  originalFilename: string
): Promise<ProcessedImage> {
  const base = path.parse(originalFilename).name.replace(/[^a-z0-9_-]/gi, '-').toLowerCase()
  const ts = Date.now()
  const stem = `${base}-${ts}`

  // Main image → WebP quality 85
  const mainSharp = sharp(inputBuffer).webp({ quality: 85 })
  const { width = 0, height = 0 } = await mainSharp.metadata().then(() => sharp(inputBuffer).metadata())
  const webpBuffer = await mainSharp.toBuffer()

  // Thumbnail → 400px wide, proportional height
  const thumbBuffer = await sharp(inputBuffer)
    .resize({ width: 400, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer()

  // OG image → 1200×630 cover crop
  const ogBuffer = await sharp(inputBuffer)
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'top' })
    .webp({ quality: 85 })
    .toBuffer()

  return {
    webpBuffer,
    webpFilename: `${stem}.webp`,
    thumbBuffer,
    thumbFilename: `${stem}-thumb.webp`,
    ogBuffer,
    ogFilename: `${stem}-og.webp`,
    width,
    height,
    size: webpBuffer.length,
  }
}

/**
 * Save processed image buffers to disk and return public URLs.
 * uploadDir must exist (e.g. public/uploads).
 */
export async function saveProcessedImage(
  processed: ProcessedImage,
  uploadDir: string,
  publicPrefix: string
): Promise<{ url: string; urlOriginal: string; urlThumb: string; urlOg: string }> {
  await fs.mkdir(uploadDir, { recursive: true })

  await Promise.all([
    fs.writeFile(path.join(uploadDir, processed.webpFilename), processed.webpBuffer),
    fs.writeFile(path.join(uploadDir, processed.thumbFilename), processed.thumbBuffer),
    fs.writeFile(path.join(uploadDir, processed.ogFilename), processed.ogBuffer),
  ])

  const url = `${publicPrefix}/${processed.webpFilename}`
  const urlThumb = `${publicPrefix}/${processed.thumbFilename}`
  const urlOg = `${publicPrefix}/${processed.ogFilename}`

  return {
    url,
    urlOriginal: url,   // original-quality WebP is the main file
    urlThumb,
    urlOg,
  }
}

/**
 * Generate alt text for an image using Claude Haiku.
 * Returns null if ANTHROPIC_API_KEY is not set or on any error.
 */
export async function generateAltText(imageBuffer: Buffer): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  try {
    // Dynamic import so the module loads even when SDK not present
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey })

    const base64 = imageBuffer.toString('base64')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/webp', data: base64 },
            },
            {
              type: 'text',
              text: 'Descrie această imagine în cel mult 10 cuvinte ca text alternativ SEO, în română. Răspunde doar cu descrierea, fără punctuație la final.',
            },
          ],
        },
      ],
    })

    const content = message.content[0]
    if (content.type === 'text') return content.text.trim()
    return null
  } catch (err) {
    console.error('[image-processor] alt text generation failed:', err)
    return null
  }
}

/**
 * Post-process HTML content to inject image SEO attributes:
 * - width + height on all <img> tags (from a provided map)
 * - loading="lazy" on all except the first image
 * - srcset pointing to main + thumbnail
 */
export function injectImageSeoAttrs(
  html: string,
  imageMap: Map<string, { width: number; height: number; thumbUrl: string }>
): string {
  let firstImage = true

  return html.replace(/<img([^>]*)>/g, (match, attrsStr: string) => {
    const srcMatch = /src="([^"]+)"/.exec(attrsStr)
    if (!srcMatch) return match
    const src = srcMatch[1]

    const meta = imageMap.get(src)
    let attrs = attrsStr

    // Remove existing width/height/loading/srcset to avoid duplication
    attrs = attrs.replace(/\s*(width|height|loading|srcset)="[^"]*"/g, '')

    if (meta) {
      attrs += ` width="${meta.width}" height="${meta.height}"`
      attrs += ` srcset="${meta.thumbUrl} 400w, ${src} ${meta.width}w"`
      attrs += ` sizes="(max-width:600px) 400px, ${meta.width}px"`
    }

    if (firstImage) {
      attrs += ' data-above-fold="true" fetchpriority="high"'
      firstImage = false
    } else {
      attrs += ' loading="lazy"'
    }

    return `<img${attrs}>`
  })
}
