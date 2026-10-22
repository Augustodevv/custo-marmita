import { Copy, Minus, PackageCheck, PackageMinus, Plus, Share2, ShoppingCart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { isExtra } from '@/lib/calc/analysis'
import { calcShoppingList, productionChanges, purchaseChanges } from '@/lib/calc/shopping'
import { groupLines, packagesLabel, shoppingGroupLabels, shoppingListText } from '@/lib/calc/shopping-text'
import { formatBRL, formatDate, formatNumber, formatQty, todayISO } from '@/lib/format'
import type { Recipe } from '@/lib/types'
import { useAppStore } from '@/store/useAppStore'

function Stepper({
  recipe,
  value,
  onChange,
}: {
  recipe: Recipe
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm">{recipe.name}</span>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Menos ${recipe.name}`}
          disabled={value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          <Minus />
        </Button>
        <Input
          inputMode="numeric"
          aria-label={`Quantidade de ${recipe.name}`}
          className="h-8 w-14 text-center tabular-nums"
          value={value || ''}
          placeholder="0"
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value.replace(/\D/g, ''), 10)
            onChange(Number.isFinite(n) ? Math.min(n, 99999) : 0)
          }}
        />
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          aria-label={`Mais ${recipe.name}`}
          onClick={() => onChange(value + 1)}
        >
          <Plus />
        </Button>
      </div>
    </div>
  )
}

