// Termos explicados em linguagem simples (usados nos tooltips "?").
export const glossary = {
  cmv: {
    title: 'CMV (Custo da Mercadoria Vendida)',
    text: 'É quanto custam só os ingredientes que vão dentro de uma marmita. Não inclui pote, aluguel, gás nem taxas.',
  },
  fatorCorrecao: {
    title: 'Fator de correção (perda)',
    text: 'Parte do alimento que você compra mas não vai para a marmita: casca, osso, aparas e água que sai no cozimento. Ex.: 1 kg de frango cru vira uns 750 g grelhado, então a perda é 25%. O app já embute essa perda no custo por grama.',
  },
  indiceCoccao: {
    title: 'Índice de cocção (rendimento)',
    text: 'Alguns alimentos GANHAM peso ao cozinhar porque absorvem água. 1 kg de arroz cru vira cerca de 2,5 kg de arroz pronto, então o índice é 2,5. Assim, o custo é calculado sobre o peso pronto que vai na marmita.',
  },
  custoPronto: {
    title: 'Custo do pronto',
    text: 'Quanto custa cada grama (ou ml/unidade) do alimento já limpo e cozido, do jeito que vai para a marmita. É o preço pago dividido pela quantidade que realmente sobra.',
  },
  custoDireto: {
    title: 'Custo direto',
    text: 'Ingredientes (CMV) + embalagens e descartáveis de uma marmita. São os custos que só existem se você produzir aquela marmita.',
  },
  markup: {
    title: 'Markup',
    text: 'Forma de calcular o preço garantindo que, depois de pagar impostos, taxas e todos os custos, sobre a margem de lucro que você quer. Fórmula: Preço = Custo ÷ (1 − (impostos + taxas + lucro desejado)).',
  },
  margem: {
    title: 'Margem de lucro',
    text: 'Quanto do preço de venda sobra de lucro, em %. Ex.: vendeu por R$ 20 e lucrou R$ 4 → margem de 20%.',
  },
  pontoEquilibrio: {
    title: 'Ponto de equilíbrio',
    text: 'Quantas marmitas você precisa vender no mês só para pagar todos os custos fixos (aluguel, luz, salários…). Abaixo disso há prejuízo; acima disso começa o lucro.',
  },
  rateio: {
    title: 'Rateio de custos fixos',
    text: 'Divide as contas do mês (aluguel, luz, salários…) pela quantidade de marmitas que você produz. Assim cada marmita "paga" a sua parte das despesas.',
  },
} as const

export type GlossaryKey = keyof typeof glossary
