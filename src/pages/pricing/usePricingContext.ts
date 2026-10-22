import { useMemo } from 'react'
import type { PricingContext } from '@/lib/calc/analysis'
import { useAppStore } from '@/store/useAppStore'

/** Fatia do estado usada nos cálculos de preço (memorizada para evitar recálculos). */
export function usePricingContext(): PricingContext {
  const ingredients = useAppStore((s) => s.ingredients)
  const packaging = useAppStore((s) => s.packaging)
  const costs = useAppStore((s) => s.costs)
  const fees = useAppStore((s) => s.fees)
  const pricing = useAppStore((s) => s.pricing)
  return useMemo(
    () => ({ ingredients, packaging, costs, fees, pricing }),
    [ingredients, packaging, costs, fees, pricing],
  )
}
