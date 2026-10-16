/**
 * DiVet — ArticleTemplate
 *
 * Layout:
 *  1. Scroll progress bar (fixed, sub nav, gradient verde→auriu)
 *  2. Hero image 480px full-width
 *  3. Breadcrumb + titlu + metadata
 *  4. TL;DR strip verde (dacă există câmpul custom `tldr`)
 *  5. Fișă Tehnică dinamică (toate celelalte câmpuri custom, orice animal)
 *  6. Conținut centrat max-width 800px cu font Lora
 *     - TOC interactiv (≥3 H2)
 *     - Articol
 *     - Bloc autor + meta (publicat, actualizat, timp citire)
 *  7. Related posts grid 4col (2col mobil)
 *
 * Custom fields:
 *  - `tldr` (TEXTAREA)   → afișat ca strip verde rezumat deasupra conținutului
 *  - orice alt câmp      → afișat în Fișa Tehnică (grid 2col, dinamic, orice animal)
 */

import Image from 'next/image'
import Link from 'next/link'
import DivetLayout, { LEAF_PATTERN_SVG } from './DivetLayout'
import DivetProgressBar from './DivetProgressBar'
import DivetToc from './DivetToc'
import { resolveImageUrl, getPostUrl, formatDateLong, getReadingTime, getAuthorInitials, slugify } from '../fauna/utils'

const FOREST     = '#1a2e1c'
const FOREST_MID = '#2a4d2e'
const MOSS       = '#4a8a4a'
const CREAM      = '#f6f1e6'
const CREAM_WARM = '#ede6d3'
const GOLD       = '#c4893a'
const GOLD_LIGHT = '#e8b86a'
const TEXT       = '#1a1e16'
const TEXT_MUTED = '#6b7a65'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldValueItem {
  fieldDefinitionId: string
  value: string
  fieldDefinition: {
    fieldKey: string
    fieldLabel: string
    fieldType: string
  }
}

interface ArticleTemplateProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    contentHtml: string
    metaTitle: string | null
    publishedAt: Date | string | null
    updatedAt: Date | string
    author: {
      name: string | null
      email: string
      slug?: string | null
      title?: string | null
      bio?: string | null
      photo?: string | null
      website?: string | null
    } | null
    category: { name: string; slug: string } | null
    featuredImage: { url: string; width: number | null; height: number | null; altText: string | null } | null
    tags: Array<{ tag: { id: string; name: string; slug: string } }>
  }
  relatedPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: { url: string; altText: string | null } | null
    category: { name: string; slug: string } | null
  }>
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  subCategory?: { name: string; slug: string } | null
  breadcrumbExtra?: { name: string; href: string }[]
  seoSettings?: { siteName?: string; defaultOgImage?: string | null; defaultMetaDesc?: string | null } | null
  fieldValues?: FieldValueItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TocEntry { text: string; id: string }

function extractH2s(html: string): TocEntry[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const entries: TocEntry[] = []
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text) entries.push({ text, id: slugify(text) })
  }
  return entries
}

function injectH2Ids(html: string): string {
  return html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_, attrs, inner) => {
    if (attrs.includes('id=')) return `<h2${attrs}>${inner}</h2>`
    const id = slugify(inner.replace(/<[^>]+>/g, '').trim())
    return `<h2${attrs} id="${id}">${inner}</h2>`
  })
}

/** Formatează o valoare boolean/text pentru afișare */
function formatFieldValue(value: string, type: string): string {
  if (type === 'BOOLEAN') return value === 'true' ? 'Da' : 'Nu'
  return value
}

// ─── TL;DR Strip ─────────────────────────────────────────────────────────────

function TldrStrip({ text }: { text: string }) {
  return (
    <section
      className="my-8 rounded-2xl overflow-hidden"
      style={{ backgroundColor: FOREST, border: `1px solid rgba(246,241,230,0.08)` }}
    >
      <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: `1px solid rgba(246,241,230,0.1)` }}>
        <span className="text-lg" aria-hidden="true">⚡</span>
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: GOLD_LIGHT }}
        >
          Pe scurt / TL;DR
        </span>
      </div>
      <div className="px-6 py-5">
        <p
          className="text-sm leading-relaxed"
          style={{ color: CREAM, fontFamily: '"Lora", Georgia, serif', lineHeight: 1.8 }}
        >
          {text}
        </p>
      </div>
    </section>
  )
}

// ─── Smart field renderers ────────────────────────────────────────────────────

