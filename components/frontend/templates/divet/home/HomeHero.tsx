import Image from 'next/image'
import Link from 'next/link'
import SearchForm from '../SearchForm'
import type { HomeData, HomePost } from '@/lib/home'
import { HOME_INTRO } from '@/lib/home-content'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-dv-accent'

/** Un tile din mozaic: fotografie pe tot cardul, eticheta de grup si numele fisei peste un degrade. */
function MosaicTile({ post, className, priority, sizes }: { post: HomePost; className: string; priority?: boolean; sizes: string }) {
  return (
    <Link
      href={post.href}
      className={`group relative block overflow-hidden rounded-2xl bg-dv-sunken shadow-dv-lift ${focusRing} ${className}`}
    >
      {post.image ? (
        <Image
          src={post.image.url}
          alt={post.image.alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
      ) : null}
      <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-dv-deep/80 via-dv-deep/10 to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
        <span className="block text-[10px] font-semibold tracking-[0.14em] uppercase opacity-80">{post.groupName}</span>
        <span className="block font-dv-display text-[17px] leading-tight font-semibold">{post.shortName}</span>
      </span>
    </Link>
  )
}

export default function HomeHero({ home }: { home: HomeData }) {
  const { mosaic, featured, totalPosts, groups } = home
  const chips = [...featured, ...mosaic].filter((p, i, all) => all.findIndex((q) => q.href === p.href) === i).slice(0, 6)
  const stat =
    totalPosts > 0 ? `${totalPosts} ${totalPosts === 1 ? 'articol' : 'articole'} · ${groups.length} ${groups.length === 1 ? 'grup' : 'grupuri'}` : 'Enciclopedie în construcție'

  return (
    <section className="dv-contour relative">
      <div className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-16">
        <div>
          <p
            className="dv-rise mb-5 inline-flex items-center gap-2 rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[12px] font-semibold tracking-[0.08em] text-dv-ink-muted uppercase"
            style={{ ['--d' as string]: 0 }}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-dv-warm" />
            {stat}
          </p>
          <h1
            className="dv-rise m-0 font-dv-display text-[38px] leading-[1.02] font-bold tracking-[-0.035em] text-balance text-dv-ink sm:text-[58px]"
            style={{ ['--d' as string]: 1 }}
          >
            Enciclopedia animalelor <span className="text-dv-accent">din România</span>
          </h1>
          <p className="dv-rise mt-5 mb-7 max-w-[56ch] text-[17px] leading-[1.65] text-dv-ink-muted" style={{ ['--d' as string]: 2 }}>
            {HOME_INTRO}
          </p>
          <div className="dv-rise" style={{ ['--d' as string]: 3 }}>
            <SearchForm size="lg" inputId="dv-home-q" />
          </div>
          {chips.length > 0 ? (
            <div className="dv-rise mt-5 flex flex-wrap items-center gap-2" style={{ ['--d' as string]: 4 }}>
              <span className="text-[12px] font-semibold tracking-[0.08em] text-dv-ink-subtle uppercase">Începe cu</span>
              {chips.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] font-medium text-dv-ink hover:border-dv-accent hover:text-dv-accent ${focusRing}`}
                >
                  {p.shortName}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {mosaic.length >= 3 ? (
          <>
            {/* Desktop: mozaic asimetric */}
            <div
              className="dv-rise hidden h-[440px] grid-cols-6 grid-rows-[1fr_1fr_1fr] gap-3 lg:grid"
              style={{ ['--d' as string]: 2 }}
            >
              <MosaicTile post={mosaic[0]} priority sizes="(min-width:1024px) 34vw, 100vw" className="col-span-4 row-span-2" />
              <MosaicTile post={mosaic[1]} sizes="18vw" className="col-span-2 row-span-1" />
              <MosaicTile post={mosaic[2]} sizes="18vw" className="col-span-2 row-span-2" />
              {mosaic[3] ? <MosaicTile post={mosaic[3]} sizes="22vw" className="col-span-2 row-span-1" /> : null}
              {mosaic[4] ? <MosaicTile post={mosaic[4]} sizes="22vw" className="col-span-2 row-span-1" /> : null}
            </div>
            {/* Mobil: bandă derulabilă */}
            <div className="dv-scrollx dv-rise -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:hidden" style={{ ['--d' as string]: 3 }}>
              {mosaic.map((p, i) => (
                <MosaicTile key={p.href} post={p} priority={i === 0} sizes="70vw" className="h-[210px] w-[68vw] max-w-[300px] shrink-0 snap-start" />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
