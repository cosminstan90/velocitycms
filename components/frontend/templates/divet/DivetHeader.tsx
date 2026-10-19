import Link from 'next/link'

export default function DivetHeader({ siteName, showSearch = true }: { siteName: string; showSearch?: boolean }) {
  return (
    <header className="bg-dv-surface border-b border-dv-border px-4 md:px-10">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3 md:h-[62px] md:py-0">
        <Link
          href="/"
          className="font-dv-display text-[23px] font-bold tracking-tight text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
        >
          {siteName}
        </Link>

        {showSearch ? (
          <form
            action="/cautare"
            method="get"
            role="search"
            className="order-last w-full md:order-none md:w-auto md:max-w-[520px] md:flex-1"
          >
            <label htmlFor="dv-q" className="sr-only">Caută în enciclopedie</label>
            <div className="relative">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-dv-ink-subtle"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                id="dv-q"
                name="q"
                type="search"
                placeholder="Caută specii, rase, simptome"
                className="h-10 w-full rounded-[7px] border border-dv-border bg-dv-sunken pl-9 pr-3 text-dv-body text-dv-ink placeholder:text-dv-ink-subtle focus-visible:outline-2 focus-visible:outline-dv-accent"
              />
            </div>
          </form>
        ) : null}

        <Link
          href="/index-a-z"
          className="ml-auto text-[13px] font-semibold text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent"
        >
          Index A–Z
        </Link>
      </div>
    </header>
  )
}
