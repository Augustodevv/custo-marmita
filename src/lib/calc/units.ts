import type { BaseUnit, Ingredient, Packaging, PriceEntry, Unit } from '../types'
import { clamp, nonNeg, safeDiv } from './math'

export const MAX_LOSS_PERCENT = 95

const FACTORS: Record<Unit, { base: BaseUnit; factor: number }> = {
  g: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  L: { base: 'ml', factor: 1000 },
  un: { base: 'un', factor: 1 },
}

export function baseUnitOf(unit: Unit): BaseUnit {
  return FACTORS[unit].base
}

/** Converte uma quantidade para a unidade-base (kg → g, L → ml). */
export function toBaseQty(qty: number, unit: Unit): number {
  return nonNeg(qty) * FACTORS[unit].factor
}

export const MAX_COOKING_YIELD = 10

/**
 * Rendimento: quanto de produto pronto sai de 1 unidade comprada.
 * Perda de 25% → 0,75. Arroz com índice de cocção 2,5 → 2,5.
 */
export function yieldFraction(lossPercent: number, cookingYield = 1): number {
  const cy = cookingYield > 0 ? clamp(cookingYield, 0.1, MAX_COOKING_YIELD) : 1
  return (1 - clamp(nonNeg(lossPercent), 0, MAX_LOSS_PERCENT) / 100) * cy
}

/**
 * Custo por unidade-base (g, ml ou un) do ingrediente JÁ PRONTO, considerando a perda.
 * Ex.: 1 kg de frango a R$ 20 com 25% de perda → 750 g aproveitáveis → R$ 0,02667/g.
 */
export function costPerBaseUnit(
  ing: Pick<Ingredient, 'packagePrice' | 'packageQty' | 'unit' | 'lossPercent' | 'cookingYield'>,
): number {
  const usable = toBaseQty(ing.packageQty, ing.unit) * yieldFraction(ing.lossPercent, ing.cookingYield)
  return safeDiv(nonNeg(ing.packagePrice), usable)
}

/** Custo por unidade-base SEM considerar a perda (preço de compra bruto). */
export function rawCostPerBaseUnit(ing: Pick<Ingredient, 'packagePrice' | 'packageQty' | 'unit'>): number {
  return safeDiv(nonNeg(ing.packagePrice), toBaseQty(ing.packageQty, ing.unit))
}

/** Quantidade bruta a comprar para obter `readyQty` pronta (inverso do rendimento). */
export function grossQty(readyQty: number, lossPercent: number, cookingYield = 1): number {
  return safeDiv(nonNeg(readyQty), yieldFraction(lossPercent, cookingYield))
}

/** Custo unitário de uma embalagem/descartável. */
export function packagingUnitCost(p: Pick<Packaging, 'packPrice' | 'packQty'>): number {
  return safeDiv(nonNeg(p.packPrice), nonNeg(p.packQty))
}

/** Variação % entre o preço atual e o anterior. `null` quando não há histórico. */
export function priceVariation(current: number, history: PriceEntry[]): number | null {
  const prev = history.at(-1)
  if (!prev || prev.price <= 0) return null
  return ((current - prev.price) / prev.price) * 100
}

/**
 * Registra novo preço: o preço atual vai para o histórico e o novo passa a valer.
 * Retorna um novo objeto (imutável).
 */
export function applyPriceUpdate<T extends Ingredient>(ing: T, newPrice: number, date: string): T {
  return {
    ...ing,
    priceHistory: [...ing.priceHistory, { price: ing.packagePrice, date: ing.updatedAt }],
    packagePrice: nonNeg(newPrice),
    updatedAt: date,
  }
}
