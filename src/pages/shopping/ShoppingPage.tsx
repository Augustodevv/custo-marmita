import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { soldOut } from '@/lib/calc/menu'
import { stockAlerts } from '@/lib/calc/stock'
import { useAppStore } from '@/store/useAppStore'
import { ReadyTab } from './ReadyTab'
import { ShoppingListTab } from './ShoppingListTab'
import { StockTab } from './StockTab'

export function ShoppingPage() {
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba')
  const tab = aba === 'estoque' || aba === 'prontas' ? aba : 'lista'
  const alertCount = useAppStore((s) => stockAlerts(s.ingredients, s.packaging).length)
  const soldOutCount = useAppStore((s) => soldOut(s.recipes).length)

  return (
    <>
      <PageHeader
        title="Compras e estoque"
        description="Planeje a produção, gere a lista de compras, controle as marmitas prontas e o que tem na despensa."
      />
      <Tabs value={tab} onValueChange={(v) => setParams(v === 'lista' ? {} : { aba: v }, { replace: true })}>
        <TabsList className="mb-2 w-full sm:w-auto">
          <TabsTrigger value="lista" className="flex-1 sm:flex-none sm:px-5">
            Lista de compras
          </TabsTrigger>
          <TabsTrigger value="prontas" className="flex-1 sm:flex-none sm:px-5">
            Prontas
            {soldOutCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {soldOutCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="estoque" className="flex-1 sm:flex-none sm:px-5">
            Estoque
            {alertCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-white">
                {alertCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="lista">
          <ShoppingListTab />
        </TabsContent>
        <TabsContent value="prontas">
          <ReadyTab />
        </TabsContent>
        <TabsContent value="estoque">
          <StockTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
