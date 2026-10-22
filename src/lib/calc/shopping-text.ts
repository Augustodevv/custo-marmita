import { formatBRL, formatNumber, formatQty } from '../format'
import { ingredientCategoryLabels } from '../labels'
import type { Recipe } from '../types'
import type { ShoppingGroup, ShoppingLine, ShoppingList } from './shopping'

export const shoppingGroupLabels: Record<ShoppingGroup, string> = {
  ...ingredientCategoryLabels,
  embalagem: 'Embalagens e descartáveis',
}

export const SHOPPING_GROUP_ORDER: ShoppingGroup[] = [
  'proteina',
  'carboidrato',
  'legume',
  'tempero',
  'outros',
  'embalagem',
]

export function groupLines(lines: ShoppingLine[]): [ShoppingGroup, ShoppingLine[]][] {
  return SHOPPING_GROUP_ORDER.map(
    (g) => [g, lines.filter((l) => l.group === g)] as [ShoppingGroup, ShoppingLine[]],
  ).filter(([, ls]) => ls.length > 0)
}

/** Quantidade de compra amigável: "3 emb. de 1 kg" */
export function packagesLabel(l: ShoppingLine): string {
  if (l.packages <= 0) return ''
  return `${formatNumber(l.packages, 0)} emb. de ${formatQty(l.packageSize, l.baseUnit)}`
}

/** Texto pronto para colar no WhatsApp (negrito com *asteriscos*). */
export function shoppingListText(
  list: ShoppingList,
  recipes: Recipe[],
  plan: Record<string, number>,
  date: string,
): string {
  const out: string[] = [`🛒 *Lista de compras* (${date})`]
  const produced = recipes.filter((r) => (plan[r.id] ?? 0) > 0)
  if (produced.length) {
    out.push('', `🍱 *Produção: ${formatNumber(list.totalMeals, 0)} itens*`)
    for (const r of produced) out.push(`• ${formatNumber(plan[r.id], 0)}× ${r.name}`)
  }
  for (const [group, lines] of groupLines(list.toBuyLines)) {
    out.push('', `*${shoppingGroupLabels[group]}*`)
    for (const l of lines) {
      const pk = packagesLabel(l)
      out.push(`• ${l.name}: ${formatQty(l.toBuy, l.baseUnit)}${pk ? ` (${pk})` : ''}`)
    }
  }
  if (list.toBuyLines.length === 0) out.push('', 'Nada para comprar 🎉')
  else out.push('', `💰 *Total estimado: ${formatBRL(list.totalCost)}*`)
  return out.join('\n')
}
