import Link from 'next/link'
import type { NavGroup, GroupPost } from '@/lib/navigation'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-dv-accent'

function chunkEvenly<T>(items: T[], parts: number): T[][] {
  const size = Math.ceil(items.length / parts)
  if (size === 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

export default function DivetMegaPanel({
  group,
  recentPosts,
  id,
}: {
  group: NavGroup
  recentPosts: GroupPost[]
  id: string
}) {
  const columns = chunkEvenly(group.children, 3)

  return (
    <div id={id} role="region" aria-label={`Meniu ${group.name}`}>
      <div className="grid gap-7 lg:grid-cols-[repeat(4,minmax(0,1fr))_230px]">
        <div>
          <p className="mb-3 text-dv-label uppercase font-semibold text-dv-ink-muted">Cele mai noi</p>
          {recentPosts.length > 0 ? (
            <ul className="space-y-2">
              {recentPosts.map((post) => (
                <li key={post.href}>
                  <Link href={post.href} className={`text-[14px] text-dv-ink hover:text-dv-accent ${focusRing}`}>
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-dv-ink-muted">Încă nu avem articole în această secțiune.</p>
          )}
          <Link
            href={group.href}
            className={`mt-4 inline-block text-[13px] font-semibold text-dv-accent hover:text-dv-accent-hover ${focusRing}`}
          >
            Toate din {group.name} →
          </Link>
        </div>

        {columns.map((chunk, i) => (
          <div key={i}>
            {i === 0 && (
              <p className="mb-3 text-dv-label uppercase font-semibold text-dv-ink-muted">Subcategorii</p>
            )}
            <ul className="space-y-2">
              {chunk.map((child) => (
                <li key={child.id}>
                  <Link href={child.href} className={`text-[14px] text-dv-ink hover:text-dv-accent ${focusRing}`}>
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="self-start rounded-[9px] bg-dv-accent-soft p-[18px]">
          <p className="text-dv-label uppercase font-semibold text-dv-accent">Nu găsești ce cauți?</p>
          <p className="mb-4 mt-2 font-dv-display text-[17px] font-semibold text-dv-ink">
            Răsfoiește toate articolele în ordine alfabetică
          </p>
          <Link
            href="/index-a-z"
            className={`block rounded-md bg-dv-accent px-3 py-2 text-center text-[13px] font-semibold text-dv-accent-on ${focusRing}`}
          >
            Deschide indexul
          </Link>
        </div>
      </div>
    </div>
  )
}
