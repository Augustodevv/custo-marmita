import { formatNumber } from './format'

export interface NumberRules {
  min?: number
  max?: number
  /** Não aceita zero (evita divisão por zero) */
  positive?: boolean
  required?: boolean
}

/** Retorna a mensagem de erro do campo numérico, ou `null` se estiver válido. */
export function validateNumber(
  n: number | undefined,
  { min = 0, max, positive, required }: NumberRules = {},
): string | null {
  if (n === undefined || Number.isNaN(n)) return required ? 'Campo obrigatório' : null
  if (n < min) return min === 0 ? 'Não pode ser negativo' : `Mínimo ${formatNumber(min)}`
  if (positive && n === 0) return 'Precisa ser maior que zero'
  if (max !== undefined && n > max) return `Máximo ${formatNumber(max)}`
  return null
}
