import { useId } from 'react'

export default function TldrCard({ text }: { text: string }) {
  const id = useId()
  if (!text.trim()) return null

  return (
    <section aria-labelledby={id} data-speakable="tldr" className="rounded-[10px] border border-dv-border bg-dv-surface px-[22px] py-5">
      <h2 id={id} className="mb-[9px] text-dv-label font-semibold uppercase text-dv-accent">
        Pe scurt
      </h2>
      <p className="m-0 text-dv-body text-dv-ink">{text}</p>
    </section>
  )
}
