import { catalogIngredients, dishCatalog, type CatalogDish } from '../dish-catalog'
import { catalogKey, packagingCatalog } from '../packaging-catalog'
import type { Ingredient, Packaging, Recipe, RecipePackaging, RecipeSize } from '../types'
import { baseUnitOf } from './units'

export interface DishSelection {
  dishId: string
  /** Peso da porção escolhida (um dos tamanhos do prato) */
  weight: number
}

export interface DishImportPlan {
  newIngredients: Ingredient[]
  newPackaging: Packaging[]
  recipes: Omit<Recipe, 'id' | 'createdAt'>[]
  /** Pratos que já existiam (mesmo nome) e foram ignorados */
  skipped: string[]
}

export const allCatalogDishes = (): CatalogDish[] => dishCatalog.flatMap((g) => g.dishes)

export function dishRecipeName(dish: CatalogDish, weight: number): string {
  return dish.sizes.length > 1 ? `${dish.name} (${weight} g)` : dish.name
}

export function sizeForWeight(weight: number): RecipeSize {
  if (weight <= 380) return 'P'
  if (weight <= 550) return 'M'
  return 'G'
}

const isSoupPot = (p: Pick<Packaging, 'name'>) => /sopa|caldo/i.test(p.name)

/**
 * Monta as fichas técnicas dos pratos escolhidos no catálogo, reaproveitando
 * ingredientes e embalagens já cadastrados (pelo nome) e criando os que faltam.
 * Função pura: quem chama decide como gravar o resultado.
 */
export function planDishImport(
  selections: DishSelection[],
  existing: { ingredients: Ingredient[]; packaging: Packaging[]; recipes: Recipe[] },
  newId: () => string,
  today: string,
): DishImportPlan {
  const dishes = new Map(allCatalogDishes().map((d) => [d.id, d]))
  const ingByName = new Map(existing.ingredients.map((i) => [catalogKey(i.name), i]))
  const packaging = [...existing.packaging]
  const recipeNames = new Set(existing.recipes.map((r) => catalogKey(r.name)))
  const plan: DishImportPlan = { newIngredients: [], newPackaging: [], recipes: [], skipped: [] }

  const ingredientId = (key: keyof typeof catalogIngredients): Ingredient => {
    const spec = catalogIngredients[key]
    const found = ingByName.get(catalogKey(spec.name))
    if (found) return found
    const created: Ingredient = { ...spec, id: newId(), updatedAt: today, priceHistory: [] }
    ingByName.set(catalogKey(spec.name), created)
    plan.newIngredients.push(created)
    return created
  }

  const pickPot = (dish: CatalogDish, weight: number): Packaging | undefined => {
    const soup = dish.pot === 'caldo'
    const fits = packaging
      .filter((p) => p.type === 'pote' && (p.capacity ?? 0) >= weight * 0.98 && isSoupPot(p) === soup)
      .sort((a, b) => (a.capacity ?? 0) - (b.capacity ?? 0))
    if (fits[0]) return fits[0]
    // Nada cadastrado serve: pega no catálogo o menor pote que comporta a porção
    const candidates = packagingCatalog
      .flatMap((g) => g.items)
      .filter(
        (c) =>
          c.type === 'pote' &&
          c.material === 'pp' &&
          (c.compartments ?? 1) === 1 &&
          (c.capacity ?? 0) >= weight * 0.98 &&
          (soup ? isSoupPot(c) : /^Marmita PP/.test(c.name)),
      )
      .sort((a, b) => (a.capacity ?? 0) - (b.capacity ?? 0))
    const item = candidates[0]
    if (!item) return undefined
    const sameName = packaging.find((p) => catalogKey(p.name) === catalogKey(item.name))
    if (sameName) return sameName
    const created: Packaging = { ...item, id: newId() }
    packaging.push(created)
    plan.newPackaging.push(created)
    return created
  }

  for (const sel of selections) {
    const dish = dishes.get(sel.dishId)
    if (!dish) continue
    const name = dishRecipeName(dish, sel.weight)
    if (recipeNames.has(catalogKey(name))) {
      plan.skipped.push(name)
      continue
    }
    recipeNames.add(catalogKey(name))
    const factor = sel.weight / dish.baseWeight
    const items = dish.items.map(([key, qty]) => {
      const ing = ingredientId(key)
      const scaled = qty * factor
      const rounded = baseUnitOf(ing.unit) === 'un' ? Math.round(scaled * 2) / 2 : Math.round(scaled)
      return { ingredientId: ing.id, qty: rounded }
    })
    const recipePackaging: RecipePackaging[] = []
    const pot = pickPot(dish, sel.weight)
    if (pot) recipePackaging.push({ packagingId: pot.id, qty: 1 })
    for (const type of ['etiqueta', 'lacre'] as const) {
      const p = packaging.find((x) => x.type === type)
      if (p) recipePackaging.push({ packagingId: p.id, qty: 1 })
    }
    const size = dish.sizes.find((s) => s.weight === sel.weight)
    plan.recipes.push({
      kind: dish.kind,
      name,
      category: dish.category,
      size: sizeForWeight(sel.weight),
      targetWeight: sel.weight,
      items,
      packaging: recipePackaging,
      currentPrice: size?.price,
    })
  }
  return plan
}
