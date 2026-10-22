# Post para o LinkedIn

> Sugestão: anexe 3 ou 4 imagens da pasta `docs/screenshots` (dashboard no celular, precificação no modo escuro, cardápio do dia e ficha técnica) ou grave um vídeo curto navegando pelo app no celular.

---

🍱 **Quanto custa, de verdade, uma marmita?**

Quem vende marmita costuma calcular o preço "de olho": soma o frango, o arroz e coloca uma margem. Só que o frango perde 25% do peso no fogo, o arroz rende 2,5 vezes, o pote custa quase R$ 1, o iFood leva até 27% e o aluguel e o gás precisam ser divididos entre todas as marmitas do mês.

Resultado: vende bem e não sobra dinheiro.

Para resolver isso, desenvolvi o **Custo Marmita**, um app web para quem vende marmitas fit, tradicionais e congeladas, pensado para ser usado no celular, na cozinha:

✅ Ficha técnica com custo em tempo real, já considerando perda no preparo e rendimento na cocção
✅ Rateio automático de custos fixos, mão de obra e gás por botijão
✅ Preço sugerido por markup, com alerta em vermelho quando a marmita dá prejuízo
✅ Preço por canal (WhatsApp × iFood) mantendo o mesmo lucro
✅ Kits com desconto mostrando quanto a margem cai, e o desconto máximo possível
✅ Lista de compras automática enviada direto para o WhatsApp
✅ Controle de estoque e de marmitas prontas, com cardápio do dia marcando o que está esgotado
✅ Dashboard com lucro do mês e ponto de equilíbrio
✅ PDF da ficha técnica, modo escuro e backup dos dados

O projeto nasceu de um problema real: usei o cardápio da **Marmifit Camburi** como base. Os pratos, os tamanhos (350 g e 500 g) e os preços já vêm prontos no catálogo do app.

🛠️ **Stack:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, Recharts, jsPDF e Vitest (84 testes cobrindo toda a lógica de cálculo, que fica em funções puras separadas da interface). Deploy contínuo com GitHub Actions.

🔗 App: https://augustodevv.github.io/custo-marmita/
💻 Código: https://github.com/Augustodevv/custo-marmita

Se você vende comida ou conhece alguém que vende, testa e me conta o que achou! 👇

#react #typescript #frontend #desenvolvimentoweb #portfolio #empreendedorismo #marmitas #foodservice
