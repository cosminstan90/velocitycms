import Link from 'next/link'
import type { FieldItem } from '@/lib/fields'
import { urgencyLevel, type HealthLink, type UrgencyLevel } from '@/lib/health'

const URGENCY_STYLE: Record<UrgencyLevel, { box: string; label: string; icon: string }> = {
  low: { box: 'border-dv-border bg-dv-accent-soft text-dv-ink', label: 'text-dv-accent', icon: '●' },
  medium: { box: 'border-dv-warm/40 bg-dv-warm-soft text-dv-ink', label: 'text-dv-warm', icon: '▲' },
  high: { box: 'border-dv-alert/40 bg-dv-alert-soft text-dv-ink', label: 'text-dv-alert', icon: '■' },
}

const URGENCY_HINT: Record<UrgencyLevel, string> = {
  low: 'Observă animalul și notează schimbările. Dacă simptomele persistă sau se agravează, mergi la medicul veterinar.',
  medium: 'Programează un consult în următoarele 24–48 de ore, chiar dacă animalul pare să se simtă bine.',
  high: 'Sună acum la cabinetul veterinar sau la o clinică de urgențe. Nu aștepta să treacă de la sine.',
}

/** Caseta „Cât de urgent este?" a articolelor de sanatate. Nivelul vine din campul `urgenta`; fara el nu se afiseaza. */
export function UrgencyBanner({ value }: { value: string | null }) {
  const level = urgencyLevel(value)
  if (!level || !value) return null
  const s = URGENCY_STYLE[level]
  return (
    <section aria-label="Cât de urgent este" className={`rounded-[10px] border px-[22px] py-4 ${s.box}`}>
      <p className={`m-0 text-dv-label font-semibold uppercase ${s.label}`}>
        <span aria-hidden="true">{s.icon} </span>Cât de urgent este
      </p>
      <p className="mt-1 mb-0 text-dv-title font-semibold">{value}</p>
      <p className="mt-1 mb-0 text-dv-body text-dv-ink-muted">{URGENCY_HINT[level]}</p>
    </section>
  )
}

/** Datele scurte ale unui articol de sanatate: specie, contagios, se transmite la om. */
export function HealthFacts({ items }: { items: FieldItem[] }) {
  if (items.length === 0) return null
  return (
    <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.key} className="rounded-lg border border-dv-border bg-dv-surface px-4 py-3">
          <dt className="mb-1 text-dv-label font-semibold uppercase text-dv-ink-muted">{item.label}</dt>
          <dd className="m-0 font-dv-display text-[16px] font-semibold text-dv-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Caseta „Revizuit medical de ...": apare doar cand un recenzent real si data revizuirii sunt setate pe articol. */
export function ReviewedBy({
  reviewer,
  reviewedAt,
}: {
  reviewer: { name: string | null; slug: string | null; title: string | null; credentials: string | null } | null
  reviewedAt: Date | string | null
}) {
  if (!reviewer?.name || !reviewedAt) return null
  const date = new Date(reviewedAt)
  const label = new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
  return (
    <aside aria-label="Revizuire medicală" className="rounded-[10px] border border-dv-border bg-dv-accent-soft px-[22px] py-4 text-dv-body text-dv-ink">
      <p className="m-0">
        <strong>Revizuit medical de{' '}</strong>
        {reviewer.slug ? (
          <Link href={`/autor/${reviewer.slug}`} className="font-semibold text-dv-accent hover:underline">
            {reviewer.name}
          </Link>
        ) : (
          <strong>{reviewer.name}</strong>
        )}
        {reviewer.title ? <span className="text-dv-ink-muted">, {reviewer.title}</span> : null}
        <span className="text-dv-ink-muted">
          {' '}
          · <time dateTime={date.toISOString()}>{label}</time>
        </span>
      </p>
      {reviewer.credentials ? <p className="mt-1 mb-0 text-dv-meta text-dv-ink-muted">{reviewer.credentials}</p> : null}
    </aside>
  )
}

export function MedicalDisclaimer() {
  return (
    <aside
      aria-label="Avertisment medical"
      className="rounded-[10px] border border-dv-border bg-dv-sunken px-[22px] py-4 text-dv-meta text-dv-ink-muted"
    >
      <strong className="text-dv-ink">Informație orientativă.</strong> Articolul nu înlocuiește consultul la un medic
      veterinar și nu stabilește diagnostice sau tratamente. Dacă animalul tău are simptome, sună cabinetul veterinar.
      Sursele folosite sunt linkate în text. Vezi cum lucrăm în{' '}
      <Link href="/politica-editoriala" className="underline hover:text-dv-accent">
        politica editorială
      </Link>
      .
    </aside>
  )
}

/** Lista de linkuri „Rase predispuse" (pe boala) sau „Probleme de sanatate frecvente" (pe rasa). */
export function HealthLinkList({ heading, links }: { heading: string; links: HealthLink[] }) {
  if (links.length === 0) return null
  return (
    <section aria-label={heading} className="rounded-[10px] border border-dv-border bg-dv-surface px-[22px] py-5">
      <h2 className="mb-3 text-dv-label font-semibold uppercase text-dv-accent">{heading}</h2>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-block rounded-full border border-dv-border bg-dv-bg px-3 py-1 text-[13px] hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
            >
              {l.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