const ENERGY_MAP: Record<string, number> = {
  'Scăzut': 1, 'scăzut': 1,
  'Mediu': 2, 'mediu': 2,
  'Ridicat': 3, 'ridicat': 3,
  'Foarte ridicat': 4, 'foarte ridicat': 4,
  'Foarte Ridicat': 4,
}

const IUCN_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  LC: { bg: '#4caf50', text: '#fff', label: 'Least Concern' },
  NT: { bg: '#8bc34a', text: '#fff', label: 'Near Threatened' },
  VU: { bg: '#ff9800', text: '#fff', label: 'Vulnerable' },
  EN: { bg: '#f44336', text: '#fff', label: 'Endangered' },
  CR: { bg: '#b71c1c', text: '#fff', label: 'Critically Endangered' },
  EW: { bg: '#212121', text: '#fff', label: 'Extinct in Wild' },
  EX: { bg: '#000', text: '#fff', label: 'Extinct' },
  DD: { bg: '#9e9e9e', text: '#fff', label: 'Data Deficient' },
  NE: { bg: '#bdbdbd', text: '#333', label: 'Not Evaluated' },
}

const SIZE_CATEGORIES = ['Mic', 'Mediu', 'Mare', 'Variabil'] as const

function TemperamentPills({ value }: { value: string }) {
  const traits = value.split(',').map((t) => t.trim()).filter(Boolean)
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {traits.map((trait) => (
        <span
          key={trait}
          className="px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: CREAM_WARM, color: FOREST, border: `1px solid rgba(26,46,28,0.15)` }}
        >
          {trait}
        </span>
      ))}
    </div>
  )
}

function DotScale({ value, max = 5 }: { value: string; max?: number }) {
  const normalized = value.trim()
  const filled = ENERGY_MAP[normalized] ?? Math.min(Math.max(parseInt(normalized, 10) || 0, 0), max)
  return (
    <div className="flex items-center gap-1.5 mt-1">
      {Array.from({ length: max }, (_, i) => (
        <span
          key={i}
          className="w-3 h-3 rounded-full inline-block"
          style={{ backgroundColor: i < filled ? MOSS : CREAM_WARM, border: `1.5px solid ${i < filled ? MOSS : 'rgba(26,46,28,0.2)'}` }}
          aria-hidden="true"
        />
      ))}
      <span className="text-xs ml-1" style={{ color: TEXT_MUTED }}>{normalized}</span>
    </div>
  )
}

function BoolBadge({ value }: { value: string }) {
  const positive = ['da', 'yes', 'true', '1'].includes(value.toLowerCase().trim())
  return (
    <span className="text-lg" title={value} aria-label={positive ? 'Da' : 'Nu'}>
      {positive ? '✅' : '❌'}
    </span>
  )
}

function IucnBadge({ value }: { value: string }) {
  const code = value.trim().toUpperCase()
  const meta = IUCN_COLORS[code]
  if (!meta) return <span className="text-sm font-semibold" style={{ color: TEXT }}>{value}</span>
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{ backgroundColor: meta.bg, color: meta.text }}
      title={meta.label}
    >
      {code}
      <span className="font-normal opacity-80 normal-case tracking-normal">— {meta.label}</span>
    </span>
  )
}

