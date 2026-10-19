import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, authMock, siteMock } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    fieldDefinition: {
      findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), aggregate: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    },
    fieldValue: { count: vi.fn() },
    $transaction: vi.fn(),
  },
  authMock: vi.fn(),
  siteMock: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth: authMock }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: siteMock }))

import { GET, POST } from './route'
import { GET as getOne, PUT, DELETE } from './[id]/route'
import { PUT as reorder } from './reorder/route'

const ctx = { params: Promise.resolve({ id: 'f1' }) }
const def = { id: 'f1', siteId: 's1' }
const req = (url: string, method = 'GET', body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, body: body === undefined ? undefined : JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  siteMock.mockImplementation(async (r: NextRequest) => r.nextUrl.searchParams.get('siteId'))
  authMock.mockResolvedValue({ user: { id: 'u1', activeSiteId: 's1' } })
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.fieldDefinition.findMany.mockResolvedValue([])
  prisma.fieldDefinition.findFirst.mockResolvedValue(null)
  prisma.fieldDefinition.findUnique.mockResolvedValue(def)
  prisma.fieldDefinition.aggregate.mockResolvedValue({ _max: { sortOrder: 0 } })
  prisma.fieldDefinition.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'f2', ...data }))
  prisma.fieldDefinition.update.mockResolvedValue(def)
  prisma.fieldValue.count.mockResolvedValue(0)
  prisma.$transaction.mockResolvedValue([])
})

describe('/api/field-definitions collection', () => {
  it('GET lists with access', async () => {
    expect((await GET(req('/api/field-definitions?siteId=s1'))).status).toBe(200)
  })
  it('GET 403 without access', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await GET(req('/api/field-definitions?siteId=s2'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect(prisma.fieldDefinition.findMany).not.toHaveBeenCalled()
  })
  it('GET 401 without a session', async () => {
    authMock.mockResolvedValue(null)
    expect((await GET(req('/api/field-definitions?siteId=s1'))).status).toBe(401)
  })
  it('POST creates with access', async () => {
    const res = await POST(req('/api/field-definitions', 'POST', { siteId: 's1', fieldLabel: 'Age', fieldType: 'NUMBER' }))
    expect(res.status).toBe(201)
  })
  it('POST falls back to the resolved site when the body has no siteId', async () => {
    siteMock.mockResolvedValue('s1')
    const res = await POST(req('/api/field-definitions', 'POST', { fieldLabel: 'Age', fieldType: 'NUMBER' }))
    expect(res.status).toBe(201)
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_siteId: { userId: 'u1', siteId: 's1' } } }))
    expect(prisma.fieldDefinition.create.mock.calls[0][0].data.siteId).toBe('s1')
  })
  it('POST falls back to the session activeSiteId and is 403 without access', async () => {
    siteMock.mockResolvedValue(null)
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await POST(req('/api/field-definitions', 'POST', { fieldLabel: 'Age', fieldType: 'NUMBER' }))
    expect(res.status).toBe(403)
    expect(prisma.fieldDefinition.create).not.toHaveBeenCalled()
  })
  it('GET without siteId uses the resolved site', async () => {
    siteMock.mockResolvedValue('s1')
    expect((await GET(req('/api/field-definitions'))).status).toBe(200)
    expect(prisma.fieldDefinition.findMany.mock.calls[0][0].where.siteId).toBe('s1')
  })
  it('POST 403 without access', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await POST(req('/api/field-definitions', 'POST', { siteId: 's2', fieldLabel: 'Age', fieldType: 'NUMBER' }))
    expect(res.status).toBe(403)
    expect(prisma.fieldDefinition.create).not.toHaveBeenCalled()
  })
})

describe('/api/field-definitions/[id]', () => {
  it('GET, PUT and DELETE work with access', async () => {
    expect((await getOne(req('/api/field-definitions/f1'), ctx)).status).toBe(200)
    expect((await PUT(req('/api/field-definitions/f1', 'PUT', { fieldLabel: 'X' }), ctx)).status).toBe(200)
    expect((await DELETE(req('/api/field-definitions/f1', 'DELETE'), ctx)).status).toBe(200)
    expect(prisma.fieldDefinition.delete).toHaveBeenCalledWith({ where: { id: 'f1' } })
  })
  it('404 and no write for a definition of an inaccessible site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await getOne(req('/api/field-definitions/f1'), ctx)).status).toBe(404)
    expect((await PUT(req('/api/field-definitions/f1', 'PUT', { fieldLabel: 'X' }), ctx)).status).toBe(404)
    const res = await DELETE(req('/api/field-definitions/f1', 'DELETE'), ctx)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(prisma.fieldDefinition.update).not.toHaveBeenCalled()
    expect(prisma.fieldDefinition.delete).not.toHaveBeenCalled()
  })
})

describe('PUT /api/field-definitions/reorder', () => {
  it('reorders definitions of an accessible site', async () => {
    prisma.fieldDefinition.findMany.mockResolvedValue([{ id: 'f1', siteId: 's1' }, { id: 'f2', siteId: 's1' }])
    const res = await reorder(req('/api/field-definitions/reorder', 'PUT', { ids: ['f1', 'f2'] }))
    expect(res.status).toBe(200)
    expect(prisma.$transaction).toHaveBeenCalled()
  })
  it('404 and no update when any definition belongs to an inaccessible site', async () => {
    prisma.fieldDefinition.findMany.mockResolvedValue([{ id: 'f1', siteId: 's1' }, { id: 'f2', siteId: 's2' }])
    prisma.userSiteAccess.findUnique.mockImplementation(async ({ where }: { where: { userId_siteId: { siteId: string } } }) =>
      where.userId_siteId.siteId === 's1' ? { id: 'a1' } : null,
    )
    const res = await reorder(req('/api/field-definitions/reorder', 'PUT', { ids: ['f1', 'f2'] }))
    expect(res.status).toBe(404)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
  it('404 when an id does not exist', async () => {
    prisma.fieldDefinition.findMany.mockResolvedValue([{ id: 'f1', siteId: 's1' }])
    const res = await reorder(req('/api/field-definitions/reorder', 'PUT', { ids: ['f1', 'ghost'] }))
    expect(res.status).toBe(404)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
