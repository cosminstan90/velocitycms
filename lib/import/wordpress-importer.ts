import { XMLParser } from 'fast-xml-parser'
import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { slugify } from '@/lib/slugify'
import fetch from 'node-fetch'
import sharp from 'sharp'
import pLimit from 'p-limit'

interface ImportOptions {
  importPosts: boolean
  importPages: boolean
  importMedia: boolean
  importCategories: boolean
  redownloadMedia: boolean
  oldDomain: string
  newDomain: string
}

interface ImportResult {
  categoriesImported: number
  postsImported: number
  pagesImported: number
  mediaDownloaded: number
  errors: string[]
  duplicates: number
  skipped: number
}

interface WPCategory {
  'wp:term_id': string
  'wp:category_nicename': string
  'wp:cat_name': string
  'wp:category_parent'?: string
}

interface WPPost {
  title: string
  'wp:post_name': string
  'wp:post_type': string
  'wp:status': string
  'wp:post_date': string
  'content:encoded': string
  'excerpt:encoded'?: string
  'wp:postmeta'?: Array<{ 'wp:meta_key': string; 'wp:meta_value': string }>
  category?: Array<{ nicename: string }>
}

interface WPData {
  rss: {
    channel: {
      link?: string
      item: WPPost[]
      'wp:category'?: WPCategory[]
    }
  }
}

export class WordPressImporter {
  private siteId: string
  private xmlPath: string
  private options: ImportOptions
  private db: PrismaClient
  private _importerId: string | null = null

  constructor({ siteId, xmlPath, options, db }: { siteId: string; xmlPath: string; options: ImportOptions; db: PrismaClient }) {
    this.siteId = siteId
    this.xmlPath = xmlPath
    this.options = options
    this.db = db
  }

  /** Resolves (and caches) the authorId to use for imported content. */
  private async resolveImporterId(): Promise<string> {
    if (this._importerId) return this._importerId
    const access = await this.db.userSiteAccess.findFirst({
      where: { siteId: this.siteId },
      orderBy: { user: { createdAt: 'asc' } },
      select: { userId: true },
    })
    if (!access) throw new Error('No user found for site — cannot import content without an author.')
    this._importerId = access.userId
    return this._importerId
  }

