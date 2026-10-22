import type { Kit, Recipe } from '../types'
import { priceRecipe, type PricingContext } from './analysis'
import { clamp, nonNeg, safeDiv } from './math'

export interface KitLine {
  recipe: Recipe
  qty: number
  /** Preço unitário usado (praticado; se não houver, o sugerido) */
  unitPrice: number
  /** Custo unitário sem a entrega (a entrega do kit é uma só) */
  unitCost: number
}

export interface KitResult {
  lines: KitLine[]
  meals: number
  /** Soma dos preços sem desconto */
  fullPrice: number
  /** Preço com desconto */
  price: number
  pricePerMeal: number
  /** Custo total: marmitas + uma entrega */
  cost: number
  feePercent: number
  profitFull: number
  marginFull: number
  profit: number
  margin: number
  /** Quanto a margem cai, em pontos percentuais */
  marginDrop: number
  /** Maior desconto (%) que mantém a margem mínima; 0 se nem sem desconto ela é atingida */
  maxDiscount: number
  /** Margem mínima é inatingível mesmo sem desconto */
  belowMinWithoutDiscount: boolean
}

const marginOf = (price: number, cost: number, fee: number) => {
  const profit = price * (1 - fee / 100) - cost
  return { profit, margin: price > 0 ? (profit / price) * 100 : 0 }
}

/**
 * Desconto máximo d para manter a margem mínima m:
 * P(1−d)(1−f) − C ≥ m·P(1−d)  ⇒  d ≤ 1 − C ÷ (P·(1 − f − m))
 */
export function maxDiscountFor(
  fullPrice: number,
  cost: number,
  feePercent: number,
  minMargin: number,
): number {
  const k = 1 - (nonNeg(feePercent) + nonNeg(minMargin)) / 100
  if (fullPrice <= 0 || k <= 0) return 0
  const d = 1 - safeDiv(cost, fullPrice * k, Infinity)
  return clamp(d * 100, 0, 100)
}

export function calcKit(kit: Kit, recipes: Recipe[], ctx: PricingContext): KitResult {
  const byId = new Map(recipes.map((r) => [r.id, r]))
  const lines: KitLine[] = []
  let delivery = 0
  let feePercent = 0
  for (const it of kit.items) {
    const recipe = byId.get(it.recipeId)
    const qty = nonNeg(it.qty)
    if (!recipe || qty <= 0) continue
    const p = priceRecipe(recipe, ctx)
    feePercent = p.feePercent
    delivery = Math.max(delivery, p.cost.delivery)
    const unitPrice = p.current?.price ?? (p.suggested.ok ? p.suggested.price : 0)
    lines.push({ recipe, qty, unitPrice, unitCost: p.cost.total - p.cost.delivery })
  }
  const meals = lines.reduce((s, l) => s + l.qty, 0)
  const fullPrice = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0)
  const cost = lines.reduce((s, l) => s + l.unitCost * l.qty, 0) + (meals > 0 ? delivery : 0)
  const discount = clamp(nonNeg(kit.discountPercent), 0, 100)
  const price = fullPrice * (1 - discount / 100)
  const full = marginOf(fullPrice, cost, feePercent)
  const now = marginOf(price, cost, feePercent)
  return {
    lines,
    meals,
    fullPrice,
    price,
    pricePerMeal: safeDiv(price, meals),
    cost,
    feePercent,
    profitFull: full.profit,
    marginFull: full.margin,
    profit: now.profit,
    margin: now.margin,
    marginDrop: full.margin - now.margin,
    maxDiscount: maxDiscountFor(fullPrice, cost, feePercent, kit.minMargin),
    belowMinWithoutDiscount: fullPrice > 0 && full.margin < kit.minMargin,
  }
}
