import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types'
import type { PricingContext } from './analysis'
import { calcDashboard } from './dashboard'

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
      updatedAt: '2026-10-01',
      priceHistory: [],
    },
  ],
  packaging: [],
  costs: {
    fixedCosts: [{ id: 'f', name: 'Aluguel', amount: 1000 }],
    labor: [],
    gas: { mode: 'mensal', monthly: 0, cylinderPrice: 0, mealsPerCylinder: 0 },
    monthlyProduction: 500, // fixo por marmita = R$ 2
  },
  fees: {
    salesTaxPercent: 0,
    cardFees: { pix: 0, debito: 0, credito: 0, dinheiro: 0 },
    deliveryCostPerMeal: 0,
    channels: [{ id: 'direto', name: 'WhatsApp', feePercent: 10, payment: 'pix', ownDelivery: false }],
  },
  pricing: { defaultMargin: 20, minMarginAlert: 15, primaryChannelId: 'direto' },
}

const base: Omit<Recipe, 'id' | 'name' | 'items'> = {
  category: 'fit',
  size: 'M',
  targetWeight: 0,
  packaging: [],
  createdAt: '2026-10-01',
}

// A: custo 5 + 2 = 7; preço 20 → taxas 2, lucro 11 (55%)
const a: Recipe = {
  ...base,
  id: 'a',
  name: 'A',
  items: [{ ingredientId: 'arroz', qty: 500 }],
  currentPrice: 20,
}
// B: custo 8 + 2 = 10; preço 11 → taxas 1,10, lucro −0,10 (prejuízo)
const b: Recipe = {
  ...base,
  id: 'b',
  name: 'B',
  items: [{ ingredientId: 'arroz', qty: 800 }],
  currentPrice: 11,
}
const extra: Recipe = { ...a, id: 'x', name: 'Extra', kind: 'adicional' }

describe('dashboard', () => {
  const d = calcDashboard([a, b, extra], ctx)

  it('ignora adicionais nas médias', () => {
    expect(d.rows.map((r) => r.pricing.recipe.id)).toEqual(['a', 'b'])
  })

  it('calcula médias e lucro do mês', () => {
    expect(d.avgCost).toBeCloseTo(8.5)
    expect(d.avgPrice).toBeCloseTo(15.5)
    expect(d.avgProfit).toBeCloseTo((11 - 0.1) / 2)
    expect(d.monthlyProfit).toBeCloseTo(((11 - 0.1) / 2) * 500)
  })

  it('ponto de equilíbrio usa a margem de contribuição', () => {
    // contribuição: A = 20 − 2 − 5 = 13; B = 11 − 1,1 − 8 = 1,9 → média 7,45
    expect(d.breakEvenUnits).toBe(Math.ceil(1000 / 7.45))
  })

  it('rankings', () => {
    expect(d.topProfitable.map((r) => r.pricing.recipe.id)).toEqual(['a'])
    expect(d.needsAdjustment.map((r) => r.pricing.recipe.id)).toEqual(['b'])
    expect(d.needsAdjustment[0].status).toBe('prejuizo')
  })

  it('composição soma o preço médio quando há lucro', () => {
    const total = d.composition.reduce((s, c) => s + c.value, 0)
    expect(total).toBeCloseTo(d.avgPrice)
  })

  it('sem preço praticado usa o sugerido', () => {
    const r = calcDashboard([{ ...a, currentPrice: undefined }], ctx)
    expect(r.rows[0].priceSource).toBe('sugerido')
    expect(r.rows[0].margin).toBeCloseTo(20)
  })

  it('sem marmitas não quebra', () => {
    const r = calcDashboard([], ctx)
    expect(r.avgPrice).toBe(0)
    expect(r.breakEvenUnits).toBeNull()
  })
})
