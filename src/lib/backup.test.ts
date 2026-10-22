import { describe, expect, it } from 'vitest'
import { initialData } from '@/store/useAppStore'
import { makeBackup, parseBackup } from './backup'

describe('backup', () => {
  it('exporta e importa os mesmos dados', () => {
    const text = makeBackup(initialData, new Date('2026-10-22T12:00:00Z'))
    const r = parseBackup(text, initialData)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.recipes).toEqual(initialData.recipes)
      expect(r.data.costs).toEqual(initialData.costs)
      expect(r.exportedAt).toBe('2026-10-22T12:00:00.000Z')
    }
  })

  it('backup antigo sem blocos novos recebe os padrões', () => {
    const old = JSON.stringify({ ingredients: [], packaging: [], recipes: [] })
    const r = parseBackup(old, initialData)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.fees).toEqual(initialData.fees)
      expect(r.data.kits).toEqual([])
    }
  })

  it('rejeita arquivos inválidos', () => {
    expect(parseBackup('não é json', initialData)).toEqual({
      ok: false,
      error: 'O arquivo não é um JSON válido.',
    })
    expect(parseBackup('{"ingredients": []}', initialData).ok).toBe(false)
    expect(parseBackup('{"ingredients":[{"x":1}],"packaging":[],"recipes":[]}', initialData).ok).toBe(false)
  })
})
