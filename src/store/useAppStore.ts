import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { applyStockChanges } from '@/lib/calc/stock'
import { applyPriceUpdate } from '@/lib/calc/units'
import { duplicateRecipe as duplicateRecipeCalc } from '@/lib/calc/recipe'
import { todayISO } from '@/lib/format'
import { newId } from '@/lib/id'
import type {
  CostSettings,
  FeeSettings,
  Ingredient,
  Packaging,
  PricingSettings,
  ProductionPlan,
  Recipe,
  StockChange,
} from '@/lib/types'
import {
  sampleFixedCosts,
  sampleIngredients,
  sampleLabor,
  samplePackaging,
  sampleRecipes,
} from './sample-data'

export type ThemePref = 'light' | 'dark' | 'system'

export interface Settings {
  theme: ThemePref
}

export interface AppData {
  ingredients: Ingredient[]
  packaging: Packaging[]
  recipes: Recipe[]
  costs: CostSettings
  fees: FeeSettings
  pricing: PricingSettings
  /** Plano de produção da lista de compras (id da ficha → quantidade) */
  plan: ProductionPlan
  settings: Settings
}

interface Actions {
  addIngredient: (i: Omit<Ingredient, 'id' | 'priceHistory' | 'updatedAt'>) => string
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void
  updateIngredientPrice: (id: string, newPrice: number) => void
  deleteIngredient: (id: string) => void

  addPackaging: (p: Omit<Packaging, 'id'>) => string
  updatePackaging: (id: string, patch: Partial<Packaging>) => void
  deletePackaging: (id: string) => void

  addRecipe: (r: Omit<Recipe, 'id' | 'createdAt'>) => string
  updateRecipe: (id: string, patch: Partial<Recipe>) => void
  deleteRecipe: (id: string) => void
  duplicateRecipe: (id: string) => string | undefined

  setCosts: (patch: Partial<CostSettings>) => void
  setFees: (patch: Partial<FeeSettings>) => void
  setPricing: (patch: Partial<PricingSettings>) => void

  setPlanQty: (recipeId: string, qty: number) => void
  setPlan: (plan: ProductionPlan) => void
  applyStock: (changes: StockChange[]) => void

  setTheme: (t: ThemePref) => void
  clearSampleData: () => void
  loadSampleData: () => void
  replaceAll: (data: AppData) => void
}

export type AppState = AppData & Actions

export const defaultSettings: Settings = { theme: 'system' }

export const defaultCosts: CostSettings = {
  fixedCosts: sampleFixedCosts,
  labor: sampleLabor,
  gas: { mode: 'botijao', monthly: 0, cylinderPrice: 115, mealsPerCylinder: 120 },
  monthlyProduction: 600,
}

export const defaultFees: FeeSettings = {
  salesTaxPercent: 0,
  cardFees: { pix: 0, debito: 1.99, credito: 4.99, dinheiro: 0 },
  deliveryCostPerMeal: 2,
  channels: [
    { id: 'direto', name: 'Direto / WhatsApp', feePercent: 0, payment: 'pix', ownDelivery: true },
    { id: 'ifood', name: 'iFood', feePercent: 26.2, payment: 'app', ownDelivery: false },
    { id: 'retirada', name: 'Retirada no local', feePercent: 0, payment: 'pix', ownDelivery: false },
  ],
}

export const defaultPricing: PricingSettings = {
  defaultMargin: 20,
  minMarginAlert: 15,
  primaryChannelId: 'direto',
}

export const initialData: AppData = {
  ingredients: sampleIngredients,
  packaging: samplePackaging,
  recipes: sampleRecipes,
  costs: defaultCosts,
  fees: defaultFees,
  pricing: defaultPricing,
  plan: { 's-r-frango': 15, 's-r-carne-pure': 10, 's-r-strogonoff': 10, 's-r-kids': 5 },
  settings: defaultSettings,
}

const without = <T extends { sample?: boolean }>(list: T[]) => list.filter((x) => !x.sample)

/**
 * Remove os dados de exemplo. Ingredientes/embalagens de exemplo usados em fichas
 * do próprio usuário são mantidos (e passam a ser dele), para não quebrar essas fichas.
 */
