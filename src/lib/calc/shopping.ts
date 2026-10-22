import type {
  BaseUnit,
  Ingredient,
  IngredientCategory,
  Packaging,
  ProductionPlan,
  Recipe,
  StockChange,
} from '../types'
import { nonNeg, sum } from './math'
import { baseUnitOf, grossQty, packagingUnitCost, rawCostPerBaseUnit, toBaseQty } from './units'
import { stockStatus, type StockStatus } from './stock'

export type ShoppingGroup = IngredientCategory | 'embalagem'

export interface ShoppingLine {
  kind: 'ingrediente' | 'embalagem'
  id: string
  name: string
  group: ShoppingGroup
  baseUnit: BaseUnit
  /** Quantidade bruta necessária para a produção (já com a perda), na unidade-base */
  needed: number
  /** Estoque considerado (0 quando "descontar estoque" está desligado) */
  stock: number
  min: number
  /** A comprar = necessário + mínimo − estoque (nunca negativo) */
  toBuy: number
  /** Tamanho da embalagem de compra, na unidade-base */
  packageSize: number
  /** Embalagens fechadas a comprar (arredondado para cima) */
  packages: number
  /** Custo comprando embalagens fechadas */
  cost: number
  /** Custo proporcional só do que é necessário */
  exactCost: number
  stockStatus: StockStatus
}

export interface ShoppingList {
  lines: ShoppingLine[]
  /** Linhas com algo a comprar */
  toBuyLines: ShoppingLine[]
  totalCost: number
  totalExactCost: number
  totalMeals: number
}

export interface ShoppingOptions {
  /** Desconta o que já tem em estoque e repõe o estoque mínimo */
  useStock: boolean
}

const EPS = 1e-9

/** Quantidade bruta de cada ingrediente e embalagem para produzir o plano. */
export function requiredQuantities(plan: ProductionPlan, recipes: Recipe[], ingredients: Ingredient[]) {
  const ingMap = new Map(ingredients.map((i) => [i.id, i]))
  const ing = new Map<string, number>()
  const pack = new Map<string, number>()
  for (const r of recipes) {
    const count = nonNeg(plan[r.id])
    if (count <= 0) continue
    for (const it of r.items) {
      const i = ingMap.get(it.ingredientId)
      if (!i) continue
      const gross = grossQty(it.qty, i.lossPercent, i.cookingYield) * count
      ing.set(i.id, (ing.get(i.id) ?? 0) + gross)
    }
    for (const pk of r.packaging) {
      pack.set(pk.packagingId, (pack.get(pk.packagingId) ?? 0) + nonNeg(pk.qty) * count)
    }
  }
  return { ingredients: ing, packaging: pack }
}

/**
 * Lista de compras: soma o que o plano de produção consome (com a perda),
 * desconta o estoque e repõe o mínimo. Inclui itens abaixo do mínimo mesmo
 * que o plano não os use.
 */
export function calcShoppingList(
  plan: ProductionPlan,
  recipes: Recipe[],
  ingredients: Ingredient[],
  packaging: Packaging[],
  { useStock }: ShoppingOptions,
): ShoppingList {
  const req = requiredQuantities(plan, recipes, ingredients)
  const lines: ShoppingLine[] = []

  const build = (
    base: Omit<ShoppingLine, 'toBuy' | 'packages' | 'cost' | 'exactCost' | 'stock' | 'min' | 'stockStatus'>,
    item: { stockQty?: number; minStock?: number },
    packagePrice: number,
    unitCost: number,
  ) => {
    const stock = useStock ? nonNeg(item.stockQty) : 0
    const min = useStock ? nonNeg(item.minStock) : 0
    const toBuy = Math.max(0, base.needed + min - stock)
    if (base.needed <= EPS && toBuy <= EPS) return
    const packages = base.packageSize > 0 ? Math.ceil(toBuy / base.packageSize - EPS) : 0
    lines.push({
      ...base,
      stock,
      min,
      toBuy,
      packages,
      cost: packages * packagePrice,
      exactCost: toBuy * unitCost,
      stockStatus: stockStatus(item),
    })
  }

  for (const i of ingredients) {
    build(
      {
        kind: 'ingrediente',
        id: i.id,
        name: i.name,
        group: i.category,
        baseUnit: baseUnitOf(i.unit),
        needed: req.ingredients.get(i.id) ?? 0,
        packageSize: toBaseQty(i.packageQty, i.unit),
      },
      i,
      nonNeg(i.packagePrice),
      rawCostPerBaseUnit(i),
    )
  }
  for (const p of packaging) {
    build(
      {
        kind: 'embalagem',
        id: p.id,
        name: p.name,
        group: 'embalagem',
        baseUnit: 'un',
        needed: req.packaging.get(p.id) ?? 0,
        packageSize: nonNeg(p.packQty),
      },
      p,
      nonNeg(p.packPrice),
      packagingUnitCost(p),
    )
  }

  lines.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const toBuyLines = lines.filter((l) => l.toBuy > EPS)
  return {
    lines,
    toBuyLines,
    totalCost: sum(toBuyLines.map((l) => l.cost)),
    totalExactCost: sum(toBuyLines.map((l) => l.exactCost)),
    totalMeals: sum(recipes.map((r) => nonNeg(plan[r.id]))),
  }
}

/** Entrada no estoque das embalagens fechadas compradas. */
export function purchaseChanges(list: ShoppingList): StockChange[] {
  return list.toBuyLines.map((l) => ({ kind: l.kind, id: l.id, delta: l.packages * l.packageSize }))
}

/** Saída do estoque do que a produção consome. */
export function productionChanges(
  plan: ProductionPlan,
  recipes: Recipe[],
  ingredients: Ingredient[],
): StockChange[] {
  const req = requiredQuantities(plan, recipes, ingredients)
  return [
    ...[...req.ingredients].map(([id, q]) => ({ kind: 'ingrediente' as const, id, delta: -q })),
    ...[...req.packaging].map(([id, q]) => ({ kind: 'embalagem' as const, id, delta: -q })),
  ]
}
