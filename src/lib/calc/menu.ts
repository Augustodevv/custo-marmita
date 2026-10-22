import { formatBRL } from '../format'
import { recipeCategoryLabels } from '../labels'
import type { Recipe, RecipeCategory } from '../types'

export type ReadyStatus = 'esgotada' | 'ultimas' | 'disponivel' | 'sem-controle'

/** Situação do estoque de marmitas prontas. Sem quantidade informada = sem controle. */
export function readyStatus(recipe: Pick<Recipe, 'readyStock'>, alertAt: number): ReadyStatus {
  if (recipe.readyStock === undefined) return 'sem-controle'
  if (recipe.readyStock <= 0) return 'esgotada'
  if (recipe.readyStock <= alertAt) return 'ultimas'
  return 'disponivel'
}

const SIZE_SUFFIX = /^(.*) \((\d+) ?g\)$/

/** Separa "Caldo verde fit (350 g)" em nome-base e tamanho. */
export function splitSizeName(name: string): { base: string; size?: string } {
  const m = SIZE_SUFFIX.exec(name.trim())
  return m ? { base: m[1], size: `${m[2]} g` } : { base: name.trim() }
}

export interface MenuEntry {
  base: string
  category: RecipeCategory | 'adicional'
  variants: { recipe: Recipe; size?: string; status: ReadyStatus }[]
}

/** Agrupa as fichas por prato (juntando os tamanhos 350 g / 500 g). */
export function groupMenu(recipes: Recipe[], alertAt: number): MenuEntry[] {
  const map = new Map<string, MenuEntry>()
  for (const r of recipes) {
    if (r.hidden) continue
    const { base, size } = splitSizeName(r.name)
    const category = r.kind === 'adicional' ? 'adicional' : r.category
    const key = `${category}|${base.toLocaleLowerCase('pt-BR')}`
    const entry = map.get(key) ?? { base, category, variants: [] }
    entry.variants.push({ recipe: r, size, status: readyStatus(r, alertAt) })
    map.set(key, entry)
  }
  for (const e of map.values()) {
    e.variants.sort((a, b) => Number.parseInt(a.size ?? '0', 10) - Number.parseInt(b.size ?? '0', 10))
  }
  return [...map.values()]
}

const CATEGORY_ORDER: (RecipeCategory | 'adicional')[] = [
  'tradicional',
  'fit',
  'lowcarb',
  'vegetariana',
  'vegana',
  'caldos',
  'kids',
  'adicional',
]

export const menuCategoryLabel = (c: RecipeCategory | 'adicional') =>
  c === 'adicional' ? 'Adicionais' : recipeCategoryLabels[c]

export interface MenuTextOptions {
  title: string
  date: string
  hideSoldOut: boolean
  showPrices: boolean
}

/**
 * Cardápio do dia pronto para WhatsApp/Instagram, marcando o que está esgotado
 * (✅ disponível · ⚠️ últimas unidades · ❌ esgotado).
 */
export function menuText(recipes: Recipe[], alertAt: number, opts: MenuTextOptions): string {
  const entries = groupMenu(recipes, alertAt)
  const out: string[] = [`🍱 *${opts.title}*`, `Cardápio de ${opts.date}`]
  let shown = 0
  for (const cat of CATEGORY_ORDER) {
    const list = entries.filter((e) => e.category === cat)
    const lines: string[] = []
    for (const e of list) {
      const allOut = e.variants.every((v) => v.status === 'esgotada')
      if (allOut && opts.hideSoldOut) continue
      if (allOut) {
        lines.push(`❌ ~${e.base}~ (esgotado)`)
        continue
      }
      const anyLow = e.variants.some((v) => v.status === 'ultimas')
      const parts = e.variants
        .filter((v) => !(opts.hideSoldOut && v.status === 'esgotada'))
        .map((v) => {
          const label = [
            v.size,
            opts.showPrices && v.recipe.currentPrice ? formatBRL(v.recipe.currentPrice) : null,
          ]
            .filter(Boolean)
            .join(' ')
          if (v.status === 'esgotada') return v.size ? `~${v.size}~ esgotado` : 'esgotado'
          return label
        })
        .filter(Boolean)
      const detail = parts.length ? ` · ${parts.join(' | ')}` : ''
      lines.push(`${anyLow ? '⚠️' : '✅'} ${e.base}${detail}${anyLow ? ' _(últimas unidades)_' : ''}`)
    }
    if (lines.length) {
      out.push('', `*${menuCategoryLabel(cat)}*`, ...lines)
      shown += lines.length
    }
  }
  if (shown === 0) out.push('', 'Hoje estamos sem marmitas disponíveis. Volte amanhã! 💚')
  else out.push('', 'Faça seu pedido por aqui! 😉')
  return out.join('\n')
}

/** Marmitas esgotadas (com controle de prontas). */
export function soldOut(recipes: Recipe[]): Recipe[] {
  return recipes.filter((r) => !r.hidden && r.readyStock !== undefined && r.readyStock <= 0)
}
