import type { RecipePricing } from './calc/analysis'
import { isExtra } from './calc/analysis'
import { grossQty, baseUnitOf } from './calc/units'
import { formatBRL, formatDate, formatPercent, formatQty, todayISO } from './format'
import { recipeCategoryLabels } from './labels'
import type { Ingredient } from './types'

interface Business {
  businessName: string
  whatsapp: string
  instagram: string
}

const GREEN: [number, number, number] = [31, 140, 82]
const GRAY: [number, number, number] = [110, 110, 110]

// Carrega jsPDF só quando o usuário pede um PDF (mantém o app leve)
async function loadPdf() {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  return { jsPDF, autoTable }
}

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Alinha à direita as colunas numéricas também no cabeçalho e no rodapé da tabela. */
const alignRight =
  (cols: number[]) =>
  (data: { section: string; column: { index: number }; cell: { styles: { halign?: string } } }) => {
    if (cols.includes(data.column.index)) data.cell.styles.halign = 'right'
  }

type Doc = InstanceType<Awaited<ReturnType<typeof loadPdf>>['jsPDF']>

function header(doc: Doc, biz: Business, title: string) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...GREEN)
  doc.rect(0, 0, w, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(biz.businessName || 'Custo Marmita', 14, 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text([biz.whatsapp, biz.instagram].filter(Boolean).join('  |  '), w - 14, 14, { align: 'right' })
  doc.setTextColor(20, 20, 20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(title, 14, 34, { maxWidth: w - 28 })
}

function footer(doc: Doc) {
  const pages = doc.getNumberOfPages()
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(`Gerado pelo Custo Marmita em ${formatDate(todayISO())}`, 14, h - 8)
    doc.text(`Página ${i} de ${pages}`, w - 14, h - 8, { align: 'right' })
  }
}

/** PDF da ficha técnica: ingredientes (pronto e bruto), embalagens e preço. */
export async function exportRecipePdf(p: RecipePricing, ingredients: Ingredient[], biz: Business) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const r = p.recipe
  header(doc, biz, `Ficha técnica: ${r.name}`)

  const ingMap = new Map(ingredients.map((i) => [i.id, i]))
  let y = 44
  if (r.photo) {
    try {
      doc.addImage(r.photo, 'JPEG', 14, y - 2, 36, 36)
    } catch {
      /* foto inválida: segue sem ela */
    }
  }
  const infoX = r.photo ? 56 : 14
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60, 60, 60)
  doc.text(
    [
      `Tipo: ${isExtra(r) ? 'Adicional' : `Marmita ${recipeCategoryLabels[r.category]} - tamanho ${r.size}`}`,
      `Peso da porção: ${formatQty(p.recipeCost.totalWeight, 'g')}`,
      `Custo direto (ingredientes + embalagem): ${formatBRL(p.recipeCost.directCost)}`,
    ],
    infoX,
    y + 4,
  )
  y += r.photo ? 40 : 20

  autoTable(doc, {
    startY: y,
    head: [['Ingrediente', 'Qtd. pronta', 'Qtd. a comprar*', 'Custo']],
    body: p.recipeCost.items.map((it) => {
      const ing = ingMap.get(it.ingredientId)
      const base = ing ? baseUnitOf(ing.unit) : 'g'
      const gross = ing ? grossQty(it.qty, ing.lossPercent, ing.cookingYield) : it.qty
      return [it.name, formatQty(it.qty, base), formatQty(gross, base), formatBRL(it.cost)]
    }),
    foot: [['CMV (ingredientes)', '', '', formatBRL(p.recipeCost.ingredientsCost)]],
    headStyles: { fillColor: GREEN },
    footStyles: { fillColor: [235, 245, 238], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 9 },
    didParseCell: alignRight([1, 2, 3]),
  })

  const afterIng = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.text(
    '* Quantidade bruta, já considerando a perda no preparo e o rendimento na cocção.',
    14,
    afterIng + 4,
  )

  if (p.recipeCost.packagingItems.length) {
    autoTable(doc, {
      startY: afterIng + 8,
      head: [['Embalagem', 'Qtd.', 'Custo']],
      body: p.recipeCost.packagingItems.map((pk) => [pk.name, String(pk.qty), formatBRL(pk.cost)]),
      headStyles: { fillColor: GREEN },
      styles: { fontSize: 9 },
      didParseCell: alignRight([1, 2]),
    })
  }

  const afterPack = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
  const priceRows: string[][] = [
    ['Ingredientes (CMV)', formatBRL(p.cost.ingredients)],
    ['Embalagens', formatBRL(p.cost.packaging)],
    ['Custo fixo rateado', formatBRL(p.cost.fixed)],
    ['Entrega', formatBRL(p.cost.delivery)],
    ['Custo total por unidade', formatBRL(p.cost.total)],
    ['Impostos e taxas do canal', formatPercent(p.feePercent)],
    ['Margem desejada', formatPercent(p.desiredMargin)],
    ['Preço sugerido (markup)', p.suggested.ok ? formatBRL(p.suggested.price) : '-'],
  ]
  if (p.current) {
    priceRows.push(
      ['Preço praticado', formatBRL(p.current.price)],
      ['Lucro por unidade', formatBRL(p.current.profit)],
      ['Margem real', formatPercent(p.current.margin)],
    )
  }
  autoTable(doc, {
    startY: afterPack + 8,
    head: [['Precificação', '']],
    body: priceRows,
    headStyles: { fillColor: GREEN },
    columnStyles: { 1: { fontStyle: 'bold' } },
    styles: { fontSize: 9 },
    didParseCell: alignRight([1]),
  })

  if (r.notes?.trim()) {
    const afterPrice = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
    doc.setFontSize(10)
    doc.setTextColor(20, 20, 20)
    doc.setFont('helvetica', 'bold')
    doc.text('Observações', 14, afterPrice + 10)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(doc.splitTextToSize(r.notes, 180), 14, afterPrice + 16)
  }

  footer(doc)
  doc.save(`ficha-tecnica-${slug(r.name)}.pdf`)
}

