import { describe, expect, it } from 'vitest'
import { formatBRL, formatPercent, formatQty, parseBRNumber } from './format'

describe('formatação pt-BR', () => {
  it('formata moeda', () => {
    expect(formatBRL(1234.56)).toBe('R$ 1.234,56')
    expect(formatBRL(0.5)).toBe('R$ 0,50')
  })

  it('formata percentual', () => {
    expect(formatPercent(12.345)).toBe('12,3%')
  })

  it('formata quantidades', () => {
    expect(formatQty(1500, 'g')).toBe('1,5 kg')
    expect(formatQty(250, 'ml')).toBe('250 ml')
  })
})

describe('parseBRNumber', () => {
  it('aceita vírgula decimal e ponto de milhar', () => {
    expect(parseBRNumber('32,90')).toBe(32.9)
    expect(parseBRNumber('1.234,56')).toBe(1234.56)
    expect(parseBRNumber('R$ 10')).toBe(10)
    expect(parseBRNumber('1.5')).toBe(1.5)
    expect(parseBRNumber('1.000')).toBe(1000)
  })

  it('rejeita texto inválido', () => {
    expect(parseBRNumber('')).toBeNaN()
    expect(parseBRNumber('abc')).toBeNaN()
  })
})
