import Image from 'next/image'
import Link from 'next/link'

export type ArticleCardProps = {
  href: string
  title: string
  kicker?: string | null
  meta?: string | null
  image?: { url: string; alt: string } | null
}

export default function ArticleCard({ href, title, kicker, meta, image }: ArticleCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[9px] border border-dv-border bg-dv-surface hover:border-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
    >
      <div className="relative h-[108px] bg-dv-sunken">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : null}
      </div>
      <div className="px-[15px] pt-[13px] pb-[15px]">
        {kicker ? (
          <div className="mb-1 text-dv-label font-semibold uppercase text-dv-accent">{kicker}</div>
        ) : null}
        <h3 className="m-0 line-clamp-3 font-dv-display text-dv-title text-dv-ink group-hover:text-dv-accent">
          {title}
        </h3>
        {meta ? <div className="mt-1.5 text-[12px] text-dv-ink-muted">{meta}</div> : null}
      </div>
    </Link>
  )
}
