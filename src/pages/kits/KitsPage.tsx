import { Minus, PackageOpen, Plus, Sparkles, Trash2, TrendingDown } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ItemPicker } from '@/components/common/ItemPicker'
import { NumberField } from '@/components/common/NumberField'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isExtra } from '@/lib/calc/analysis'
import { calcKit } from '@/lib/calc/kits'
import { formatBRL, formatNumber, formatPercent } from '@/lib/format'
import { recipeCategoryLabels } from '@/lib/labels'
import type { Kit } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { usePricingContext } from '../pricing/usePricingContext'

export function KitsPage() {
  const kits = useAppStore((s) => s.kits)
  const recipes = useAppStore((s) => s.recipes)
  const addKit = useAppStore((s) => s.addKit)
  const minMargin = useAppStore((s) => s.pricing.minMarginAlert)

  const marmitas = recipes.filter((r) => !isExtra(r))

  const newKit = (size: number) => {
    // Distribui a quantidade entre as primeiras marmitas (variadas)
    const pick = marmitas.slice(0, Math.min(5, marmitas.length))
    const items = pick.map((r, i) => ({
      recipeId: r.id,
      qty: Math.floor(size / pick.length) + (i < size % pick.length ? 1 : 0),
    }))
    addKit({
      name: `Kit ${size} marmitas`,
      items: items.filter((i) => i.qty > 0),
      discountPercent: size >= 20 ? 12 : size >= 10 ? 8 : 5,
      minMargin,
    })
  }

  return (
    <>
      <PageHeader
        title="Kits e combos"
        description="Monte pacotes de 5, 10 ou 20 marmitas, aplique um desconto e veja na hora quanto a margem cai."
        actions={
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20].map((n) => (
              <Button
                key={n}
                variant={n === 5 ? 'default' : 'outline'}
                disabled={marmitas.length === 0}
                onClick={() => newKit(n)}
              >
                <Plus /> Kit {n}
              </Button>
            ))}
          </div>
        }
      />

      {kits.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title="Nenhum kit ainda"
          description={
            marmitas.length === 0
              ? 'Crie fichas técnicas primeiro; os kits usam o preço de cada marmita.'
              : 'Kits semanais fidelizam o cliente. Crie um com os botões acima.'
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {kits.map((k) => (
            <KitCard key={k.id} kit={k} />
          ))}
        </div>
      )}
    </>
  )
}

