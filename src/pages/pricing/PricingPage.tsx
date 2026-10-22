import { AlertTriangle, CheckCircle2, ClipboardList, Settings2, TrendingDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { InfoTip } from '@/components/common/InfoTip'
import { NumberField } from '@/components/common/NumberField'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  compareChannels,
  isExtra,
  priceRecipe,
  primaryChannel,
  type RecipePricing,
} from '@/lib/calc/analysis'
import { calcFixedCosts } from '@/lib/calc/fixed'
import type { MarginStatus } from '@/lib/calc/pricing'
import { formatBRL, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { RecipeThumb } from '../recipes/RecipeThumb'
import { usePricingContext } from './usePricingContext'

export function PricingPage() {
  const recipes = useAppStore((s) => s.recipes)
  const ctx = usePricingContext()
  const [selectedId, setSelectedId] = useState<string | undefined>()

  // Marmitas primeiro, adicionais no fim
  const rows = useMemo(
    () => [...recipes.filter((r) => !isExtra(r)), ...recipes.filter(isExtra)].map((r) => priceRecipe(r, ctx)),
    [recipes, ctx],
  )
  const groups = [
    { label: 'Marmitas', items: rows.filter((r) => !isExtra(r.recipe)) },
    { label: 'Adicionais e extras', items: rows.filter((r) => isExtra(r.recipe)) },
  ].filter((g) => g.items.length > 0)
  const selected = rows.find((r) => r.recipe.id === selectedId) ?? rows[0]
  const fixed = calcFixedCosts(ctx.costs)
  const main = primaryChannel(ctx)

  if (recipes.length === 0) {
    return (
      <>
        <PageHeader title="Precificação" />
        <EmptyState
          icon={ClipboardList}
          title="Nenhuma ficha técnica ainda"
          description="Crie a ficha técnica de uma marmita para calcular o preço de venda."
          action={
            <Button asChild>
              <Link to="/fichas/nova">Criar ficha técnica</Link>
            </Button>
          }
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Precificação"
        description={
          <>
            Canal principal: <strong>{main.name}</strong> · custo fixo rateado {formatBRL(fixed.perMeal)} por
            marmita
          </>
        }
        actions={
          <Button variant="outline" asChild>
            <Link to="/custos?aba=taxas">
              <Settings2 /> Taxas e canais
            </Link>
          </Button>
        }
      />

      {fixed.missingProduction && (
        <p className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Informe a produção mensal em{' '}
          <Link to="/custos" className="font-semibold underline">
            Custos fixos
          </Link>{' '}
          para incluir o rateio dos custos fixos no preço.
        </p>
      )}

      <div className="mb-4 grid gap-1.5 sm:max-w-md">
        <span className="text-sm font-medium">Marmita ou adicional</span>
        <Select value={selected.recipe.id} onValueChange={setSelectedId}>
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectGroup key={g.label}>
                <SelectLabel>{g.label}</SelectLabel>
                {g.items.map((r) => (
                  <SelectItem key={r.recipe.id} value={r.recipe.id}>
                    {r.recipe.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RecipePricingDetail key={selected.recipe.id} pricing={selected} />

      <PriceTable
        rows={rows}
        onSelect={(id) => {
          setSelectedId(id)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />
    </>
  )
}

function RecipePricingDetail({ pricing: p }: { pricing: RecipePricing }) {
  const updateRecipe = useAppStore((s) => s.updateRecipe)
  const minMargin = useAppStore((s) => s.pricing.minMarginAlert)
  const ctx = usePricingContext()
  const comparison = compareChannels(p.recipe, ctx)
  const { cost } = p

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card className="gap-4">
        <CardHeader className="flex flex-row items-center gap-3">
          <RecipeThumb photo={p.recipe.photo} name={p.recipe.name} className="size-12" />
          <div className="min-w-0">
            <CardTitle className="leading-snug">{p.recipe.name}</CardTitle>
            <CardDescription>
              {isExtra(p.recipe) ? 'Adicional' : `Tamanho ${p.recipe.size}`} · canal {p.channel.name}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <Line
            label={
              <>
                Insumos (CMV) <InfoTip term="cmv" />
              </>
            }
            value={formatBRL(cost.ingredients)}
          />
          <Line label="Embalagens" value={formatBRL(cost.packaging)} />
          <Line
            label={
              <>
                Custo fixo rateado <InfoTip term="rateio" />
              </>
            }
            value={isExtra(p.recipe) ? 'Vai com a marmita' : formatBRL(cost.fixed)}
          />
          <Line
            label="Entrega"
            value={p.channel.ownDelivery && !isExtra(p.recipe) ? formatBRL(cost.delivery) : 'Não se aplica'}
          />
          <div className="mt-1 flex items-center justify-between rounded-lg bg-muted px-3 py-2.5">
            <span className="font-medium">Custo total unitário</span>
            <span className="text-lg font-bold tabular-nums">{formatBRL(cost.total)}</span>
          </div>
          <Line label="Impostos e taxas do canal" value={formatPercent(p.feePercent)} />

          <div className="mt-2 grid grid-cols-2 items-end gap-3 border-t pt-4">
            <NumberField
              label={
                <span className="flex items-center gap-1">
                  Margem desejada <InfoTip term="margem" />
                </span>
              }
              suffix="%"
              value={p.desiredMargin}
              max={90}
              decimals={1}
              onValueChange={(v) => updateRecipe(p.recipe.id, { desiredMargin: v ?? 0 })}
            />
            <div className="rounded-lg bg-primary px-3 py-2 text-primary-foreground">
              <p className="flex items-center gap-1 text-xs opacity-90">
                Preço sugerido{' '}
                <InfoTip term="markup" className="text-primary-foreground/80 hover:text-primary-foreground" />
              </p>
              <p className="text-2xl leading-tight font-bold tabular-nums">
                {p.suggested.ok ? formatBRL(p.suggested.price) : '—'}
              </p>
            </div>
          </div>
          {p.suggested.ok ? (
            <p className="text-xs text-muted-foreground">
              {formatBRL(cost.total)} ÷ (1 − ({formatPercent(p.feePercent)} + {formatPercent(p.desiredMargin)}
              )) · markup de {p.suggested.markup.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}×
            </p>
          ) : (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {p.suggested.reason}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Preço que você pratica hoje</CardTitle>
            <CardDescription>No canal {p.channel.name}. Veja quanto sobra de verdade.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <NumberField
              aria-label="Preço praticado hoje"
              prefix="R$"
              value={p.recipe.currentPrice}
              placeholder="0,00"
              inputClassName="h-12 text-lg"
              onValueChange={(v) => updateRecipe(p.recipe.id, { currentPrice: v })}
            />
            {p.current ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Metric
                    label="Lucro por marmita"
                    value={formatBRL(p.current.profit)}
                    tone={p.current.status}
                  />
                  <Metric
                    label="Margem real"
                    value={formatPercent(p.current.margin)}
                    tone={p.current.status}
                  />
                </div>
                <Line label="Vai para impostos e taxas" value={formatBRL(p.current.fees)} />
                <StatusMessage
                  status={p.current.status}
                  minMargin={minMargin}
                  suggested={p.suggested.ok ? p.suggested.price : undefined}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Digite o preço atual para ver o lucro e a margem real.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle>Preço por canal</CardTitle>
            <CardDescription>
              {comparison.referenceProfit !== null ? (
                <>
                  Para lucrar os mesmos <strong>{formatBRL(comparison.referenceProfit)}</strong> por marmita
                  que no canal {p.channel.name}
                  {comparison.basis === 'atual'
                    ? ' (com o preço de hoje)'
                    : p.current
                      ? ' (com o preço sugerido, já que o preço de hoje dá prejuízo)'
                      : ' (com o preço sugerido)'}
                  :
                </>
              ) : (
                'Ajuste as taxas e a margem para comparar os canais.'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Canal</th>
                    <th className="px-2 py-2 text-right font-medium">Taxas</th>
                    <th className="px-2 py-2 text-right font-medium">Custo</th>
                    <th className="px-6 py-2 text-right font-medium">Preço necessário</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((r) => (
                    <tr
                      key={r.channel.id}
                      className={cn(
                        'border-b last:border-0',
                        r.channel.id === p.channel.id && 'bg-primary/5',
                      )}
                    >
                      <td className="px-6 py-2.5 font-medium">{r.channel.name}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{formatPercent(r.feePercent)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{formatBRL(r.cost)}</td>
                      <td className="px-6 py-2.5 text-right font-semibold tabular-nums">
                        {r.sameProfitPrice !== null ? formatBRL(r.sameProfitPrice) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatusMessage({
  status,
  minMargin,
  suggested,
}: {
  status: MarginStatus
  minMargin: number
  suggested?: number
}) {
  if (status === 'ok')
    return (
      <p className="flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-300">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> Margem saudável. Esse preço cobre todos os custos.
      </p>
    )
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-700 dark:text-red-300"
    >
      {status === 'prejuizo' ? (
        <TrendingDown className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      )}
      <span>
        {status === 'prejuizo'
          ? 'Você está tendo prejuízo em cada marmita vendida.'
          : `Margem abaixo de ${formatPercent(minMargin, 0)}.`}
        {suggested !== undefined && ` Preço sugerido: ${formatBRL(suggested)}.`}
      </span>
    </p>
  )
}

function Metric({ label, value, tone }: { label: string; value: string; tone: MarginStatus }) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        tone === 'ok' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5',
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          'text-xl font-bold tabular-nums',
          tone === 'ok' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function Line({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1 text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  )
}

function PriceTable({ rows, onSelect }: { rows: RecipePricing[]; onSelect: (id: string) => void }) {
  return (
    <Card className="mt-6 gap-3">
      <CardHeader>
        <CardTitle>Tabela de preços</CardTitle>
        <CardDescription>
          Todas as marmitas no canal principal. Toque em uma para ver os detalhes.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-6 py-2 font-medium">Marmita</th>
                <th className="px-2 py-2 text-right font-medium">Custo total</th>
                <th className="px-2 py-2 text-right font-medium">Sugerido</th>
                <th className="px-2 py-2 text-right font-medium">Praticado</th>
                <th className="px-2 py-2 text-right font-medium">Margem real</th>
                <th className="px-6 py-2 text-right font-medium">Situação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.recipe.id}
                  onClick={() => onSelect(r.recipe.id)}
                  className="cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50"
                >
                  <td className="max-w-[240px] truncate px-6 py-2.5 font-medium">
                    {isExtra(r.recipe) && (
                      <span className="mr-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                        Adicional
                      </span>
                    )}
                    {r.recipe.name}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{formatBRL(r.cost.total)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">
                    {r.suggested.ok ? formatBRL(r.suggested.price) : '—'}
                  </td>
                  <td className="px-2 py-2.5 text-right tabular-nums">
                    {r.current ? formatBRL(r.current.price) : '—'}
                  </td>
                  <td
                    className={cn(
                      'px-2 py-2.5 text-right font-semibold tabular-nums',
                      r.current && r.current.status !== 'ok' && 'text-red-600 dark:text-red-400',
                    )}
                  >
                    {r.current ? formatPercent(r.current.margin) : '—'}
                  </td>
                  <td className="px-6 py-2.5 text-right">
                    {r.current ? <StatusBadge status={r.current.status} /> : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
