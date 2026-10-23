import Image from 'next/image'
import Link from 'next/link'
import type { HomeGroup } from '@/lib/home'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-dv-accent'

/** Pe desktop grila are 6 coloane: ultimul rand incomplet se intinde, ca sa nu ramana goluri. */
function spanClass(i: number, total: number): string {
  const rest = total % 3
  if (rest === 1 && i === total - 1) return 'lg:col-span-6'
  if (rest === 2 && i >= total - 2) return 'lg:col-span-3'
  return 'lg:col-span-2'
}

function plural(n: number): string {
  return `${n} ${n === 1 ? 'articol' : 'articole'}`
}

/** Placi pe grupuri: fotografie, numar de fise, subcategorii cu numaratori. Linkul principal acopera cardul; chip-urile raman clicabile. */
export default function GroupTiles({ groups }: { groups: HomeGroup[] }) {
  if (groups.length === 0) return null
  return (
    <section aria-labelledby="dv-home-groups" className="py-12 lg:py-16">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="m-0 mb-1 text-dv-label font-semibold tracking-[0.14em] text-dv-warm uppercase">Răsfoiește</p>
          <h2 id="dv-home-groups" className="m-0 font-dv-display text-[28px] leading-tight font-bold tracking-[-0.025em] text-dv-ink sm:text-[34px]">
            Explorează după grup
          </h2>
        </div>
        <Link href="/index-a-z" className={`text-[14px] font-semibold text-dv-accent hover:text-dv-accent-hover ${focusRing}`}>
          Index A–Z →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {groups.map((g, i) => (
          <article
            key={g.id}
            className={`dv-rise group relative flex flex-col overflow-hidden rounded-2xl border border-dv-border bg-dv-surface shadow-dv-lift transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-dv-accent ${spanClass(i, groups.length)}`}
            style={{ ['--d' as string]: Math.min(i, 5) }}
          >
            <div className="relative h-[150px] bg-dv-accent-soft">
              {g.cover ? (
                <Image
                  src={g.cover.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
              ) : null}
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-dv-deep/55 to-transparent" />
              <span className="absolute top-3 right-3 rounded-full bg-dv-warm-soft px-2.5 py-1 text-[12px] font-semibold text-dv-warm">
                {plural(g.count)}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-5">
              <h3 className="m-0 font-dv-display text-[22px] leading-tight font-bold tracking-[-0.02em] text-dv-ink">
                <Link href={g.href} className={`after:absolute after:inset-0 after:content-[''] hover:text-dv-accent ${focusRing}`}>
                  {g.name}
                </Link>
              </h3>
              {g.children.length > 0 ? (
                <ul className="relative z-10 m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
                  {g.children.slice(0, 6).map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        className={`inline-flex items-center gap-1.5 rounded-full border border-dv-border bg-dv-bg px-2.5 py-1 text-[12px] text-dv-ink-muted hover:border-dv-accent hover:text-dv-accent ${focusRing}`}
                      >
                        {c.name}
                        <span className="text-dv-ink-subtle">{c.count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
              <span className="mt-auto pt-5 text-[13px] font-semibold text-dv-accent group-hover:text-dv-accent-hover">
                Vezi toate articolele din {g.name} →
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
