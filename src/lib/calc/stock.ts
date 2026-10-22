import type { Ingredient, Packaging, StockChange } from '../types'
import { nonNeg } from './math'

export type StockStatus = 'zerado' | 'baixo' | 'ok' | 'sem-controle'

/** Situação do estoque de um item: sem controle quando nada foi informado. */
export function stockStatus(item: { stockQty?: number; minStock?: number }): StockStatus {
  if (item.stockQty === undefined && item.minStock === undefined) return 'sem-controle'
  const stock = nonNeg(item.stockQty)
  const min = nonNeg(item.minStock)
  if (stock <= 0) return 'zerado'
  if (stock < min) return 'baixo'
  return 'ok'
}

export interface StockAlert {
  kind: 'ingrediente' | 'embalagem'
  id: string
  name: string
  status: 'zerado' | 'baixo'
  stock: number
  min: number
}

/** Itens zerados ou abaixo do mínimo (zerados primeiro). */
export function stockAlerts(ingredients: Ingredient[], packaging: Packaging[]): StockAlert[] {
  const alerts: StockAlert[] = []
  const push = (kind: StockAlert['kind'], i: Ingredient | Packaging) => {
    const status = stockStatus(i)
    if (status === 'zerado' || status === 'baixo') {
      alerts.push({
        kind,
        id: i.id,
        name: i.name,
        status,
        stock: nonNeg(i.stockQty),
        min: nonNeg(i.minStock),
      })
    }
  }
  ingredients.forEach((i) => push('ingrediente', i))
  packaging.forEach((p) => push('embalagem', p))
  return alerts.sort((a, b) =>
    a.status === b.status ? a.name.localeCompare(b.name, 'pt-BR') : a.status === 'zerado' ? -1 : 1,
  )
}

/** Aplica entradas/saídas no estoque. O estoque nunca fica negativo. */
export function applyStockChanges<T extends { id: string; stockQty?: number }>(
  items: T[],
  changes: StockChange[],
  kind: StockChange['kind'],
): T[] {
  const deltas = new Map<string, number>()
  for (const c of changes) {
    if (c.kind === kind) deltas.set(c.id, (deltas.get(c.id) ?? 0) + c.delta)
  }
  return items.map((i) => {
    const d = deltas.get(i.id)
    return d === undefined ? i : { ...i, stockQty: Math.max(0, nonNeg(i.stockQty) + d) }
  })
}
