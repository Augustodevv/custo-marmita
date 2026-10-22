import type {
  CostSettings,
  FeeSettings,
  Ingredient,
  Packaging,
  PricingSettings,
  Recipe,
  SalesChannel,
} from '../types'
import { calcFixedCosts } from './fixed'
import {
  analyzePrice,
  channelFeePercent,
  priceForProfit,
  suggestedPrice,
  unitCost,
  type PriceAnalysis,
  type SuggestedPrice,
  type UnitCostParts,
} from './pricing'
import { calcRecipeCost, type RecipeCost } from './recipe'

/** Tudo o que o cálculo de preço precisa (subconjunto do estado do app). */
export interface PricingContext {
  ingredients: Ingredient[]
  packaging: Packaging[]
  costs: CostSettings
  fees: FeeSettings
  pricing: PricingSettings
}

export interface RecipePricing {
  recipe: Recipe
  recipeCost: RecipeCost
  channel: SalesChannel
  feePercent: number
  cost: UnitCostParts
  desiredMargin: number
  suggested: SuggestedPrice
  /** Análise do preço praticado hoje (no canal principal), se informado */
  current?: PriceAnalysis
}

const FALLBACK_CHANNEL: SalesChannel = {
  id: 'direto',
  name: 'Direto',
  feePercent: 0,
  payment: 'pix',
  ownDelivery: false,
}

export function primaryChannel(ctx: Pick<PricingContext, 'fees' | 'pricing'>): SalesChannel {
  return (
    ctx.fees.channels.find((c) => c.id === ctx.pricing.primaryChannelId) ??
    ctx.fees.channels[0] ??
    FALLBACK_CHANNEL
  )
}

export const isExtra = (r: Pick<Recipe, 'kind'>) => r.kind === 'adicional'

export function priceRecipe(
  recipe: Recipe,
  ctx: PricingContext,
  channel = primaryChannel(ctx),
): RecipePricing {
  const recipeCost = calcRecipeCost(recipe, ctx.ingredients, ctx.packaging)
  const feePercent = channelFeePercent(ctx.fees, channel)
  // Adicionais vão junto com uma marmita: não recebem rateio de custo fixo nem entrega
  const extra = isExtra(recipe)
  const fixedPerMeal = extra ? 0 : calcFixedCosts(ctx.costs).perMeal
  const cost = unitCost(
    recipeCost.ingredientsCost,
    recipeCost.packagingCost,
    fixedPerMeal,
    ctx.fees,
    extra ? { ...channel, ownDelivery: false } : channel,
  )
  const desiredMargin = recipe.desiredMargin ?? ctx.pricing.defaultMargin
  const isPrimary = channel.id === primaryChannel(ctx).id
  const current =
    isPrimary && recipe.currentPrice && recipe.currentPrice > 0
      ? analyzePrice(recipe.currentPrice, cost.total, feePercent, ctx.pricing.minMarginAlert)
      : undefined
  return {
    recipe,
    recipeCost,
    channel,
    feePercent,
    cost,
    desiredMargin,
    suggested: suggestedPrice(cost.total, feePercent, desiredMargin),
    current,
  }
}

export interface ChannelRow {
  channel: SalesChannel
  feePercent: number
  cost: number
  /** Preço pelo markup com a margem desejada */
  suggested: SuggestedPrice
  /** Preço necessário para ter o mesmo lucro em R$ do canal principal */
  sameProfitPrice: number | null
}

export interface ChannelComparison {
  /** Lucro em R$ que se quer manter em todos os canais */
  referenceProfit: number | null
  /** De onde veio o lucro de referência */
  basis: 'atual' | 'sugerido' | null
  rows: ChannelRow[]
}

/**
 * Compara canais: quanto cobrar em cada um para manter o mesmo lucro em R$
 * que você tem no canal principal. Usa o preço praticado; se não houver
 * (ou se ele der prejuízo), usa o preço sugerido.
 */
export function compareChannels(recipe: Recipe, ctx: PricingContext): ChannelComparison {
  const base = priceRecipe(recipe, ctx)
  let referenceProfit: number | null = null
  let basis: ChannelComparison['basis'] = null
  if (base.current && base.current.profit > 0) {
    referenceProfit = base.current.profit
    basis = 'atual'
  } else if (base.suggested.ok) {
    referenceProfit = analyzePrice(base.suggested.price, base.cost.total, base.feePercent, 0).profit
    basis = 'sugerido'
  }

  const rows = ctx.fees.channels.map((channel) => {
    const p = priceRecipe(recipe, ctx, channel)
    return {
      channel,
      feePercent: p.feePercent,
      cost: p.cost.total,
      suggested: p.suggested,
      sameProfitPrice:
        referenceProfit === null ? null : priceForProfit(p.cost.total, p.feePercent, referenceProfit),
    }
  })
  return { referenceProfit, basis, rows }
}
