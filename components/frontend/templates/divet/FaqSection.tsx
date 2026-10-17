/**
 * DiVet — FaqSection
 *
 * Server component, fara JS: acordeon nativ <details>. Text simplu (React escapeaza).
 * Elementele vin din contentJson (lib/faq.ts), aceeasi sursa ca JSON-LD FAQPage.
 */

import { useId } from 'react'
import type { FaqItem } from '@/lib/faq'

export default function FaqSection({ items }: { items: FaqItem[] }) {
  const id = useId()
  if (items.length === 0) return null

  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="mb-3 font-dv-display text-dv-heading-m font-semibold tracking-tight text-dv-ink">
        Întrebări frecvente
      </h2>
      <div>
        {items.map((item, i) => (
          <details key={i} className="group border-b border-dv-border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-3 font-semibold text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent [&::-webkit-details-marker]:hidden">
              <span>{item.question}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 shrink-0 text-dv-ink-subtle transition-transform group-open:rotate-180"
              >
                <path d="M5 8l5 5 5-5" />
              </svg>
            </summary>
            <p className="pb-4 text-dv-body text-dv-ink-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