  async parseXML(): Promise<WPData> {
    const xml = await fs.readFile(this.xmlPath, 'utf-8')
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      cdataPropName: '__cdata',
      parseTagValue: false,
      trimValues: true,
      isArray: (tagName) =>
        ['item', 'wp:category', 'wp:postmeta', 'category'].includes(tagName),
    })
    const parsed = parser.parse(xml)

    // Normalise: fast-xml-parser may return channel.item as object if only one item
    const channel = parsed?.rss?.channel ?? {}
    if (channel.item && !Array.isArray(channel.item)) {
      channel.item = [channel.item]
    }
    if (!channel.item) channel.item = []

    // Flatten CDATA values
    const flattenCdata = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') return obj
      if (obj.__cdata !== undefined) return obj.__cdata
      if (Array.isArray(obj)) return obj.map(flattenCdata)
      return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, flattenCdata(v)]))
    }

    return flattenCdata(parsed) as WPData
  }

  detectOldDomain(wpData: WPData): string | null {
    // Try to find from channel link
    if (wpData.rss.channel.link) {
      try {
        const url = new URL(wpData.rss.channel.link)
        return url.origin
      } catch {}
    }

    // Try from first post with img
    for (const item of wpData.rss.channel.item) {
      if (item['content:encoded']) {
        const match = item['content:encoded'].match(/<img[^>]+src="([^"]+)"/)
        if (match) {
          try {
            const url = new URL(match[1])
            return url.origin
          } catch {}
        }
      }
    }

    return null
  }

  async importCategories(wpData: WPData): Promise<{ created: Map<string, string>; skipped: number }> {
    if (!this.options.importCategories || !wpData.rss.channel['wp:category']) {
      return { created: new Map(), skipped: 0 }
    }

    const categories = wpData.rss.channel['wp:category']
    const parentMap = new Map<string, string>()
    const created = new Map<string, string>()
    let skipped = 0

    // Build parent-child relationships
    for (const cat of categories) {
      if (cat['wp:category_parent']) {
        parentMap.set(cat['wp:category_nicename'], cat['wp:category_parent'])
      }
    }

    // Sort categories: parents first
    const sortedCategories = categories.sort((a, b) => {
      const aHasParent = parentMap.has(a['wp:category_nicename'])
      const bHasParent = parentMap.has(b['wp:category_nicename'])
      if (aHasParent && !bHasParent) return 1
      if (!aHasParent && bHasParent) return -1
      return 0
    })

    for (const cat of sortedCategories) {
      const slug = cat['wp:category_nicename']
      const name = cat['wp:cat_name']

      // Check if exists
      const existing = await this.db.category.findFirst({
        where: { siteId: this.siteId, slug },
      })

      if (existing) {
        skipped++
        continue
      }

      // Find parent
      let parentId: string | null = null
      if (parentMap.has(slug)) {
        const parentSlug = parentMap.get(slug)!
        const parent = await this.db.category.findFirst({
          where: { siteId: this.siteId, slug: parentSlug },
        })
        parentId = parent?.id || null
      }

      const newCat = await this.db.category.create({
        data: {
          siteId: this.siteId,
          name,
          slug,
          parentId,
        },
      })

      created.set(slug, newCat.id)
    }

    return { created, skipped }
  }

  async importPosts(wpData: WPData, categoryMap: Map<string, string>): Promise<{ imported: number; skipped: number; duplicates: number }> {
    if (!this.options.importPosts) {
      return { imported: 0, skipped: 0, duplicates: 0 }
    }

    const posts = wpData.rss.channel.item.filter(item => item['wp:post_type'] === 'post')
    let imported = 0
    let skipped = 0
    let duplicates = 0

    for (const post of posts) {
      const slug = post['wp:post_name']
      const title = post.title

      // Check duplicate
      const existing = await this.db.post.findFirst({
        where: { siteId: this.siteId, slug },
      })

      if (existing) {
        duplicates++
        continue
      }

      let contentHtml = post['content:encoded'] || ''
      const excerpt = post['excerpt:encoded'] || ''

      // Replace domains
      if (this.options.oldDomain && this.options.newDomain) {
        contentHtml = contentHtml.replace(new RegExp(this.options.oldDomain, 'g'), this.options.newDomain)
      }

      // Status
      let status: 'PUBLISHED' | 'DRAFT' = 'DRAFT'
      if (post['wp:status'] === 'publish') status = 'PUBLISHED'

      // Date
      const publishedAt = post['wp:post_date'] ? new Date(post['wp:post_date']) : null

      // Categories
      const categoryIds: string[] = []
      if (post.category) {
        for (const cat of post.category) {
          const catId = categoryMap.get(cat.nicename)
          if (catId) categoryIds.push(catId)
        }
      }

      // Yoast meta
      let metaTitle: string | null = null
      let metaDescription: string | null = null
      let focusKeyword: string | null = null
      let canonicalUrl: string | null = null
      let noIndex = false

      if (post['wp:postmeta']) {
        for (const meta of post['wp:postmeta']) {
          switch (meta['wp:meta_key']) {
            case '_yoast_wpseo_title':
              metaTitle = meta['wp:meta_value']
              break
            case '_yoast_wpseo_metadesc':
              metaDescription = meta['wp:meta_value']
              break
            case '_yoast_wpseo_focuskw':
              focusKeyword = meta['wp:meta_value']
              break
            case '_yoast_wpseo_canonical':
              canonicalUrl = meta['wp:meta_value']
              break
            case '_yoast_wpseo_meta-robots-noindex':
              noIndex = meta['wp:meta_value'] === '1'
              break
          }
        }
      }

      // Content JSON
      const contentJson = this.htmlToJson(contentHtml)

      // Redownload media if enabled
      if (this.options.redownloadMedia) {
        const result = await this.redownloadMedia(contentHtml, slug)
        contentHtml = result.contentHtml
        // Update contentJson if needed, but for simplicity, keep as is
      }

      const authorId = await this.resolveImporterId()
      await this.db.post.create({
        data: {
          siteId: this.siteId,
          authorId,
          title,
          slug,
          contentHtml,
          contentJson,
          excerpt,
          status,
          publishedAt,
          metaTitle,
          metaDescription,
          focusKeyword,
          canonicalUrl,
          noIndex,
          categoryId: categoryIds[0] ?? null,
        },
      })

      imported++
    }

    return { imported, skipped, duplicates }
  }

  async importPages(wpData: WPData): Promise<{ imported: number; skipped: number; duplicates: number }> {
    if (!this.options.importPages) {
      return { imported: 0, skipped: 0, duplicates: 0 }
    }

    const pages = wpData.rss.channel.item.filter(item => item['wp:post_type'] === 'page')
    let imported = 0
    let skipped = 0
    let duplicates = 0

    for (const page of pages) {
      const slug = page['wp:post_name']
      const title = page.title

      // Check duplicate
      const existing = await this.db.page.findFirst({
        where: { siteId: this.siteId, slug },
      })

      if (existing) {
        duplicates++
        continue
      }

      let contentHtml = page['content:encoded'] || ''
      const excerpt = page['excerpt:encoded'] || ''

      // Replace domains
      if (this.options.oldDomain && this.options.newDomain) {
        contentHtml = contentHtml.replace(new RegExp(this.options.oldDomain, 'g'), this.options.newDomain)
      }

      // Status
      let status: 'PUBLISHED' | 'DRAFT' = 'DRAFT'
      if (page['wp:status'] === 'publish') status = 'PUBLISHED'

      // Date
      const publishedAt = page['wp:post_date'] ? new Date(page['wp:post_date']) : null

      // Yoast meta
      let metaTitle: string | null = null
      let metaDescription: string | null = null
      let focusKeyword: string | null = null
      let canonicalUrl: string | null = null
      let noIndex = false

      if (page['wp:postmeta']) {
        for (const meta of page['wp:postmeta']) {
          switch (meta['wp:meta_key']) {
            case '_yoast_wpseo_title':
              metaTitle = meta['wp:meta_value']
              break
            case '_yoast_wpseo_metadesc':
              metaDescription = meta['wp:meta_value']
              break
            case '_yoast_wpseo_focuskw':
              focusKeyword = meta['wp:meta_value']
              break
            case '_yoast_wpseo_canonical':
              canonicalUrl = meta['wp:meta_value']
              break
            case '_yoast_wpseo_meta-robots-noindex':
              noIndex = meta['wp:meta_value'] === '1'
              break
          }
        }
      }

      // Content JSON
      const contentJson = this.htmlToJson(contentHtml)

      // Redownload media if enabled
      if (this.options.redownloadMedia) {
        const result = await this.redownloadMedia(contentHtml, slug)
        contentHtml = result.contentHtml
      }

      const authorId = await this.resolveImporterId()
      await this.db.page.create({
        data: {
          siteId: this.siteId,
          authorId,
          title,
          slug,
          contentHtml,
          contentJson,
          status,
          publishedAt,
          metaTitle,
          metaDescription,
          canonicalUrl,
          noIndex,
        },
      })

      imported++
    }

    return { imported, skipped, duplicates }
  }

  async redownloadMedia(contentHtml: string, postSlug: string): Promise<{ contentHtml: string; downloaded: number; failed: number }> {
    const imgRegex = /<img[^>]+src="([^"]+)"/g
    const urls: string[] = []
    let match
    while ((match = imgRegex.exec(contentHtml)) !== null) {
      const url = match[1]
      if (url.includes(this.options.oldDomain) && !urls.includes(url)) {
        urls.push(url)
      }
    }

    let downloaded = 0
    let failed = 0
    const limit = pLimit(3)

    const replacements = await Promise.all(
      urls.map(url => limit(async () => {
        try {
          const response = await fetch(url)
          if (!response.ok) throw new Error(`HTTP ${response.status}`)

          const buffer = await response.arrayBuffer()
          const sharpInstance = sharp(Buffer.from(buffer))

          // Get original format
          const metadata = await sharpInstance.metadata()
          const ext = metadata.format === 'jpeg' ? 'jpg' : metadata.format || 'jpg'

          // Convert to WebP
          const webpBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer()

          // Save to uploads
          const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.webp`
          const uploadDir = path.join(process.cwd(), 'public', 'media', 'uploads', this.siteId)
          await fs.mkdir(uploadDir, { recursive: true })
          const filePath = path.join(uploadDir, filename)
          await fs.writeFile(filePath, webpBuffer)

          // Create Media record
          const media = await this.db.media.create({
            data: {
              siteId: this.siteId,
              filename,
              originalName: path.basename(url),
              mimeType: 'image/webp',
              size: webpBuffer.length,
              url: `/media/uploads/${this.siteId}/${filename}`,
            },
          })

          downloaded++
          return { oldUrl: url, newUrl: media.url }
        } catch (error) {
          console.error(`Failed to download ${url}:`, error)
          failed++
          return null
        }
      }))
    )

    let updatedContent = contentHtml
    for (const rep of replacements) {
      if (rep) {
        updatedContent = updatedContent.replace(new RegExp(rep.oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), rep.newUrl)
      }
    }

    return { contentHtml: updatedContent, downloaded, failed }
  }

  private htmlToJson(html: string): any {
    // Simple converter: p -> paragraph, h2/h3 -> heading, img -> image, ul/ol -> list
    // This is a basic implementation; in reality, might need a proper HTML to JSON converter
    const json: any[] = []

    // Split by tags roughly
    const parts = html.split(/(<[^>]+>)/)

    let currentPara: any[] = []
    let currentList: any = null

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (part.startsWith('<p>')) {
        if (currentPara.length) {
          json.push({ type: 'paragraph', content: currentPara })
          currentPara = []
        }
        currentPara.push({ type: 'text', text: parts[i + 1] || '' })
        i++ // skip text
      } else if (part.startsWith('<h2>') || part.startsWith('<h3>')) {
        if (currentPara.length) {
          json.push({ type: 'paragraph', content: currentPara })
          currentPara = []
        }
        const level = part.startsWith('<h2>') ? 2 : 3
        json.push({ type: 'heading', attrs: { level }, content: [{ type: 'text', text: parts[i + 1] || '' }] })
        i++
      } else if (part.startsWith('<img')) {
        // Extract src
        const srcMatch = part.match(/src="([^"]+)"/)
        if (srcMatch) {
          if (currentPara.length) {
            json.push({ type: 'paragraph', content: currentPara })
            currentPara = []
          }
          json.push({ type: 'image', attrs: { src: srcMatch[1] } })
        }
      } else if (part.startsWith('<ul>') || part.startsWith('<ol>')) {
        if (currentPara.length) {
          json.push({ type: 'paragraph', content: currentPara })
          currentPara = []
        }
        currentList = { type: 'bulletList', content: [] }
      } else if (part.startsWith('<li>')) {
        if (currentList) {
          currentList.content.push({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: parts[i + 1] || '' }] }] })
          i++
        }
      } else if (part === '</ul>' || part === '</ol>') {
        if (currentList) {
          json.push(currentList)
          currentList = null
        }
      }
    }

    if (currentPara.length) {
      json.push({ type: 'paragraph', content: currentPara })
    }

    return { type: 'doc', content: json }
  }

  async importAll(onProgress: (step: string, current: number, total: number, message: string) => void): Promise<ImportResult> {
    const result: ImportResult = {
      categoriesImported: 0,
      postsImported: 0,
      pagesImported: 0,
      mediaDownloaded: 0,
      errors: [],
      duplicates: 0,
      skipped: 0,
    }

    try {
      onProgress('Parsing XML', 0, 1, 'Reading WordPress export file...')
      const wpData = await this.parseXML()
      onProgress('Parsing XML', 1, 1, 'XML parsed successfully')

      const totalItems = wpData.rss.channel.item.length
      const totalCategories = wpData.rss.channel['wp:category']?.length || 0

      if (this.options.importCategories) {
        onProgress('Importing Categories', 0, totalCategories, 'Starting category import...')
        const catResult = await this.importCategories(wpData)
        result.categoriesImported = catResult.created.size
        result.skipped += catResult.skipped
        onProgress('Importing Categories', catResult.created.size, totalCategories, `Imported ${catResult.created.size} categories`)
      }

      if (this.options.importPosts) {
        const posts = wpData.rss.channel.item.filter(item => item['wp:post_type'] === 'post')
        onProgress('Importing Posts', 0, posts.length, 'Starting post import...')
        const postResult = await this.importPosts(wpData, new Map()) // categoryMap empty for now
        result.postsImported = postResult.imported
        result.duplicates += postResult.duplicates
        result.skipped += postResult.skipped
        onProgress('Importing Posts', postResult.imported, posts.length, `Imported ${postResult.imported} posts`)
      }

      if (this.options.importPages) {
        const pages = wpData.rss.channel.item.filter(item => item['wp:post_type'] === 'page')
        onProgress('Importing Pages', 0, pages.length, 'Starting page import...')
        const pageResult = await this.importPages(wpData)
        result.pagesImported = pageResult.imported
        result.duplicates += pageResult.duplicates
        result.skipped += pageResult.skipped
        onProgress('Importing Pages', pageResult.imported, pages.length, `Imported ${pageResult.imported} pages`)
      }

      // Media download is handled per post/page if redownloadMedia is true

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error))
    }

    return result
  }
}