import { Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { packagingUnitCost } from '@/lib/calc/units'
import { formatBRL, formatBRLUnit } from '@/lib/format'
import { capacityLabel, materialLabels } from '@/lib/labels'
import { catalogKey, packagingCatalog, type CatalogItem } from '@/lib/packaging-catalog'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

export function CatalogDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open && <CatalogPicker onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CatalogPicker({ onDone }: { onDone: () => void }) {
  const packaging = useAppStore((s) => s.packaging)
  const addPackaging = useAppStore((s) => s.addPackaging)
  const existing = new Set(packaging.map((p) => catalogKey(p.name)))
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })

  const add = () => {
    const items: CatalogItem[] = packagingCatalog.flatMap((g) => g.items).filter((i) => selected.has(i.name))
    items.forEach((i) => addPackaging({ ...i }))
    toast.success(
      `${items.length} embalage${items.length === 1 ? 'm adicionada' : 'ns adicionadas'}. Confira os preços!`,
    )
    onDone()
  }

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Catálogo de embalagens</DialogTitle>
        <DialogDescription>
          Marque o que você usa. Os preços são uma referência de atacado: depois ajuste para o que você paga.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        {packagingCatalog.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {group.title}
            </p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {group.items.map((item) => {
                const has = existing.has(catalogKey(item.name))
                const checked = selected.has(item.name)
                const details = [
                  capacityLabel(item),
                  item.material && materialLabels[item.material],
                  item.compartments && item.compartments > 1 ? `${item.compartments} divisórias` : null,
                  item.microwave ? 'micro-ondas' : null,
                  item.freezer ? 'freezer' : null,
                ].filter(Boolean)
                return (
                  <li key={item.name}>
                    <button
                      type="button"
                      disabled={has}
                      aria-pressed={checked}
                      onClick={() => toggle(item.name)}
                      className={cn(
                        'flex w-full items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors',
                        checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
                        has && 'cursor-default opacity-60',
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded border',
                          (checked || has) && 'border-primary bg-primary text-primary-foreground',
                        )}
                      >
                        {(checked || has) && <Check className="size-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{item.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {has ? 'Já cadastrada' : details.join(' · ')}
                        </span>
                        <span className="block text-xs text-muted-foreground tabular-nums">
                          {formatBRL(item.packPrice)} / {item.packQty} un ·{' '}
                          <strong className="text-foreground">
                            {formatBRLUnit(packagingUnitCost(item))}
                          </strong>{' '}
                          cada
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <DialogFooter className="sticky -bottom-5 -mx-5 border-t bg-background px-5 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="button" disabled={selected.size === 0} onClick={add}>
          Adicionar {selected.size > 0 ? selected.size : ''} selecionada{selected.size === 1 ? '' : 's'}
        </Button>
      </DialogFooter>
    </div>
  )
}
