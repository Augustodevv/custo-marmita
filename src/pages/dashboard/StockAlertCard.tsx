import { ArrowRight, PackageX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { stockAlerts } from '@/lib/calc/stock'
import { useAppStore } from '@/store/useAppStore'

/** Aviso de itens zerados ou abaixo do estoque mínimo. Some quando está tudo em dia. */
export function StockAlertCard() {
  const ingredients = useAppStore((s) => s.ingredients)
  const packaging = useAppStore((s) => s.packaging)
  const alerts = stockAlerts(ingredients, packaging)
  if (alerts.length === 0) return null
  const zeroed = alerts.filter((a) => a.status === 'zerado').length

  return (
    <div
      role="alert"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:flex-row sm:items-center"
    >
      <PackageX className="size-6 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {alerts.length} {alerts.length === 1 ? 'item precisa' : 'itens precisam'} de compra
          {zeroed > 0 && ` · ${zeroed} zerado${zeroed > 1 ? 's' : ''}`}
        </p>
        <p className="truncate text-sm text-muted-foreground">{alerts.map((a) => a.name).join(', ')}</p>
      </div>
      <Button size="sm" variant="outline" asChild className="shrink-0">
        <Link to="/compras?aba=estoque">
          Ver estoque <ArrowRight />
        </Link>
      </Button>
    </div>
  )
}
