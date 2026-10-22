import type { MarginStatus } from '@/lib/calc/pricing'
import { cn } from '@/lib/utils'

const statusStyles: Record<MarginStatus, { label: string; className: string }> = {
  prejuizo: {
    label: 'Prejuízo',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  },
  baixa: {
    label: 'Margem baixa',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  ok: {
    label: 'Saudável',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
}

export function StatusBadge({ status }: { status: MarginStatus }) {
  const s = statusStyles[status]
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', s.className)}>{s.label}</span>
}
