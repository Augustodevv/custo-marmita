import type { FeeSettings, SalesChannel } from '../types'
import { clamp, nonNeg, safeDiv } from './math'

export type MarginStatus = 'prejuizo' | 'baixa' | 'ok'

/**
 * % que sai do preço de venda num canal: imposto + comissão do canal + taxa da maquininha.
 * Quando o app cobra o cliente ("app"), a comissão do canal já inclui o pagamento.
 */
export function channelFeePercent(fees: FeeSettings, channel: SalesChannel): number {
  const card = channel.payment === 'app' ? 0 : nonNeg(fees.cardFees[channel.payment])
  return nonNeg(fees.salesTaxPercent) + nonNeg(channel.feePercent) + card
}

export interface UnitCostParts {
  ingredients: number
  packaging: number
  fixed: number
  delivery: number
  total: number
}

/** Custo total unitário = insumos + embalagem + custo fixo rateado + entrega (se você entrega). */
export function unitCost(
  directIngredients: number,
  directPackaging: number,
  fixedPerMeal: number,
  fees: FeeSettings,
  channel: SalesChannel,
): UnitCostParts {
  const delivery = channel.ownDelivery ? nonNeg(fees.deliveryCostPerMeal) : 0
  const ingredients = nonNeg(directIngredients)
  const packaging = nonNeg(directPackaging)
  const fixed = nonNeg(fixedPerMeal)
  return { ingredients, packaging, fixed, delivery, total: ingredients + packaging + fixed + delivery }
}

export type SuggestedPrice = { ok: true; price: number; markup: number } | { ok: false; reason: string }

/**
 * Markup: Preço = Custo ÷ (1 − (% impostos + % taxas + % margem)).
 * Se a soma dos percentuais chega a 100%, não existe preço possível.
 */
export function suggestedPrice(cost: number, feePercent: number, marginPercent: number): SuggestedPrice {
  const totalPct = nonNeg(feePercent) + nonNeg(marginPercent)
  const divisor = 1 - totalPct / 100
  if (divisor <= 0.0001) {
    return {
      ok: false,
      reason: `Impostos, taxas e margem somam ${totalPct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%. A soma precisa ficar abaixo de 100%.`,
    }
  }
  const price = nonNeg(cost) / divisor
  return { ok: true, price, markup: safeDiv(price, cost, 0) }
}

export interface PriceAnalysis {
  price: number
  /** R$ que vão para impostos e taxas */
  fees: number
  /** Lucro em R$ por marmita */
  profit: number
  /** Margem real (%): lucro ÷ preço */
  margin: number
  status: MarginStatus
}

export function analyzePrice(
  price: number,
  cost: number,
  feePercent: number,
  minMargin: number,
): PriceAnalysis {
  const p = nonNeg(price)
  const fees = (p * nonNeg(feePercent)) / 100
  const profit = p - nonNeg(cost) - fees
  const margin = p > 0 ? (profit / p) * 100 : profit < 0 ? -100 : 0
  return { price: p, fees, profit, margin, status: marginStatus(profit, margin, minMargin) }
}

export function marginStatus(profit: number, margin: number, minMargin: number): MarginStatus {
  if (profit < 0) return 'prejuizo'
  if (margin < minMargin) return 'baixa'
  return 'ok'
}

/**
 * Preço necessário num canal para manter o mesmo lucro em R$:
 * Preço = (custo no canal + lucro desejado) ÷ (1 − % taxas do canal).
 */
export function priceForProfit(cost: number, feePercent: number, profit: number): number | null {
  const divisor = 1 - clamp(nonNeg(feePercent), 0, 100) / 100
  if (divisor <= 0.0001) return null
  return (nonNeg(cost) + profit) / divisor
}
