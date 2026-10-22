import { cn } from '@/lib/utils'

interface SegmentedProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  className?: string
  'aria-label'?: string
}

/** Alternador compacto (ex.: Mensal | Por hora). */
export function Segmented<T extends string>({ value, onChange, options, className, ...rest }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={rest['aria-label']} className={cn('inline-flex rounded-lg border bg-muted/50 p-0.5', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors',
            value === o.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
