import { describe, expect, it } from 'vitest'
import { validateNumber } from './validation'

describe('validação de campos numéricos', () => {
  it('bloqueia negativos', () => {
    expect(validateNumber(-1)).toBe('Não pode ser negativo')
  })
  it('bloqueia zero quando o campo vira divisor', () => {
    expect(validateNumber(0, { positive: true })).toBe('Precisa ser maior que zero')
  })
  it('respeita máximo e obrigatório', () => {
    expect(validateNumber(120, { max: 95 })).toBe('Máximo 95')
    expect(validateNumber(undefined, { required: true })).toBe('Campo obrigatório')
    expect(validateNumber(undefined)).toBeNull()
    expect(validateNumber(10, { min: 1, max: 20 })).toBeNull()
  })
})
