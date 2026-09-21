interface ChipGroupProps<T extends string | number> {
  label: string
  options: readonly { value: T; label: string; title?: string }[]
  selected: readonly T[]
  onChange: (next: T[]) => void
  /** Optional "all" chip when nothing is selected. */
  allLabel?: string
}

/** Multi-select toggle chips; an empty selection means "everything". */
export function ChipGroup<T extends string | number>({ label, options, selected, onChange, allLabel = 'all' }: ChipGroupProps<T>) {
  const toggle = (value: T) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }
  return (
    <div className="filter-block" role="group" aria-label={label}>
      <div className="filter-block__label">{label}</div>
      <div className="chip-group">
        <button type="button" className="chip" aria-pressed={selected.length === 0} onClick={() => onChange([])}>
          {allLabel}
        </button>
        {options.map((option) => (
          <button
            type="button"
            key={String(option.value)}
            className="chip"
            aria-pressed={selected.includes(option.value)}
            title={option.title}
            onClick={() => toggle(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
