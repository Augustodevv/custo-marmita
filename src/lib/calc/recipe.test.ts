import { describe, expect, it } from 'vitest'
import type { Ingredient, Packaging, Recipe } from '../types'
import { calcRecipeCost, duplicateRecipe } from './recipe'

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
  },
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
  {
    id: 'ovo',
    name: 'Ovo',
    category: 'proteina',
    packagePrice: 12,
    packageQty: 12,
    unit: 'un',
    lossPercent: 0,
    unitWeight: 50,
    updatedAt: '2026-10-01',
    priceHistory: [],
  },
]

const packaging: Packaging[] = [
  { id: 'pote', name: 'Pote 750 ml', type: 'pote', packPrice: 50, packQty: 100 },
  { id: 'etq', name: 'Etiqueta', type: 'etiqueta', packPrice: 10, packQty: 100 },
]

const recipe: Recipe = {
  id: 'r1',
  name: 'Frango com arroz',
  category: 'fit',
  size: 'M',
  targetWeight: 400,
  items: [
    { ingredientId: 'frango', qty: 150 },
    { ingredientId: 'arroz', qty: 200 },
    { ingredientId: 'ovo', qty: 1 },
  ],
  packaging: [
    { packagingId: 'pote', qty: 1 },
    { packagingId: 'etq', qty: 2 },
  ],
  createdAt: '2026-10-01',
}

describe('ficha técnica', () => {
  const r = calcRecipeCost(recipe, ingredients, packaging)

  it('calcula custo de cada ingrediente na porção', () => {
    expect(r.items[0].cost).toBeCloseTo(4) // 150 g × R$20/750 g
    expect(r.items[1].cost).toBeCloseTo(2) // 200 g × R$0,01
    expect(r.items[2].cost).toBeCloseTo(1) // 1 ovo
  })

  it('soma CMV, embalagem e custo direto', () => {
    expect(r.ingredientsCost).toBeCloseTo(7)
    expect(r.packagingCost).toBeCloseTo(0.7) // 0,50 + 2 × 0,10
    expect(r.directCost).toBeCloseTo(7.7)
  })

  it('peso total usa peso unitário para itens em unidade', () => {
    expect(r.totalWeight).toBe(400)
  })

  it('ingrediente removido não quebra o cálculo', () => {
    const r2 = calcRecipeCost(
      { ...recipe, items: [{ ingredientId: 'nao-existe', qty: 100 }] },
      ingredients,
      packaging,
    )
    expect(r2.items[0].missing).toBe(true)
    expect(r2.ingredientsCost).toBe(0)
  })

  it('duplicar cria cópia independente', () => {
    const copy = duplicateRecipe(recipe, 'r2', '2026-10-22')
    expect(copy.id).toBe('r2')
    expect(copy.name).toBe('Frango com arroz (cópia)')
    copy.items[0].qty = 999
    expect(recipe.items[0].qty).toBe(150)
  })
})
