import type { Recipe } from '../types'
import { isExtra, priceRecipe, type PricingContext, type RecipePricing } from './analysis'
import { calcFixedCosts } from './fixed'
import { analyzePrice, type MarginStatus } from './pricing'
import { nonNeg, safeDiv } from './math'

export interface DashboardRow {
  pricing: RecipePricing
  /** Preço considerado: o praticado; se não houver, o sugerido */
  price: number
  priceSource: 'praticado' | 'sugerido'
  fees: number
  profit: number
  margin: number
  status: MarginStatus
  /** Sobra de cada venda para pagar os custos fixos: preço − custos variáveis − taxas */
  contribution: number
}

export interface CostSlice {
  key: 'ingredientes' | 'embalagem' | 'fixos' | 'entrega' | 'taxas' | 'lucro'
  label: string
  /** Valor médio por marmita em R$ */
  value: number
}

export interface DashboardData {
  rows: DashboardRow[]
  /** Marmitas sem preço possível (taxas + margem ≥ 100% e sem preço praticado) */
  unpriced: Recipe[]
  avgCost: number
  avgPrice: number
  avgMargin: number
  avgProfit: number
  monthlyProduction: number
  /** Lucro estimado no mês = lucro médio × produção mensal */
  monthlyProfit: number
  monthlyRevenue: number
  /** Custos fixos do mês (contas + mão de obra + gás mensal) */
  monthlyFixed: number
  /** Marmitas/mês para cobrir os custos fixos; null quando cada venda não sobra nada */
  breakEvenUnits: number | null
  composition: CostSlice[]
  /** Mais lucrativas em R$ por marmita (melhor primeiro) */
  topProfitable: DashboardRow[]
  /** Prejuízo ou margem abaixo do mínimo (pior primeiro) */
  needsAdjustment: DashboardRow[]
}

const mean = (values: number[]) =>
  safeDiv(
    values.reduce((a, b) => a + b, 0),
    values.length,
  )

/**
 * Indicadores do negócio. Considera só marmitas (adicionais ficam fora das médias)
 * e supõe vendas iguais entre os pratos.
 */
export function calcDashboard(recipes: Recipe[], ctx: PricingContext): DashboardData {
  const fixed = calcFixedCosts(ctx.costs)
  const minMargin = ctx.pricing.minMarginAlert
  const unpriced: Recipe[] = []
  const rows: DashboardRow[] = []

  for (const recipe of recipes.filter((r) => !isExtra(r))) {
    const pricing = priceRecipe(recipe, ctx)
    const price = pricing.current?.price ?? (pricing.suggested.ok ? pricing.suggested.price : null)
    if (price === null) {
      unpriced.push(recipe)
      continue
    }
    const a = analyzePrice(price, pricing.cost.total, pricing.feePercent, minMargin)
    // Custos variáveis: o que só existe se a marmita for produzida (o rateio fica de fora)
    const variable =
      pricing.cost.ingredients + pricing.cost.packaging + pricing.cost.delivery + fixed.gasPerMeal
    rows.push({
      pricing,
      price,
      priceSource: pricing.current ? 'praticado' : 'sugerido',
      fees: a.fees,
      profit: a.profit,
      margin: a.margin,
      status: a.status,
      contribution: price - a.fees - variable,
    })
  }

  const production = nonNeg(ctx.costs.monthlyProduction)
  const avgProfit = mean(rows.map((r) => r.profit))
  const avgPrice = mean(rows.map((r) => r.price))
  const avgContribution = mean(rows.map((r) => r.contribution))
  const monthlyFixed = fixed.monthlyTotal

  const avgOf = (pick: (r: DashboardRow) => number) => mean(rows.map(pick))
  const composition: CostSlice[] = [
    { key: 'ingredientes', label: 'Ingredientes', value: avgOf((r) => r.pricing.cost.ingredients) },
    { key: 'embalagem', label: 'Embalagem', value: avgOf((r) => r.pricing.cost.packaging) },
    { key: 'fixos', label: 'Custos fixos', value: avgOf((r) => r.pricing.cost.fixed) },
    { key: 'entrega', label: 'Entrega', value: avgOf((r) => r.pricing.cost.delivery) },
    { key: 'taxas', label: 'Impostos e taxas', value: avgOf((r) => r.fees) },
    { key: 'lucro', label: 'Lucro', value: Math.max(0, avgProfit) },
  ]

  return {
    rows,
    unpriced,
    avgCost: avgOf((r) => r.pricing.cost.total),
    avgPrice,
    avgMargin: avgOf((r) => r.margin),
    avgProfit,
    monthlyProduction: production,
    monthlyProfit: avgProfit * production,
    monthlyRevenue: avgPrice * production,
    monthlyFixed,
    breakEvenUnits:
      rows.length === 0 || avgContribution <= 0 ? null : Math.ceil(monthlyFixed / avgContribution),
    composition,
    topProfitable: [...rows].filter((r) => r.profit > 0).sort((a, b) => b.profit - a.profit),
    needsAdjustment: [...rows].filter((r) => r.status !== 'ok').sort((a, b) => a.margin - b.margin),
  }
}
