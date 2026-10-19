import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, getSmartScheduledAt } = vi.hoisted(() => ({
  prisma: {
    seoSettings: { findUnique: vi.fn() },
    userSiteAccess: { findFirst: vi.fn() },
    post: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
  getSmartScheduledAt: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/publisher/scheduler', () => ({ getSmartScheduledAt }))
vi.mock('@/lib/navigation', () => ({ revalidateNavigation: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))
vi.mock('fs/promises', () => ({ default: { mkdir: vi.fn() } }))
vi.mock('@prisma/client', () => ({ Prisma: { JsonNull: 'JsonNull' } }))
vi.mock('@/lib/media/image-processor', () => ({
  processImage: vi.fn(),
  saveProcessedImage: vi.fn(),
  generateAltText: vi.fn(),
}))
vi.mock('@/lib/media/storage', () => ({ siteUploadDir: vi.fn(), sitePublicPrefix: vi.fn() }))
vi.mock('@/lib/seo/geo-scorer', () => ({
  calculateGeoScore: vi.fn(() => ({
    score: 50,
    breakdown: {},
    directAnswerText: null,
    speakableSections: [],
  })),
}))
vi.mock('@/lib/seo/schema-generator', () => ({ generatePostSchema: vi.fn(() => ({})) }))
vi.mock('@/lib/seo/speakable-schema', () => ({
  addSpeakableSchema: vi.fn((s: unknown) => s),
  getFaqItemCount: vi.fn(() => 0),
}))
vi.mock('@/lib/tiptap/server-html-parser', () => ({
  serverHtmlToTiptapJson: vi.fn(() => ({ type: 'doc', content: [] })),
}))

import { POST } from './route'

const TOKEN = 'secret-token'
const SLOT = new Date('2030-01-01T10:00:00.000Z')
const ORIGINAL_PUBLISHED_AT = new Date('2024-05-05T08:00:00.000Z')

const send = (overrides: Record<string, unknown> = {}, token: string = TOKEN) =>
  POST(
    new NextRequest('http://localhost/api/publisher/receive', {
      method: 'POST',
      headers: { 'x-cms-token': token },
      body: JSON.stringify({
        siteId: 's1',
        title: 'Titlu',
        slug: 'titlu',
        contentHtml: '<p>Salut</p>',
        status: 'published',
        publisherPageId: 'pp1',
        ...overrides,
      }),
    })
  )

const existingPost = (status: 'DRAFT' | 'PUBLISHED') => ({
  id: 'p1',
  status,
  publishedAt: status === 'PUBLISHED' ? ORIGINAL_PUBLISHED_AT : null,
  publisherCampaign: null,
  featuredImageId: null,
  categoryId: null,
})

beforeEach(() => {
  vi.clearAllMocks()
  prisma.seoSettings.findUnique.mockResolvedValue({
    publisherToken: TOKEN,
    siteName: 'S',
    siteUrl: 'http://x.test',
    defaultOgImage: null,
  })
  prisma.userSiteAccess.findFirst.mockResolvedValue({ userId: 'u1' })
  prisma.post.findFirst.mockResolvedValue(null)
  prisma.post.update.mockResolvedValue({ id: 'p1', slug: 'titlu' })
  prisma.post.create.mockResolvedValue({ id: 'p2', slug: 'titlu' })
  getSmartScheduledAt.mockResolvedValue(SLOT)
})

describe('POST /api/publisher/receive', () => {
  it('401 without the right token', async () => {
    const res = await send({}, 'wrong')
    expect(res.status).toBe(401)
    expect(prisma.post.update).not.toHaveBeenCalled()
    expect(prisma.post.create).not.toHaveBeenCalled()
  })

  it('keeps an already PUBLISHED post published and skips the scheduler', async () => {
    prisma.post.findFirst.mockResolvedValue(existingPost('PUBLISHED'))
    const res = await send()
    expect(res.status).toBe(200)
    expect(getSmartScheduledAt).not.toHaveBeenCalled()
    const data = prisma.post.update.mock.calls[0][0].data
    expect(data.status).toBe('PUBLISHED')
    expect(data.scheduledAt).toBeNull()
    expect(data.publishedAt).toBe(ORIGINAL_PUBLISHED_AT)
    expect((await res.json()).scheduledAt).toBeNull()
  })

  it('still schedules a NEW post as DRAFT', async () => {
    const res = await send()
    expect(res.status).toBe(201)
    expect(getSmartScheduledAt).toHaveBeenCalledWith('s1')
    const data = prisma.post.create.mock.calls[0][0].data
    expect(data.status).toBe('DRAFT')
    expect(data.scheduledAt).toBe(SLOT)
    expect(data.publishedAt).toBeNull()
  })

  it('still schedules an existing DRAFT post', async () => {
    prisma.post.findFirst.mockResolvedValue(existingPost('DRAFT'))
    const res = await send()
    expect(res.status).toBe(200)
    expect(getSmartScheduledAt).toHaveBeenCalledWith('s1')
    const data = prisma.post.update.mock.calls[0][0].data
    expect(data.status).toBe('DRAFT')
    expect(data.scheduledAt).toBe(SLOT)
    expect(data.publishedAt).toBeNull()
  })
})
