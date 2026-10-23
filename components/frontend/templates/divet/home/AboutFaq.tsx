import { HOME_FAQ } from '@/lib/home-content'

/** "Despre DiVet" + intrebari frecvente (details/summary: accesibil fara JS). Aceleasi texte alimenteaza FAQPage JSON-LD. */
export default function AboutFaq() {
  return (
    <section aria-labelledby="dv-home-about" className="border-t border-dv-border py-12 lg:py-16">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div>
          <p className="m-0 mb-1 text-dv-label font-semibold tracking-[0.14em] text-dv-warm uppercase">Despre noi</p>
          <h2 id="dv-home-about" className="m-0 font-dv-display text-[28px] leading-tight font-bold tracking-[-0.025em] text-dv-ink sm:text-[34px]">
            O enciclopedie făcută pentru cititori
          </h2>
          <p className="mt-4 mb-0 max-w-[48ch] text-[15px] leading-[1.7] text-dv-ink-muted">
            DiVet adună într-un singur loc informații clare despre animalele pe care le ținem acasă sau pe care le întâlnim în natură. Scriem în română,
            păstrăm același format în toate fișele și semnalăm când sursele nu se potrivesc, ca să poți compara rapid și să iei decizii informate.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {HOME_FAQ.map((item, i) => (
            <details key={item.question} className="group rounded-xl border border-dv-border bg-dv-surface open:border-dv-accent open:shadow-dv-lift" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-dv-display text-[17px] font-semibold text-dv-ink focus-visible:outline-2 focus-visible:outline-dv-accent [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full bg-dv-accent-soft text-dv-accent transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="m-0 px-5 pb-5 text-[15px] leading-[1.7] text-dv-ink-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
