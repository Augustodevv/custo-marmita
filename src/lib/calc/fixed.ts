import type { CostSettings, LaborEntry } from '../types'
import { nonNeg, safeDiv, sum } from './math'

export function laborMonthly(entry: LaborEntry): number {
  return entry.mode === 'mensal'
    ? nonNeg(entry.monthly)
    : nonNeg(entry.hourlyRate) * nonNeg(entry.hours)
}

export interface FixedCostBreakdown {
  /** Soma da lista de custos fixos (aluguel, luz…) */
  fixedTotal: number
  laborTotal: number
  /** Gás mensal (só no modo "mensal"; no modo botijão vira custo por marmita) */
  gasMonthly: number
  /** Tudo que é rateado pela produção do mês */
  monthlyTotal: number
  /** Parte do custo fixo que cabe a cada marmita (rateio) */
  perMealFromMonthly: number
  /** Gás por marmita no modo botijão */
  gasPerMeal: number
  /** Custo fixo total por marmita = rateio + gás por botijão */
  perMeal: number
  /** Produção mensal é zero: não dá para ratear */
  missingProduction: boolean
}

/**
 * Rateio: custo fixo por marmita = (custos fixos + mão de obra + gás mensal) ÷ produção mensal.
 * No modo botijão, soma-se preço do botijão ÷ marmitas que ele rende.
 */
export function calcFixedCosts(c: CostSettings): FixedCostBreakdown {
  const fixedTotal = sum(c.fixedCosts.map((f) => nonNeg(f.amount)))
  const laborTotal = sum(c.labor.map(laborMonthly))
  const gasMonthly = c.gas.mode === 'mensal' ? nonNeg(c.gas.monthly) : 0
  const gasPerMeal =
    c.gas.mode === 'botijao' ? safeDiv(nonNeg(c.gas.cylinderPrice), nonNeg(c.gas.mealsPerCylinder)) : 0
  const monthlyTotal = fixedTotal + laborTotal + gasMonthly
  const production = nonNeg(c.monthlyProduction)
  const perMealFromMonthly = safeDiv(monthlyTotal, production)
  return {
    fixedTotal,
    laborTotal,
    gasMonthly,
    monthlyTotal,
    perMealFromMonthly,
    gasPerMeal,
    perMeal: perMealFromMonthly + gasPerMeal,
    missingProduction: production <= 0 && monthlyTotal > 0,
  }
}

/** Custo fixo mensal total, incluindo o gás de botijão estimado para a produção do mês. */
export function totalMonthlyFixed(c: CostSettings): number {
  const b = calcFixedCosts(c)
  return b.monthlyTotal + b.gasPerMeal * nonNeg(c.monthlyProduction)
}
