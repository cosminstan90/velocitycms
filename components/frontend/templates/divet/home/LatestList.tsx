import Image from 'next/image'
import Link from 'next/link'
import type { HomePost } from '@/lib/home'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-dv-accent'

function shortDate(value: Date | string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })
}

/** Lista compacta "Adaugate recent": link-uri crawlabile, cu miniatura si data. */
export default function LatestList({ posts }: { posts: HomePost[] }) {
  if (posts.length === 0) return null
  return (
    <section aria-labelledby="dv-home-latest" className="border-t border-dv-border py-12 lg:py-16">
      <div className="mb-7">
        <p className="m-0 mb-1 text-dv-label font-semibold tracking-[0.14em] text-dv-warm uppercase">Mereu la zi</p>
        <h2 id="dv-home-latest" className="m-0 font-dv-display text-[28px] leading-tight font-bold tracking-[-0.025em] text-dv-ink sm:text-[34px]">
          Adăugate recent
        </h2>
      </div>
      <ol className="m-0 grid list-none gap-x-10 gap-y-1 p-0 md:grid-cols-2">
        {posts.map((p) => {
          const date = shortDate(p.publishedAt)
          return (
            <li key={p.href} className="border-b border-dv-border">
              <Link href={p.href} className={`group flex items-center gap-4 py-3 ${focusRing}`}>
                <div className="relative size-[56px] shrink-0 overflow-hidden rounded-lg bg-dv-sunken">
                  {p.image ? <Image src={p.image.url} alt="" fill sizes="56px" className="object-cover" /> : null}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-dv-display text-[16px] font-semibold text-dv-ink group-hover:text-dv-accent">{p.shortName}</span>
                  <span className="block truncate text-[12px] text-dv-ink-muted">{[p.groupName, p.subName].filter(Boolean).join(' · ')}</span>
                </div>
                {date ? <time className="shrink-0 text-[12px] font-medium text-dv-ink-subtle">{date}</time> : null}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
