import { describe, it, expect } from 'vitest'
import { resolveMetadataBase } from './metadata-base'

describe('resolveMetadataBase', () => {
  it('foloseste originea site-ului, fara cale', () => {
    expect(resolveMetadataBase('https://divet.ro')?.href).toBe('https://divet.ro/')
    expect(resolveMetadataBase(' https://divet.ro/blog/ ')?.href).toBe('https://divet.ro/')
    expect(resolveMetadataBase('http://localhost:3000')?.href).toBe('http://localhost:3000/')
  })
  it('valori lipsa sau invalide -> undefined', () => {
    expect(resolveMetadataBase(undefined)).toBeUndefined()
    expect(resolveMetadataBase(null)).toBeUndefined()
    expect(resolveMetadataBase('')).toBeUndefined()
    expect(resolveMetadataBase('divet.ro')).toBeUndefined()
    expect(resolveMetadataBase('ftp://divet.ro')).toBeUndefined()
    expect(resolveMetadataBase('javascript:alert(1)')).toBeUndefined()
  })
})
