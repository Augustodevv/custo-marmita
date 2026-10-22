import { describe, expect, it } from 'vitest'
import { sampleIngredients, samplePackaging, sampleRecipes } from './sample-data'
import { defaultCosts, removeSampleData } from './useAppStore'

describe('limpar dados de exemplo', () => {
  it('remove tudo que é exemplo quando não há fichas do usuário', () => {
    const r = removeSampleData({
      ingredients: sampleIngredients,
      packaging: samplePackaging,
      recipes: sampleRecipes,
      costs: defaultCosts,
      plan: { minha: 5, 's-r-frango': 10 },
    })
    expect(r.ingredients).toHaveLength(0)
    expect(r.packaging).toHaveLength(0)
    expect(r.recipes).toHaveLength(0)
    expect(r.costs.fixedCosts).toHaveLength(0)
    expect(r.costs.labor).toHaveLength(0)
    expect(r.costs.monthlyProduction).toBe(defaultCosts.monthlyProduction)
  })

  it('mantém itens de exemplo usados em fichas do usuário', () => {
    const mine = {
      ...sampleRecipes[0],
      id: 'minha',
      sample: false,
      items: [{ ingredientId: 's-frango', qty: 100 }],
      packaging: [{ packagingId: 's-pote-750', qty: 1 }],
    }
    const r = removeSampleData({
      ingredients: sampleIngredients,
      packaging: samplePackaging,
      recipes: [...sampleRecipes, mine],
      costs: defaultCosts,
      plan: { minha: 5, 's-r-frango': 10 },
    })
    expect(r.recipes.map((x) => x.id)).toEqual(['minha'])
    expect(r.ingredients.map((x) => x.id)).toEqual(['s-frango'])
    expect(r.ingredients[0].sample).toBe(false)
    expect(r.packaging.map((x) => x.id)).toEqual(['s-pote-750'])
    expect(r.plan).toEqual({ minha: 5 })
  })
})
