import { describe, expect, it } from 'vitest'
import type { Recipe } from '../types'
import { groupMenu, menuText, readyStatus, soldOut, splitSizeName } from './menu'

const rec = (over: Partial<Recipe>): Recipe => ({
  id: over.name ?? 'x',
  name: 'X',
  category: 'vegetariana',
  size: 'P',
  targetWeight: 350,
  items: [],
  packaging: [],
  createdAt: '',
  ...over,
})

const recipes: Recipe[] = [
  rec({ name: 'Lasanha de berinjela (350 g)', currentPrice: 30, readyStock: 5 }),
  rec({ name: 'Lasanha de berinjela (500 g)', currentPrice: 35, readyStock: 0 }),
  rec({ name: 'Caldo verde fit (350 g)', category: 'caldos', currentPrice: 25, readyStock: 0 }),
  rec({ name: 'Caldo verde fit (500 g)', category: 'caldos', currentPrice: 30, readyStock: 0 }),
  rec({ name: 'Risoto de lula (350 g)', category: 'fit', currentPrice: 38, readyStock: 2 }),
  rec({ name: 'Legumes no vapor', kind: 'adicional', category: 'vegana' }),
  rec({ name: 'Prato fora de linha', hidden: true, readyStock: 0 }),
]

describe('estoque de marmitas prontas', () => {
  it('situação', () => {
    expect(readyStatus({}, 3)).toBe('sem-controle')
    expect(readyStatus({ readyStock: 0 }, 3)).toBe('esgotada')
    expect(readyStatus({ readyStock: 3 }, 3)).toBe('ultimas')
    expect(readyStatus({ readyStock: 4 }, 3)).toBe('disponivel')
  })

  it('esgotadas ignoram pratos ocultos', () => {
    expect(soldOut(recipes).map((r) => r.name)).toEqual([
      'Lasanha de berinjela (500 g)',
      'Caldo verde fit (350 g)',
      'Caldo verde fit (500 g)',
    ])
  })

  it('separa o tamanho do nome e agrupa os tamanhos', () => {
    expect(splitSizeName('Caldo verde fit (350 g)')).toEqual({ base: 'Caldo verde fit', size: '350 g' })
    const g = groupMenu(recipes, 3)
    const lasanha = g.find((e) => e.base === 'Lasanha de berinjela')!
    expect(lasanha.variants.map((v) => v.size)).toEqual(['350 g', '500 g'])
  })
})

describe('cardápio do dia', () => {
  const opts = { title: 'Marmifit Camburi', date: '22/10', hideSoldOut: false, showPrices: true }

  it('marca disponível, últimas unidades e esgotado', () => {
    const t = menuText(recipes, 3, opts)
    expect(t).toContain('✅ Lasanha de berinjela · 350 g R$ 30,00 | ~500 g~ esgotado')
    expect(t).toContain('⚠️ Risoto de lula · 350 g R$ 38,00 _(últimas unidades)_')
    expect(t).toContain('*Caldos e cremes*\n❌ ~Caldo verde fit~ (esgotado)')
    expect(t).toContain('*Adicionais*\n✅ Legumes no vapor')
    expect(t).not.toContain('fora de linha')
  })

  it('pode esconder os esgotados', () => {
    const t = menuText(recipes, 3, { ...opts, hideSoldOut: true })
    expect(t).not.toContain('Caldo verde')
    expect(t).not.toContain('500 g')
  })

  it('tudo esgotado', () => {
    const t = menuText([rec({ name: 'A', readyStock: 0 })], 3, { ...opts, hideSoldOut: true })
    expect(t).toContain('sem marmitas disponíveis')
  })
})
