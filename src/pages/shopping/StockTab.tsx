import { CheckCircle2, CircleSlash, PackageX, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { NumberField } from '@/components/common/NumberField'
import { Segmented } from '@/components/common/Segmented'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { stockAlerts, stockStatus, type StockStatus } from '@/lib/calc/stock'
import { baseUnitOf } from '@/lib/calc/units'
import { formatQty } from '@/lib/format'
import { bigUnit, ingredientCategoryLabels } from '@/lib/labels'
import type { BaseUnit } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

const statusInfo: Record<StockStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  zerado: {
    label: 'Zerado',
    icon: PackageX,
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  baixo: {
    label: 'Baixo',
    icon: TriangleAlert,
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  ok: {
    label: 'OK',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  'sem-controle': {
    label: 'Sem controle',
    icon: CircleSlash,
    className: 'bg-muted text-muted-foreground',
  },
}

function StockBadge({ status }: { status: StockStatus }) {
  const s = statusInfo[status]
  const Icon = s.icon
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        s.className,
      )}
    >
      <Icon className="size-3" /> {s.label}
    </span>
  )
}

interface RowProps {
  name: string
  detail: string
  base: BaseUnit
  stockQty?: number
  minStock?: number
  onChange: (patch: { stockQty?: number; minStock?: number }) => void
}

function StockRow({ name, detail, base, stockQty, minStock, onChange }: RowProps) {
  const { unit, factor } = bigUnit(base)
  const toBig = (v?: number) => (v === undefined ? undefined : v / factor)
  const toBase = (v?: number) => (v === undefined ? undefined : v * factor)
  return (
    <li className="grid gap-2 p-3 sm:grid-cols-[1fr_130px_130px] sm:items-center sm:gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <StockBadge status={stockStatus({ stockQty, minStock })} />
          <span className="text-xs text-muted-foreground">{detail}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:contents">
        <NumberField
          label={<span className="text-xs text-muted-foreground sm:sr-only">Tenho</span>}
          aria-label={`Estoque de ${name}`}
          suffix={unit}
          value={toBig(stockQty)}
          decimals={3}
          placeholder="—"
          onValueChange={(v) => onChange({ stockQty: toBase(v) })}
        />
        <NumberField
          label={<span className="text-xs text-muted-foreground sm:sr-only">Mínimo</span>}
          aria-label={`Estoque mínimo de ${name}`}
          suffix={unit}
          value={toBig(minStock)}
          decimals={3}
          placeholder="—"
          onValueChange={(v) => onChange({ minStock: toBase(v) })}
        />
      </div>
    </li>
  )
}

export function StockTab() {
  const ingredients = useAppStore((s) => s.ingredients)
  const packaging = useAppStore((s) => s.packaging)
  const updateIngredient = useAppStore((s) => s.updateIngredient)
  const updatePackaging = useAppStore((s) => s.updatePackaging)
  const [kind, setKind] = useState<'ingredientes' | 'embalagens'>('ingredientes')
  const alerts = stockAlerts(ingredients, packaging)

  return (
    <div className="grid gap-4">
      {alerts.length > 0 ? (
        <Card className="gap-3 border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-amber-600" /> Comprar logo
            </CardTitle>
            <CardDescription>Esses itens já entram automaticamente na lista de compras.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
              {alerts.map((a) => {
                const ing = a.kind === 'ingrediente' ? ingredients.find((i) => i.id === a.id) : undefined
                const base: BaseUnit = ing ? baseUnitOf(ing.unit) : 'un'
                return (
                  <li key={`${a.kind}-${a.id}`} className="flex items-center gap-2">
                    <StockBadge status={a.status} />
                    <span className="min-w-0 flex-1 truncate">{a.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatQty(a.stock, base)} / mín. {formatQty(a.min, base)}
                    </span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4" /> Estoque em dia: nada abaixo do mínimo.
        </p>
      )}

      <Card className="gap-3">
        <CardHeader>
          <CardTitle>Estoque atual</CardTitle>
          <CardDescription>
            Informe quanto você tem e o mínimo que quer manter. Deixe em branco o que não quer controlar.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Segmented
            aria-label="Tipo de item"
            className="w-full sm:w-auto"
            value={kind}
            onChange={setKind}
            options={[
              { value: 'ingredientes', label: `Ingredientes (${ingredients.length})` },
              { value: 'embalagens', label: `Embalagens (${packaging.length})` },
            ]}
          />
          <div className="hidden grid-cols-[1fr_130px_130px] gap-3 px-3 text-xs font-medium text-muted-foreground sm:grid">
            <span>Item</span>
            <span>Tenho</span>
            <span>Mínimo</span>
          </div>
          <ul className="divide-y rounded-lg border">
            {kind === 'ingredientes'
              ? [...ingredients]
                  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                  .map((i) => (
                    <StockRow
                      key={i.id}
                      name={i.name}
                      detail={ingredientCategoryLabels[i.category]}
                      base={baseUnitOf(i.unit)}
                      stockQty={i.stockQty}
                      minStock={i.minStock}
                      onChange={(patch) => updateIngredient(i.id, patch)}
                    />
                  ))
              : [...packaging]
                  .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                  .map((p) => (
                    <StockRow
                      key={p.id}
                      name={p.name}
                      detail={`pacote com ${p.packQty} un`}
                      base="un"
                      stockQty={p.stockQty}
                      minStock={p.minStock}
                      onChange={(patch) => updatePackaging(p.id, patch)}
                    />
                  ))}
            {(kind === 'ingredientes' ? ingredients : packaging).length === 0 && (
              <li className="p-6 text-center text-sm text-muted-foreground">Nada cadastrado ainda.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
