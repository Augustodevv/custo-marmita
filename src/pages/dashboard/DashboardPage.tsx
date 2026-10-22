import {
  AlertTriangle,
  ArrowRight,
  Calculator,
  ClipboardList,
  PiggyBank,
  Scale,
  Tag,
  TrendingUp,
  Trophy,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/common/EmptyState'
import { InfoTip } from '@/components/common/InfoTip'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calcDashboard } from '@/lib/calc/dashboard'
import { formatBRL, formatNumber, formatPercent } from '@/lib/format'
import type { GlossaryKey } from '@/lib/glossary'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { usePricingContext } from '../pricing/usePricingContext'
import { RecipeThumb } from '../recipes/RecipeThumb'
import { CompositionChart, MarginChart } from './DashboardCharts'
import { SoldOutAlertCard, StockAlertCard } from './StockAlertCard'

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  term,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: ReactNode
  term?: GlossaryKey
  tone?: 'bad' | 'good'
}) {
  return (
    <Card className="gap-1 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          {label} {term && <InfoTip term={term} />}
        </span>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p
        className={cn(
          'text-2xl font-bold tracking-tight',
          tone === 'bad' && 'text-red-600 dark:text-red-400',
          tone === 'good' && 'text-emerald-700 dark:text-emerald-400',
        )}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  )
}

