import { Hammer } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'

export function ComingSoonPage({ title, stage }: { title: string; stage: number }) {
  return (
    <>
      <PageHeader title={title} />
      <EmptyState
        icon={Hammer}
        title="Em construção"
        description={`Esta tela chega na etapa ${stage} do desenvolvimento.`}
      />
    </>
  )
}
