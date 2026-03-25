import { NextRequest } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { WordPressImporter } from '@/lib/import/wordpress-importer'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

export async function POST(req: NextRequest) {
  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return new Response('siteId required', { status: 400 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const optionsStr = formData.get('options') as string
  const parseOnly = formData.get('parseOnly') === 'true'

  if (!file) {
    return new Response('file required', { status: 400 })
  }

  // Save XML to temp
  const timestamp = Date.now()
  const tempPath = path.join('/tmp', `wp-import-${timestamp}.xml`)
  const buffer = await file.arrayBuffer()
  await writeFile(tempPath, Buffer.from(buffer))

  if (parseOnly) {
    try {
      const importer = new WordPressImporter({
        siteId,
        xmlPath: tempPath,
        options: {} as any, // dummy
        db: prisma,
      })
      const wpData = await importer.parseXML()
      const oldDomain = importer.detectOldDomain(wpData)
      const counts = {
        posts: wpData.rss.channel.item.filter(item => item['wp:post_type'] === 'post').length,
        pages: wpData.rss.channel.item.filter(item => item['wp:post_type'] === 'page').length,
        categories: wpData.rss.channel['wp:category']?.length || 0,
        oldDomain,
      }
      await unlink(tempPath)
      return new Response(JSON.stringify(counts), { headers: { 'Content-Type': 'application/json' } })
    } catch (error) {
      await unlink(tempPath)
      return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
  }

  // Parse options
  const options = JSON.parse(optionsStr)

  // SSE response
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const onProgress = (step: string, current: number, total: number, message: string) => {
        const percent = total > 0 ? Math.round((current / total) * 100) : 0
        sendEvent({ step, current, total, percent, message })
      }

      // Run import
      const importer = new WordPressImporter({
        siteId,
        xmlPath: tempPath,
        options,
        db: prisma,
      })

      importer.importAll(onProgress).then((result) => {
        sendEvent({ ...result, step: 'completed' })
        controller.close()
        // Cleanup
        unlink(tempPath).catch(() => {})
      }).catch((error) => {
        sendEvent({ step: 'error', message: error.message })
        controller.close()
        unlink(tempPath).catch(() => {})
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}