function KitCard({ kit }: { kit: Kit }) {
  const recipes = useAppStore((s) => s.recipes)
  const updateKit = useAppStore((s) => s.updateKit)
  const deleteKit = useAppStore((s) => s.deleteKit)
  const ctx = usePricingContext()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const r = useMemo(() => calcKit(kit, recipes, ctx), [kit, recipes, ctx])

  const setQty = (recipeId: string, qty: number) =>
    updateKit(kit.id, {
      items:
        qty <= 0
          ? kit.items.filter((i) => i.recipeId !== recipeId)
          : kit.items.map((i) => (i.recipeId === recipeId ? { ...i, qty } : i)),
    })

  const options = recipes
    .filter((rec) => !kit.items.some((i) => i.recipeId === rec.id))
    .map((rec) => ({
      id: rec.id,
      label: rec.name,
      group: isExtra(rec) ? 'Adicionais' : recipeCategoryLabels[rec.category],
    }))

  const marginBad = r.meals > 0 && r.margin < kit.minMargin

  return (
    <Card className="gap-4">
      <CardHeader className="flex flex-row items-center gap-2">
        <Input
          aria-label="Nome do kit"
          value={kit.name}
          onChange={(e) => updateKit(kit.id, { name: e.target.value })}
          className="h-9 border-transparent px-1 text-base font-semibold shadow-none hover:border-input focus-visible:border-input"
        />
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Excluir ${kit.name}`}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 />
        </Button>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <ul className="mb-2 divide-y rounded-lg border">
            {r.lines.map((l) => (
              <li key={l.recipe.id} className="flex items-center gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{l.recipe.name}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{formatBRL(l.unitPrice)} cada</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label={`Menos ${l.recipe.name}`}
                    onClick={() => setQty(l.recipe.id, l.qty - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-7"
                    aria-label={`Mais ${l.recipe.name}`}
                    onClick={() => setQty(l.recipe.id, l.qty + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
              </li>
            ))}
            {r.lines.length === 0 && (
              <li className="p-4 text-center text-sm text-muted-foreground">Adicione marmitas ao kit.</li>
            )}
          </ul>
          <ItemPicker
            label="Adicionar marmita"
            placeholder="Buscar marmita…"
            options={options}
            onPick={(recipeId) => updateKit(kit.id, { items: [...kit.items, { recipeId, qty: 1 }] })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <NumberField
            label="Desconto"
            suffix="%"
            value={kit.discountPercent}
            max={90}
            decimals={1}
            onValueChange={(v) => updateKit(kit.id, { discountPercent: v ?? 0 })}
          />
          <NumberField
            label="Margem mínima"
            suffix="%"
            value={kit.minMargin}
            max={90}
            decimals={1}
            onValueChange={(v) => updateKit(kit.id, { minMargin: v ?? 0 })}
          />
        </div>

        {r.meals > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Preço cheio</p>
                <p className="font-semibold text-muted-foreground line-through tabular-nums">
                  {formatBRL(r.fullPrice)}
                </p>
              </div>
              <div className="rounded-lg bg-primary p-3 text-primary-foreground">
                <p className="text-xs opacity-90">Preço do kit</p>
                <p className="text-lg leading-tight font-bold tabular-nums">{formatBRL(r.price)}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-muted/60 p-3 sm:col-span-1">
                <p className="text-xs text-muted-foreground">Por marmita</p>
                <p className="font-semibold tabular-nums">
                  {formatBRL(r.pricePerMeal)}{' '}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({formatNumber(r.meals, 0)} un)
                  </span>
                </p>
              </div>
            </div>

            <div className="grid gap-1.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Custo do kit (com 1 entrega)</span>
                <span className="tabular-nums">{formatBRL(r.cost)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Lucro do kit</span>
                <span
                  className={cn(
                    'font-semibold tabular-nums',
                    r.profit < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400',
                  )}
                >
                  {formatBRL(r.profit)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Margem</span>
                <span className="tabular-nums">
                  {formatPercent(r.marginFull)} →{' '}
                  <strong className={cn(marginBad && 'text-red-600 dark:text-red-400')}>
                    {formatPercent(r.margin)}
                  </strong>
                </span>
              </div>
              {kit.discountPercent > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingDown className="size-3.5" />O desconto de {formatPercent(kit.discountPercent, 0)}{' '}
                  tira {formatNumber(r.marginDrop, 1)} pontos da margem ({formatBRL(r.profitFull - r.profit)}{' '}
                  a menos de lucro).
                </p>
              )}
            </div>

            <div
              className={cn(
                'flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm',
                marginBad ? 'border-red-500/40 bg-red-500/5' : 'border-primary/30 bg-primary/5',
              )}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4 text-primary" />
                {r.belowMinWithoutDiscount ? (
                  <span>
                    Nem sem desconto o kit atinge {formatPercent(kit.minMargin, 0)} de margem. Revise os
                    preços.
                  </span>
                ) : (
                  <span>
                    Desconto máximo para manter {formatPercent(kit.minMargin, 0)}:{' '}
                    <strong>{formatPercent(Math.floor(r.maxDiscount * 10) / 10)}</strong>
                  </span>
                )}
              </span>
              {!r.belowMinWithoutDiscount && Math.abs(r.maxDiscount - kit.discountPercent) > 0.05 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateKit(kit.id, { discountPercent: Math.floor(r.maxDiscount * 10) / 10 })}
                >
                  Usar esse desconto
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Excluir "${kit.name}"?`}
        description="O kit será apagado. As fichas técnicas não são afetadas."
        confirmLabel="Excluir"
        onConfirm={() => deleteKit(kit.id)}
      />
    </Card>
  )
}
