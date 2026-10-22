import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/common/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FeesTab } from './FeesTab'
import { FixedCostsTab } from './FixedCostsTab'

export function CostsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('aba') === 'taxas' ? 'taxas' : 'fixos'

  return (
    <>
      <PageHeader
        title="Custos e taxas"
        description="Despesas do mês, mão de obra, impostos e taxas de cada canal de venda."
      />
      <Tabs value={tab} onValueChange={(v) => setParams(v === 'taxas' ? { aba: 'taxas' } : {}, { replace: true })}>
        <TabsList className="mb-2 w-full sm:w-auto">
          <TabsTrigger value="fixos" className="flex-1 sm:flex-none sm:px-5">
            Custos fixos
          </TabsTrigger>
          <TabsTrigger value="taxas" className="flex-1 sm:flex-none sm:px-5">
            Taxas e canais
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fixos">
          <FixedCostsTab />
        </TabsContent>
        <TabsContent value="taxas">
          <FeesTab />
        </TabsContent>
      </Tabs>
    </>
  )
}