export function ShoppingListTab() {
  const recipes = useAppStore((s) => s.recipes)
  const ingredients = useAppStore((s) => s.ingredients)
  const packaging = useAppStore((s) => s.packaging)
  const plan = useAppStore((s) => s.plan)
  const setPlanQty = useAppStore((s) => s.setPlanQty)
  const setPlan = useAppStore((s) => s.setPlan)
  const applyStock = useAppStore((s) => s.applyStock)
  const adjustReady = useAppStore((s) => s.adjustReady)
  const [useStock, setUseStock] = useState(true)
  const [confirm, setConfirm] = useState<'compra' | 'producao' | null>(null)

  const list = useMemo(
    () => calcShoppingList(plan, recipes, ingredients, packaging, { useStock }),
    [plan, recipes, ingredients, packaging, useStock],
  )
  const marmitas = recipes.filter((r) => !isExtra(r))
  const extras = recipes.filter(isExtra)
  const text = () => shoppingListText(list, recipes, plan, formatDate(todayISO()))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text())
      toast.success('Lista copiada! É só colar no WhatsApp.')
    } catch {
      toast.error('Não foi possível copiar. Use o botão Compartilhar.')
    }
  }
  const share = async () => {
    const t = text()
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Lista de compras', text: t })
      } catch {
        /* usuário cancelou */
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(t)}`, '_blank', 'noopener')
    }
  }

  if (recipes.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Crie fichas técnicas primeiro"
        description="A lista de compras soma os ingredientes das marmitas que você vai produzir."
      />
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-start">
      <Card className="gap-3 lg:sticky lg:top-8">
        <CardHeader>
          <CardTitle>O que vai produzir</CardTitle>
          <CardDescription>Quantidade de cada marmita na semana (ou no período da compra).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-1">
          <div className="divide-y">
            {marmitas.map((r) => (
              <Stepper key={r.id} recipe={r} value={plan[r.id] ?? 0} onChange={(n) => setPlanQty(r.id, n)} />
            ))}
          </div>
          {extras.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Adicionais
              </p>
              <div className="divide-y">
                {extras.map((r) => (
                  <Stepper
                    key={r.id}
                    recipe={r}
                    value={plan[r.id] ?? 0}
                    onChange={(n) => setPlanQty(r.id, n)}
                  />
                ))}
              </div>
            </>
          )}
          <div className="mt-3 flex items-center justify-between border-t pt-3 text-sm">
            <span className="text-muted-foreground">
              Total: <strong className="text-foreground">{formatNumber(list.totalMeals, 0)}</strong> itens
            </span>
            <Button variant="ghost" size="sm" disabled={list.totalMeals === 0} onClick={() => setPlan({})}>
              Zerar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="gap-3">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 basis-60">
                <CardTitle>Lista de compras</CardTitle>
                <CardDescription>
                  Quantidades já com a perda no preparo e arredondadas para embalagens fechadas.
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total estimado</p>
                <p className="text-2xl font-bold text-primary tabular-nums">{formatBRL(list.totalCost)}</p>
                {list.totalExactCost > 0 && Math.abs(list.totalExactCost - list.totalCost) > 0.5 && (
                  <p className="text-[11px] text-muted-foreground">
                    {formatBRL(list.totalExactCost)} consumidos de fato
                  </p>
                )}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={useStock} onCheckedChange={setUseStock} />
              Descontar o que tenho em estoque e repor o mínimo
            </label>
          </CardHeader>
          <CardContent className="grid gap-4">
            {list.toBuyLines.length === 0 ? (
              <p className="rounded-lg bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
                {list.totalMeals === 0
                  ? 'Informe quantas marmitas vai produzir para montar a lista.'
                  : 'Você já tem tudo em estoque. Nada para comprar! 🎉'}
              </p>
            ) : (
              groupLines(list.toBuyLines).map(([group, lines]) => (
                <div key={group}>
                  <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    {shoppingGroupLabels[group]}
                  </p>
                  <ul className="divide-y rounded-lg border">
                    {lines.map((l) => (
                      <li
                        key={`${l.kind}-${l.id}`}
                        className="flex items-start justify-between gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {l.name}{' '}
                            {(l.stockStatus === 'zerado' || l.stockStatus === 'baixo') && (
                              <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                                {l.stockStatus === 'zerado' ? 'zerado' : 'estoque baixo'}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {useStock && (l.stock > 0 || l.min > 0)
                              ? `precisa ${formatQty(l.needed, l.baseUnit)} · tem ${formatQty(l.stock, l.baseUnit)}${l.min > 0 ? ` · mín. ${formatQty(l.min, l.baseUnit)}` : ''}`
                              : `para a produção`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold tabular-nums">
                            {formatQty(l.toBuy, l.baseUnit)}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {packagesLabel(l)} · {formatBRL(l.cost)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}

            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button onClick={copy} disabled={list.toBuyLines.length === 0}>
                <Copy /> Copiar para WhatsApp
              </Button>
              <Button variant="outline" onClick={share} disabled={list.toBuyLines.length === 0}>
                <Share2 /> Compartilhar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Atualizar estoque</CardTitle>
            <CardDescription>Mantenha o estoque em dia com dois toques.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={list.toBuyLines.length === 0}
              onClick={() => setConfirm('compra')}
            >
              <PackageCheck /> Fiz a compra
            </Button>
            <Button variant="outline" disabled={list.totalMeals === 0} onClick={() => setConfirm('producao')}>
              <PackageMinus /> Produzi as marmitas
            </Button>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirm === 'compra'}
        onOpenChange={(o) => !o && setConfirm(null)}
        destructive={false}
        title="Dar entrada da compra no estoque?"
        description="Soma ao estoque as embalagens fechadas desta lista."
        confirmLabel="Dar entrada"
        onConfirm={() => {
          applyStock(purchaseChanges(list))
          toast.success('Compra registrada no estoque.')
        }}
      />
      <ConfirmDialog
        open={confirm === 'producao'}
        onOpenChange={(o) => !o && setConfirm(null)}
        destructive={false}
        title={`Registrar a produção de ${formatNumber(list.totalMeals, 0)} itens?`}
        description="Tira do estoque os ingredientes (com a perda) e as embalagens usados, soma as marmitas às prontas para venda e zera o plano de produção."
        confirmLabel="Registrar produção"
        onConfirm={() => {
          applyStock(productionChanges(plan, recipes, ingredients))
          adjustReady(plan)
          setPlan({})
          toast.success('Produção registrada. Estoque atualizado.')
        }}
      />
    </div>
  )
}
