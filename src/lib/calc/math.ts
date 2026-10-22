/** Divisão segura: retorna `fallback` quando o divisor é zero, negativo ou não finito. */
export function safeDiv(a: number, b: number, fallback = 0): number {
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return fallback
  return a / b
}

/** Converte qualquer entrada numérica em número finito e não negativo. */
export function nonNeg(n: number | undefined | null): number {
  if (n == null || !Number.isFinite(n) || n < 0) return 0
  return n
}

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

/** Arredonda para centavos (evita 0.1 + 0.2 = 0.30000000000000004 na exibição). */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}
