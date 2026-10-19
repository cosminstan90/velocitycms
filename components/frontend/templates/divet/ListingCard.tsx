import Link from 'next/link'

export type ListingCardProps = {
  href: string
  name: string
  kicker: string
  location: string
  phone: string | null
  services: string[]
}

export default function ListingCard({ href, name, kicker, location, phone, services }: ListingCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-[9px] border border-dv-border bg-dv-surface px-[15px] py-[14px] hover:border-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
    >
      <div className="mb-1 text-dv-label font-semibold uppercase text-dv-accent">{kicker}</div>
      <h3 className="m-0 font-dv-display text-dv-title text-dv-ink group-hover:text-dv-accent">{name}</h3>
      <div className="mt-1.5 text-[13px] text-dv-ink-muted">{location}</div>
      {phone ? <div className="mt-1 text-[13px] text-dv-ink">{phone}</div> : null}
      {services.length > 0 ? (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
          {services.slice(0, 4).map((s) => (
            <li key={s} className="rounded-full bg-dv-sunken px-2.5 py-0.5 text-[12px] text-dv-ink-muted">
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  )
}
