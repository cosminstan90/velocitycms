import { describe, it, expect } from 'vitest'
import {
  CATEGORY_INDEX_MIN,
  CATEGORY_NAV_MIN,
  categoryTotals,
  isCategoryIndexable,
  isGroupInNav,
  isSubcategoryInNav,
} from './category-visibility'

describe('thresholds', () => {
  it('indexable from the minimum, not below', () => {
    expect(isCategoryIndexable(CATEGORY_INDEX_MIN - 1)).toBe(false)
    expect(isCategoryIndexable(CATEGORY_INDEX_MIN)).toBe(true)
    expect(isCategoryIndexable(0)).toBe(false)
  })

  it('a group is in the menu when it is indexable; a subcategory needs the higher bar', () => {
    expect(isGroupInNav(CATEGORY_INDEX_MIN)).toBe(true)
    expect(isGroupInNav(CATEGORY_INDEX_MIN - 1)).toBe(false)
    expect(isSubcategoryInNav(CATEGORY_NAV_MIN - 1)).toBe(false)
    expect(isSubcategoryInNav(CATEGORY_NAV_MIN)).toBe(true)
  })

  it('never lists in the menu something that is not indexable', () => {
    expect(CATEGORY_NAV_MIN).toBeGreaterThanOrEqual(CATEGORY_INDEX_MIN)
  })
})

describe('categoryTotals', () => {
  const cats = [
    { id: 'g1', parentId: null, directCount: 1 },
    { id: 's1', parentId: 'g1', directCount: 2 },
    { id: 's2', parentId: 'g1', directCount: 3 },
    { id: 'g2', parentId: null, directCount: 0 },
  ]
  it('a group includes its children, a subcategory only itself', () => {
    const t = categoryTotals(cats)
    expect(t.get('g1')).toBe(6)
    expect(t.get('s1')).toBe(2)
    expect(t.get('s2')).toBe(3)
    expect(t.get('g2')).toBe(0)
  })

  it('ignores a child whose parent is unknown', () => {
    expect(categoryTotals([{ id: 'x', parentId: 'ghost', directCount: 4 }]).get('x')).toBe(4)
  })
})