function SizeScale({ value }: { value: string }) {
  const normalized = value.trim()
  const active = SIZE_CATEGORIES.find((s) => s.toLowerCase() === normalized.toLowerCase()) ?? normalized
  const heights = [24, 36, 48, 32] // visual bar heights for Mic, Mediu, Mare, Variabil
  return (
    <div className="flex items-end gap-2 mt-1">
      {SIZE_CATEGORIES.map((cat, i) => {
        const isActive = cat.toLowerCase() === active.toLowerCase()
        return (
          <div key={cat} className="flex flex-col items-center gap-1">
            <div
              className="w-8 rounded-t-md transition-colors"
              style={{
                height: heights[i],
                backgroundColor: isActive ? FOREST : CREAM_WARM,
                border: `1.5px solid ${isActive ? FOREST : 'rgba(26,46,28,0.15)'}`,
              }}
              aria-hidden="true"
            />
            <span
              className="text-[10px] font-semibold"
              style={{ color: isActive ? FOREST : TEXT_MUTED }}
            >
              {cat}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function FieldValueRenderer({ fv }: { fv: FieldValueItem }) {
  const key = fv.fieldDefinition.fieldKey
  const val = fv.value

  if (key === 'temperament') return <TemperamentPills value={val} />
  if (key === 'nivel_energie' || key === 'ingrijire_blana') return <DotScale value={val} />
  if (key === 'bun_cu_copiii') return <BoolBadge value={val} />
  if (key === 'statut_conservare') return <IucnBadge value={val} />
  if (key === 'talie') return (
    <>
      <span className="text-sm font-semibold" style={{ color: TEXT }}>{val}</span>
      <SizeScale value={val} />
    </>
  )

  return <span className="text-sm font-semibold" style={{ color: TEXT }}>{formatFieldValue(val, fv.fieldDefinition.fieldType)}</span>
}

// ─── Fișă Tehnică ─────────────────────────────────────────────────────────────

function FisaTehnica({ fields }: { fields: FieldValueItem[] }) {
  if (!fields.length) return null
  return (
    <section
      className="my-8 rounded-2xl overflow-hidden"
      style={{ border: `1px solid rgba(26,46,28,0.1)`, backgroundColor: 'white' }}
    >
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ backgroundColor: CREAM_WARM, borderBottom: `1px solid rgba(26,46,28,0.08)` }}
      >
        <span className="text-lg" aria-hidden="true">📋</span>
        <span
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: FOREST }}
        >
          Fișă Tehnică
        </span>
      </div>

      {/* Grid dinamic — 2 coloane pe desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2">
        {fields.map((fv, i) => {
          const isLeft    = i % 2 === 0
          const isLastRow = i >= fields.length - (fields.length % 2 === 0 ? 2 : 1)
          const isLast    = i === fields.length - 1
          return (
            <div
              key={fv.fieldDefinitionId}
              className="px-6 py-4"
              style={{
                borderRight: isLeft ? `1px solid ${CREAM_WARM}` : 'none',
                borderBottom: isLastRow && !(fields.length % 2 !== 0 && isLast) ? 'none' : `1px solid ${CREAM_WARM}`,
              }}
            >
              <dt
                className="text-[11px] font-bold uppercase tracking-widest mb-1"
                style={{ color: TEXT_MUTED }}
              >
                {fv.fieldDefinition.fieldLabel}
              </dt>
              <dd style={{ fontFamily: '"DM Sans", sans-serif' }}>
                <FieldValueRenderer fv={fv} />
              </dd>
            </div>
          )
        })}
        {/* Celulă goală dacă număr impar (menține grid-ul) */}
        {fields.length % 2 !== 0 && (
          <div className="px-6 py-4" style={{ backgroundColor: 'transparent' }} aria-hidden="true" />
        )}
      </div>
    </section>
  )
}

// ─── Related post card ────────────────────────────────────────────────────────

function RelatedCard({ post, siteUrl }: { post: ArticleTemplateProps['relatedPosts'][number]; siteUrl: string }) {
  const url = getPostUrl(post)
  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden transition-shadow duration-300"
      style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(26,46,28,0.08)', border: '1px solid rgba(26,46,28,0.06)' }}
    >
      <Link href={url} className="relative block overflow-hidden flex-shrink-0" style={{ aspectRatio: '4/3', backgroundColor: CREAM_WARM }}>
        {post.featuredImage ? (
          <Image
            src={resolveImageUrl(post.featuredImage.url, siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🐾</div>
        )}
      </Link>
      <div className="p-4">
        {post.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            {post.category.name}
          </span>
        )}
        <h3
          className="mt-1 text-sm font-bold leading-snug line-clamp-2 group-hover:opacity-70 transition-opacity"
          style={{ color: TEXT, fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          <Link href={url}>{post.title}</Link>
        </h3>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DivetArticleTemplate({
  post,
  relatedPosts,
  site,
  categories = [],
  subCategory,
  breadcrumbExtra,
  seoSettings,
  fieldValues = [],
}: ArticleTemplateProps) {
  const readingTime = getReadingTime(post.contentHtml)
  const tocEntries  = extractH2s(post.contentHtml)
  const contentHtml = injectH2Ids(post.contentHtml)
  const initials    = getAuthorInitials(post.author?.name ?? null, post.author?.email ?? 'A')

  // Separă câmpurile: `tldr` → strip, restul → Fișă Tehnică
  const tldrField  = fieldValues.find((fv) => fv.fieldDefinition.fieldKey === 'tldr')
  const fisaFields = fieldValues.filter(
    (fv) => fv.fieldDefinition.fieldKey !== 'tldr' && fv.value.trim() !== ''
  )

  return (
    <DivetLayout site={site} categories={categories} activeCategory={post.category?.slug} seoSettings={seoSettings}>

      {/* Progress bar */}
      <DivetProgressBar />

      {/* ══ HERO IMAGE ═══════════════════════════════════════════════════════ */}
      {post.featuredImage && (
        <div className="relative w-full overflow-hidden" style={{ height: '480px', backgroundColor: FOREST }}>
          <Image
            src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(26,46,28,0.55) 100%)' }} />
        </div>
      )}

      {/* ══ ARTICLE HEADER ═══════════════════════════════════════════════════ */}
      <div className="max-w-[800px] mx-auto px-5 pt-10">

        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-2 mb-6 text-sm" style={{ color: TEXT_MUTED }} aria-label="Breadcrumb">
          <Link href="/" style={{ color: TEXT_MUTED }} className="hover:underline">Acasă</Link>
          <span aria-hidden="true">›</span>
          {post.category && (
            <>
              <Link href={`/${post.category.slug}`} style={{ color: TEXT_MUTED }} className="hover:underline">
                {post.category.name}
              </Link>
              <span aria-hidden="true">›</span>
            </>
          )}
          {subCategory && post.category && (
            <>
              <Link href={`/${post.category.slug}/${subCategory.slug}`} style={{ color: TEXT_MUTED }} className="hover:underline">
                {subCategory.name}
              </Link>
              <span aria-hidden="true">›</span>
            </>
          )}
          {breadcrumbExtra?.map((b) => (
            <span key={b.href} className="contents">
              <Link href={b.href} style={{ color: TEXT_MUTED }} className="hover:underline">{b.name}</Link>
              <span aria-hidden="true">›</span>
            </span>
          ))}
          <span style={{ color: TEXT }} className="truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* Category badge */}
        {post.category && (
          <Link
            href={`/${post.category.slug}`}
            className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-4"
            style={{ backgroundColor: GOLD, color: 'white' }}
          >
            {post.category.name}
          </Link>
        )}

        {/* Title */}
        <h1
          className="mb-6 leading-[1.15]"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 700,
            color: TEXT,
          }}
        >
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mb-8 text-lg leading-relaxed" style={{ color: TEXT_MUTED, fontFamily: '"Lora", Georgia, serif' }}>
            {post.excerpt}
          </p>
        )}

        {/* Author + meta byline */}
        <div className="flex items-center gap-4 pb-8" style={{ borderBottom: `2px solid ${CREAM_WARM}` }}>
          {post.author?.photo ? (
            <div className="flex-shrink-0 relative w-12 h-12 rounded-full overflow-hidden" style={{ border: `2px solid ${CREAM_WARM}` }}>
              <Image src={resolveImageUrl(post.author.photo, site.siteUrl)} fill alt={post.author.name ?? ''} className="object-cover" sizes="48px" />
            </div>
          ) : (
            <div
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: FOREST, color: CREAM }}
              aria-hidden="true"
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {post.author?.name && (
              <p className="text-sm font-semibold" style={{ color: TEXT }}>
                {post.author.name}
                {post.author.title && (
                  <span className="font-normal ml-1" style={{ color: TEXT_MUTED }}>· {post.author.title}</span>
                )}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
              {post.publishedAt && (
                <time dateTime={new Date(post.publishedAt).toISOString()}>
                  {formatDateLong(post.publishedAt)}
                </time>
              )}
              <span aria-hidden="true">·</span>
              <span>{readingTime} min citire</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ TL;DR + FIȘĂ TEHNICĂ ═════════════════════════════════════════════ */}
      <div className="max-w-[800px] mx-auto px-5">
        {tldrField && <TldrStrip text={tldrField.value} />}
        {fisaFields.length > 0 && <FisaTehnica fields={fisaFields} />}
      </div>

      {/* ══ CONTENT ══════════════════════════════════════════════════════════ */}
      <div className="max-w-[800px] mx-auto px-5 py-8">

        {/* TOC */}
        {tocEntries.length >= 3 && <DivetToc entries={tocEntries} />}

        {/* Article body */}
        <div
          className="divet-prose"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
          style={{ color: TEXT }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-10 pt-8 flex flex-wrap gap-2" style={{ borderTop: `1px solid ${CREAM_WARM}` }}>
            <span className="text-xs font-bold uppercase tracking-widest mr-2 self-center" style={{ color: TEXT_MUTED }}>
              Etichete:
            </span>
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/eticheta/${tag.slug}`}
                className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                style={{ backgroundColor: CREAM_WARM, color: FOREST, border: `1px solid rgba(26,46,28,0.12)` }}
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Author bio block */}
        {post.author && (
          <div className="mt-10 p-6 rounded-2xl" style={{ backgroundColor: CREAM_WARM, border: `1px solid rgba(26,46,28,0.08)` }}>
            <div className="flex items-start gap-4 mb-4">
              {post.author.photo ? (
                <div className="flex-shrink-0 relative w-14 h-14 rounded-full overflow-hidden">
                  <Image src={resolveImageUrl(post.author.photo, site.siteUrl)} fill alt={post.author.name ?? ''} className="object-cover" sizes="56px" />
                </div>
              ) : (
                <div
                  className="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center text-base font-bold"
                  style={{ backgroundColor: FOREST, color: CREAM }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: TEXT, fontFamily: '"Playfair Display", Georgia, serif' }}>
                  {post.author.name}
                </p>
                {post.author.title && (
                  <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>{post.author.title}</p>
                )}
              </div>
            </div>
            {post.author.bio && (
              <p className="text-sm leading-relaxed" style={{ color: TEXT_MUTED, fontFamily: '"Lora", Georgia, serif' }}>
                {post.author.bio}
              </p>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-5" style={{ borderTop: `1px solid rgba(26,46,28,0.1)` }}>
              {post.publishedAt && (
                <div className="text-center">
                  <div className="text-xl mb-1" aria-hidden="true">📅</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: TEXT_MUTED }}>Publicat</div>
                  <div className="text-xs font-semibold" style={{ color: TEXT }}>
                    {new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(post.publishedAt))}
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-xl mb-1" aria-hidden="true">🔄</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: TEXT_MUTED }}>Actualizat</div>
                <div className="text-xs font-semibold" style={{ color: TEXT }}>
                  {new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(post.updatedAt))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl mb-1" aria-hidden="true">⏱️</div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: TEXT_MUTED }}>Timp citire</div>
                <div className="text-xs font-semibold" style={{ color: TEXT }}>{readingTime} minute</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prose styles */}
      <style>{`
        .divet-prose { font-family: "Lora", Georgia, serif; font-size: 16px; line-height: 1.8; }
        .divet-prose h2 { font-family: "Playfair Display", Georgia, serif; font-size: 26px; font-weight: 700; color: ${TEXT}; margin: 2em 0 0.75em; line-height: 1.25; scroll-margin-top: 72px; }
        .divet-prose h3 { font-family: "Playfair Display", Georgia, serif; font-size: 20px; font-weight: 600; color: ${TEXT}; margin: 1.5em 0 0.5em; }
        .divet-prose p  { margin: 0 0 1.25em; color: ${TEXT}; }
        .divet-prose a  { color: ${MOSS}; text-decoration: underline; text-decoration-color: rgba(74,138,74,0.3); text-underline-offset: 3px; }
        .divet-prose a:hover { color: ${FOREST}; }
        .divet-prose ul, .divet-prose ol { margin: 0 0 1.25em 1.5em; }
        .divet-prose li { margin: 0.35em 0; }
        .divet-prose blockquote { margin: 1.5em 0; padding: 1em 1.5em; border-left: 4px solid ${MOSS}; background: ${CREAM_WARM}; border-radius: 0 12px 12px 0; font-style: italic; color: ${TEXT_MUTED}; }
        .divet-prose img { border-radius: 12px; width: 100%; height: auto; margin: 1.5em 0; }
        .divet-prose strong { font-weight: 600; color: ${TEXT}; }
        .divet-prose table { width: 100%; border-collapse: collapse; margin: 1.5em 0; font-size: 14px; }
        .divet-prose th { padding: 10px 16px; text-align: left; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; background: ${CREAM_WARM}; color: ${TEXT}; }
        .divet-prose td { padding: 10px 16px; border-bottom: 1px solid ${CREAM_WARM}; color: ${TEXT}; }
        .divet-prose tr:last-child td { border-bottom: none; }
      `}</style>

      {/* ══ RELATED POSTS ════════════════════════════════════════════════════ */}
      {relatedPosts.length > 0 && (
        <section style={{ backgroundColor: CREAM_WARM, padding: '60px 0' }}>
          <div className="max-w-[1200px] mx-auto px-5">
            <h2
              className="text-2xl font-bold mb-8"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}
            >
              Animale asemănătoare
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedPosts.slice(0, 4).map((p) => (
                <RelatedCard key={p.id} post={p} siteUrl={site.siteUrl} />
              ))}
            </div>
          </div>
        </section>
      )}

    </DivetLayout>
  )
}
