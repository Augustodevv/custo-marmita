// Tipos de domínio do Custo Marmita.
// Valores monetários em reais (number), percentuais de 0 a 100.

export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'un'
export type BaseUnit = 'g' | 'ml' | 'un'

export type IngredientCategory = 'proteina' | 'carboidrato' | 'legume' | 'tempero' | 'outros'

export interface PriceEntry {
  price: number
  /** Data ISO (yyyy-mm-dd) em que esse preço passou a valer */
  date: string
}

export interface Ingredient {
  id: string
  name: string
  category: IngredientCategory
  /** Preço pago pela embalagem, em R$ */
  packagePrice: number
  /** Quantidade da embalagem, na unidade `unit` */
  packageQty: number
  unit: Unit
  /** Perda no preparo (cocção, cascas, aparas), de 0 a 95 */
  lossPercent: number
  /**
   * Índice de cocção: quanto 1 kg cru pesa depois de pronto (arroz ≈ 2,5; padrão 1).
   * Só para alimentos que GANHAM peso; perdas vão em `lossPercent`.
   */
  cookingYield?: number
  /** Peso aproximado de 1 unidade em gramas (só para unidade "un"; usado no peso da porção) */
  unitWeight?: number
  /** Data ISO da última atualização de preço */
  updatedAt: string
  /** Preços anteriores, do mais antigo para o mais recente (não inclui o atual) */
  priceHistory: PriceEntry[]
  sample?: boolean
}

export type PackagingType =
  | 'pote'
  | 'tampa'
  | 'sacola'
  | 'talher'
  | 'guardanapo'
  | 'etiqueta'
  | 'lacre'
  | 'outros'

export interface Packaging {
  id: string
  name: string
  type: PackagingType
  /** Preço do pacote, em R$ */
  packPrice: number
  /** Quantidade de itens no pacote */
  packQty: number
  sample?: boolean
}

export type RecipeCategory = 'fit' | 'lowcarb' | 'tradicional' | 'vegana' | 'kids'
export type RecipeSize = 'P' | 'M' | 'G'

export interface RecipeItem {
  ingredientId: string
  /** Quantidade pronta na marmita, na unidade-base do ingrediente (g, ml ou un) */
  qty: number
}

export interface RecipePackaging {
  packagingId: string
  qty: number
}

export interface Recipe {
  id: string
  name: string
  /** Foto reduzida em data URL (JPEG) */
  photo?: string
  category: RecipeCategory
  size: RecipeSize
  /** Peso total planejado da porção em gramas */
  targetWeight: number
  items: RecipeItem[]
  packaging: RecipePackaging[]
  /** Preço praticado hoje (R$), opcional */
  currentPrice?: number
  /** Margem de lucro desejada (%) — se ausente usa a padrão das configurações */
  desiredMargin?: number
  notes?: string
  createdAt: string
  sample?: boolean
}