export function DashboardPage() {
  const recipes = useAppStore((s) => s.recipes)
  const ctx = usePricingContext()
  const d = useMemo(() => calcDashboard(recipes, ctx), [recipes, ctx])
  const minMargin = ctx.pricing.minMarginAlert

  if (d.rows.length === 0) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <SoldOutAlertCard />
        <StockAlertCard />
        <EmptyState
          icon={ClipboardList}
          title="Cadastre suas marmitas para ver os números"
          description="O dashboard usa as fichas técnicas, os custos fixos e as taxas para calcular custo médio, margem, lucro do mês e ponto de equilíbrio."
          action={
            <Button asChild>
              <Link to="/fichas/nova">Criar ficha técnica</Link>
            </Button>
          }
        />
      </>
    )
  }

  const usesSuggested = d.rows.some((r) => r.priceSource === 'sugerido')
  const breakEvenPct =
    d.breakEvenUnits !== null && d.monthlyProduction > 0
      ? Math.min(100, (d.breakEvenUnits / d.monthlyProduction) * 100)
      : 100
  const coversFixed = d.breakEvenUnits !== null && d.breakEvenUnits <= d.monthlyProduction

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          <>
            {d.rows.length} marmita(s) · produção de {formatNumber(d.monthlyProduction, 0)} por mês
            {usesSuggested && ' · sem preço praticado, usamos o preço sugerido'}
          </>
        }
      />

      <SoldOutAlertCard />
      <StockAlertCard />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4 [&>*]:min-w-0">
        <StatCard
          icon={Wallet}
          label="Custo médio"
          value={formatBRL(d.avgCost)}
          hint="por marmita, com fixos"
        />
        <StatCard icon={Tag} label="Preço médio" value={formatBRL(d.avgPrice)} hint="no canal principal" />
        <StatCard
          icon={TrendingUp}
          label="Margem média"
          term="margem"
          value={formatPercent(d.avgMargin)}
          tone={d.avgMargin < 0 ? 'bad' : d.avgMargin < minMargin ? 'bad' : 'good'}
          hint={`meta mínima ${formatPercent(minMargin, 0)}`}
        />
        <StatCard
          icon={PiggyBank}
          label="Lucro no mês"
          value={formatBRL(d.monthlyProfit)}
          tone={d.monthlyProfit < 0 ? 'bad' : 'good'}
          hint={`${formatBRL(d.avgProfit)} × ${formatNumber(d.monthlyProduction, 0)} marmitas`}
        />
      </div>

      <Card className="mb-4 gap-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Scale className="size-4" /> Ponto de equilíbrio <InfoTip term="pontoEquilibrio" />
          </CardTitle>
          <CardDescription>
            Custos fixos do mês: {formatBRL(d.monthlyFixed)} (contas, mão de obra e gás mensal)
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {d.breakEvenUnits === null ? (
            <p className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-700 dark:text-red-300">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              Com os preços atuais, cada venda não cobre nem os ingredientes, embalagens e taxas. Revise os
              preços em Precificação.
            </p>
          ) : (
            <>
              <p className="text-sm">
                Você precisa vender <strong className="text-xl">{formatNumber(d.breakEvenUnits, 0)}</strong>{' '}
                marmitas por mês (≈ {formatNumber(Math.ceil(d.breakEvenUnits / 26), 0)} por dia) para pagar os
                custos fixos.
              </p>
              <Progress value={breakEvenPct} className={cn(!coversFixed && '[&>*]:bg-destructive')} />
              <p
                className={cn(
                  'text-xs',
                  coversFixed ? 'text-muted-foreground' : 'font-medium text-red-600 dark:text-red-400',
                )}
              >
                {coversFixed
                  ? `Sua produção de ${formatNumber(d.monthlyProduction, 0)} cobre o ponto de equilíbrio: as ${formatNumber(
                      d.monthlyProduction - d.breakEvenUnits,
                      0,
                    )} marmitas a mais geram o lucro.`
                  : `Sua produção de ${formatNumber(d.monthlyProduction, 0)} fica abaixo do ponto de equilíbrio: faltam ${formatNumber(
                      d.breakEvenUnits - d.monthlyProduction,
                      0,
                    )} marmitas por mês.`}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mb-4 grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Para onde vai o dinheiro</CardTitle>
            <CardDescription>Composição do preço médio de uma marmita</CardDescription>
          </CardHeader>
          <CardContent>
            <CompositionChart slices={d.composition} avgPrice={d.avgPrice} />
            {d.avgProfit < 0 && (
              <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">
                Em média, cada marmita dá {formatBRL(Math.abs(d.avgProfit))} de prejuízo.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Margem de cada marmita</CardTitle>
            <CardDescription>Da mais lucrativa à menos lucrativa · linha = margem mínima</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            <MarginChart rows={d.rows} minMargin={minMargin} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" /> Mais lucrativas
            </CardTitle>
            <CardDescription>Lucro em R$ por marmita vendida</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {d.topProfitable.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma marmita dá lucro com os preços atuais.</p>
            )}
            {d.topProfitable.slice(0, 5).map((r, i) => (
              <Link
                key={r.pricing.recipe.id}
                to={`/fichas/${r.pricing.recipe.id}`}
                className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-muted"
              >
                <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                <RecipeThumb photo={r.pricing.recipe.photo} name={r.pricing.recipe.name} className="size-9" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.pricing.recipe.name}</span>
                <span className="text-right text-sm">
                  <span className="block font-semibold text-emerald-700 tabular-nums dark:text-emerald-400">
                    {formatBRL(r.profit)}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatPercent(r.margin)}
                  </span>
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="gap-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-red-500" /> Precisam de reajuste
            </CardTitle>
            <CardDescription>Prejuízo ou margem abaixo de {formatPercent(minMargin, 0)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {d.needsAdjustment.length === 0 && (
              <p className="text-sm text-muted-foreground">Tudo certo: todas as marmitas estão na meta. 🎉</p>
            )}
            {d.needsAdjustment.map((r) => (
              <div key={r.pricing.recipe.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.pricing.recipe.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <StatusBadge status={r.status} />
                    <span className="tabular-nums">
                      {formatPercent(r.margin)} · hoje {formatBRL(r.price)}
                    </span>
                  </p>
                </div>
                {r.pricing.suggested.ok && (
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">Sugerido</p>
                    <p className="text-sm font-bold text-primary tabular-nums">
                      {formatBRL(r.pricing.suggested.price)}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {d.needsAdjustment.length > 0 && (
              <Button variant="outline" size="sm" asChild className="mt-1 w-fit">
                <Link to="/precificacao">
                  <Calculator /> Ajustar preços <ArrowRight />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
