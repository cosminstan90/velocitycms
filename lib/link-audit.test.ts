import { describe, it, expect } from 'vitest'
import { buildAudit, extractInternalLinks, formatReport, normalizePath, postPath, MIN_OUT, type AuditPost } from './link-audit'

const SITE = 'https://divet.ro'
const NOW = new Date('2026-11-04T00:00:00Z')

const post = (id: string, over: Partial<AuditPost> = {}): AuditPost => ({
  id,
  title: id,
  slug: id,
  contentHtml: '',
  groupSlug: 'caini',
  subSlug: 'rase',
  tagSlugs: [],
  fields: {},
  publishedAt: '2025-01-01T00:00:00Z',
  ...over,
})

describe('normalizePath / postPath', () => {
  it('drops query, hash and trailing slash, lowercases, keeps root', () => {
    expect(normalizePath('/Caini/Rase/?a=1#x')).toBe('/caini/rase')
    expect(normalizePath('/')).toBe('/')
    expect(normalizePath('')).toBe('/')
  })
  it('builds the canonical path of a post', () => {
    expect(postPath({ slug: 'beagle', groupSlug: 'caini', subSlug: 'rase' })).toBe('/caini/rase/beagle')
    expect(postPath({ slug: 'x', groupSlug: 'caini', subSlug: null })).toBe('/caini/x')
    expect(postPath({ slug: 'x', groupSlug: null, subSlug: null })).toBe('/blog/x')
  })
})

describe('extractInternalLinks', () => {
  it('keeps relative and own-domain links, drops external, mailto and protocol-relative', () => {
    const html =
      '<p><a href="/caini/rase/beagle/" target="_blank">Beagle</a> <a href="https://divet.ro/pisici/rase/maine-coon?x=1">Maine <em>Coon</em></a> ' +
      '<a href="https://merckvetmanual.com/x">Merck</a> <a href="mailto:a@b.ro">m</a> <a href="//cdn.test/x">c</a></p>'
    expect(extractInternalLinks(html, SITE)).toEqual([
      { path: '/caini/rase/beagle', anchor: 'Beagle' },
      { path: '/pisici/rase/maine-coon', anchor: 'Maine Coon' },
    ])
  })
})

describe('buildAudit', () => {
  const posts = [
    post('a', { contentHtml: '<a href="/caini/rase/b">B</a> <a href="/caini/rase/b">din nou</a> <a href="/caini/rase/nu-exista">rupt</a>' }),
    post('b'),
    post('lonely', { groupSlug: 'marine', subSlug: 'x', tagSlugs: [] }),
  ]
  const report = buildAudit(posts, ['/caini', '/caini/rase'], SITE, NOW)
  const byPath = (p: string) => report.posts.find((x) => x.path === p)!

  it('counts body links once per distinct target and flags duplicates', () => {
    expect(byPath('/caini/rase/a').outBody).toBe(1)
    expect(byPath('/caini/rase/b').inBody).toBe(1)
    expect(report.duplicates).toEqual([{ from: '/caini/rase/a', to: '/caini/rase/b', times: 2 }])
  })

  it('reports links to pages that do not exist as broken, but not links to known paths', () => {
    expect(report.broken).toEqual([{ from: '/caini/rase/a', to: '/caini/rase/nu-exista', anchor: 'rupt' }])
    const ok = buildAudit([post('a', { contentHtml: '<a href="/caini/rase">hub</a>' })], ['/caini/rase'], SITE, NOW)
    expect(ok.broken).toEqual([])
  })

  it('includes related-block edges (same subcategory) in both directions', () => {
    expect(byPath('/caini/rase/a').outRelated).toBe(1)
    expect(byPath('/caini/rase/b').inRelated).toBe(1)
  })

  it('flags orphans and low-outbound posts', () => {
    expect(report.orphans).toEqual(['/marine/x/lonely'])
    expect(report.lowOutbound.map((l) => l.path)).toContain('/marine/x/lonely')
    expect(report.summary.orphans).toBe(1)
  })

  it('counts breed <-> health relations from rase_predispuse in both directions', () => {
    const r = buildAudit(
      [
        post('labrador', { slug: 'labrador-retriever', title: 'Labrador Retriever' }),
        post('parvo', { slug: 'parvoviroza', groupSlug: 'sanatate', subSlug: 'boli', fields: { rase_predispuse: 'Labrador' } }),
      ],
      [],
      SITE,
      NOW,
    )
    const lab = r.posts.find((x) => x.path === '/caini/rase/labrador-retriever')!
    const parvo = r.posts.find((x) => x.path === '/sanatate/boli/parvoviroza')!
    expect(lab.inExplicit).toBe(1)
    expect(lab.outExplicit).toBe(1)
    expect(parvo.inExplicit).toBe(1)
    expect(parvo.outExplicit).toBe(1)
  })

  it('handles an empty site', () => {
    const empty = buildAudit([], [], SITE, NOW)
    expect(empty.summary).toMatchObject({ posts: 0, orphans: 0, avgOutbound: 0 })
  })
})

describe('formatReport', () => {
  it('renders a markdown report with the key sections and the coverage caveat', () => {
    const md = formatReport(buildAudit([post('a'), post('b')], [], SITE, NOW), '2026-11-04')
    expect(md).toContain('# Audit linkuri interne (2026-11-04)')
    expect(md).toContain('## Linkuri rupte')
    expect(md).toContain('## Articole orfane')
    expect(md).toContain('Nu sunt numărate')
    expect(md).toContain(`< ${MIN_OUT} linkuri trimise`)
  })
})
