import { describe, it, expect, afterEach } from 'vitest'
import { adsTxtLine, getAdsenseClient } from './ads'

describe('ads', () => {
  afterEach(() => {
    delete process.env.ADSENSE_CLIENT
  })

  it('liniile ads.txt folosesc pub-… fara prefixul ca-', () => {
    expect(adsTxtLine('ca-pub-5857406003088462')).toBe('google.com, pub-5857406003088462, DIRECT, f08c47fec0942fa0')
  })

  it('accepta doar un ID ca-pub-… valid', () => {
    expect(getAdsenseClient()).toBe('ca-pub-5857406003088462')
    process.env.ADSENSE_CLIENT = 'ca-pub-123'
    expect(getAdsenseClient()).toBeNull()
    process.env.ADSENSE_CLIENT = ''
    expect(getAdsenseClient()).toBeNull()
  })
})
