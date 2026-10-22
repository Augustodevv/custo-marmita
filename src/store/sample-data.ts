import type { Ingredient, Packaging, Recipe } from '@/lib/types'

// Dados de exemplo com preços típicos de atacarejo (out/2026), só para demonstração.
const D = '2026-10-15'
const PREV = '2026-09-10'

type SeedIngredient = Omit<Ingredient, 'sample' | 'priceHistory' | 'updatedAt'> & {
  prev?: number
}

const ing = (i: SeedIngredient): Ingredient => {
  const { prev, ...rest } = i
  return {
    ...rest,
    updatedAt: D,
    priceHistory: prev ? [{ price: prev, date: PREV }] : [],
    sample: true,
  }
}

export const sampleIngredients: Ingredient[] = [
  ing({ id: 's-frango', name: 'Peito de frango', category: 'proteina', packagePrice: 21.9, packageQty: 1, unit: 'kg', lossPercent: 25, prev: 19.9 }),
  ing({ id: 's-patinho', name: 'Patinho moído', category: 'proteina', packagePrice: 42.9, packageQty: 1, unit: 'kg', lossPercent: 20, prev: 44.5 }),
  ing({ id: 's-tilapia', name: 'Filé de tilápia', category: 'proteina', packagePrice: 54.9, packageQty: 1, unit: 'kg', lossPercent: 15 }),
  ing({ id: 's-ovo', name: 'Ovo', category: 'proteina', packagePrice: 15.9, packageQty: 30, unit: 'un', lossPercent: 0, unitWeight: 50 }),
  ing({ id: 's-grao', name: 'Grão-de-bico', category: 'proteina', packagePrice: 12.9, packageQty: 500, unit: 'g', lossPercent: 0, cookingYield: 2.6 }),
  ing({ id: 's-arroz-int', name: 'Arroz integral', category: 'carboidrato', packagePrice: 8.49, packageQty: 1, unit: 'kg', lossPercent: 0, cookingYield: 2.5 }),
  ing({ id: 's-arroz', name: 'Arroz branco', category: 'carboidrato', packagePrice: 27.9, packageQty: 5, unit: 'kg', lossPercent: 0, cookingYield: 2.8, prev: 25.9 }),
  ing({ id: 's-batata', name: 'Batata inglesa', category: 'carboidrato', packagePrice: 6.99, packageQty: 1, unit: 'kg', lossPercent: 15 }),
  ing({ id: 's-batata-doce', name: 'Batata-doce', category: 'carboidrato', packagePrice: 5.99, packageQty: 1, unit: 'kg', lossPercent: 12 }),
  ing({ id: 's-feijao', name: 'Feijão carioca', category: 'carboidrato', packagePrice: 8.99, packageQty: 1, unit: 'kg', lossPercent: 0, cookingYield: 2.4 }),
  ing({ id: 's-brocolis', name: 'Brócolis', category: 'legume', packagePrice: 7.99, packageQty: 500, unit: 'g', lossPercent: 35 }),
  ing({ id: 's-cenoura', name: 'Cenoura', category: 'legume', packagePrice: 4.99, packageQty: 1, unit: 'kg', lossPercent: 10 }),
  ing({ id: 's-abobrinha', name: 'Abobrinha', category: 'legume', packagePrice: 5.49, packageQty: 1, unit: 'kg', lossPercent: 8 }),
  ing({ id: 's-champignon', name: 'Champignon fatiado', category: 'legume', packagePrice: 9.9, packageQty: 200, unit: 'g', lossPercent: 0 }),
  ing({ id: 's-iogurte', name: 'Iogurte natural', category: 'outros', packagePrice: 3.99, packageQty: 170, unit: 'g', lossPercent: 0 }),
  ing({ id: 's-creme', name: 'Creme de leite', category: 'outros', packagePrice: 3.49, packageQty: 200, unit: 'g', lossPercent: 0 }),
  ing({ id: 's-leite', name: 'Leite integral', category: 'outros', packagePrice: 5.29, packageQty: 1, unit: 'L', lossPercent: 0 }),
  ing({ id: 's-molho', name: 'Molho de tomate', category: 'tempero', packagePrice: 2.79, packageQty: 340, unit: 'g', lossPercent: 0 }),
  ing({ id: 's-azeite', name: 'Azeite de oliva', category: 'tempero', packagePrice: 34.9, packageQty: 500, unit: 'ml', lossPercent: 0 }),
  ing({ id: 's-oleo', name: 'Óleo de soja', category: 'tempero', packagePrice: 7.49, packageQty: 900, unit: 'ml', lossPercent: 0 }),
  ing({ id: 's-alho-cebola', name: 'Alho e cebola', category: 'tempero', packagePrice: 9.9, packageQty: 1, unit: 'kg', lossPercent: 15 }),
  ing({ id: 's-sal-temp', name: 'Sal e temperos secos', category: 'tempero', packagePrice: 12.0, packageQty: 1, unit: 'kg', lossPercent: 0 }),
]

const pack = (p: Omit<Packaging, 'sample'>): Packaging => ({ ...p, sample: true })

