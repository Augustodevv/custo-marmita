import type {
  BaseUnit,
  IngredientCategory,
  PackagingType,
  RecipeCategory,
  RecipeSize,
  Unit,
} from './types'

export const ingredientCategoryLabels: Record<IngredientCategory, string> = {
  proteina: 'Proteína',
  carboidrato: 'Carboidrato',
  legume: 'Legume/verdura',
  tempero: 'Tempero',
  outros: 'Outros',
}

export const ingredientCategoryColors: Record<IngredientCategory, string> = {
  proteina: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  carboidrato: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  legume: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  tempero: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
  outros: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
}

export const unitLabels: Record<Unit, string> = {
  g: 'g',
  kg: 'kg',
  ml: 'ml',
  L: 'L',
  un: 'unidade',
}

export const baseUnitLong: Record<BaseUnit, string> = {
  g: 'gramas',
  ml: 'ml',
  un: 'unidades',
}

export const packagingTypeLabels: Record<PackagingType, string> = {
  pote: 'Marmita (pote)',
  tampa: 'Tampa',
  sacola: 'Sacola',
  talher: 'Talher',
  guardanapo: 'Guardanapo',
  etiqueta: 'Etiqueta',
  lacre: 'Adesivo de lacre',
  outros: 'Outros',
}

export const recipeCategoryLabels: Record<RecipeCategory, string> = {
  fit: 'Fit',
  lowcarb: 'Low carb',
  tradicional: 'Tradicional',
  vegana: 'Vegana',
  kids: 'Kids',
}

export const recipeCategoryColors: Record<RecipeCategory, string> = {
  fit: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  lowcarb: 'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  tradicional: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  vegana: 'bg-lime-100 text-lime-800 dark:bg-lime-500/15 dark:text-lime-300',
  kids: 'bg-pink-100 text-pink-800 dark:bg-pink-500/15 dark:text-pink-300',
}

export const sizeLabels: Record<RecipeSize, string> = { P: 'P', M: 'M', G: 'G' }

/** Custo por kg/L/un a partir do custo por unidade-base — mais fácil de ler que R$/g. */
export function perDisplayUnit(costPerBase: number, base: BaseUnit): { value: number; unit: string } {
  if (base === 'g') return { value: costPerBase * 1000, unit: 'kg' }
  if (base === 'ml') return { value: costPerBase * 1000, unit: 'L' }
  return { value: costPerBase, unit: 'un' }
}
