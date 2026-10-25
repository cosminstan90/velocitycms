import { describe, it, expect } from 'vitest'
import { isTagIndexable, MIN_INDEXABLE_TAG_POSTS } from './tag-index'

describe('isTagIndexable', () => {
  it('sub prag nu se indexeaza', () => {
    expect(isTagIndexable(0)).toBe(false)
    expect(isTagIndexable(MIN_INDEXABLE_TAG_POSTS - 1)).toBe(false)
  })
  it('de la prag in sus se indexeaza', () => {
    expect(isTagIndexable(MIN_INDEXABLE_TAG_POSTS)).toBe(true)
    expect(isTagIndexable(20)).toBe(true)
  })
})
