const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlPrecise = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
})

/** R$ 1.234,56 */
export function formatBRL(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return brl.format(n).replace(/\u00a0/g, ' ')
}

/** R$ 0,0267 — para custos por grama */
export function formatBRLPrecise(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return brlPrecise.format(n).replace(/\u00a0/g, ' ')
}

const brlUnit = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

/** R$ 0,649 — para custos unitários pequenos (embalagens), sem zeros sobrando */
export function formatBRLUnit(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return brlUnit.format(n).replace(/\u00a0/g, ' ')
}

/** 1.234,5 */
export function formatNumber(n: number, maxDecimals = 2): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('pt-BR', { maximumFractionDigits: maxDecimals })
}

/** 12,5% */
export function formatPercent(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—'
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`
}

/** +12,5% / −3,0% */
export function formatSignedPercent(n: number, decimals = 1): string {
  if (!Number.isFinite(n)) return '—'
  const sign = n > 0 ? '+' : n < 0 ? '−' : ''
  return `${sign}${formatPercent(Math.abs(n), decimals)}`
}

/**
 * Converte texto digitado em número aceitando formato brasileiro.
 * "32,90" → 32.9 · "1.234,56" → 1234.56 · "R$ 10" → 10 · "1.5" → 1.5
 * Retorna NaN para entradas inválidas.
 */
export function parseBRNumber(input: string): number {
  let s = input.trim().replace(/[R$\s%]/g, '')
  if (s === '') return NaN
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.234" sem vírgula: ponto como separador de milhar
    s = s.replace(/\./g, '')
  }
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN
  return Number(s)
}

/** Formata número para exibição dentro de um campo editável (sem símbolo). */
export function toInputString(n: number | undefined, decimals = 2): string {
  if (n == null || !Number.isFinite(n)) return ''
  return n.toLocaleString('pt-BR', { maximumFractionDigits: decimals, useGrouping: false })
}

/** 22/10/2026 */
export function formatDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  if (!y || !m || !d) return '—'
  return `${d}/${m}/${y}`
}

export function todayISO(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Exibe quantidade com unidade amigável: 1500 g → "1,5 kg" */
export function formatQty(qty: number, base: 'g' | 'ml' | 'un'): string {
  if (base === 'un') return `${formatNumber(qty, 1)} un`
  if (qty >= 1000) return `${formatNumber(qty / 1000, 2)} ${base === 'g' ? 'kg' : 'L'}`
  return `${formatNumber(qty, 0)} ${base}`
}
