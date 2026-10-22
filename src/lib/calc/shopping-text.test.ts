import { describe, expect, it } from 'vitest'
import type { ShoppingLine, ShoppingList } from './shopping'
import { shoppingListText } from './shopping-text'

const line = (over: Partial<ShoppingLine>): ShoppingLine => ({
  kind: 'ingrediente',
  id: 'x',
  name: 'X',
  group: 'proteina',
  baseUnit: 'g',
  needed: 0,
  stock: 0,
  min: 0,
  toBuy: 0,
  packageSize: 1000,
  packages: 0,
  cost: 0,
  exactCost: 0,
  stockStatus: 'sem-controle',
  ...over,
})

describe('texto para WhatsApp', () => {
  it('agrupa por categoria e mostra total', () => {
    const toBuyLines = [
      line({ id: 'f', name: 'Frango', toBuy: 2500, packages: 3, cost: 65.7 }),
      line({
        id: 'p',
        name: 'Pote',
        group: 'embalagem',
        baseUnit: 'un',
        toBuy: 40,
        packageSize: 100,
        packages: 1,
        cost: 64.9,
      }),
    ]
    const list: ShoppingList = {
      lines: toBuyLines,
      toBuyLines,
      totalCost: 130.6,
      totalExactCost: 100,
      totalMeals: 20,
    }
    const text = shoppingListText(
      list,
      [
        {
          id: 'r',
          name: 'Frango com arroz',
          category: 'fit',
          size: 'M',
          targetWeight: 0,
          items: [],
          packaging: [],
          createdAt: '',
        },
      ],
      { r: 20 },
      '22/10/2026',
    )
    expect(text).toContain('*Lista de compras* (22/10/2026)')
    expect(text).toContain('• 20× Frango com arroz')
    expect(text).toContain('*Proteína*\n• Frango: 2,5 kg (3 emb. de 1 kg)')
    expect(text).toContain('*Embalagens e descartáveis*\n• Pote: 40 un (1 emb. de 100 un)')
    expect(text).toContain('Total estimado: R$ 130,60')
  })

  it('lista vazia', () => {
    const text = shoppingListText(
      { lines: [], toBuyLines: [], totalCost: 0, totalExactCost: 0, totalMeals: 0 },
      [],
      {},
      '01/01/2026',
    )
    expect(text).toContain('Nada para comprar')
  })
})
