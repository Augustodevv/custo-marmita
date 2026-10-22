import { History, TrendingDown, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { NumberField } from '@/components/common/NumberField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { priceVariation } from '@/lib/calc/units'
import { formatBRL, formatDate, formatNumber, formatSignedPercent } from '@/lib/format'
import { unitLabels } from '@/lib/labels'
import type { Ingredient } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  ingredient?: Ingredient
  onOpenChange: (open: boolean) => void
}

export function PriceUpdateDialog({ ingredient, onOpenChange }: Props) {
  return (
    <Dialog open={!!ingredient} onOpenChange={onOpenChange}>
      <DialogContent>
        {ingredient && <PriceUpdateForm ingredient={ingredient} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

export function VariationBadge({ value, className }: { value: number | null; className?: string }) {
  if (value === null || Math.abs(value) < 0.05) return null
  const up = value > 0
  const Icon = up ? TrendingUp : TrendingDown
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        up
          ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
        className,
      )}
      title={up ? 'Ficou mais caro que a compra anterior' : 'Ficou mais barato que a compra anterior'}
    >
      <Icon className="size-3" />
      {formatSignedPercent(value)}
    </span>
  )
}

function PriceUpdateForm({ ingredient, onDone }: { ingredient: Ingredient; onDone: () => void }) {
  const updatePrice = useAppStore((s) => s.updateIngredientPrice)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const preview =
    price !== undefined && price >= 0
      ? priceVariation(price, [{ price: ingredient.packagePrice, date: ingredient.updatedAt }])
      : null
  const history = [
    ...ingredient.priceHistory,
    { price: ingredient.packagePrice, date: ingredient.updatedAt },
  ].reverse()
  const valid = price !== undefined && price >= 0

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        if (!valid) return
        updatePrice(ingredient.id, price)
        onDone()
      }}
    >
      <DialogHeader>
        <DialogTitle>Atualizar preço</DialogTitle>
        <DialogDescription>
          {ingredient.name} · embalagem de {formatNumber(ingredient.packageQty, 3)}{' '}
          {unitLabels[ingredient.unit]}
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Preço atual</span>
        <span className="font-semibold tabular-nums">{formatBRL(ingredient.packagePrice)}</span>
      </div>

      <NumberField
        label="Novo preço pago"
        prefix="R$"
        value={price}
        onValueChange={setPrice}
        required
        inputClassName="h-12 text-lg"
        hint={
          preview !== null ? (
            <span className="flex items-center gap-2">
              Variação: <VariationBadge value={preview} />
            </span>
          ) : undefined
        }
      />

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
          <History className="size-4" /> Histórico de preços
        </p>
        <ul className="max-h-48 divide-y overflow-y-auto rounded-lg border text-sm">
          {history.map((h, idx) => {
            const older = history[idx + 1]
            const v = older ? priceVariation(h.price, [older]) : null
            return (
              <li key={`${h.date}-${idx}`} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-muted-foreground">
                  {formatDate(h.date)}
                  {idx === 0 && <span className="ml-1.5 text-xs font-medium text-primary">(atual)</span>}
                </span>
                <span className="flex items-center gap-2">
                  <VariationBadge value={v} />
                  <span className="font-medium tabular-nums">{formatBRL(h.price)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!valid}>
          Salvar novo preço
        </Button>
      </DialogFooter>
    </form>
  )
}
