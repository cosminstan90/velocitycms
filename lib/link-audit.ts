/**
 * Audit de linkuri interne (pur: fara baza de date). Folosit de scripts/link-audit.ts.
 *
 * Trei surse de linkuri intre articole:
 *  - body: linkuri din contentHtml (scrise in text);
 *  - related: blocul „Mai multe din…", calculat cu lib/related.ts (aceleasi reguli ca pe site);
 *  - explicit: relatii rasa <-> boala (rase_predispuse), calculate cu lib/health.ts.
 * NU sunt numarate: listele filtrate, comparatiile, meniul si paginile de categorie (raportul spune asta).
 * Importurile sunt relative (fara alias @/) ca scriptul sa ruleze sub ts-node.
 */
import { buildPostPath } from './seo/canonical-builder'
import { pickRelated, RELATED_FIELD_KEYS, type RelatedSubject } from './related'
import { HEALTH_GROUP, matchBreeds, parseBreedList } from './health'

export type AuditPost = {
  id: string
  title: string
  slug: string
  contentHtml: string
  groupSlug: string | null
  subSlug: string | null
  tagSlugs: string[]
  fields: Record<string, string | undefined>
  publishedAt: Date | string | null
}

/** Calea canonica a unui articol. */
export function postPath(p: Pick<AuditPost, 'slug' | 'groupSlug' | 'subSlug'>): string {
  const category = p.groupSlug
    ? p.subSlug
      ? { slug: p.subSlug, parent: { slug: p.groupSlug } }
      : { slug: p.groupSlug }
    : null
  return buildPostPath({ slug: p.slug }, category)
}

/** Normalizeaza o cale: fara query/hash, fara slash final, minuscule; "/" ramane "/". */
export function normalizePath(href: string): string {
  const clean = href.split('#')[0].split('?')[0].replace(/\/+$/, '')
  return (clean === '' ? '/' : clean).toLowerCase()
}

export type BodyLink = { path: string; anchor: string }

