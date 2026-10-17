export default function SearchForm({
  defaultValue = '',
  size = 'md',
  inputId,
}: {
  defaultValue?: string
  size?: 'md' | 'lg'
  inputId: string
}) {
  const height = size === 'lg' ? 'h-[52px] text-[16px]' : 'h-11 text-[15px]'
  const buttonHeight = size === 'lg' ? 'h-[52px]' : 'h-11'

  return (
    <form action="/cautare" method="get" role="search" className="flex w-full max-w-[640px] flex-wrap gap-2">
      <label htmlFor={inputId} className="sr-only">
        Caută în enciclopedie
      </label>
      <input
        id={inputId}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Caută specii, rase, simptome"
        className={`${height} min-w-0 flex-1 basis-56 rounded-[7px] border border-dv-border bg-dv-surface px-4 text-dv-ink placeholder:text-dv-ink-subtle focus-visible:outline-2 focus-visible:outline-dv-accent`}
      />
      <button
        type="submit"
        className={`${buttonHeight} min-w-11 rounded-[7px] bg-dv-accent px-6 font-semibold text-dv-accent-on focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dv-accent`}
      >
        Caută
      </button>
    </form>
  )
}
