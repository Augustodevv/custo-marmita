import type { BaseUnit, Ingredient, Packaging, Recipe } from '../types'
import { nonNeg, sum } from './math'
import { baseUnitOf, costPerBaseUnit, packagingUnitCost } from './units'

export interface RecipeItemCost {
  ingredientId: string
  name: string
  qty: number
  baseUnit: BaseUnit
  cost: number
  /** Ingrediente foi excluído do cadastro */
  missing: boolean
}

export interface RecipePackagingCost {
  packagingId: string
  name: string
  qty: number
  cost: number
  missing: boolean
}

export interface RecipeCost {
  items: RecipeItemCost[]
  packagingItems: RecipePackagingCost[]
  /** CMV: custo da mercadoria vendida (só ingredientes) */
  ingredientsCost: number
  packagingCost: number
  /** Ingredientes + embalagens */
  directCost: number
  /** Peso da porção em gramas (ml conta como g; "un" usa o peso unitário, se informado) */
  totalWeight: number
}

export function itemWeight(ing: Ingredient | undefined, qty: number): number {
  if (!ing) return 0
  const base = baseUnitOf(ing.unit)
  if (base === 'un') return nonNeg(ing.unitWeight) * nonNeg(qty)
  return nonNeg(qty)
}

export function calcRecipeCost(
  recipe: Pick<Recipe, 'items' | 'packaging'>,
  ingredients: Ingredient[],
  packaging: Packaging[],
): RecipeCost {
  const ingMap = new Map(ingredients.map((i) => [i.id, i]))
  const packMap = new Map(packaging.map((p) => [p.id, p]))

  const items: RecipeItemCost[] = recipe.items.map((it) => {
    const ing = ingMap.get(it.ingredientId)
    const qty = nonNeg(it.qty)
    return {
      ingredientId: it.ingredientId,
      name: ing?.name ?? 'Ingrediente removido',
      qty,
      baseUnit: ing ? baseUnitOf(ing.unit) : 'g',
      cost: ing ? costPerBaseUnit(ing) * qty : 0,
      missing: !ing,
    }
  })

  const packagingItems: RecipePackagingCost[] = recipe.packaging.map((pk) => {
    const p = packMap.get(pk.packagingId)
    const qty = nonNeg(pk.qty)
    return {
      packagingId: pk.packagingId,
      name: p?.name ?? 'Embalagem removida',
      qty,
      cost: p ? packagingUnitCost(p) * qty : 0,
      missing: !p,
    }
  })

  const ingredientsCost = sum(items.map((i) => i.cost))
  const packagingCost = sum(packagingItems.map((p) => p.cost))
  const totalWeight = sum(recipe.items.map((it) => itemWeight(ingMap.get(it.ingredientId), it.qty)))

  return {
    items,
    packagingItems,
    ingredientsCost,
    packagingCost,
    directCost: ingredientsCost + packagingCost,
    totalWeight,
  }
}

/** Cria uma cópia da ficha para variações (ex.: versão G da mesma marmita). */
export function duplicateRecipe(recipe: Recipe, newId: string, now: string): Recipe {
  return {
    ...recipe,
    id: newId,
    name: `${recipe.name} (cópia)`,
    items: recipe.items.map((i) => ({ ...i })),
    packaging: recipe.packaging.map((p) => ({ ...p })),
    createdAt: now,
    sample: false,
  }
}

/**
 * Capacidade total dos potes da ficha (ml conta como g). `null` quando nenhum
 * pote tem capacidade informada.
 */
export function potCapacity(recipe: Pick<Recipe, 'packaging'>, packaging: Packaging[]): number | null {
  const map = new Map(packaging.map((p) => [p.id, p]))
  let total = 0
  let known = false
  for (const pk of recipe.packaging) {
    const p = map.get(pk.packagingId)
    if (p?.type === 'pote' && p.capacity && p.capacity > 0) {
      total += p.capacity * nonNeg(pk.qty)
      known = true
    }
  }
  return known ? total : null
}
