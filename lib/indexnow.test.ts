import { describe, it, expect, vi, afterEach } from 'vitest'
import { isValidIndexNowKey, pingIndexNow } from './indexnow'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('isValidIndexNowKey', () => {
  it('accepts alphanumeric/dash keys of 8-128 chars only', () => {
    expect(isValidIndexNowKey('a1b2c3d4e5f6')).toBe(true)
    expect(isValidIndexNowKey('short')).toBe(false)
    expect(isValidIndexNowKey('../etc/passwd')).toBe(false)
    expect(isValidIndexNowKey(undefined)).toBe(false)
  })
})

describe('pingIndexNow', () => {
  it('does nothing outside production or without a key', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('INDEXNOW_KEY', 'a1b2c3d4e5f6')
    vi.stubEnv('NODE_ENV', 'development')
    await pingIndexNow('https://divet.ro', ['/x'])
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('INDEXNOW_KEY', '')
    await pingIndexNow('https://divet.ro', ['/x'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts absolute URLs with the key location in production', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('INDEXNOW_KEY', 'a1b2c3d4e5f6')
    await pingIndexNow('https://divet.ro/', ['/caini/rase/beagle'])
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({
      host: 'divet.ro',
      keyLocation: 'https://divet.ro/a1b2c3d4e5f6.txt',
      urlList: ['https://divet.ro/caini/rase/beagle'],
    })
  })
})