/** Linkurile interne din HTML: href relativ care incepe cu "/" sau absolut spre domeniul propriu. */
export function extractInternalLinks(html: string, siteUrl: string): BodyLink[] {
  const origin = siteUrl.replace(/\/+$/, '')
  const out: BodyLink[] = []
  for (const m of html.matchAll(/<a\s+[^>]*?href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
    let href = m[1].trim()
    if (href.startsWith(origin + '/') || href === origin) href = href.slice(origin.length) || '/'
    if (!href.startsWith('/') || href.startsWith('//')) continue
    out.push({ path: normalizePath(href), anchor: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() })
  }
  return out
}

export type PostAudit = {
  path: string
  title: string
  outBody: number
  outRelated: number
  outExplicit: number
  inBody: number
  inRelated: number
  inExplicit: number
}

export type AuditReport = {
  summary: {
    posts: number
    bodyLinks: number
    avgOutbound: number
    orphans: number
    lowOutbound: number
    brokenLinks: number
    duplicateTargets: number
  }
  orphans: string[]
  /** Articole cu mai putin de MIN_OUT linkuri trimise in total. */
  lowOutbound: Array<{ path: string; out: number }>
  broken: Array<{ from: string; to: string; anchor: string }>
  duplicates: Array<{ from: string; to: string; times: number }>
  posts: PostAudit[]
}

export const MIN_OUT = 4

/**
 * @param validPaths  toate caile care exista (articole, categorii, pagini statice, etichete, autori): tinta unui
 *                    link care nu e aici este „rupt".
 */
export function buildAudit(posts: AuditPost[], validPaths: Iterable<string>, siteUrl: string, now: Date = new Date()): AuditReport {
  const valid = new Set<string>([...validPaths].map(normalizePath))
  const paths = new Map(posts.map((p) => [p.id, postPath(p)]))
  for (const p of paths.values()) valid.add(normalizePath(p))

  const audit = new Map<string, PostAudit>(
    posts.map((p) => [paths.get(p.id)!, { path: paths.get(p.id)!, title: p.title, outBody: 0, outRelated: 0, outExplicit: 0, inBody: 0, inRelated: 0, inExplicit: 0 }]),
  )
  const bump = (path: string, key: keyof PostAudit, n = 1) => {
    const a = audit.get(path)
    if (a) (a[key] as number) += n
  }

  const broken: AuditReport['broken'] = []
  const duplicates: AuditReport['duplicates'] = []
  let bodyLinks = 0

  // 1) body
  for (const p of posts) {
    const from = paths.get(p.id)!
    const seen = new Map<string, number>()
    for (const l of extractInternalLinks(p.contentHtml, siteUrl)) {
      if (l.path === normalizePath(from)) continue
      bodyLinks++
      if (!valid.has(l.path)) {
        broken.push({ from, to: l.path, anchor: l.anchor })
        continue
      }
      seen.set(l.path, (seen.get(l.path) ?? 0) + 1)
    }
    for (const [to, times] of seen) {
      bump(from, 'outBody')
      bump(to, 'inBody')
      if (times > 1) duplicates.push({ from, to, times })
    }
  }

  // 2) related (aceleasi reguli ca blocul de pe site)
  const subjects = posts.map((p) => ({
    post: p,
    subject: {
      id: p.id,
      groupSlug: p.groupSlug,
      subSlug: p.subSlug,
      tagSlugs: p.tagSlugs,
      fields: Object.fromEntries(RELATED_FIELD_KEYS.map((k) => [k, p.fields[k]])),
      publishedAt: p.publishedAt,
    } satisfies RelatedSubject,
    title: p.title,
  }))
  for (const s of subjects) {
    const candidates = subjects.filter((o) => o.post.id !== s.post.id && o.post.groupSlug !== 'comparatie').map((o) => ({ ...o.subject, title: o.title, post: o.post }))
    for (const pick of pickRelated(s.subject, candidates, 6, now)) {
      bump(paths.get(s.post.id)!, 'outRelated')
      bump(paths.get(pick.item.post.id)!, 'inRelated')
    }
  }

  // 3) explicit: rase_predispuse -> fisa rasei (si invers, ca pe site)
  const breeds = posts
    .filter((p) => p.subSlug === 'rase' && (p.groupSlug === 'caini' || p.groupSlug === 'pisici'))
    .map((p) => ({ title: p.title, slug: p.slug, href: paths.get(p.id)! }))
  for (const p of posts.filter((x) => x.groupSlug === HEALTH_GROUP)) {
    const matched = matchBreeds(parseBreedList(p.fields['rase_predispuse']), breeds)
    for (const b of matched) {
      bump(paths.get(p.id)!, 'outExplicit')
      bump(b.href, 'inExplicit')
      bump(b.href, 'outExplicit')
      bump(paths.get(p.id)!, 'inExplicit')
    }
  }

  const rows = [...audit.values()]
  const total = (a: PostAudit, dir: 'in' | 'out') => (dir === 'in' ? a.inBody + a.inRelated + a.inExplicit : a.outBody + a.outRelated + a.outExplicit)
  const orphans = rows.filter((a) => total(a, 'in') === 0).map((a) => a.path)
  const lowOutbound = rows.filter((a) => total(a, 'out') < MIN_OUT).map((a) => ({ path: a.path, out: total(a, 'out') }))
  const avg = rows.length ? rows.reduce((n, a) => n + total(a, 'out'), 0) / rows.length : 0

  return {
    summary: {
      posts: rows.length,
      bodyLinks,
      avgOutbound: Math.round(avg * 10) / 10,
      orphans: orphans.length,
      lowOutbound: lowOutbound.length,
      brokenLinks: broken.length,
      duplicateTargets: duplicates.length,
    },
    orphans,
    lowOutbound,
    broken,
    duplicates,
    posts: rows,
  }
}

/** Raport markdown pentru docs/seo. */
export function formatReport(r: AuditReport, generatedAt: string): string {
  const s = r.summary
  const lines = [
    `# Audit linkuri interne (${generatedAt})`,
    '',
    '| Indicator | Valoare |',
    '|---|---|',
    `| Articole publicate | ${s.posts} |`,
    `| Linkuri în text (body) | ${s.bodyLinks} |`,
    `| Linkuri trimise / articol (body + înrudite + rasă↔boală), medie | ${s.avgOutbound} |`,
    `| Articole orfane (0 linkuri primite) | ${s.orphans} |`,
    `| Articole cu < ${MIN_OUT} linkuri trimise | ${s.lowOutbound} |`,
    `| Linkuri rupte în text | ${s.brokenLinks} |`,
    `| Același țintă legată de mai multe ori în același articol | ${s.duplicateTargets} |`,
    '',
    '> Nu sunt numărate: listele filtrate, comparațiile, meniul și paginile de categorie. Un articol „orfan” aici poate fi totuși linkat din acestea.',
    '',
  ]
  const section = (title: string, rows: string[]) => {
    lines.push(`## ${title}`, '')
    lines.push(...(rows.length ? rows : ['_Niciunul._']), '')
  }
  section('Linkuri rupte', r.broken.map((b) => `- \`${b.from}\` → \`${b.to}\` („${b.anchor}”)`))
  section('Articole orfane', r.orphans.map((p) => `- \`${p}\``))
  section(`Articole cu < ${MIN_OUT} linkuri trimise`, r.lowOutbound.map((l) => `- \`${l.path}\`: ${l.out}`))
  section('Ținte duplicate în același articol', r.duplicates.map((d) => `- \`${d.from}\` → \`${d.to}\` (×${d.times})`))
  return lines.join('\n')
}
