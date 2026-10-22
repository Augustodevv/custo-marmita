import { Carrot, Clock, MoreVertical, Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { InfoTip } from '@/components/common/InfoTip'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { baseUnitOf, costPerBaseUnit, priceVariation } from '@/lib/calc/units'
import { formatBRL, formatDate, formatNumber, formatPercent } from '@/lib/format'
import { ingredientCategoryColors, ingredientCategoryLabels, perDisplayUnit, unitLabels } from '@/lib/labels'
import type { Ingredient, IngredientCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { IngredientFormDialog } from './IngredientFormDialog'
import { PriceUpdateDialog, VariationBadge } from './PriceUpdateDialog'

const STALE_DAYS = 45

function daysSince(iso: string) {
  const t = new Date(`${iso}T00:00:00`).getTime()
  return Math.floor((Date.now() - t) / 86_400_000)
}

export function IngredientsPage() {
  const ingredients = useAppStore((s) => s.ingredients)
  const recipes = useAppStore((s) => s.recipes)
  const deleteIngredient = useAppStore((s) => s.deleteIngredient)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<IngredientCategory | 'todas'>('todas')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingredient | undefined>()
  const [pricing, setPricing] = useState<Ingredient | undefined>()
  const [deleting, setDeleting] = useState<Ingredient | undefined>()

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('pt-BR')
    return ingredients
      .filter((i) => category === 'todas' || i.category === category)
      .filter((i) => !q || i.name.toLocaleLowerCase('pt-BR').includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [ingredients, query, category])

  const usage = (id: string) => recipes.filter((r) => r.items.some((it) => it.ingredientId === id)).length

  const openNew = () => {
    setEditing(undefined)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title="Ingredientes"
        description={
          <span className="inline-flex flex-wrap items-center gap-1">
            Custos já consideram a perda no preparo <InfoTip term="fatorCorrecao" />
          </span>
        }
        actions={
          <Button onClick={openNew}>
            <Plus /> Novo ingrediente
          </Button>
        }
      />

      <div className="mb-4 grid gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ingrediente…"
            className="pl-9"
            type="search"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {(['todas', ...Object.keys(ingredientCategoryLabels)] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c as IngredientCategory | 'todas')}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card hover:bg-secondary',
              )}
            >
              {c === 'todas' ? 'Todas' : ingredientCategoryLabels[c as IngredientCategory]}
            </button>
          ))}
        </div>
      </div>

      {ingredients.length === 0 ? (
        <EmptyState
          icon={Carrot}
          title="Nenhum ingrediente cadastrado"
          description="Cadastre o que você compra (frango, arroz, legumes…) com o preço pago e a perda no preparo."
          action={
            <Button onClick={openNew}>
              <Plus /> Cadastrar o primeiro
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Nada encontrado com esse filtro.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ing) => {
            const base = baseUnitOf(ing.unit)
            const unitCost = perDisplayUnit(costPerBaseUnit(ing), base)
            const variation = priceVariation(ing.packagePrice, ing.priceHistory)
            const stale = daysSince(ing.updatedAt) > STALE_DAYS
            return (
              <Card key={ing.id} className="gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{ing.name}</p>
                    <span
                      className={cn(
                        'mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium',
                        ingredientCategoryColors[ing.category],
                      )}
                    >
                      {ingredientCategoryLabels[ing.category]}
                    </span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mt-1 -mr-2" aria-label="Ações">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setPricing(ing)}>
                        <Tag /> Atualizar preço
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditing(ing)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(ing)}>
                        <Trash2 /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Preço pago</p>
                    <p className="font-medium tabular-nums">
                      {formatBRL(ing.packagePrice)}
                      <span className="text-muted-foreground">
                        {' '}
                        / {formatNumber(ing.packageQty, 3)} {unitLabels[ing.unit]}
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Perda{(ing.cookingYield ?? 1) !== 1 && ' · rendimento'}
                    </p>
                    <p className="font-medium tabular-nums">
                      {formatPercent(ing.lossPercent, 0)}
                      {(ing.cookingYield ?? 1) !== 1 && (
                        <span className="text-muted-foreground">
                          {' '}
                          · {formatNumber(ing.cookingYield ?? 1)}×
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-2 rounded-lg bg-primary/8 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Custo do pronto</p>
                    <p className="text-lg font-bold text-primary tabular-nums">
                      {formatBRL(unitCost.value)}
                      <span className="text-sm font-medium">/{unitCost.unit}</span>
                    </p>
                  </div>
                  <VariationBadge value={variation} />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs',
                      stale ? 'font-medium text-warning' : 'text-muted-foreground',
                    )}
                    title={stale ? `Preço sem atualização há mais de ${STALE_DAYS} dias` : undefined}
                  >
                    <Clock className="size-3.5" />
                    {formatDate(ing.updatedAt)}
                    {stale && ' · confira o preço'}
                  </span>
                  <Button size="sm" variant="secondary" onClick={() => setPricing(ing)}>
                    <Tag /> Atualizar preço
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <IngredientFormDialog ingredient={editing} open={formOpen} onOpenChange={setFormOpen} />
      <PriceUpdateDialog ingredient={pricing} onOpenChange={(o) => !o && setPricing(undefined)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title={`Excluir "${deleting?.name ?? ''}"?`}
        description={
          deleting && usage(deleting.id) > 0
            ? `Ele está em ${usage(deleting.id)} ficha(s) técnica(s) e será removido delas.`
            : 'Essa ação não pode ser desfeita.'
        }
        confirmLabel="Excluir"
        onConfirm={() => deleting && deleteIngredient(deleting.id)}
      />
    </>
  )
}
