import { describe, expect, it } from 'vitest'
import type { Kit, Recipe } from '../types'
import type { PricingContext } from './analysis'
import { calcKit, maxDiscountFor } from './kits'

const ctx: PricingContext = {
  ingredients: [
    {
      id: 'arroz',
      name: 'Arroz',
      category: 'carboidrato',
      packagePrice: 10,
      packageQty: 1,
      unit: 'kg',
      lossPercent: 0,
      updatedAt: '',
      priceHistory: [],
    },
  ],
  packaging: [],
  costs: {
    fixedCosts: [],
    labor: [],
    gas: { mode: 'mensal', monthly: 0, cylinderPrice: 0, mealsPerCylinder: 0 },
    monthlyProduction: 100,
  },
  fees: {
    salesTaxPercent: 0,
    cardFees: { pix: 0, debito: 0, credito: 0, dinheiro: 0 },
    deliveryCostPerMeal: 3,
    channels: [{ id: 'direto', name: 'WhatsApp', feePercent: 0, payment: 'pix', ownDelivery: true }],
  },
  pricing: { defaultMargin: 20, minMarginAlert: 15, primaryChannelId: 'direto' },
}

// custo R$ 5 de ingredientes + R$ 3 de entrega; preço R$ 20
const recipe: Recipe = {
  id: 'r',
  name: 'Arroz',
  category: 'fit',
  size: 'M',
  targetWeight: 500,
  items: [{ ingredientId: 'arroz', qty: 500 }],
  packaging: [],
  createdAt: '',
  currentPrice: 20,
}

const kit: Kit = {
  id: 'k',
  name: 'Kit 5',
  items: [{ recipeId: 'r', qty: 5 }],
  discountPercent: 10,
  minMargin: 15,
}

describe('kits', () => {
  const k = calcKit(kit, [recipe], ctx)

  it('soma preços e aplica o desconto', () => {
    expect(k.meals).toBe(5)
    expect(k.fullPrice).toBe(100)
    expect(k.price).toBeCloseTo(90)
    expect(k.pricePerMeal).toBeCloseTo(18)
  })

  it('cobra uma entrega só para o kit', () => {
    expect(k.cost).toBeCloseTo(5 * 5 + 3)
  })

  it('mostra quanto a margem cai', () => {
    expect(k.marginFull).toBeCloseTo(72)
    expect(k.margin).toBeCloseTo((62 / 90) * 100)
    expect(k.marginDrop).toBeCloseTo(72 - (62 / 90) * 100)
  })

  it('desconto máximo mantém exatamente a margem mínima', () => {
    const d = maxDiscountFor(100, 28, 0, 15)
    const price = 100 * (1 - d / 100)
    expect(((price - 28) / price) * 100).toBeCloseTo(15)
    expect(k.maxDiscount).toBeCloseTo(d)
  })

  it('sem desconto possível quando nem o preço cheio atinge a margem', () => {
    expect(maxDiscountFor(100, 95, 0, 15)).toBe(0)
    expect(maxDiscountFor(100, 10, 50, 50)).toBe(0)
  })

  it('kit vazio não quebra', () => {
    const e = calcKit({ ...kit, items: [] }, [recipe], ctx)
    expect(e.price).toBe(0)
    expect(e.pricePerMeal).toBe(0)
  })
})
