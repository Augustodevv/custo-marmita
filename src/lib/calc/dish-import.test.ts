import { describe, expect, it } from 'vitest'
import { dishCatalog } from '../dish-catalog'
import type { Ingredient, Packaging } from '../types'
import { calcRecipeCost } from './recipe'
import { planDishImport } from './dish-import'

let n = 0
const id = () => `id${++n}`

const arroz: Ingredient = {
  id: 'meu-arroz',
  name: 'Arroz integral',
  category: 'carboidrato',
  packagePrice: 9,
  packageQty: 1,
  unit: 'kg',
  lossPercent: 0,
  cookingYield: 2.5,
  updatedAt: '2026-10-01',
  priceHistory: [],
}
const pote500: Packaging = {
  id: 'meu-pote',
  name: 'Pote 500 g',
  type: 'pote',
  capacity: 500,
  capacityUnit: 'g',
  packPrice: 50,
  packQty: 100,
}
const etiqueta: Packaging = { id: 'etq', name: 'Etiqueta', type: 'etiqueta', packPrice: 10, packQty: 100 }

describe('importar pratos do catálogo', () => {
  it('todos os pratos do catálogo têm ingredientes válidos e preço por tamanho coerente', () => {
    for (const g of dishCatalog)
      for (const d of g.dishes) {
        expect(d.items.length).toBeGreaterThan(0)
        expect(d.sizes.length).toBeGreaterThan(0)
      }
  })

  it('reaproveita ingredientes pelo nome e cria os que faltam', () => {
    const plan = planDishImport(
      [{ dishId: 'mc-risoto-vegetais', weight: 350 }],
      { ingredients: [arroz], packaging: [], recipes: [] },
      id,
      '2026-10-22',
    )
    const r = plan.recipes[0]
    expect(r.name).toBe('Risoto integral com vegetais (350 g)')
    expect(r.currentPrice).toBe(30)
    expect(r.category).toBe('vegetariana')
    expect(r.items.some((i) => i.ingredientId === 'meu-arroz')).toBe(true)
    expect(plan.newIngredients.some((i) => i.name === 'Arroz integral')).toBe(false)
    expect(plan.newIngredients.some((i) => i.name === 'Queijo parmesão ralado')).toBe(true)
  })

  it('escala as quantidades para 500 g e escolhe o pote que comporta', () => {
    const plan = planDishImport(
      [{ dishId: 'mc-risoto-vegetais', weight: 500 }],
      { ingredients: [arroz], packaging: [pote500, etiqueta], recipes: [] },
      id,
      '2026-10-22',
    )
    const r = plan.recipes[0]
    expect(r.size).toBe('M')
    expect(r.currentPrice).toBe(35)
    const total = r.items.reduce((s, i) => s + i.qty, 0)
    expect(total).toBeGreaterThanOrEqual(498)
    expect(total).toBeLessThanOrEqual(502)
    expect(r.packaging).toEqual([
      { packagingId: 'meu-pote', qty: 1 },
      { packagingId: 'etq', qty: 1 },
    ])
  })

  it('cria o pote do catálogo quando nenhum cadastrado serve (caldo usa pote de sopa)', () => {
    const plan = planDishImport(
      [
        { dishId: 'mc-caldo-verde', weight: 350 },
        { dishId: 'mc-creme-mandioquinha', weight: 350 },
      ],
      { ingredients: [], packaging: [pote500], recipes: [] },
      id,
      '2026-10-22',
    )
    expect(plan.newPackaging.map((p) => p.name)).toEqual(['Pote PP 350 ml (sopa, caldo)'])
    // o mesmo pote novo é usado nos dois caldos
    expect(plan.recipes[0].packaging[0].packagingId).toBe(plan.recipes[1].packaging[0].packagingId)
  })

  it('não duplica prato que já existe', () => {
    const plan = planDishImport(
      [{ dishId: 'mc-caldo-verde', weight: 350 }],
      {
        ingredients: [],
        packaging: [],
        recipes: [
          {
            id: 'x',
            name: 'Caldo verde fit (350 g)',
            category: 'caldos',
            size: 'P',
            targetWeight: 350,
            items: [],
            packaging: [],
            createdAt: '',
          },
        ],
      },
      id,
      '2026-10-22',
    )
    expect(plan.recipes).toHaveLength(0)
    expect(plan.skipped).toEqual(['Caldo verde fit (350 g)'])
  })

  it('o peso calculado da ficha bate com a porção', () => {
    const plan = planDishImport(
      [{ dishId: 'mc-lasanha-berinjela', weight: 350 }],
      { ingredients: [], packaging: [], recipes: [] },
      id,
      '2026-10-22',
    )
    const cost = calcRecipeCost(plan.recipes[0], plan.newIngredients, plan.newPackaging)
    expect(cost.totalWeight).toBe(350)
    expect(cost.ingredientsCost).toBeGreaterThan(0)
  })
})
