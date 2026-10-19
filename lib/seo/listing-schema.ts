import {
  DAYS,
  TYPE_LABEL,
  cityListPath,
  listingPath,
  parseOpeningHours,
  typeListPath,
  type ListingType,
} from '@/lib/listings'

export interface ListingSchemaInput {
  type: ListingType
  name: string
  slug: string
  citySlug: string
  city: string
  county: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  lat: number | null
  lng: number | null
  openingHours: unknown
}

const SCHEMA_DAY = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
} as const

/** [afacerea locala, BreadcrumbList]; fara aggregateRating (nu exista recenzii). */
export function generateListingSchema(l: ListingSchemaInput, siteUrl: string): Record<string, unknown>[] {
  const base = siteUrl.replace(/\/$/, '')
  const url = `${base}${listingPath(l)}`

  const business: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': l.type === 'VET' ? 'VeterinaryCare' : 'LocalBusiness',
    '@id': url,
    url,
    name: l.name,
    address: {
      '@type': 'PostalAddress',
      ...(l.address && { streetAddress: l.address }),
      addressLocality: l.city,
      addressRegion: l.county,
      addressCountry: 'RO',
    },
  }
  if (l.description) business.description = l.description
  if (l.phone) business.telephone = l.phone
  if (l.email) business.email = l.email
  if (l.website && /^https?:\/\//i.test(l.website)) business.sameAs = [l.website]
  if (l.lat !== null && l.lng !== null) {
    business.geo = { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng }
  }

  const hours = parseOpeningHours(l.openingHours)
  if (hours.ok) {
    const specs = DAYS.flatMap((day) =>
      hours.value[day].map((i) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAY[day],
        opens: i.from,
        closes: i.to,
      })),
    )
    if (specs.length > 0) business.openingHoursSpecification = specs
  }

  const crumbs = [
    { name: 'Acasă', item: `${base}/` },
    { name: 'Director', item: `${base}/director` },
    { name: TYPE_LABEL[l.type].plural, item: `${base}${typeListPath(l.type)}` },
    { name: l.city, item: `${base}${cityListPath(l.type, l.citySlug)}` },
    { name: l.name, item: url },
  ]
  const breadcrumb: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
  }

  return [business, breadcrumb]
}