const statusLabel = { ok: 'Saudável', baixa: 'Margem baixa', prejuizo: 'Prejuízo' } as const

/** PDF da tabela de preços de todas as marmitas e adicionais. */
export async function exportPriceTablePdf(rows: RecipePricing[], channelName: string, biz: Business) {
  const { jsPDF, autoTable } = await loadPdf()
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  header(doc, biz, 'Tabela de preços')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text(`Canal: ${channelName}  |  ${formatDate(todayISO())}`, 14, 40)

  autoTable(doc, {
    startY: 45,
    head: [
      [
        'Item',
        'Tipo',
        'Custo total',
        'Preço sugerido',
        'Preço praticado',
        'Lucro',
        'Margem real',
        'Situação',
      ],
    ],
    body: rows.map((r) => [
      r.recipe.name,
      isExtra(r.recipe) ? 'Adicional' : recipeCategoryLabels[r.recipe.category],
      formatBRL(r.cost.total),
      r.suggested.ok ? formatBRL(r.suggested.price) : '-',
      r.current ? formatBRL(r.current.price) : '-',
      r.current ? formatBRL(r.current.profit) : '-',
      r.current ? formatPercent(r.current.margin) : '-',
      r.current ? statusLabel[r.current.status] : '-',
    ]),
    headStyles: { fillColor: GREEN },
    styles: { fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 90 } },
    didParseCell: (data) => {
      alignRight([2, 3, 4, 5, 6])(data)
      if (data.section === 'body' && data.column.index === 7) {
        const v = String(data.cell.raw)
        if (v === 'Prejuízo' || v === 'Margem baixa') data.cell.styles.textColor = [200, 40, 40]
      }
    },
  })
  footer(doc)
  doc.save(`tabela-de-precos-${todayISO()}.pdf`)
}