export function removeSampleData(
  s: Pick<AppData, 'ingredients' | 'packaging' | 'recipes' | 'costs' | 'plan'>,
) {
  const recipes = without(s.recipes)
  const usedIng = new Set(recipes.flatMap((r) => r.items.map((i) => i.ingredientId)))
  const usedPack = new Set(recipes.flatMap((r) => r.packaging.map((p) => p.packagingId)))
  const keep = <T extends { id: string; sample?: boolean }>(list: T[], used: Set<string>) =>
    list.filter((x) => !x.sample || used.has(x.id)).map((x) => (x.sample ? { ...x, sample: false } : x))
  return {
    ingredients: keep(s.ingredients, usedIng),
    packaging: keep(s.packaging, usedPack),
    recipes,
    costs: { ...s.costs, fixedCosts: without(s.costs.fixedCosts), labor: without(s.costs.labor) },
    plan: Object.fromEntries(Object.entries(s.plan).filter(([id]) => recipes.some((r) => r.id === id))),
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData,

      addIngredient: (i) => {
        const id = newId()
        set((s) => ({
          ingredients: [...s.ingredients, { ...i, id, priceHistory: [], updatedAt: todayISO() }],
        }))
        return id
      },
      updateIngredient: (id, patch) =>
        set((s) => ({
          ingredients: s.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      updateIngredientPrice: (id, newPrice) =>
        set((s) => ({
          ingredients: s.ingredients.map((i) =>
            i.id === id ? { ...applyPriceUpdate(i, newPrice, todayISO()), sample: false } : i,
          ),
        })),
      deleteIngredient: (id) =>
        set((s) => ({
          ingredients: s.ingredients.filter((i) => i.id !== id),
          recipes: s.recipes.map((r) => ({
            ...r,
            items: r.items.filter((it) => it.ingredientId !== id),
          })),
        })),

      addPackaging: (p) => {
        const id = newId()
        set((s) => ({ packaging: [...s.packaging, { ...p, id }] }))
        return id
      },
      updatePackaging: (id, patch) =>
        set((s) => ({
          packaging: s.packaging.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deletePackaging: (id) =>
        set((s) => ({
          packaging: s.packaging.filter((p) => p.id !== id),
          recipes: s.recipes.map((r) => ({
            ...r,
            packaging: r.packaging.filter((pk) => pk.packagingId !== id),
          })),
        })),

      addRecipe: (r) => {
        const id = newId()
        set((s) => ({ recipes: [...s.recipes, { ...r, id, createdAt: todayISO() }] }))
        return id
      },
      updateRecipe: (id, patch) =>
        set((s) => ({ recipes: s.recipes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      deleteRecipe: (id) =>
        set((s) => {
          const plan = { ...s.plan }
          delete plan[id]
          return { recipes: s.recipes.filter((r) => r.id !== id), plan }
        }),
      duplicateRecipe: (id) => {
        const original = get().recipes.find((r) => r.id === id)
        if (!original) return undefined
        const copy = duplicateRecipeCalc(original, newId(), todayISO())
        set((s) => ({ recipes: [...s.recipes, copy] }))
        return copy.id
      },

      setCosts: (patch) => set((s) => ({ costs: { ...s.costs, ...patch } })),
      setFees: (patch) => set((s) => ({ fees: { ...s.fees, ...patch } })),
      setPricing: (patch) => set((s) => ({ pricing: { ...s.pricing, ...patch } })),

      setPlanQty: (recipeId, qty) =>
        set((s) => {
          const plan = { ...s.plan }
          if (qty > 0) plan[recipeId] = qty
          else delete plan[recipeId]
          return { plan }
        }),
      setPlan: (plan) => set(() => ({ plan })),
      applyStock: (changes) =>
        set((s) => ({
          ingredients: applyStockChanges(s.ingredients, changes, 'ingrediente'),
          packaging: applyStockChanges(s.packaging, changes, 'embalagem'),
        })),

      setTheme: (theme) => set((s) => ({ settings: { ...s.settings, theme } })),

      clearSampleData: () => set((s) => removeSampleData(s)),
      loadSampleData: () =>
        set((s) => ({
          ingredients: [...without(s.ingredients), ...sampleIngredients],
          packaging: [...without(s.packaging), ...samplePackaging],
          recipes: [...without(s.recipes), ...sampleRecipes],
          costs: {
            ...s.costs,
            fixedCosts: [...without(s.costs.fixedCosts), ...sampleFixedCosts],
            labor: [...without(s.costs.labor), ...sampleLabor],
          },
        })),
      replaceAll: (data) => set(() => ({ ...data })),
    }),
    {
      name: 'custo-marmita',
      version: 3,
      // Versões antigas: blocos novos (custos, taxas, plano…) recebem os padrões no `merge`
      migrate: (persisted) => persisted as AppData,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): AppData => ({
        ingredients: s.ingredients,
        packaging: s.packaging,
        recipes: s.recipes,
        costs: s.costs,
        fees: s.fees,
        pricing: s.pricing,
        plan: s.plan,
        settings: s.settings,
      }),
      // Garante que campos novos (de versões futuras) recebam valores padrão
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppData>
        return {
          ...current,
          ...p,
          costs: { ...current.costs, ...(p.costs ?? {}) },
          fees: { ...current.fees, ...(p.fees ?? {}) },
          pricing: { ...current.pricing, ...(p.pricing ?? {}) },
          settings: { ...current.settings, ...(p.settings ?? {}) },
        }
      },
    },
  ),
)

export const hasSampleData = (s: AppData) =>
  s.ingredients.some((i) => i.sample) ||
  s.packaging.some((p) => p.sample) ||
  s.recipes.some((r) => r.sample) ||
  s.costs.fixedCosts.some((f) => f.sample) ||
  s.costs.labor.some((l) => l.sample)
