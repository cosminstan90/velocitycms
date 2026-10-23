import Image from 'next/image'
import Link from 'next/link'
import type { HomePost } from '@/lib/home'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-dv-accent'

function kicker(p: HomePost): string {
  return [p.groupName, p.subName].filter(Boolean).join(' · ')
}

/** Fise recomandate: una mare, cu rezumat, si patru compacte, cate una pe grup (diversitate). */
export default function FeaturedSection({ posts }: { posts: HomePost[] }) {
  if (posts.length === 0) return null
  const [lead, ...rest] = posts
  return (
    <section aria-labelledby="dv-home-featured" className="border-t border-dv-border py-12 lg:py-16">
      <div className="mb-7">
        <p className="m-0 mb-1 text-dv-label font-semibold tracking-[0.14em] text-dv-warm uppercase">Alegerea redacției</p>
        <h2 id="dv-home-featured" className="m-0 font-dv-display text-[28px] leading-tight font-bold tracking-[-0.025em] text-dv-ink sm:text-[34px]">
          Fișe recomandate
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Link
          href={lead.href}
          className={`group flex flex-col overflow-hidden rounded-2xl border border-dv-border bg-dv-surface shadow-dv-lift hover:border-dv-accent lg:col-span-7 ${focusRing}`}
        >
          <div className="relative aspect-[16/10] bg-dv-sunken">
            {lead.image ? (
              <Image
                src={lead.image.url}
                alt={lead.image.alt}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : null}
          </div>
          <div className="p-6">
            <p className="m-0 mb-2 text-dv-label font-semibold tracking-[0.14em] text-dv-accent uppercase">{kicker(lead)}</p>
            <h3 className="m-0 font-dv-display text-[28px] leading-[1.1] font-bold tracking-[-0.025em] text-dv-ink group-hover:text-dv-accent">
              {lead.shortName}
            </h3>
            {lead.tldr ? <p className="mt-3 mb-0 line-clamp-3 max-w-[62ch] text-[15px] leading-[1.65] text-dv-ink-muted">{lead.tldr}</p> : null}
            {lead.meta ? (
              <p className="mt-4 mb-0 inline-block rounded-full bg-dv-accent-soft px-3 py-1 text-[12px] font-semibold text-dv-accent">{lead.meta}</p>
            ) : null}
          </div>
        </Link>

        <ul className="m-0 flex list-none flex-col gap-4 p-0 lg:col-span-5 lg:justify-between">
          {rest.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className={`group flex gap-4 overflow-hidden rounded-2xl border border-dv-border bg-dv-surface p-3 hover:border-dv-accent ${focusRing}`}
              >
                <div className="relative size-[92px] shrink-0 overflow-hidden rounded-xl bg-dv-sunken">
                  {p.image ? (
                    <Image src={p.image.url} alt="" fill sizes="92px" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" />
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-col justify-center">
                  <span className="mb-1 text-dv-label font-semibold tracking-[0.14em] text-dv-accent uppercase">{kicker(p)}</span>
                  <span className="font-dv-display text-[18px] leading-tight font-semibold text-dv-ink group-hover:text-dv-accent">{p.shortName}</span>
                  {p.meta ? <span className="mt-1 text-[12px] text-dv-ink-muted">{p.meta}</span> : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
