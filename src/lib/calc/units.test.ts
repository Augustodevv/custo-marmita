import { describe, expect, it } from 'vitest'
import type { Ingredient } from '../types'
import {
  applyPriceUpdate,
  costPerBaseUnit,
  grossQty,
  packagingUnitCost,
  priceVariation,
  rawCostPerBaseUnit,
  toBaseQty,
  yieldFraction,
} from './units'

const frango: Ingredient = {
  id: 'f',
  name: 'Peito de frango',
  category: 'proteina',
  packagePrice: 20,
  packageQty: 1,
  unit: 'kg',
  lossPercent: 25,
  updatedAt: '2026-10-01',
  priceHistory: [],
}

describe('conversão de unidades', () => {
  it('converte kg e L para g e ml', () => {
    expect(toBaseQty(1.5, 'kg')).toBe(1500)
    expect(toBaseQty(2, 'L')).toBe(2000)
    expect(toBaseQty(500, 'g')).toBe(500)
    expect(toBaseQty(12, 'un')).toBe(12)
  })

  it('ignora quantidades negativas', () => {
    expect(toBaseQty(-3, 'kg')).toBe(0)
  })
})

describe('fator de correção (perda)', () => {
  it('calcula o rendimento', () => {
    expect(yieldFraction(25)).toBe(0.75)
    expect(yieldFraction(0)).toBe(1)
  })

  it('limita perda a 95% para evitar divisão por zero', () => {
    expect(yieldFraction(100)).toBeCloseTo(0.05)
    expect(yieldFraction(-10)).toBe(1)
  })

  it('custo por grama considera a perda', () => {
    // R$ 20 / 750 g aproveitáveis
    expect(costPerBaseUnit(frango)).toBeCloseTo(20 / 750, 6)
    expect(rawCostPerBaseUnit(frango)).toBeCloseTo(0.02, 6)
  })

  it('custo é zero quando a embalagem tem quantidade zero', () => {
    expect(costPerBaseUnit({ ...frango, packageQty: 0 })).toBe(0)
  })

  it('índice de cocção barateia o grama pronto de grãos', () => {
    const arroz = { packagePrice: 10, packageQty: 1, unit: 'kg' as const, lossPercent: 0, cookingYield: 2.5 }
    expect(costPerBaseUnit(arroz)).toBeCloseTo(10 / 2500, 6)
    expect(grossQty(250, 0, 2.5)).toBeCloseTo(100)
  })

  it('quantidade bruta a comprar é o inverso da perda', () => {
    expect(grossQty(750, 25)).toBeCloseTo(1000)
    expect(grossQty(100, 0)).toBe(100)
  })
})

describe('embalagens', () => {
  it('custo unitário = preço do pacote / quantidade', () => {
    expect(packagingUnitCost({ packPrice: 45, packQty: 100 })).toBeCloseTo(0.45)
    expect(packagingUnitCost({ packPrice: 45, packQty: 0 })).toBe(0)
  })
})

describe('histórico de preços', () => {
  it('sem histórico não há variação', () => {
    expect(priceVariation(20, [])).toBeNull()
  })

  it('atualização move o preço atual para o histórico e calcula variação', () => {
    const updated = applyPriceUpdate(frango, 23, '2026-10-20')
    expect(updated.packagePrice).toBe(23)
    expect(updated.updatedAt).toBe('2026-10-20')
    expect(updated.priceHistory).toEqual([{ price: 20, date: '2026-10-01' }])
    expect(priceVariation(updated.packagePrice, updated.priceHistory)).toBeCloseTo(15)
    // objeto original não é alterado
    expect(frango.priceHistory).toHaveLength(0)
  })
})
