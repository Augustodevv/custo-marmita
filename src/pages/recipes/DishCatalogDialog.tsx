import { Check } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { dishRecipeName, planDishImport, type DishSelection } from '@/lib/calc/dish-import'
import { calcRecipeCost } from '@/lib/calc/recipe'
import { catalogIngredients, dishCatalog, type CatalogDish } from '@/lib/dish-catalog'
import { formatBRL } from '@/lib/format'
import { recipeCategoryColors, recipeCategoryLabels } from '@/lib/labels'
import { catalogKey } from '@/lib/packaging-catalog'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

const selKey = (s: DishSelection) => `${s.dishId}@${s.weight}`

export function DishCatalogDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        {open && <DishPicker onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function DishPicker({ onDone }: { onDone: () => void }) {
  const ingredients = useAppStore((s) => s.ingredients)
  const packaging = useAppStore((s) => s.packaging)
  const recipes = useAppStore((s) => s.recipes)
  const importDishes = useAppStore((s) => s.importDishes)
  const [selected, setSelected] = useState<Map<string, DishSelection>>(new Map())

  const existingNames = useMemo(() => new Set(recipes.map((r) => catalogKey(r.name))), [recipes])

  /** Custo direto estimado (ingredientes + embalagem) de cada prato em cada tamanho. */
  const estimates = useMemo(() => {
    const out = new Map<string, number>()
    for (const dish of dishCatalog.flatMap((g) => g.dishes)) {
      for (const { weight } of dish.sizes) {
        let n = 0
        const plan = planDishImport(
          [{ dishId: dish.id, weight }],
          { ingredients, packaging, recipes: [] },
          () => `tmp${++n}`,
          '',
        )
        const r = plan.recipes[0]
        out.set(
          selKey({ dishId: dish.id, weight }),
          r
            ? calcRecipeCost(
                r,
                [...ingredients, ...plan.newIngredients],
                [...packaging, ...plan.newPackaging],
              ).directCost
            : 0,
        )
      }
    }
    return out
  }, [ingredients, packaging])

  const toggle = (sel: DishSelection) =>
    setSelected((prev) => {
      const next = new Map(prev)
      const k = selKey(sel)
      if (next.has(k)) next.delete(k)
      else next.set(k, sel)
      return next
    })

  const selectGroup = (dishes: CatalogDish[]) =>
    setSelected((prev) => {
      const next = new Map(prev)
      for (const d of dishes)
        for (const s of d.sizes) {
          if (!existingNames.has(catalogKey(dishRecipeName(d, s.weight)))) {
            next.set(selKey({ dishId: d.id, weight: s.weight }), { dishId: d.id, weight: s.weight })
          }
        }
      return next
    })

  const add = () => {
    const { created, skipped } = importDishes([...selected.values()])
    toast.success(
      `${created} ficha${created === 1 ? '' : 's'} criada${created === 1 ? '' : 's'}.` +
        (skipped.length ? ` ${skipped.length} já existia${skipped.length === 1 ? '' : 'm'}.` : '') +
        ' Confira as quantidades e os preços dos ingredientes.',
    )
    onDone()
  }

  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Catálogo de pratos</DialogTitle>
        <DialogDescription>
          Escolha os pratos e tamanhos. O app cria a ficha técnica, cadastra os ingredientes que faltarem e
          escolhe o pote certo. As receitas são uma base: ajuste as quantidades do seu jeito.
        </DialogDescription>
      </DialogHeader>

      {dishCatalog.map((group) => (
        <section key={group.title} className="grid gap-2">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{group.title}</p>
              {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => selectGroup(group.dishes)}>
              Marcar todos
            </Button>
          </div>
          <ul className="grid gap-2">
            {group.dishes.map((dish) => (
              <li key={dish.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium">{dish.name}</span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[11px] font-medium',
                      dish.kind === 'adicional'
                        ? 'bg-accent text-accent-foreground'
                        : recipeCategoryColors[dish.category],
                    )}
                  >
                    {dish.kind === 'adicional' ? 'Adicional' : recipeCategoryLabels[dish.category]}
                  </span>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {dish.items.map(([k]) => catalogIngredients[k].name).join(', ')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {dish.sizes.map((size) => {
                    const sel = { dishId: dish.id, weight: size.weight }
                    const has = existingNames.has(catalogKey(dishRecipeName(dish, size.weight)))
                    const checked = selected.has(selKey(sel))
                    const cost = estimates.get(selKey(sel)) ?? 0
                    return (
                      <button
                        key={size.weight}
                        type="button"
                        disabled={has}
                        aria-pressed={checked}
                        onClick={() => toggle(sel)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors',
                          checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/60',
                          has && 'cursor-default opacity-60',
                        )}
                      >
                        <span
                          className={cn(
                            'flex size-4 shrink-0 items-center justify-center rounded border',
                            (checked || has) && 'border-primary bg-primary text-primary-foreground',
                          )}
                        >
                          {(checked || has) && <Check className="size-3" />}
                        </span>
                        <span>
                          <span className="block font-semibold">
                            {size.weight} g{size.price ? ` · ${formatBRL(size.price)}` : ''}
                          </span>
                          <span className="block text-muted-foreground tabular-nums">
                            {has ? 'já cadastrada' : `custo ≈ ${formatBRL(cost)}`}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <DialogFooter className="sticky -bottom-5 -mx-5 border-t bg-background px-5 py-3 sm:-bottom-6 sm:-mx-6 sm:px-6">
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="button" disabled={selected.size === 0} onClick={add}>
          Criar {selected.size > 0 ? selected.size : ''} ficha{selected.size === 1 ? '' : 's'}
        </Button>
      </DialogFooter>
    </div>
  )
}
