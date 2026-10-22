import { describe, expect, it } from 'vitest'
import type { Ingredient, Packaging, Recipe } from '../types'
import { calcShoppingList, productionChanges, purchaseChanges } from './shopping'
import { applyStockChanges, stockAlerts, stockStatus } from './stock'

const ingredients: Ingredient[] = [
  {
    id: 'frango',
    name: 'Frango',
    category: 'proteina',
    packagePrice: 20,
    packageQty: 1,
    unit: 'kg',
    lossPercent: 25,
    updatedAt: '2026-10-01',
    priceHistory: [],
    stockQty: 500,
    minStock: 1000,
  },
  {
    id: 'arroz',
    name: 'Arroz',
    category: 'carboidrato',
    packagePrice: 25,
    packageQty: 5,
    unit: 'kg',
    lossPercent: 0,
    cookingYield: 2.5,
    updatedAt: '2026-10-01',
    priceHistory: [],
  },
]
const packaging: Packaging[] = [
  { id: 'pote', name: 'Pote', type: 'pote', packPrice: 50, packQty: 100, stockQty: 30, minStock: 20 },
]
const recipe: Recipe = {
  id: 'r',
  name: 'Frango com arroz',
  category: 'fit',
  size: 'M',
  targetWeight: 0,
  items: [
    { ingredientId: 'frango', qty: 150 },
    { ingredientId: 'arroz', qty: 250 },
  ],
  packaging: [{ packagingId: 'pote', qty: 1 }],
  createdAt: '2026-10-01',
}
const plan = { r: 20 }

describe('lista de compras', () => {
  it('soma a quantidade bruta considerando a perda e o índice de cocção', () => {
    const l = calcShoppingList(plan, [recipe], ingredients, packaging, { useStock: false })
    const frango = l.lines.find((x) => x.id === 'frango')!
    const arroz = l.lines.find((x) => x.id === 'arroz')!
    expect(frango.needed).toBeCloseTo(4000) // 150 g pronto ÷ 0,75 × 20
    expect(arroz.needed).toBeCloseTo(2000) // 250 g cozido ÷ 2,5 × 20
    expect(frango.packages).toBe(4)
    expect(arroz.packages).toBe(1) // pacote de 5 kg
    expect(l.totalMeals).toBe(20)
  })

  it('custo estimado por embalagem fechada e proporcional', () => {
    const l = calcShoppingList(plan, [recipe], ingredients, packaging, { useStock: false })
    expect(l.totalCost).toBeCloseTo(4 * 20 + 25 + 50)
    expect(l.totalExactCost).toBeCloseTo(80 + 10 + 10)
  })

  it('desconta o estoque e repõe o mínimo', () => {
    const l = calcShoppingList(plan, [recipe], ingredients, packaging, { useStock: true })
    const frango = l.lines.find((x) => x.id === 'frango')!
    const pote = l.lines.find((x) => x.id === 'pote')!
    expect(frango.toBuy).toBeCloseTo(4000 + 1000 - 500)
    expect(frango.packages).toBe(5)
    expect(pote.toBuy).toBe(20 + 20 - 30)
  })

  it('inclui item abaixo do mínimo mesmo sem produção', () => {
    const l = calcShoppingList({}, [recipe], ingredients, packaging, { useStock: true })
    expect(l.toBuyLines.map((x) => x.id)).toEqual(['frango'])
  })

  it('plano vazio sem estoque controlado gera lista vazia', () => {
    const l = calcShoppingList({}, [recipe], ingredients, packaging, { useStock: false })
    expect(l.lines).toHaveLength(0)
    expect(l.totalCost).toBe(0)
  })
})

describe('estoque', () => {
  it('situação do estoque', () => {
    expect(stockStatus({})).toBe('sem-controle')
    expect(stockStatus({ stockQty: 0, minStock: 10 })).toBe('zerado')
    expect(stockStatus({ stockQty: 5, minStock: 10 })).toBe('baixo')
    expect(stockStatus({ stockQty: 15, minStock: 10 })).toBe('ok')
  })

  it('alertas listam zerados primeiro', () => {
    const a = stockAlerts(
      [...ingredients, { ...ingredients[1], id: 'ovo', name: 'Ovo', stockQty: 0, minStock: 30 }],
      packaging,
    )
    expect(a.map((x) => x.id)).toEqual(['ovo', 'frango'])
  })

  it('compra dá entrada e produção dá baixa, sem ficar negativo', () => {
    const l = calcShoppingList(plan, [recipe], ingredients, packaging, { useStock: true })
    const afterBuy = applyStockChanges(ingredients, purchaseChanges(l), 'ingrediente')
    expect(afterBuy[0].stockQty).toBe(500 + 5000)
    const afterProd = applyStockChanges(
      afterBuy,
      productionChanges(plan, [recipe], ingredients),
      'ingrediente',
    )
    expect(afterProd[0].stockQty).toBeCloseTo(5500 - 4000)
    const tooMuch = applyStockChanges(
      ingredients,
      [{ kind: 'ingrediente', id: 'frango', delta: -99999 }],
      'ingrediente',
    )
    expect(tooMuch[0].stockQty).toBe(0)
  })
})
