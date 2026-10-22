import { describe, expect, it } from 'vitest'
import type { CostSettings, FeeSettings, SalesChannel } from '../types'
import { calcFixedCosts, laborMonthly, totalMonthlyFixed } from './fixed'
import {
  analyzePrice,
  channelFeePercent,
  priceForProfit,
  suggestedPrice,
  unitCost,
} from './pricing'

const costs: CostSettings = {
  fixedCosts: [
    { id: '1', name: 'Aluguel', amount: 1000 },
    { id: '2', name: 'Luz', amount: 200 },
  ],
  labor: [
    { id: 'a', name: 'Pró-labore', mode: 'mensal', monthly: 2000, hourlyRate: 0, hours: 0 },
    { id: 'b', name: 'Ajudante', mode: 'hora', monthly: 0, hourlyRate: 10, hours: 80 },
  ],
  gas: { mode: 'mensal', monthly: 200, cylinderPrice: 120, mealsPerCylinder: 100 },
  monthlyProduction: 400,
}

const fees: FeeSettings = {
  salesTaxPercent: 6,
  cardFees: { pix: 0, debito: 2, credito: 5, dinheiro: 0 },
  deliveryCostPerMeal: 3,
  channels: [],
}

const whatsapp: SalesChannel = { id: 'w', name: 'WhatsApp', feePercent: 0, payment: 'credito', ownDelivery: true }
const ifood: SalesChannel = { id: 'i', name: 'iFood', feePercent: 27, payment: 'app', ownDelivery: false }

describe('custos fixos e rateio', () => {
  it('mão de obra mensal ou por hora', () => {
    expect(laborMonthly(costs.labor[0])).toBe(2000)
    expect(laborMonthly(costs.labor[1])).toBe(800)
  })

  it('rateia o total pela produção mensal', () => {
    const b = calcFixedCosts(costs)
    expect(b.monthlyTotal).toBe(1000 + 200 + 2000 + 800 + 200)
    expect(b.perMeal).toBeCloseTo(4200 / 400)
    expect(b.missingProduction).toBe(false)
  })

  it('gás por botijão vira custo por marmita', () => {
    const b = calcFixedCosts({ ...costs, gas: { ...costs.gas, mode: 'botijao' } })
    expect(b.gasMonthly).toBe(0)
    expect(b.gasPerMeal).toBeCloseTo(1.2)
    expect(b.perMeal).toBeCloseTo(4000 / 400 + 1.2)
    expect(totalMonthlyFixed({ ...costs, gas: { ...costs.gas, mode: 'botijao' } })).toBeCloseTo(4000 + 480)
  })

  it('produção zero não divide por zero', () => {
    const b = calcFixedCosts({ ...costs, monthlyProduction: 0 })
    expect(b.perMeal).toBe(0)
    expect(b.missingProduction).toBe(true)
  })
})

describe('taxas por canal', () => {
  it('soma imposto, comissão e maquininha', () => {
    expect(channelFeePercent(fees, whatsapp)).toBe(11)
    // no app a taxa de pagamento já está na comissão
    expect(channelFeePercent(fees, ifood)).toBe(33)
  })

  it('entrega só entra quando você entrega', () => {
    expect(unitCost(5, 1, 4, fees, whatsapp).total).toBe(13)
    expect(unitCost(5, 1, 4, fees, ifood).total).toBe(10)
  })
})

describe('markup e preço sugerido', () => {
  it('Preço = Custo ÷ (1 − (taxas + margem))', () => {
    const r = suggestedPrice(13, 11, 20)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.price).toBeCloseTo(13 / 0.69)
  })

  it('o preço sugerido entrega exatamente a margem desejada', () => {
    const r = suggestedPrice(13, 11, 20)
    if (!r.ok) throw new Error('esperava preço')
    const a = analyzePrice(r.price, 13, 11, 15)
    expect(a.margin).toBeCloseTo(20)
    expect(a.status).toBe('ok')
  })

  it('recusa quando taxas + margem chegam a 100%', () => {
    const r = suggestedPrice(10, 40, 60)
    expect(r.ok).toBe(false)
  })
})

describe('análise do preço praticado', () => {
  it('calcula lucro e margem real', () => {
    const a = analyzePrice(20, 13, 11, 15)
    expect(a.fees).toBeCloseTo(2.2)
    expect(a.profit).toBeCloseTo(4.8)
    expect(a.margin).toBeCloseTo(24)
    expect(a.status).toBe('ok')
  })

  it('alerta margem baixa e prejuízo', () => {
    expect(analyzePrice(16, 13, 11, 15).status).toBe('baixa')
    expect(analyzePrice(14, 13, 11, 15).status).toBe('prejuizo')
  })

  it('preço zero não quebra', () => {
    const a = analyzePrice(0, 13, 11, 15)
    expect(a.status).toBe('prejuizo')
    expect(Number.isFinite(a.margin)).toBe(true)
  })
})

describe('comparação entre canais', () => {
  it('preço no iFood para manter o mesmo lucro do WhatsApp', () => {
    const lucroWhats = analyzePrice(20, 13, 11, 15).profit // 4,80
    const p = priceForProfit(10, 33, lucroWhats)
    expect(p).toBeCloseTo(14.8 / 0.67)
    expect(analyzePrice(p!, 10, 33, 15).profit).toBeCloseTo(lucroWhats)
  })

  it('taxa de 100% não tem preço possível', () => {
    expect(priceForProfit(10, 100, 5)).toBeNull()
  })
})
