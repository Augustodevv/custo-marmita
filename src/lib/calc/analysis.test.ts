import { describe, expect, it } from 'vitest'
import type { PricingContext } from './analysis'
import { compareChannels, priceRecipe } from './analysis'
import type { Recipe } from '../types'

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
  packaging: [{ id: 'pote', name: 'Pote', type: 'pote', packPrice: 100, packQty: 100 }],
  costs: {
    fixedCosts: [{ id: 'f', name: 'Aluguel', amount: 1000 }],
    labor: [],
    gas: { mode: 'mensal', monthly: 0, cylinderPrice: 0, mealsPerCylinder: 0 },
    monthlyProduction: 500,
  },
  fees: {
    salesTaxPercent: 0,
    cardFees: { pix: 0, debito: 0, credito: 0, dinheiro: 0 },
    deliveryCostPerMeal: 2,
    channels: [
      { id: 'direto', name: 'WhatsApp', feePercent: 0, payment: 'pix', ownDelivery: true },
      { id: 'ifood', name: 'iFood', feePercent: 25, payment: 'app', ownDelivery: false },
    ],
  },
  pricing: { defaultMargin: 20, minMarginAlert: 15, primaryChannelId: 'direto' },
}

// 500 g de arroz (R$ 5) + pote (R$ 1) + fixo (R$ 2) + entrega (R$ 2) = R$ 10 no WhatsApp
const recipe: Recipe = {
  id: 'r',
  name: 'Teste',
  category: 'fit',
  size: 'M',
  targetWeight: 500,
  items: [{ ingredientId: 'arroz', qty: 500 }],
  packaging: [{ packagingId: 'pote', qty: 1 }],
  createdAt: '2026-10-01',
  currentPrice: 15,
}

describe('precificação completa da marmita', () => {
  it('soma insumos + embalagem + fixo rateado + entrega', () => {
    const p = priceRecipe(recipe, ctx)
    expect(p.cost.total).toBeCloseTo(10)
    expect(p.suggested.ok && p.suggested.price).toBeCloseTo(12.5) // 10 ÷ 0,8
    expect(p.current?.profit).toBeCloseTo(5)
    expect(p.current?.margin).toBeCloseTo(33.33, 1)
  })

  it('compara canais mantendo o mesmo lucro em R$', () => {
    const { referenceProfit, rows } = compareChannels(recipe, ctx)
    expect(referenceProfit).toBeCloseTo(5)
    const ifood = rows.find((r) => r.channel.id === 'ifood')!
    expect(ifood.cost).toBeCloseTo(8) // sem entrega própria
    expect(ifood.sameProfitPrice).toBeCloseTo(13 / 0.75)
  })

  it('se o preço de hoje dá prejuízo, compara pelo lucro do preço sugerido', () => {
    const c = compareChannels({ ...recipe, currentPrice: 8 }, ctx)
    expect(c.basis).toBe('sugerido')
    expect(c.referenceProfit).toBeCloseTo(2.5) // 12,50 × 20%
  })

  it('adicional não recebe rateio de custo fixo nem entrega', () => {
    const p = priceRecipe({ ...recipe, kind: 'adicional' }, ctx)
    expect(p.cost.fixed).toBe(0)
    expect(p.cost.delivery).toBe(0)
    expect(p.cost.total).toBeCloseTo(6) // arroz R$ 5 + pote R$ 1
  })
})
