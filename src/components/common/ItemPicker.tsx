import { Plus, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface PickerOption {
  id: string
  label: string
  group?: string
  detail?: string
}

interface ItemPickerProps {
  options: PickerOption[]
  onPick: (id: string) => void
  label: ReactNode
  placeholder?: string
  emptyText?: ReactNode
}

/** Botão "+ Adicionar" que abre uma lista pesquisável, agrupada por categoria. */
export function ItemPicker({ options, onPick, label, placeholder = 'Buscar…', emptyText }: ItemPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    const map = new Map<string, PickerOption[]>()
    for (const o of options) {
      if (q && !o.label.toLocaleLowerCase('pt-BR').includes(q)) continue
      const g = o.group ?? ''
      map.set(g, [...(map.get(g) ?? []), o])
    }
    return [...map.entries()]
  }, [options, query])

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full border-dashed sm:w-auto">
          <Plus /> {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-0" align="start">
        <div className="relative border-b p-2">
          <Search className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="h-9 border-0 pl-8 shadow-none focus-visible:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-72 overflow-y-auto p-1">
          {groups.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              {options.length === 0 ? emptyText ?? 'Nada para adicionar.' : 'Nada encontrado.'}
            </div>
          )}
          {groups.map(([group, items]) => (
            <div key={group} className="py-1">
              {group && (
                <p className="px-2 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {group}
                </p>
              )}
              {items.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    onPick(o.id)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary focus-visible:bg-secondary focus-visible:outline-none"
                >
                  <span className="truncate">{o.label}</span>
                  {o.detail && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{o.detail}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
