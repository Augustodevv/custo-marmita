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
  /** Quanto você tem em estoque, na unidade-base (g, ml ou un). Ausente = sem controle */
  stockQty?: number
  /** Estoque mínimo desejado, na unidade-base. Abaixo disso o app avisa para comprar */
  minStock?: number
  sample?: boolean
}

export type PackagingType =
  'pote' | 'tampa' | 'sacola' | 'talher' | 'guardanapo' | 'etiqueta' | 'lacre' | 'outros'

export interface Packaging {
  id: string
  name: string
  type: PackagingType
  /** Preço do pacote, em R$ */
  packPrice: number
  /** Quantidade de itens no pacote */
  packQty: number
  /** Unidades em estoque. Ausente = sem controle */
  stockQty?: number
  /** Estoque mínimo em unidades */
  minStock?: number
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

/** "adicional": item vendido junto com a marmita (proteína extra, salada, sobremesa, suco…) */
export type RecipeKind = 'marmita' | 'adicional'

export interface Recipe {
  id: string
  /** Ausente = marmita (compatível com dados antigos) */
  kind?: RecipeKind
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

// ---------- Custos fixos e operacionais (mensais) ----------

export interface FixedCost {
  id: string
  name: string
  /** Valor mensal em R$ */
  amount: number
  sample?: boolean
}

export type LaborMode = 'mensal' | 'hora'

export interface LaborEntry {
  id: string
  /** Ex.: "Pró-labore", "Ajudante de cozinha" */
  name: string
  mode: LaborMode
  /** Salário ou pró-labore mensal (modo "mensal") */
  monthly: number
  /** Valor da hora (modo "hora") */
  hourlyRate: number
  /** Horas trabalhadas no mês (modo "hora") */
  hours: number
  sample?: boolean
}

export interface GasConfig {
  /** "mensal": valor fixo no mês · "botijao": preço do botijão ÷ marmitas que ele rende */
  mode: 'mensal' | 'botijao'
  monthly: number
  cylinderPrice: number
  mealsPerCylinder: number
}

export interface CostSettings {
  fixedCosts: FixedCost[]
  labor: LaborEntry[]
  gas: GasConfig
  /** Produção mensal estimada (marmitas/mês) */
  monthlyProduction: number
}

// ---------- Taxas, impostos e canais de venda ----------

export type PaymentMethod = 'pix' | 'debito' | 'credito' | 'dinheiro'

/** "app": o próprio aplicativo cobra o cliente; a taxa do canal já inclui o pagamento */
export type ChannelPayment = PaymentMethod | 'app'

export interface SalesChannel {
  id: string
  name: string
  /** Comissão do canal (ex.: iFood) em % */
  feePercent: number
  /** Forma de pagamento mais comum nesse canal */
  payment: ChannelPayment
  /** Você mesmo entrega? Se sim, o custo de entrega entra no custo da marmita */
  ownDelivery: boolean
}

export interface FeeSettings {
  /** Imposto sobre a venda em % (ex.: Simples Nacional). MEI costuma deixar 0 e lançar o DAS nos custos fixos */
  salesTaxPercent: number
  cardFees: Record<PaymentMethod, number>
  /** Custo de entrega por marmita quando você mesmo entrega */
  deliveryCostPerMeal: number
  channels: SalesChannel[]
}

export interface PricingSettings {
  /** Margem de lucro desejada padrão (%) */
  defaultMargin: number
  /** Abaixo desta margem a marmita recebe alerta (%) */
  minMarginAlert: number
  /** Canal em que o "preço praticado" das fichas é cobrado */
  primaryChannelId: string
}

// ---------- Estoque e produção ----------

export type StockKind = 'ingrediente' | 'embalagem'

export interface StockChange {
  kind: StockKind
  id: string
  /** Variação na unidade-base (positivo = entrada, negativo = saída) */
  delta: number
}

/** Plano de produção: id da ficha → quantidade a produzir */
export type ProductionPlan = Record<string, number>
