import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { NextRequest } from 'next/server'

let root = ''
vi.mock('@/lib/media/storage', () => ({ getMediaRoot: () => root }))

import { GET, HEAD } from './route'

const WEBP = Buffer.from('RIFFxxxxWEBPVP8 fake-webp-data')
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5])
let outside = ''
let symlinkOk = false

function call(fn: typeof GET, segs: string[], headers: Record<string, string> = {}) {
  const req = new NextRequest('http://localhost/api/media-file/x', { headers })
  return fn(req, { params: Promise.resolve({ path: segs }) })
}

beforeAll(() => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'media-file-'))
  root = path.join(base, 'uploads')
  outside = path.join(base, 'outside')
  fs.mkdirSync(path.join(root, 'site1', 'adir.webp'), { recursive: true })
  fs.mkdirSync(outside)
  fs.writeFileSync(path.join(root, 'a.webp'), WEBP)
  fs.writeFileSync(path.join(root, 'b.jpg'), JPG)
  fs.writeFileSync(path.join(root, 'site1', 'x.webp'), WEBP)
  fs.writeFileSync(path.join(root, 'icon.svg'), '<svg/>')
  fs.writeFileSync(path.join(root, 'p.html'), '<html/>')
  fs.writeFileSync(path.join(root, 'n.txt'), 'hi')
  fs.writeFileSync(path.join(outside, 'secret.webp'), WEBP)
  fs.writeFileSync(path.join(base, 'package.json'), '{}')
  try {
    fs.symlinkSync(path.join(outside, 'secret.webp'), path.join(root, 'link.webp'))
    fs.symlinkSync(outside, path.join(root, 'linkdir'), 'junction')
    symlinkOk = true
  } catch {
    symlinkOk = false
  }
})

afterAll(() => {
  fs.rmSync(path.dirname(root), { recursive: true, force: true })
})

describe('GET /api/media-file', () => {
  it('serves webp with headers', async () => {
    const res = await call(GET, ['a.webp'])
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/webp')
    expect(res.headers.get('content-length')).toBe(String(WEBP.length))
    expect(res.headers.get('cache-control')).toBe('public, max-age=86400')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('etag')).toBeTruthy()
    expect(res.headers.get('last-modified')).toBeTruthy()
    expect(Buffer.from(await res.arrayBuffer()).equals(WEBP)).toBe(true)
  })

  it('serves jpg', async () => {
    const res = await call(GET, ['b.jpg'])
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/jpeg')
    expect(res.headers.get('content-length')).toBe(String(JPG.length))
    expect(Buffer.from(await res.arrayBuffer()).equals(JPG)).toBe(true)
  })

  it('serves files in a subfolder', async () => {
    const res = await call(GET, ['site1', 'x.webp'])
    expect(res.status).toBe(200)
  })

  it('returns 304 on matching If-None-Match', async () => {
    const etag = (await call(GET, ['a.webp'])).headers.get('etag')!
    const res = await call(GET, ['a.webp'], { 'if-none-match': etag })
    expect(res.status).toBe(304)
    expect(await res.text()).toBe('')
  })

  it('returns 304 on If-Modified-Since', async () => {
    const lm = (await call(GET, ['a.webp'])).headers.get('last-modified')!
    const res = await call(GET, ['a.webp'], { 'if-modified-since': lm })
    expect(res.status).toBe(304)
  })

  it('HEAD has headers and no body', async () => {
    const res = await call(HEAD, ['a.webp'])
    expect(res.status).toBe(200)
    expect(res.headers.get('content-length')).toBe(String(WEBP.length))
    expect(await res.text()).toBe('')
  })

  it('404 for missing file', async () => {
    expect((await call(GET, ['nope.webp'])).status).toBe(404)
  })

  it.each([
    [['..', '..', 'package.json']],
    [['..', 'outside', 'secret.webp']],
    [['%2e%2e', '%2e%2e', 'package.json']],
    [['..%2f..%2fpackage.json']],
    [['..\\..\\package.json']],
    [['site1', '..', 'a.webp']],
    [['.', 'a.webp']],
    [['', 'a.webp']],
    [['.hidden.webp']],
    [['a.webp\0.txt']],
    [['/etc/passwd']],
    [['C:\\Windows\\win.ini']],
    [[]],
  ])('404 for unsafe segments %j', async (segs) => {
    expect((await call(GET, segs)).status).toBe(404)
  })

  it.each([['icon.svg'], ['p.html'], ['n.txt']])('404 for disallowed extension %s', async (f) => {
    expect((await call(GET, [f])).status).toBe(404)
  })

  it('404 for a directory', async () => {
    expect((await call(GET, ['site1', 'adir.webp'])).status).toBe(404)
    expect((await call(GET, ['site1'])).status).toBe(404)
  })

  it('404 for a symlink pointing outside the root', async (ctx) => {
    if (!symlinkOk) ctx.skip()
    expect((await call(GET, ['link.webp'])).status).toBe(404)
    expect((await call(GET, ['linkdir', 'secret.webp'])).status).toBe(404)
  })
})