export const samplePackaging: Packaging[] = [
  pack({ id: 's-pote-750', name: 'Pote 750 ml com divisória', type: 'pote', packPrice: 64.9, packQty: 100 }),
  pack({ id: 's-pote-500', name: 'Pote 500 ml', type: 'pote', packPrice: 49.9, packQty: 100 }),
  pack({ id: 's-tampa', name: 'Tampa (pote 500 ml)', type: 'tampa', packPrice: 19.9, packQty: 100 }),
  pack({ id: 's-sacola', name: 'Sacola kraft', type: 'sacola', packPrice: 39.9, packQty: 50 }),
  pack({ id: 's-talher', name: 'Kit talher descartável', type: 'talher', packPrice: 24.9, packQty: 100 }),
  pack({ id: 's-guardanapo', name: 'Guardanapo', type: 'guardanapo', packPrice: 6.9, packQty: 250 }),
  pack({ id: 's-etiqueta', name: 'Etiqueta com tabela nutricional', type: 'etiqueta', packPrice: 29.9, packQty: 500 }),
  pack({ id: 's-lacre', name: 'Adesivo de lacre', type: 'lacre', packPrice: 18.9, packQty: 500 }),
]

const STD_PACK = [
  { packagingId: 's-pote-750', qty: 1 },
  { packagingId: 's-etiqueta', qty: 1 },
  { packagingId: 's-lacre', qty: 1 },
]

const rec = (r: Omit<Recipe, 'sample' | 'createdAt'>): Recipe => ({ ...r, createdAt: D, sample: true })

export const sampleRecipes: Recipe[] = [
  rec({
    id: 's-r-frango',
    name: 'Frango grelhado com arroz integral e brócolis',
    category: 'fit',
    size: 'M',
    targetWeight: 350,
    items: [
      { ingredientId: 's-frango', qty: 130 },
      { ingredientId: 's-arroz-int', qty: 110 },
      { ingredientId: 's-brocolis', qty: 90 },
      { ingredientId: 's-azeite', qty: 5 },
      { ingredientId: 's-alho-cebola', qty: 10 },
      { ingredientId: 's-sal-temp', qty: 5 },
    ],
    packaging: STD_PACK,
    currentPrice: 22,
    desiredMargin: 20,
  }),
  rec({
    id: 's-r-carne-pure',
    name: 'Carne moída com purê de batata',
    category: 'tradicional',
    size: 'G',
    targetWeight: 450,
    items: [
      { ingredientId: 's-patinho', qty: 150 },
      { ingredientId: 's-batata', qty: 180 },
      { ingredientId: 's-leite', qty: 30 },
      { ingredientId: 's-cenoura', qty: 50 },
      { ingredientId: 's-molho', qty: 30 },
      { ingredientId: 's-alho-cebola', qty: 15 },
      { ingredientId: 's-oleo', qty: 5 },
      { ingredientId: 's-sal-temp', qty: 5 },
    ],
    packaging: STD_PACK,
    currentPrice: 24,
    desiredMargin: 20,
  }),
  rec({
    id: 's-r-strogonoff',
    name: 'Strogonoff fit de frango com arroz',
    category: 'fit',
    size: 'M',
    targetWeight: 380,
    items: [
      { ingredientId: 's-frango', qty: 130 },
      { ingredientId: 's-iogurte', qty: 50 },
      { ingredientId: 's-champignon', qty: 30 },
      { ingredientId: 's-molho', qty: 25 },
      { ingredientId: 's-arroz', qty: 130 },
      { ingredientId: 's-alho-cebola', qty: 10 },
      { ingredientId: 's-sal-temp', qty: 5 },
    ],
    packaging: STD_PACK,
    currentPrice: 21,
    desiredMargin: 20,
  }),
  rec({
    id: 's-r-tilapia',
    name: 'Tilápia com batata-doce e legumes',
    category: 'lowcarb',
    size: 'M',
    targetWeight: 350,
    items: [
      { ingredientId: 's-tilapia', qty: 140 },
      { ingredientId: 's-batata-doce', qty: 120 },
      { ingredientId: 's-abobrinha', qty: 50 },
      { ingredientId: 's-cenoura', qty: 30 },
      { ingredientId: 's-azeite', qty: 5 },
      { ingredientId: 's-sal-temp', qty: 5 },
    ],
    packaging: STD_PACK,
    currentPrice: 23,
    desiredMargin: 20,
  }),
  rec({
    id: 's-r-grao',
    name: 'Grão-de-bico com legumes e arroz',
    category: 'vegana',
    size: 'M',
    targetWeight: 360,
    items: [
      { ingredientId: 's-grao', qty: 60 },
      { ingredientId: 's-arroz-int', qty: 120 },
      { ingredientId: 's-abobrinha', qty: 70 },
      { ingredientId: 's-cenoura', qty: 50 },
      { ingredientId: 's-brocolis', qty: 50 },
      { ingredientId: 's-azeite', qty: 8 },
      { ingredientId: 's-sal-temp', qty: 5 },
    ],
    packaging: STD_PACK,
    currentPrice: 19,
    desiredMargin: 20,
  }),
  rec({
    id: 's-r-kids',
    name: 'Kids: arroz, feijão, frango desfiado e cenoura',
    category: 'kids',
    size: 'P',
    targetWeight: 250,
    items: [
      { ingredientId: 's-arroz', qty: 80 },
      { ingredientId: 's-feijao', qty: 30 },
      { ingredientId: 's-frango', qty: 70 },
      { ingredientId: 's-cenoura', qty: 40 },
      { ingredientId: 's-oleo', qty: 3 },
      { ingredientId: 's-sal-temp', qty: 3 },
    ],
    packaging: [
      { packagingId: 's-pote-500', qty: 1 },
      { packagingId: 's-tampa', qty: 1 },
      { packagingId: 's-etiqueta', qty: 1 },
    ],
    currentPrice: 15,
    desiredMargin: 20,
  }),
]
