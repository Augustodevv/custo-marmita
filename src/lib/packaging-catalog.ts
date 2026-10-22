import type { Packaging } from './types'

export type CatalogItem = Omit<Packaging, 'id' | 'sample' | 'stockQty' | 'minStock'>

export interface CatalogGroup {
  title: string
  items: CatalogItem[]
}

// Preços de referência (pacote fechado, atacado, out/2026). São só um ponto de partida:
// depois de adicionar, ajuste para o valor que você paga.
const pp = (
  name: string,
  capacity: number,
  capacityUnit: 'g' | 'ml',
  compartments: number,
  packPrice: number,
  packQty = 100,
): CatalogItem => ({
  name,
  type: 'pote',
  capacity,
  capacityUnit,
  material: 'pp',
  compartments,
  microwave: true,
  freezer: true,
  packPrice,
  packQty,
})

export const packagingCatalog: CatalogGroup[] = [
  {
    title: 'Marmitas de plástico PP (micro-ondas e freezer)',
    items: [
      pp('Marmita PP 250 g com tampa', 250, 'g', 1, 49.9),
      pp('Marmita PP 350 g com tampa', 350, 'g', 1, 54.9),
      pp('Marmita PP 500 g com tampa', 500, 'g', 1, 62.9),
      pp('Marmita PP 750 g com tampa', 750, 'g', 1, 74.9),
      pp('Marmita PP 1000 g com tampa', 1000, 'g', 1, 89.9),
      pp('Marmita PP 500 g 2 divisórias', 500, 'g', 2, 72.9),
      pp('Marmita PP 750 g 2 divisórias', 750, 'g', 2, 84.9),
      pp('Marmita PP 1000 g 3 divisórias', 1000, 'g', 3, 99.9),
      pp('Pote PP 100 ml (molho)', 100, 'ml', 1, 24.9),
      pp('Pote PP 250 ml (salada, sobremesa)', 250, 'ml', 1, 39.9),
      pp('Pote PP 350 ml (sopa, caldo)', 350, 'ml', 1, 44.9),
      pp('Pote PP 500 ml (sopa, caldo)', 500, 'ml', 1, 49.9),
    ],
  },
  {
    title: 'Alumínio, isopor, biodegradável e vidro',
    items: [
      {
        name: 'Marmitex alumínio nº 7 (750 ml) com tampa',
        type: 'pote',
        capacity: 750,
        capacityUnit: 'ml',
        material: 'aluminio',
        compartments: 1,
        microwave: false,
        freezer: true,
        packPrice: 79.9,
        packQty: 100,
      },
      {
        name: 'Marmitex alumínio nº 8 (1100 ml) com tampa',
        type: 'pote',
        capacity: 1100,
        capacityUnit: 'ml',
        material: 'aluminio',
        compartments: 1,
        microwave: false,
        freezer: true,
        packPrice: 94.9,
        packQty: 100,
      },
      {
        name: 'Marmitex isopor 750 ml',
        type: 'pote',
        capacity: 750,
        capacityUnit: 'ml',
        material: 'isopor',
        compartments: 1,
        microwave: false,
        freezer: false,
        packPrice: 39.9,
        packQty: 100,
      },
      {
        name: 'Marmita bagaço de cana 750 ml 3 divisórias',
        type: 'pote',
        capacity: 750,
        capacityUnit: 'ml',
        material: 'biodegradavel',
        compartments: 3,
        microwave: true,
        freezer: false,
        packPrice: 64.9,
        packQty: 50,
      },
      {
        name: 'Pote de vidro 640 ml com tampa',
        type: 'pote',
        capacity: 640,
        capacityUnit: 'ml',
        material: 'vidro',
        compartments: 1,
        microwave: true,
        freezer: true,
        packPrice: 89.9,
        packQty: 6,
      },
    ],
  },
  {
    title: 'Congeladas',
    items: [
      { name: 'Saco a vácuo 20×30 cm', type: 'outros', material: 'outros', packPrice: 49.9, packQty: 100 },
      { name: 'Filme PVC (rolo, ~500 usos)', type: 'outros', material: 'pp', packPrice: 34.9, packQty: 500 },
    ],
  },
  {
    title: 'Tampas, sacolas e descartáveis',
    items: [
      { name: 'Tampa avulsa para marmita PP', type: 'tampa', material: 'pp', packPrice: 19.9, packQty: 100 },
      { name: 'Sacola kraft com alça', type: 'sacola', material: 'papel', packPrice: 39.9, packQty: 50 },
      { name: 'Sacola plástica', type: 'sacola', material: 'pet', packPrice: 14.9, packQty: 100 },
      { name: 'Bolsa térmica descartável', type: 'sacola', material: 'outros', packPrice: 69.9, packQty: 50 },
      {
        name: 'Kit talher descartável (garfo, faca, guardanapo)',
        type: 'talher',
        packPrice: 24.9,
        packQty: 100,
      },
      { name: 'Guardanapo de papel', type: 'guardanapo', material: 'papel', packPrice: 6.9, packQty: 250 },
      {
        name: 'Etiqueta com tabela nutricional',
        type: 'etiqueta',
        material: 'papel',
        packPrice: 29.9,
        packQty: 500,
      },
      { name: 'Adesivo de lacre', type: 'lacre', material: 'papel', packPrice: 18.9, packQty: 500 },
    ],
  },
]

/** Já existe uma embalagem com esse nome? (ignora maiúsculas/acentos) */
export function catalogKey(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}
