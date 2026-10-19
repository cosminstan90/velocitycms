import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedListing, getRelatedArticles, loadDirectorySite } from '@/lib/director'
import { TYPE_LABEL, listingPath, typeFromSegment } from '@/lib/listings'
import { generateListingSchema } from '@/lib/seo/listing-schema'
import ListingTemplate from '@/components/frontend/templates/divet/ListingTemplate'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ type: string; city: string; slug: string }> }

async function load(params: Props['params']) {
  const { type: segment, city: citySlug, slug } = await params
  const type = typeFromSegment(segment)
  if (!type) return null
  const ctx = await loadDirectorySite()
  if (!ctx) return null
  const listing = await getPublishedListing({ siteId: ctx.site.id, type, citySlug, slug })
  if (!listing) return null
  return { ctx, type, listing }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params)
  if (!data) return {}
  const { ctx, type, listing } = data
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  const fallback = `${TYPE_LABEL[type].singular} în ${listing.city}: date de contact, program și servicii.`
  return {
    title: `${listing.name} – ${TYPE_LABEL[type].singular} în ${listing.city} | ${ctx.siteData.siteName}`,
    description: (listing.description ?? fallback).slice(0, 155),
    alternates: { canonical: `${base}${listingPath(listing)}` },
  }
}

export default async function ListingPage({ params }: Props) {
  const data = await load(params)
  if (!data) notFound()
  const { ctx, type, listing } = data

  const related = await getRelatedArticles(ctx.site.id, type, ctx.siteData.siteUrl)
  const schemas = generateListingSchema(listing, ctx.siteData.siteUrl)

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
      ))}
      <ListingTemplate
        site={ctx.siteData}
        listing={{ ...listing, services: listing.services.map((s) => s.service.name) }}
        related={related}
      />
    </>
  )
}
